// 音声まわり：読み上げ（TTS）・音声認識（STT）・録音と流暢さメーター・テキスト比較
var Audio2 = (function () {
  "use strict";

  // ---------- 読み上げ ----------
  var voices = [];
  function loadVoices() {
    if (!window.speechSynthesis) return;
    voices = speechSynthesis.getVoices().filter(function (v) { return /^en[-_]US/i.test(v.lang); });
  }
  if (window.speechSynthesis) {
    loadVoices();
    speechSynthesis.onvoiceschanged = loadVoices;
  }
  function pickVoice(name, second) {
    if (!voices.length) loadVoices();
    if (name) {
      var v = voices.find(function (x) { return x.name === name; });
      if (v && !second) return v;
    }
    var pref = ["Samantha", "Ava", "Allison", "Alex", "Google US English", "Microsoft Aria", "Microsoft Jenny"];
    var list = voices.slice().sort(function (a, b) {
      var ia = pref.findIndex(function (p) { return a.name.indexOf(p) >= 0; });
      var ib = pref.findIndex(function (p) { return b.name.indexOf(p) >= 0; });
      return (ia < 0 ? 99 : ia) - (ib < 0 ? 99 : ib);
    });
    if (second) {
      var main = pickVoice(name, false);
      var other = list.find(function (x) { return !main || x.name !== main.name; });
      return other || main;
    }
    return list[0] || null;
  }
  function stopSpeak() {
    if (window.speechSynthesis) speechSynthesis.cancel();
  }
  // texts: 文字列または配列（1文ずつ読み、onEach(i) で今読んでいる文を知らせる）
  function speak(texts, opt) {
    opt = opt || {};
    if (!window.speechSynthesis) { if (opt.onend) opt.onend(); return; }
    stopSpeak();
    var list = Array.isArray(texts) ? texts : [texts];
    var i = 0;
    var next = function () {
      if (i >= list.length) { if (opt.onEach) opt.onEach(-1); if (opt.onend) opt.onend(); return; }
      var u = new SpeechSynthesisUtterance(list[i]);
      u.lang = "en-US";
      u.rate = opt.rate || 0.9;
      var v = pickVoice(opt.voice, opt.second);
      if (v) u.voice = v;
      if (opt.onEach) opt.onEach(i);
      u.onend = function () { i++; next(); };
      u.onerror = function () { i++; next(); };
      speechSynthesis.speak(u);
    };
    next();
  }
  function splitSentences(text) {
    return String(text).match(/[^.!?]+[.!?]+["']?\s*|[^.!?]+$/g).map(function (s) { return s.trim(); }).filter(Boolean);
  }

  // ---------- 音声認識 ----------
  function sttSupported() {
    return !!(window.SpeechRecognition || window.webkitSpeechRecognition);
  }
  function listen(onText, onEnd, onError) {
    var R = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!R) { if (onError) onError("この環境では音声認識が使えません"); return null; }
    var r = new R();
    r.lang = "en-US";
    r.continuous = true;
    r.interimResults = true;
    var finals = "";
    r.onresult = function (e) {
      var interim = "";
      for (var i = e.resultIndex; i < e.results.length; i++) {
        var t = e.results[i][0].transcript;
        if (e.results[i].isFinal) finals += t + " ";
        else interim += t;
      }
      onText((finals + interim).replace(/\s+/g, " ").trim());
    };
    r.onerror = function (e) {
      if (onError && e.error !== "no-speech" && e.error !== "aborted") onError("音声認識エラー：" + e.error);
    };
    r.onend = function () { if (onEnd) onEnd(); };
    try { r.start(); } catch (err) { if (onError) onError("音声認識を開始できませんでした"); return null; }
    return r;
  }

  // ---------- 録音と流暢さメーター ----------
  // onLevel(0..1, voiced) で音量を知らせる。stop() で { url, metrics } を返す。
  async function record(onLevel) {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) throw new Error("この環境では録音できません");
    var stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } });
    var AC = window.AudioContext || window.webkitAudioContext;
    var ctx = new AC();
    if (ctx.state === "suspended") { try { await ctx.resume(); } catch (e) {} }
    var src = ctx.createMediaStreamSource(stream);
    var an = ctx.createAnalyser();
    an.fftSize = 1024;
    src.connect(an);
    var buf = new Uint8Array(an.fftSize);

    var chunks = [];
    var mime = "";
    var mr = null;
    if (window.MediaRecorder) {
      ["audio/mp4", "audio/webm;codecs=opus", "audio/webm"].some(function (m) {
        if (MediaRecorder.isTypeSupported && MediaRecorder.isTypeSupported(m)) { mime = m; return true; }
        return false;
      });
      try {
        mr = mime ? new MediaRecorder(stream, { mimeType: mime }) : new MediaRecorder(stream);
        mr.ondataavailable = function (e) { if (e.data && e.data.size) chunks.push(e.data); };
        mr.start(250);
      } catch (e) { mr = null; }
    }

    var STEP = 50;
    var t0 = Date.now();
    var floorSum = 0, floorN = 0, thr = 0.02;
    var first = -1, last = -1, silentRun = 0, voicedMs = 0;
    var pauses = 0, longest = 0;
    var timer = setInterval(function () {
      an.getByteTimeDomainData(buf);
      var s = 0;
      for (var i = 0; i < buf.length; i++) { var v = (buf[i] - 128) / 128; s += v * v; }
      var rms = Math.sqrt(s / buf.length);
      var t = Date.now() - t0;
      if (t < 600) { floorSum += rms; floorN++; thr = Math.max(0.015, (floorSum / floorN) * 2.5); }
      var voiced = t >= 600 && rms > thr;
      if (voiced) {
        if (first < 0) first = t;
        if (silentRun >= 1000 && last >= 0) { pauses++; }
        if (last >= 0) longest = Math.max(longest, silentRun);
        silentRun = 0;
        last = t;
        voicedMs += STEP;
      } else if (first >= 0) {
        silentRun += STEP;
      }
      if (onLevel) onLevel(Math.min(1, rms / 0.2), voiced);
    }, STEP);

    return {
      stop: function () {
        return new Promise(function (resolve) {
          clearInterval(timer);
          var finish = function () {
            stream.getTracks().forEach(function (tr) { tr.stop(); });
            try { ctx.close(); } catch (e) {}
            var url = chunks.length ? URL.createObjectURL(new Blob(chunks, { type: mime || "audio/mp4" })) : null;
            var dur = first >= 0 && last >= 0 ? (last - first) / 1000 : 0;
            resolve({ url: url, metrics: { dur: Math.round(dur * 10) / 10, speak: Math.round(voicedMs / 100) / 10, pauses: pauses, longest: Math.round(longest / 100) / 10 } });
          };
          if (mr && mr.state !== "inactive") { mr.onstop = finish; mr.stop(); } else finish();
        });
      }
    };
  }

  // ---------- テキスト比較 ----------
  var NUM = { zero: "0", one: "1", two: "2", three: "3", four: "4", five: "5", six: "6", seven: "7", eight: "8", nine: "9", ten: "10", eleven: "11", twelve: "12", fifteen: "15", twenty: "20", thirty: "30", forty: "40", fifty: "50", sixty: "60", seventy: "70", eighty: "80", ninety: "90", hundred: "100" };
  function tokens(s) {
    s = String(s).toLowerCase()
      .replace(/[’‘]/g, "'")
      .replace(/(\d),(\d)/g, "$1$2")
      .replace(/%/g, " percent ")
      .replace(/\$/g, " ")
      .replace(/\bdollars?\b/g, " ")
      .replace(/-/g, " ")
      .replace(/[^a-z0-9'. ]/g, " ")
      .replace(/\.(?!\d)/g, " ");
    return s.split(/\s+/).filter(Boolean).map(function (w) { return NUM[w] || w; });
  }
  // 模範文とユーザーの発話を比べる
  function compare(model, said) {
    var a = tokens(model), b = tokens(said);
    var n = a.length, m = b.length;
    var dp = [];
    for (var i = 0; i <= n; i++) { dp.push(new Array(m + 1).fill(0)); }
    for (i = n - 1; i >= 0; i--) for (var j = m - 1; j >= 0; j--) dp[i][j] = a[i] === b[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
    var hit = new Array(n).fill(false), used = new Array(m).fill(false);
    i = 0; j = 0;
    while (i < n && j < m) {
      if (a[i] === b[j]) { hit[i] = true; used[j] = true; i++; j++; }
      else if (dp[i + 1][j] >= dp[i][j + 1]) i++;
      else j++;
    }
    return {
      score: n ? dp[0][0] / n : 0,
      modelTokens: a,
      hit: hit,
      missing: a.filter(function (_, k) { return !hit[k]; }),
      extra: b.filter(function (_, k) { return !used[k]; })
    };
  }
  // 模範文を「言えた語／抜けた語」で色分けしたHTML
  function diffHtml(model, said, esc) {
    var words = String(model).split(/\s+/);
    var res = compare(model, said);
    var k = 0;
    return words.map(function (w) {
      var tk = tokens(w);
      if (!tk.length) return esc(w);
      var ok = true;
      for (var x = 0; x < tk.length; x++) { if (!res.hit[k + x]) ok = false; }
      k += tk.length;
      return '<span class="' + (ok ? "w-ok" : "w-miss") + '">' + esc(w) + "</span>";
    }).join(" ");
  }
  // 語形の違い（heads / headed / heading）をゆるく同一視する
  function stem(w) { return w.length > 4 ? w.replace(/(ing|ed|es|s)$/, "") : w; }
  function hasPhrase(said, chk) {
    var a = tokens(said).join(" ");
    var b = tokens(chk).join(" ");
    if (!b || (" " + a + " ").indexOf(" " + b + " ") >= 0 || a.indexOf(b) >= 0) return true;
    // 「take ... into consideration」「head up ～」のような表現：区切りごとに、順番どおり・語形ゆるく探す
    var aw = tokens(said).map(stem);
    var parts = String(chk).split(/\.\.\.|…|～|~|\bsomeone\b|\bsomething\b|\bsb\b|\bsth\b|\bone's\b/i).map(function (p) { return tokens(p).map(stem); }).filter(function (p) { return p.length; });
    if (!parts.length) return true;
    var pos = 0;
    return parts.every(function (p) {
      for (var i = pos; i + p.length <= aw.length; i++) {
        var hit = true;
        for (var k = 0; k < p.length; k++) if (aw[i + k] !== p[k]) { hit = false; break; }
        if (hit) { pos = i + p.length; return true; }
      }
      return false;
    });
  }
  function wordCount(s) { return tokens(s).length; }

  return { speak: speak, stopSpeak: stopSpeak, splitSentences: splitSentences, voices: function () { loadVoices(); return voices; },
    sttSupported: sttSupported, listen: listen, record: record, compare: compare, diffHtml: diffHtml, hasPhrase: hasPhrase, wordCount: wordCount, tokens: tokens };
})();
