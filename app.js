(function () {
  "use strict";
  var KEY = "fpa-v1";
  var INTERVALS = [0, 1, 3, 7, 14, 30, 60];
  var GRAD = 3; // この段階以上で「習得」
  var A = Audio2;

  // ---------- 保存データ ----------
  function defaults() {
    return {
      settings: { rate: 0.9, voice: "", silent: false, sttWhileRec: true, scenes: C.scenes.map(function (s) { return s.id; }), newPerDay: 8 },
      srs: {}, weak: {}, corrections: [], days: {}, fluency: [], newDone: {}
    };
  }
  function load() {
    try {
      var s = JSON.parse(localStorage.getItem(KEY) || "null");
      if (!s) return defaults();
      var d = defaults();
      s.settings = Object.assign(d.settings, s.settings || {});
      ["srs", "weak", "days", "newDone"].forEach(function (k) { s[k] = s[k] || {}; });
      s.corrections = s.corrections || [];
      s.fluency = s.fluency || [];
      return s;
    } catch (e) { return defaults(); }
  }
  var st = load();
  function save() { try { localStorage.setItem(KEY, JSON.stringify(st)); } catch (e) { alert("保存できませんでした（容量がいっぱいの可能性があります）"); } }

  // ---------- 日付・小物 ----------
  function pad(n) { return String(n).padStart(2, "0"); }
  function ymd(d) { d = d || new Date(); return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate()); }
  function addDays(n) { var d = new Date(); d.setDate(d.getDate() + n); return ymd(d); }
  function today() { return ymd(); }
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function shuffle(a) { a = a.slice(); for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
  function sceneOf(id) { return C.scenes.find(function (s) { return s.id === id; }) || { label: id, icon: "" }; }
  var app = document.getElementById("app");
  var screen = "home";
  var SAY = [];
  function say(text) { SAY.push(text); return SAY.length - 1; }
  function sayBtn(text, label) { return '<button class="say" data-say="' + say(text) + '">' + (label || "🔊") + "</button>"; }
  function render(html) { A.stopSpeak(); SAY = []; app.innerHTML = html; window.scrollTo(0, 0); }
  function header(title) { return '<header class="top"><button class="icon" data-go="home" aria-label="ホーム">←</button><h1>' + title + "</h1><span></span></header>"; }

  // ---------- 練習時間の記録 ----------
  setInterval(function () {
    if (document.hidden || ["home", "records", "settings", "import"].indexOf(screen) >= 0) return;
    var d = st.days[today()] || { sec: 0, n: 0 };
    d.sec += 5;
    st.days[today()] = d;
    if (d.sec % 30 === 0) save();
  }, 5000);
  function countItem() { var d = st.days[today()] || { sec: 0, n: 0 }; d.n++; st.days[today()] = d; }

  // ---------- 間隔反復 ----------
  function srsRecord(id, ok) {
    var t = today();
    var p = st.srs[id] || { box: 0, due: t, seen: 0, ok: 0, ng: 0 };
    p.seen++;
    if (ok) { p.ok++; p.box = Math.min(p.box + 1, INTERVALS.length - 1); p.due = addDays(INTERVALS[p.box]); }
    else { p.ng++; p.box = 0; p.due = addDays(1); }
    p.last = t;
    st.srs[id] = p;
    countItem();
    save();
  }
  function isDue(id) { var p = st.srs[id]; return p && p.due <= today(); }
  function addWeak(id, info) {
    var w = st.weak[id] || { n: 0, added: today() };
    w.n++;
    w.info = info || w.info;
    st.weak[id] = w;
    save();
  }
  // 新しい項目は1日 newPerDay 個まで
  function newLeft(kind) {
    var key = today() + ":" + kind;
    return Math.max(0, st.settings.newPerDay - (st.newDone[key] || 0));
  }
  function useNew(kind) {
    var key = today() + ":" + kind;
    st.newDone[key] = (st.newDone[key] || 0) + 1;
  }

  // ---------- 出題リスト ----------
  function selScenes() { return C.scenes.filter(function (s) { return st.settings.scenes.indexOf(s.id) >= 0; }); }
  function phraseItems(prefix) {
    var out = [];
    selScenes().forEach(function (s) {
      (C.phrases[s.id] || []).forEach(function (p, i) {
        out.push({ id: prefix + "-" + s.id + "-" + (i + 1), scene: s.id, en: p[0], ja: p[1], ex: p[2], exJa: p[3], chk: p[4] || p[0] });
      });
    });
    return out;
  }
  function buildQueue(prefix, kind, max) {
    var items = phraseItems(prefix);
    var due = shuffle(items.filter(function (x) { return isDue(x.id); }));
    var fresh = items.filter(function (x) { return !st.srs[x.id]; }).slice(0, newLeft(kind));
    return due.concat(fresh).slice(0, max || 20);
  }
  function findPhrase(id) {
    var m = id.match(/^[pk]-(\w+)-(\d+)$/);
    if (!m) return null;
    var p = (C.phrases[m[1]] || [])[+m[2] - 1];
    return p ? { id: id, scene: m[1], en: p[0], ja: p[1], ex: p[2], exJa: p[3], chk: p[4] || p[0] } : null;
  }
  function findBuild(id) {
    var m = id.match(/^b-(\w+)-(\d+)$/);
    if (!m) return null;
    var b = (C.builds[m[1]] || [])[+m[2] - 1];
    return b ? { id: id, scene: m[1], ja: b.ja, stages: b.stages, final: b.stages[b.stages.length - 1] } : null;
  }

  // ---------- ホーム ----------
  function home() {
    screen = "home";
    var d = st.days[today()] || { sec: 0, n: 0 };
    var cardsDue = buildQueue("k", "card", 99).length;
    var speakDue = buildQueue("p", "speak", 99).length;
    var focus = focusQueue().length;
    var chips = C.scenes.map(function (s) {
      var on = st.settings.scenes.indexOf(s.id) >= 0;
      return '<button class="chip ' + (on ? "on" : "") + '" data-scene="' + s.id + '">' + s.icon + " " + esc(s.label) + "</button>";
    }).join("");
    render(
      '<header class="top"><h1>FP&amp;A English</h1><button class="icon" data-go="records" aria-label="記録">📊</button><button class="icon" data-go="settings" aria-label="設定">⚙️</button></header>' +
      '<section class="stats"><div><b>' + Math.round(d.sec / 60) + '分</b><span>今日の練習</span></div><div><b>' + d.n + '</b><span>今日の問題数</span></div><div><b>' + streak() + '日</b><span>連続</span></div></section>' +
      '<button class="big focus" data-go="focus" ' + (focus ? "" : "disabled") + '>🎯 弱点集中モード<small>まちがえた表現・添削された表現 ' + focus + "件</small></button>" +
      '<section class="menu">' +
        tile("cards", "①", "表現カード", "あと" + cardsDue + "枚") +
        tile("speak", "②", "和→英で話す", "あと" + speakDue + "問") +
        tile("build", "③", "文を伸ばす", "長い1文を組み立てる") +
        tile("shadow", "④", "シャドーイング・音読", "録音して聞き比べ") +
        tile("speech", "⑤", "1分スピーチ", "流暢さメーター") +
        tile("role", "⑥", "会議ロールプレイ", "CFO・事業部長と") +
      "</section>" +
      '<section class="card"><div class="cat-head"><span>練習する場面</span><button class="link" data-allscenes="1">' + (st.settings.scenes.length === C.scenes.length ? "すべて外す" : "すべて選ぶ") + '</button></div><div class="chips">' + chips + "</div></section>" +
      '<button class="big sub" data-go="import">📥 Claudeの添削結果を取り込む</button>'
    );
  }
  function tile(go, num, title, sub) {
    return '<button class="tile" data-go="' + go + '"><span class="num">' + num + "</span><b>" + title + "</b><small>" + sub + "</small></button>";
  }
  function streak() {
    var n = 0, d = new Date();
    if (!(st.days[ymd(d)] && st.days[ymd(d)].sec >= 60)) d.setDate(d.getDate() - 1);
    while (st.days[ymd(d)] && st.days[ymd(d)].sec >= 60) { n++; d.setDate(d.getDate() - 1); }
    return n;
  }

  // ---------- 回答入力（音声認識＋テキスト） ----------
  var rec = null;
  function answerBox(ph) {
    if (st.settings.silent) return "";
    return '<div class="ansbox"><textarea id="said" rows="3" placeholder="' + esc(ph || "🎤を押して英語で話す（キーボードのマイク入力でもOK）") + '" autocapitalize="off" autocorrect="off" spellcheck="false"></textarea>' +
      '<div class="row"><button class="mic" data-mic="1">🎤 話す</button><button class="check" data-check="1">チェック</button></div><p class="sttmsg" id="sttmsg"></p></div>';
  }
  function toggleMic() {
    var btn = document.querySelector("[data-mic]");
    var msg = document.getElementById("sttmsg");
    if (rec) { rec.stop(); rec = null; if (btn) { btn.textContent = "🎤 話す"; btn.classList.remove("on"); } return; }
    if (!A.sttSupported()) { msg.textContent = "この画面では音声認識が使えません。キーボードのマイクボタンで入力してください。"; return; }
    var ta = document.getElementById("said");
    var base = ta.value ? ta.value + " " : "";
    A.stopSpeak();
    rec = A.listen(function (t) { ta.value = base + t; }, function () {
      rec = null;
      var b = document.querySelector("[data-mic]");
      if (b) { b.textContent = "🎤 話す"; b.classList.remove("on"); }
    }, function (err) { msg.textContent = err + "（キーボードのマイク入力も使えます）"; });
    if (rec) { btn.textContent = "⏹ 止める"; btn.classList.add("on"); msg.textContent = "話してください…"; }
  }
  function said() { if (rec) { rec.stop(); rec = null; } var t = document.getElementById("said"); return t ? t.value.trim() : ""; }

  // ---------- ① 表現カード ----------
  var q = null;
  function startCards() {
    q = { kind: "cards", items: buildQueue("k", "card", 20), i: 0, flip: false, ok: 0 };
    screen = "cards";
    cardView();
  }
  function cardView() {
    if (q.i >= q.items.length) return done("表現カード", q.ok, q.items.length);
    var it = q.items[q.i];
    var s = sceneOf(it.scene);
    render(header("① 表現カード") + progress() +
      '<section class="qcard"><div class="meta">' + s.icon + " " + esc(s.label) + (st.srs[it.id] ? "" : ' <span class="tag new">NEW</span>') + "</div>" +
      '<p class="phrase">' + esc(it.en) + " " + sayBtn(it.en) + "</p>" +
      '<p class="ex">' + esc(it.ex) + " " + sayBtn(it.ex) + "</p>" +
      (q.flip ? '<div class="back"><p class="ja">' + esc(it.ja) + '</p><p class="exja">' + esc(it.exJa) + "</p></div>" : "") +
      "</section>" +
      (q.flip ? '<div class="judge"><button class="big ng" data-card="0">まだ</button><button class="big ok" data-card="1">覚えた</button></div>'
              : '<button class="big start" data-flip="1">意味を見る</button>'));
    if (!q.flip) A.speak(it.ex, { rate: st.settings.rate, voice: st.settings.voice });
  }
  function progress() {
    var pct = q.items.length ? Math.round((q.i / q.items.length) * 100) : 0;
    return '<div class="bar"><i style="width:' + pct + '%"></i></div><p class="count">' + Math.min(q.i + 1, q.items.length) + " / " + q.items.length + "</p>";
  }

  // ---------- ② 和→英で話す（弱点集中モードでも使う） ----------
  function startSpeak() {
    q = { kind: "speak", items: buildQueue("p", "speak", 15).map(function (x) { return { type: "p", it: x }; }), i: 0, ok: 0 };
    screen = "speak";
    speakView();
  }
  function targetOf(e) {
    if (e.type === "p") return { ja: e.it.exJa, model: e.it.ex, chk: e.it.chk, hint: e.it.en + "（" + e.it.ja + "）", scene: e.it.scene };
    if (e.type === "b") return { ja: e.it.ja, model: e.it.final, chk: "", hint: e.it.stages[0], scene: e.it.scene };
    return { ja: e.it.ja || "", model: e.it.better, chk: "", hint: "前の言い方：" + e.it.original, scene: e.it.scene || "" };
  }
  function speakView() {
    if (q.i >= q.items.length) return done(q.kind === "focus" ? "弱点集中モード" : "和→英で話す", q.ok, q.items.length);
    var e = q.items[q.i];
    var t = targetOf(e);
    var s = sceneOf(t.scene);
    q.checked = false;
    render(header(q.kind === "focus" ? "🎯 弱点集中モード" : "② 和→英で話す") + progress() +
      '<section class="qcard"><div class="meta">' + (s.icon || "") + " " + esc(s.label || "") +
      (e.type === "c" ? ' <span class="tag bad">添削</span>' : e.type === "b" ? ' <span class="tag">長い文</span>' : "") + "</div>" +
      '<p class="prompt">' + esc(t.ja) + "</p>" +
      (e.type === "c" ? '<p class="orig">あなたの元の言い方：<s>' + esc(e.it.original) + "</s></p>" : "") +
      '<button class="link" data-hint="1">💡 ヒントを見る</button><p class="hint" id="hint" hidden>' + esc(t.hint) + "</p></section>" +
      (st.settings.silent ? '<button class="big start" data-reveal="1">頭の中で言ってから、答えを見る</button>' : answerBox()) +
      '<div id="result"></div>');
  }
  function checkSpeak(selfOk) {
    if (q.checked) return;
    var e = q.items[q.i], t = targetOf(e);
    var s = st.settings.silent ? "" : said();
    if (!st.settings.silent && !s && selfOk == null) { document.getElementById("sttmsg").textContent = "まず英語で話してください（または入力してください）"; return; }
    q.checked = true;
    var html = "";
    var ok;
    if (st.settings.silent) {
      html = '<div class="model"><p>' + esc(t.model) + " " + sayBtn(t.model) + '</p></div><p class="hint2">言えた？</p><div class="judge"><button class="big ng" data-judge="0">言えなかった</button><button class="big ok" data-judge="1">言えた</button></div>';
      document.getElementById("result").innerHTML = html;
      A.speak(t.model, { rate: st.settings.rate, voice: st.settings.voice });
      return;
    }
    var r = A.compare(t.model, s);
    var key = t.chk ? A.hasPhrase(s, t.chk) : true;
    ok = r.score >= 0.8 && key;
    q.lastOk = ok;
    html = '<div class="fb ' + (ok ? "ok" : "ng") + '">' + (ok ? "⭕ よく言えました（一致 " : "❌ もう少し（一致 ") + Math.round(r.score * 100) + "%）</div>" +
      (t.chk ? '<p class="keychk ' + (key ? "ok" : "ng") + '">' + (key ? "✓" : "✗") + " 表現「" + esc(t.chk) + "」" + (key ? "を使えた" : "が入っていない") + "</p>" : "") +
      '<div class="model"><small>模範（赤＝言えなかった語）</small><p>' + A.diffHtml(t.model, s, esc) + " " + sayBtn(t.model) + "</p></div>" +
      (r.extra.length ? '<p class="extra">余分・ちがう語：' + esc(r.extra.slice(0, 12).join(" ")) + "</p>" : "") +
      '<button class="big start" data-next="1">次へ ▶</button>' +
      (!ok ? '<button class="link" data-override="1">言い換えとして合っていた → ⭕にする</button>' : "") +
      '<button class="link" data-ask="1">🤖 この答えをClaudeに添削してもらう（指示文をコピー）</button>';
    document.getElementById("result").innerHTML = html;
    A.speak(t.model, { rate: st.settings.rate, voice: st.settings.voice });
  }
  function nextSpeak(okOverride) {
    var e = q.items[q.i];
    var ok = okOverride != null ? okOverride : q.lastOk;
    var id = e.type === "c" ? "c-" + e.it.id : e.it.id;
    if (q.kind === "speak" && !st.srs[id]) useNew("speak");
    srsRecord(id, ok);
    if (ok) q.ok++;
    else if (e.type === "p") addWeak(id);
    q.i++;
    speakView();
  }

  // ---------- 🎯 弱点集中モード ----------
  function focusQueue() {
    var out = [];
    Object.keys(st.weak).forEach(function (id) {
      var p = st.srs[id];
      if (p && p.box >= GRAD) return;
      if (p && p.box > 0 && p.due > today()) return; // まちがえたばかりの表現はすぐ練習できる
      var it = id[0] === "b" ? findBuild(id) : findPhrase(id);
      if (it) out.push({ type: id[0] === "b" ? "b" : "p", it: it });
    });
    st.corrections.forEach(function (c) {
      var p = st.srs["c-" + c.id];
      if (p && (p.box >= GRAD || (p.box > 0 && p.due > today()))) return;
      out.push({ type: "c", it: c });
    });
    return out;
  }
  function startFocus() {
    q = { kind: "focus", items: shuffle(focusQueue()).slice(0, 15), i: 0, ok: 0 };
    screen = "focus";
    speakView();
  }

  // ---------- ③ 文を伸ばす ----------
  function buildList() {
    var out = [];
    selScenes().forEach(function (s) {
      (C.builds[s.id] || []).forEach(function (b, i) { out.push(findBuild("b-" + s.id + "-" + (i + 1))); });
    });
    return out;
  }
  function buildMenu() {
    screen = "build";
    var list = buildList();
    render(header("③ 文を伸ばす") + '<p class="lead">短い文に少しずつ節を足して、<b>長い1文を途切れずに言える</b>ようにする練習です。各段階で「聞く → 見ないで言う → チェック」をくり返します。</p>' +
      list.map(function (b) {
        var p = st.srs[b.id];
        var mark = p ? (p.box >= GRAD ? "🎓" : p.due <= today() ? "🔁" : "✓") : "NEW";
        return '<button class="listitem" data-build="' + b.id + '"><span>' + sceneOf(b.scene).icon + " " + esc(b.stages[0]) + '</span><span class="tag">' + mark + "</span></button>";
      }).join(""));
  }
  function startBuild(id) {
    q = { kind: "build", b: findBuild(id), stage: 0, hidden: false, fails: 0 };
    screen = "buildrun";
    buildView();
  }
  function buildView() {
    var b = q.b, i = q.stage, cur = b.stages[i], prev = i ? b.stages[i - 1] : "";
    var prevCore = prev.replace(/[.?!]$/, "");
    var added = prev && cur.indexOf(prevCore) === 0 ? cur.slice(prevCore.length) : "";
    var shown = added ? esc(prevCore) + "<mark>" + esc(added) + "</mark>" : esc(cur);
    render(header("③ 文を伸ばす") +
      '<div class="stages">' + b.stages.map(function (_, k) { return '<i class="' + (k < i ? "done" : k === i ? "cur" : "") + '"></i>'; }).join("") + "</div>" +
      '<section class="qcard"><div class="meta">段階 ' + (i + 1) + " / " + b.stages.length + "（" + cur.split(/\s+/).length + "語）</div>" +
      (q.hidden ? '<p class="prompt">見ないで言ってみよう</p><p class="hint">' + (i === b.stages.length - 1 ? esc(b.ja) : "（" + cur.split(/\s+/).length + "語の文）") + "</p>"
                : '<p class="phrase long">' + shown + "</p>" + sayBtn(cur, "🔊 聞く") + (i === b.stages.length - 1 ? '<p class="exja">' + esc(b.ja) + "</p>" : "")) +
      "</section>" +
      (q.hidden ? (st.settings.silent ? '<button class="big start" data-reveal="1">頭の中で言ってから、答えを見る</button>' : answerBox()) + '<div id="result"></div>'
                : '<button class="big start" data-hide="1">覚えた → 見ないで言う</button>'));
    if (!q.hidden) A.speak(cur, { rate: st.settings.rate, voice: st.settings.voice });
  }
  function checkBuild() {
    var cur = q.b.stages[q.stage];
    if (st.settings.silent) {
      document.getElementById("result").innerHTML = '<div class="model"><p>' + esc(cur) + " " + sayBtn(cur) + '</p></div><div class="judge"><button class="big ng" data-bjudge="0">言えなかった</button><button class="big ok" data-bjudge="1">言えた</button></div>';
      return;
    }
    var s = said();
    if (!s) { document.getElementById("sttmsg").textContent = "まず英語で話してください"; return; }
    var r = A.compare(cur, s);
    var ok = r.score >= 0.85;
    document.getElementById("result").innerHTML =
      '<div class="fb ' + (ok ? "ok" : "ng") + '">' + (ok ? "⭕ 言えました（一致 " : "❌ もう一度（一致 ") + Math.round(r.score * 100) + "%）</div>" +
      '<div class="model"><small>模範（赤＝言えなかった語）</small><p>' + A.diffHtml(cur, s, esc) + " " + sayBtn(cur) + "</p></div>" +
      (ok ? '<button class="big start" data-bjudge="1">' + (q.stage === q.b.stages.length - 1 ? "完了 ✓" : "次の段階へ ▶") + "</button>"
          : '<div class="judge"><button class="big sub" data-retry="1">もう一度聞く</button><button class="big ok" data-bjudge="1">ほぼ言えた → 次へ</button></div>');
  }
  function buildJudge(ok) {
    if (!ok) { q.fails++; q.hidden = false; return buildView(); }
    if (q.stage < q.b.stages.length - 1) { q.stage++; q.hidden = false; return buildView(); }
    var good = q.fails <= 1;
    srsRecord(q.b.id, good);
    if (!good) addWeak(q.b.id);
    render(header("③ 文を伸ばす") + '<section class="result"><div class="face">' + (good ? "🎉" : "💪") + "</div><p>" + (good ? "長い1文を言えました！" : "おつかれさま！ この文は弱点集中モードでも練習します。") + '</p><p class="model">' + esc(q.b.final) + " " + sayBtn(q.b.final) + "</p></section>" +
      '<button class="big start" data-go="build">ほかの文を練習する</button><button class="big sub" data-go="home">ホームへ</button>');
  }

  // ---------- 録音つきの練習（④ シャドーイング・⑤ スピーチ 共通） ----------
  var recSession = null, sttSession = null, recTimer = null;
  async function startRecording(withStt) {
    var lvl = document.getElementById("level"), tm = document.getElementById("rectime");
    var t0 = Date.now();
    try {
      recSession = await A.record(function (v, voiced) { if (lvl) { lvl.style.width = Math.round(v * 100) + "%"; lvl.className = voiced ? "on" : ""; } });
    } catch (e) { alert("マイクを使えませんでした：" + e.message + "\n設定アプリでSafariのマイクを許可してください。"); return false; }
    recTimer = setInterval(function () { var s = Math.floor((Date.now() - t0) / 1000); if (tm) tm.textContent = Math.floor(s / 60) + ":" + pad(s % 60); }, 250);
    if (withStt && st.settings.sttWhileRec && A.sttSupported()) {
      var ta = document.getElementById("transcript");
      sttSession = A.listen(function (t) { if (ta) ta.value = t; }, null, function (err) {
        var m = document.getElementById("recmsg");
        if (m) m.textContent = "文字起こしは止まりましたが、録音と計測は続いています（" + err + "）";
      });
    }
    return true;
  }
  async function stopRecording() {
    clearInterval(recTimer);
    if (sttSession) { try { sttSession.stop(); } catch (e) {} sttSession = null; }
    if (!recSession) return null;
    var r = await recSession.stop();
    recSession = null;
    return r;
  }
  function meterHtml() {
    return '<div class="meter"><div class="lvl"><i id="level"></i></div><span id="rectime">0:00</span></div><p class="sttmsg" id="recmsg"></p>';
  }
  function metricsHtml(m, words) {
    var perMin = m.dur > 0 ? (m.pauses / (m.dur / 60)) : 0;
    var wpm = words && m.dur > 5 ? Math.round(words / (m.dur / 60)) : null;
    var good = function (b) { return b ? "good" : "warn"; };
    return '<div class="metrics">' +
      '<div><b>' + m.dur + '秒</b><span>話した長さ</span></div>' +
      '<div class="' + good(perMin <= 3) + '"><b>' + m.pauses + "回</b><span>1秒以上の沈黙（" + (Math.round(perMin * 10) / 10) + "回/分）</span></div>" +
      '<div class="' + good(m.longest < 2.5) + '"><b>' + m.longest + '秒</b><span>いちばん長い沈黙</span></div>' +
      '<div><b>' + (wpm == null ? "—" : wpm) + "</b><span>1分あたりの語数</span></div></div>" +
      '<p class="note">目安：沈黙は1分に3回以下、いちばん長い沈黙は2.5秒未満。ゆっくりでも止まらずに話せていればOKです（会議での説明は1分120〜150語くらい）。</p>';
  }
  function saveFluency(kind, id, m, words) {
    st.fluency.push({ date: today(), kind: kind, id: id, dur: m.dur, pauses: m.pauses, longest: m.longest, wpm: words && m.dur > 5 ? Math.round(words / (m.dur / 60)) : null });
    st.fluency = st.fluency.slice(-200);
    countItem();
    save();
  }

  // ---------- ④ シャドーイング・音読 ----------
  function shadowMenu() {
    screen = "shadow";
    render(header("④ シャドーイング・音読") + '<p class="lead">お手本を聞きながら少し遅れてまねる（シャドーイング）か、文を見ながら声に出して読みます（音読）。録音して、お手本と聞き比べましょう。</p>' +
      selScenes().map(function (s) {
        var p = C.passages[s.id];
        var n = st.fluency.filter(function (f) { return f.kind === "shadow" && f.id === s.id; }).length;
        return '<button class="listitem" data-shadow="' + s.id + '"><span>' + s.icon + " " + esc(p.title) + '</span><span class="tag">' + (n ? n + "回" : "NEW") + "</span></button>";
      }).join(""));
  }
  function shadowView(id) {
    screen = "shadowrun";
    var p = C.passages[id];
    q = { kind: "shadow", id: id, sents: A.splitSentences(p.text), url: null };
    render(header("④ シャドーイング・音読") +
      '<section class="qcard"><div class="meta">' + sceneOf(id).icon + " " + esc(p.title) + '</div><p class="hint">' + esc(p.ja) + "</p>" +
      '<div class="passage">' + q.sents.map(function (s, i) { return '<span class="sent" data-sent="' + i + '">' + esc(s) + "</span>"; }).join(" ") + "</div>" +
      '<p class="note">文をタップすると、その文だけ聞けます。</p></section>' +
      '<div class="row"><button class="big sub" data-playall="1">▶ 通して聞く</button><button class="big sub" data-stopsay="1">⏹ 止める</button></div>' +
      '<button class="big rec" data-recstart="shadow">⏺ 録音しながら読む</button><div id="recarea"></div>');
  }
  function playAll() {
    A.speak(q.sents, { rate: st.settings.rate, voice: st.settings.voice, onEach: function (i) {
      document.querySelectorAll(".sent").forEach(function (el, k) { el.classList.toggle("now", k === i); });
    } });
  }

  // ---------- ⑤ 1分スピーチ ----------
  function speechTopics() {
    var out = [];
    selScenes().forEach(function (s) {
      var p = C.passages[s.id];
      var keys = (C.phrases[s.id] || []).map(function (x) { return x[4] || x[0]; }).filter(function (k) { return A.hasPhrase(p.text, k); }).slice(0, 5);
      out.push({ id: s.id + "-1", scene: s.id, title: p.title, ja: p.ja, keys: keys, model: p.text });
      var sp = C.speeches[s.id];
      if (sp) out.push({ id: s.id + "-2", scene: s.id, title: sp.title, ja: sp.ja, keys: sp.keys, model: sp.model });
    });
    return out;
  }
  function speechMenu() {
    screen = "speech";
    render(header("⑤ 1分スピーチ") + '<p class="lead">お題に沿って、<b>約1分、止まらずに</b>話します。話した長さ・1秒以上の沈黙の回数・話す速さを自動で測ります。</p>' +
      speechTopics().map(function (t) {
        var hist = st.fluency.filter(function (f) { return f.kind === "speech" && f.id === t.id; });
        var last = hist[hist.length - 1];
        return '<button class="listitem" data-speech="' + t.id + '"><span>' + sceneOf(t.scene).icon + " " + esc(t.title) + '</span><span class="tag">' + (last ? "沈黙" + last.pauses + "回" : "NEW") + "</span></button>";
      }).join(""));
  }
  function speechView(id) {
    screen = "speechrun";
    var t = speechTopics().find(function (x) { return x.id === id; });
    q = { kind: "speech", t: t, url: null };
    render(header("⑤ 1分スピーチ") +
      '<section class="qcard"><div class="meta">' + sceneOf(t.scene).icon + " " + esc(t.title) + '</div><p class="prompt small">' + esc(t.ja) + "</p>" +
      '<p class="note">使いたい表現（タップで発音）：</p><div class="chips">' + t.keys.map(function (k) { return '<button class="chip on" data-say="' + say(k) + '">' + esc(k) + "</button>"; }).join("") + "</div></section>" +
      '<button class="big rec" data-recstart="speech">⏺ 話し始める</button><div id="recarea"></div>');
  }
  async function recStart(kind) {
    var area = document.getElementById("recarea");
    A.stopSpeak();
    area.innerHTML = meterHtml() + (kind === "speech" ? '<textarea id="transcript" rows="4" placeholder="（文字起こしがここに出ます。出ない場合は、あとでキーボードのマイク入力で話した内容を入れられます）"></textarea>' : "") +
      '<button class="big ng" data-recstop="' + kind + '">⏹ 終わる</button>';
    document.querySelector("[data-recstart]").hidden = true;
    var ok = await startRecording(kind === "speech");
    if (!ok) { area.innerHTML = ""; document.querySelector("[data-recstart]").hidden = false; }
  }
  async function recStop(kind) {
    var r = await stopRecording();
    if (!r) return;
    if (q.url) URL.revokeObjectURL(q.url);
    q.url = r.url;
    q.m = r.metrics;
    var area = document.getElementById("recarea");
    if (kind === "shadow") {
      var words = A.wordCount(C.passages[q.id].text);
      saveFluency("shadow", q.id, r.metrics, words);
      area.innerHTML = metricsHtml(r.metrics, words) + playerHtml() + '<button class="big rec" data-recstart="shadow">⏺ もう一度録音する</button>';
      document.querySelector("[data-recstart]").hidden = true;
      return;
    }
    var tr = (document.getElementById("transcript") || {}).value || "";
    q.transcript = tr;
    speechResult();
  }
  function playerHtml() {
    return q.url ? '<div class="player"><p class="note">自分の録音：</p><audio controls src="' + q.url + '"></audio></div>' : '<p class="note">（この環境では録音の再生ができませんでした）</p>';
  }
  function speechResult() {
    var t = q.t, tr = q.transcript || "";
    var words = A.wordCount(tr);
    saveFluency("speech", t.id, q.m, words || null);
    var used = t.keys.map(function (k) { return { k: k, ok: tr ? A.hasPhrase(tr, k) : null }; });
    var area = document.getElementById("recarea");
    area.innerHTML = metricsHtml(q.m, words) +
      '<p class="note">文字起こし（直してから添削を頼めます）：</p><textarea id="transcript" rows="5">' + esc(tr) + "</textarea>" +
      (tr ? '<div class="keys">' + used.map(function (u) { return '<span class="' + (u.ok ? "ok" : "ng") + '">' + (u.ok ? "✓ " : "✗ ") + esc(u.k) + "</span>"; }).join("") + "</div>" : "") +
      playerHtml() +
      '<details class="modelbox"><summary>模範スピーチを見る</summary><p>' + esc(t.model) + "</p>" + sayBtn(t.model, "🔊 聞く") + "</details>" +
      '<button class="big start" data-askspeech="1">🤖 Claudeに添削してもらう（指示文をコピー）</button>' +
      '<button class="big rec" data-recstart="speech">⏺ もう一度話す</button>';
    document.querySelector("[data-recstart]").hidden = true;
  }

  // ---------- ⑥ 会議ロールプレイ ----------
  function roleMenu() {
    screen = "role";
    render(header("⑥ 会議ロールプレイ") + '<p class="lead">相手（CFO・事業部長など）の質問が読み上げられます。<b>自分の言葉で</b>答えてから、回答例と比べましょう。最後に、Claudeと自由に会話するための指示文も作れます。</p>' +
      selScenes().map(function (s) {
        var r = C.roleplays[s.id];
        return '<button class="listitem" data-role="' + s.id + '"><span>' + s.icon + " " + esc(r.who) + "：" + esc(r.setting) + "</span></button>";
      }).join(""));
  }
  function roleStart(id) {
    q = { kind: "role", id: id, r: C.roleplays[id], i: 0, answers: [] };
    screen = "rolerun";
    roleView();
  }
  function roleView() {
    var r = q.r;
    if (q.i >= r.turns.length) return roleEnd();
    var tn = r.turns[q.i];
    q.checked = false;
    render(header("⑥ 会議ロールプレイ") + '<div class="bar"><i style="width:' + Math.round((q.i / r.turns.length) * 100) + '%"></i></div><p class="count">' + (q.i + 1) + " / " + r.turns.length + "</p>" +
      '<section class="qcard"><div class="meta">' + sceneOf(q.id).icon + " 相手：" + esc(r.who) + '</div><p class="hint">' + esc(r.setting) + "</p>" +
      '<div class="bubble"><button class="say big2" data-say="' + say(tn[0]) + '" data-second="1">🔊 もう一度聞く</button><button class="link" data-showline="1">せりふを表示</button><p id="line" hidden>' + esc(tn[0]) + "</p></div>" +
      '<button class="link" data-hint="1">💡 答え方のヒント</button><p class="hint" id="hint" hidden>' + esc(tn[1]) + "</p></section>" +
      (st.settings.silent ? '<button class="big start" data-rolecheck="1">頭の中で答えてから、回答例を見る</button>' : answerBox("🎤を押して、自分の言葉で答える")) +
      '<div id="result"></div>');
    setTimeout(function () { A.speak(tn[0], { rate: st.settings.rate, voice: st.settings.voice, second: true }); }, 300);
  }
  function roleCheck() {
    if (q.checked) return;
    var tn = q.r.turns[q.i];
    var s = st.settings.silent ? "" : said();
    if (!st.settings.silent && !s) { document.getElementById("sttmsg").textContent = "まず英語で答えてください"; return; }
    q.checked = true;
    q.answers.push({ q: tn[0], a: s });
    var r = s ? A.compare(tn[2], s) : null;
    document.getElementById("result").innerHTML =
      (r ? '<p class="note">回答例との重なり：' + Math.round(r.score * 100) + "%（自分の言葉で答えられていれば、低くても大丈夫です）</p>" : "") +
      '<div class="model"><small>回答例</small><p>' + (s ? A.diffHtml(tn[2], s, esc) : esc(tn[2])) + " " + sayBtn(tn[2]) + "</p></div>" +
      '<button class="big start" data-rolenext="1">次へ ▶</button>';
    countItem();
    save();
  }
  function roleEnd() {
    screen = "roleend";
    render(header("⑥ 会議ロールプレイ") + '<section class="result"><div class="face">👏</div><p>おつかれさまでした！</p></section>' +
      '<section class="card"><h2>あなたの回答</h2>' + q.answers.map(function (x) { return '<p class="qa"><b>Q.</b> ' + esc(x.q) + "<br><b>A.</b> " + esc(x.a || "（頭の中で回答）") + "</p>"; }).join("") + "</section>" +
      '<button class="big start" data-askrole="1">🤖 回答をClaudeに添削してもらう（指示文をコピー）</button>' +
      '<button class="big sub" data-freerole="1">🗣 Claudeの音声モードで自由に会話する（指示文をコピー）</button>' +
      '<button class="big sub" data-go="role">ほかの場面を練習する</button>');
  }

  // ---------- Claude への指示文 ----------
  var JSON_SPEC = '```json\n{"corrections":[{"original":"（私の表現そのまま）","better":"（より良い表現・1文）","why":"（理由を日本語で短く）","ja":"（betterの日本語訳）"}]}\n```';
  var PROFILE = "I am a Japanese FP&A professional working at the Japan affiliate of a US-headquartered medical device company. I can speak in short sentences in meetings, but I get stuck when giving longer explanations. My goal is to speak long sentences accurately and without pauses, using expressions that are actually common in real FP&A work (CFO reporting, variance analysis, forecasting, budgeting).";
  function feedbackPrompt(situation, body) {
    return "You are my business English coach. " + PROFILE + "\n\n" +
      "Situation: " + situation + "\n\n" +
      "Below is what I said (from speech recognition, so ignore obvious recognition errors such as homophones):\n\n" + body + "\n\n" +
      "Please:\n1. Point out expressions that are incorrect or unnatural, and suggest better ones that are commonly used in real FP&A meetings. Focus on the most important 3-8 points.\n" +
      "2. Show an improved version of my whole answer. Keep it at a level I can actually say (clear and natural, not too fancy), and use connectors that help me make longer sentences.\n" +
      "3. Write all explanations in Japanese.\n" +
      "4. At the very end, output a JSON code block in exactly this format so I can import it into my training app (one item per correction; \"better\" should be a full sentence I can practice saying):\n" + JSON_SPEC;
  }
  function rolePrompt(r) {
    return "Let's do a business English role-play by voice. " + PROFILE + "\n\n" +
      "You play: " + r.who + "（in English）. Setting: " + r.setting + "\n\n" +
      "Rules:\n- Speak only in English during the role-play. Ask me one question at a time and keep each of your turns short (1-2 sentences).\n- Push back and ask follow-up questions like a real executive (numbers, drivers, risks, actions).\n- Use realistic medical device business context (procedure volumes, pricing, reimbursement, tenders, backorders, FX).\n- After about 8 exchanges, or when I say \"stop\", end the role-play and give me feedback in Japanese: list my incorrect or unnatural expressions with better alternatives commonly used in FP&A meetings.\n" +
      "- Finally, output a JSON code block in exactly this format so I can import it into my training app:\n" + JSON_SPEC + "\n\nPlease start with your first question.";
  }
  function copyPrompt(text) {
    var doneMsg = function () {
      alert("指示文をコピーしました。\nClaude（アプリまたは claude.ai）に貼り付けて送ってください。\n返ってきた添削の最後にあるJSONを、ホームの「📥 Claudeの添削結果を取り込む」に貼ると、弱点集中モードで練習できます。");
    };
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(doneMsg, function () { fallbackCopy(text); });
    else fallbackCopy(text);
  }
  function fallbackCopy(text) {
    screen = "copy";
    render(header("指示文をコピー") + '<p class="lead">下の文を全部選んでコピーし、Claudeに貼り付けてください。</p><textarea class="copy" rows="16" readonly>' + esc(text) + "</textarea>");
    var ta = app.querySelector("textarea.copy");
    ta.focus();
    ta.select();
  }

  // ---------- 添削結果の取り込み ----------
  function importView() {
    screen = "import";
    render(header("📥 添削結果を取り込む") +
      '<p class="lead">Claudeの添削の最後にあるJSON（<code>{"corrections": …}</code>）を、まるごと貼り付けてください。添削全体を貼り付けてもOKです。</p>' +
      '<textarea id="imp" rows="10" placeholder="ここに貼り付け"></textarea><button class="big start" data-doimport="1">取り込む</button>' +
      '<section class="card"><h2>取り込んだ添削（' + st.corrections.length + "件）</h2>" +
      (st.corrections.length ? st.corrections.slice().reverse().slice(0, 30).map(function (c) {
        var p = st.srs["c-" + c.id];
        return '<div class="corr"><p><s>' + esc(c.original) + "</s></p><p>→ <b>" + esc(c.better) + "</b> " + sayBtn(c.better) + '</p><p class="note">' + esc(c.why || "") + (p && p.box >= GRAD ? " 🎓習得" : "") + '</p><button class="link danger" data-delcorr="' + esc(c.id) + '">削除</button></div>';
      }).join("") : '<p class="note">まだありません。</p>') + "</section>");
  }
  function doImport() {
    var raw = document.getElementById("imp").value;
    var m = raw.match(/```(?:json)?\s*([\s\S]*?)```/);
    var txt = m ? m[1] : raw.slice(raw.indexOf("{"), raw.lastIndexOf("}") + 1);
    var d;
    try { d = JSON.parse(txt); } catch (e) { return alert("JSONを読み取れませんでした。Claudeの返答の最後にある ```json … ``` の部分を貼り付けてください。"); }
    var list = Array.isArray(d) ? d : d.corrections;
    if (!Array.isArray(list)) return alert("corrections が見つかりませんでした。");
    var n = 0;
    list.forEach(function (c) {
      if (!c || !c.better) return;
      if (st.corrections.some(function (x) { return x.better === c.better; })) return;
      st.corrections.push({ id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6), original: String(c.original || ""), better: String(c.better), why: String(c.why || ""), ja: String(c.ja || ""), added: today() });
      n++;
    });
    save();
    alert(n + "件の添削を取り込みました。弱点集中モードで練習できます。");
    importView();
  }

  // ---------- 完了画面 ----------
  function done(title, ok, n) {
    screen = "done";
    render(header(title) + '<section class="result"><div class="face">' + (n === 0 ? "☕" : ok === n ? "🏆" : "👍") + "</div>" +
      (n === 0 ? "<p>今やる分は終わっています。明日また復習が出てきます。</p>" : '<div class="score">' + ok + " / " + n + "</div><p>おつかれさまでした！</p>") +
      '</section><button class="big start" data-go="home">ホームへ</button>');
  }

  // ---------- 記録 ----------
  function records() {
    screen = "records";
    var days = [], max = 1;
    for (var i = 13; i >= 0; i--) { var d = new Date(); d.setDate(d.getDate() - i); var v = st.days[ymd(d)] || { sec: 0 }; days.push({ d: d, m: Math.round(v.sec / 60) }); max = Math.max(max, Math.round(v.sec / 60)); }
    var total = Object.keys(st.days).reduce(function (a, k) { return a + st.days[k].sec; }, 0);
    var learned = Object.keys(st.srs).filter(function (k) { return k[0] === "k" && st.srs[k].box >= GRAD; }).length;
    var spoken = Object.keys(st.srs).filter(function (k) { return k[0] === "p" && st.srs[k].box >= GRAD; }).length;
    var weakAll = Object.keys(st.weak).length;
    var weakGrad = Object.keys(st.weak).filter(function (k) { return st.srs[k] && st.srs[k].box >= GRAD; }).length;
    var corrGrad = st.corrections.filter(function (c) { return st.srs["c-" + c.id] && st.srs["c-" + c.id].box >= GRAD; }).length;
    var sp = st.fluency.filter(function (f) { return f.kind === "speech"; }).slice(-12);
    var nPhr = C.scenes.reduce(function (a, s) { return a + (C.phrases[s.id] || []).length; }, 0);
    render(header("📊 記録") +
      '<section class="stats"><div><b>' + Math.round(total / 60) + '分</b><span>累計の練習</span></div><div><b>' + streak() + '日</b><span>連続</span></div><div><b>' + st.fluency.length + '回</b><span>録音した回数</span></div></section>' +
      '<section class="card"><h2>最近14日間の練習時間（分）</h2><div class="chart">' + days.map(function (x) {
        return '<div class="col"><div class="stack"><i style="height:' + Math.round((x.m / max) * 100) + '%"></i></div><small>' + (x.m || "") + "</small><span>" + (x.d.getMonth() + 1) + "/" + x.d.getDate() + "</span></div>";
      }).join("") + "</div></section>" +
      '<section class="card"><h2>流暢さの推移（1分スピーチ・直近' + sp.length + "回）</h2>" +
      (sp.length ? '<table class="tbl"><tr><th>日付</th><th>長さ</th><th>沈黙</th><th>最長</th><th>語/分</th></tr>' + sp.slice().reverse().map(function (f) {
        var per = f.dur ? Math.round((f.pauses / (f.dur / 60)) * 10) / 10 : 0;
        return "<tr><td>" + f.date.slice(5) + "</td><td>" + f.dur + "秒</td><td>" + f.pauses + "回（" + per + "/分）</td><td>" + f.longest + "秒</td><td>" + (f.wpm == null ? "—" : f.wpm) + "</td></tr>";
      }).join("") + "</table>" : '<p class="note">まだ記録がありません。</p>') + "</section>" +
      '<section class="card"><h2>習得状況</h2><div class="kv"><span>表現カード（覚えた）</span><b>' + learned + " / " + nPhr + '</b></div><div class="kv"><span>和→英（言えるようになった）</span><b>' + spoken + " / " + nPhr + '</b></div><div class="kv"><span>弱点（卒業 / 全体）</span><b>' + weakGrad + " / " + weakAll + '</b></div><div class="kv"><span>添削（習得 / 全体）</span><b>' + corrGrad + " / " + st.corrections.length + "</b></div></section>" +
      '<section class="card"><h2>データの保存</h2><p class="note">機種変更に備えて、記録をコピーしてメモなどに保存できます。</p><div class="row"><button class="big sub" data-backup="1">記録をコピー</button><button class="big sub" data-restore="1">記録を復元</button></div></section>');
  }

  // ---------- 設定 ----------
  function settings() {
    screen = "settings";
    var s = st.settings;
    var vs = A.voices();
    var seg = function (key, val, label) { return '<button class="seg ' + (s[key] === val ? "on" : "") + '" data-set="' + key + '" data-val="' + val + '">' + label + "</button>"; };
    render(header("⚙️ 設定") +
      '<section class="card"><label>読み上げの速さ</label><div class="segs">' + [0.7, 0.8, 0.9, 1].map(function (r) { return seg("rate", r, r === 1 ? "ふつう" : r + "倍"); }).join("") + "</div>" +
      "<label>読み上げの声（アメリカ英語）</label><select id=\"voice\"><option value=\"\">おまかせ</option>" + vs.map(function (v) { return '<option value="' + esc(v.name) + '"' + (s.voice === v.name ? " selected" : "") + ">" + esc(v.name) + "</option>"; }).join("") + "</select>" +
      sayBtn("Revenue came in three percent below plan, driven primarily by lower procedure volumes in Japan.", "🔊 試しに聞く") +
      "<label>声を出せないモード（電車など）</label><div class=\"segs\">" + seg("silent", false, "オフ") + seg("silent", true, "オン") + '</div><p class="note">オンにすると、話す代わりに「頭の中で言って → 答えを見て自己判定」になります。</p>' +
      "<label>スピーチ中に文字起こしもする</label><div class=\"segs\">" + seg("sttWhileRec", true, "する") + seg("sttWhileRec", false, "しない") + '</div><p class="note">iPhoneによっては、録音と文字起こしを同時にできないことがあります。うまくいかない場合は「しない」にして、終わってからキーボードのマイク入力で内容を入れてください。</p>' +
      "<label>1日の新しい表現の数</label><div class=\"segs\">" + [5, 8, 12].map(function (n) { return seg("newPerDay", n, n + "個"); }).join("") + "</div></section>" +
      '<section class="card"><h2>音声認識のテスト</h2>' + (A.sttSupported() ? '<p class="note">🎤を押して英語で話してみてください。</p>' : '<p class="note">この画面では音声認識が使えません。キーボードのマイク入力を使ってください（ホーム画面から開いている場合、Safariで開くと使えることがあります）。</p>') + answerBox() + "</section>");
  }

  // ---------- バックアップ ----------
  function backup() {
    var text = JSON.stringify({ app: "fpa-english", v: 1, data: st });
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(function () { alert("記録をコピーしました。メモアプリなどに保存してください。"); }, function () { fallbackCopy(text); });
    else fallbackCopy(text);
  }
  function restore() {
    var t = prompt("保存しておいた記録を貼り付けてください");
    if (!t) return;
    try { var d = JSON.parse(t); if (d.app !== "fpa-english") throw 0; st = Object.assign(defaults(), d.data); save(); alert("復元しました。"); home(); }
    catch (e) { alert("読み込めませんでした。"); }
  }

  // ---------- 操作 ----------
  app.addEventListener("click", function (e) {
    var sent = e.target.closest("[data-sent]");
    if (sent) { var i = +sent.dataset.sent; A.speak(q.sents[i], { rate: st.settings.rate, voice: st.settings.voice, onEach: function (k) { document.querySelectorAll(".sent").forEach(function (el, j) { el.classList.toggle("now", k >= 0 && j === i); }); } }); return; }
    var b = e.target.closest("button");
    if (!b || b.disabled) return;
    var ds = b.dataset;
    if (ds.say !== undefined) { A.speak(SAY[+ds.say], { rate: st.settings.rate, voice: st.settings.voice, second: !!ds.second }); return; }
    if (ds.go) {
      if (recSession) stopRecording();
      var g = ds.go;
      if (g === "home") return home();
      if (g === "records") return records();
      if (g === "settings") return settings();
      if (g === "cards") return startCards();
      if (g === "speak") return startSpeak();
      if (g === "focus") return startFocus();
      if (g === "build") return buildMenu();
      if (g === "shadow") return shadowMenu();
      if (g === "speech") return speechMenu();
      if (g === "role") return roleMenu();
      if (g === "import") return importView();
    }
    if (ds.scene) {
      var arr = st.settings.scenes, k = arr.indexOf(ds.scene);
      if (k >= 0) { if (arr.length > 1) arr.splice(k, 1); } else arr.push(ds.scene);
      save(); var y = window.pageYOffset; home(); window.scrollTo(0, y); return;
    }
    if (ds.allscenes) { st.settings.scenes = st.settings.scenes.length === C.scenes.length ? [C.scenes[0].id] : C.scenes.map(function (s) { return s.id; }); save(); var y2 = window.pageYOffset; home(); window.scrollTo(0, y2); return; }
    if (ds.flip) { q.flip = true; return cardView(); }
    if (ds.card !== undefined) { var it = q.items[q.i]; if (!st.srs[it.id]) useNew("card"); srsRecord(it.id, ds.card === "1"); if (ds.card === "1") q.ok++; q.i++; q.flip = false; return cardView(); }
    if (ds.mic) return toggleMic();
    if (ds.hint) { var h = document.getElementById("hint"); if (h) h.hidden = !h.hidden; return; }
    if (ds.check) {
      if (screen === "buildrun") return checkBuild();
      if (screen === "rolerun") return roleCheck();
      if (screen === "settings") { var r2 = said(); alert(r2 ? "認識された文：\n" + r2 : "まだ何も入っていません"); return; }
      return checkSpeak();
    }
    if (ds.reveal) { if (screen === "buildrun") return checkBuild(); return checkSpeak(true); }
    if (ds.judge !== undefined) { q.lastOk = ds.judge === "1"; return nextSpeak(); }
    if (ds.next) return nextSpeak();
    if (ds.override) return nextSpeak(true);
    if (ds.ask) { var t = targetOf(q.items[q.i]); return copyPrompt(feedbackPrompt("Translate this Japanese sentence into natural English for an FP&A meeting: " + t.ja + "  (Model answer: " + t.model + ")", document.getElementById("said") ? document.getElementById("said").value : "")); }
    if (ds.build) return startBuild(ds.build);
    if (ds.hide) { q.hidden = true; A.stopSpeak(); return buildView(); }
    if (ds.retry) { q.hidden = false; return buildView(); }
    if (ds.bjudge !== undefined) return buildJudge(ds.bjudge === "1");
    if (ds.shadow) return shadowView(ds.shadow);
    if (ds.playall) return playAll();
    if (ds.stopsay) { A.stopSpeak(); return; }
    if (ds.speech) return speechView(ds.speech);
    if (ds.recstart) return recStart(ds.recstart);
    if (ds.recstop) return recStop(ds.recstop);
    if (ds.askspeech) { var tr = document.getElementById("transcript"); var body = tr ? tr.value.trim() : ""; if (!body) return alert("話した内容（文字起こし）を入れてから押してください。キーボードのマイク入力でもOKです。"); return copyPrompt(feedbackPrompt(q.t.title + " — " + q.t.ja + " (I gave a one-minute spoken explanation.)", body)); }
    if (ds.role) return roleStart(ds.role);
    if (ds.showline) { var l = document.getElementById("line"); if (l) l.hidden = !l.hidden; return; }
    if (ds.rolecheck) return roleCheck();
    if (ds.rolenext) { q.i++; return roleView(); }
    if (ds.askrole) return copyPrompt(feedbackPrompt("Role-play. You were: " + q.r.who + ". Setting: " + q.r.setting, q.answers.map(function (x, i) { return (i + 1) + ". Q: " + x.q + "\n   My answer: " + (x.a || "(no answer)"); }).join("\n")));
    if (ds.freerole) return copyPrompt(rolePrompt(q.r));
    if (ds.doimport) return doImport();
    if (ds.delcorr) { if (confirm("この添削を削除しますか？")) { st.corrections = st.corrections.filter(function (c) { return c.id !== ds.delcorr; }); save(); importView(); } return; }
    if (ds.set) {
      var v = ds.val; v = v === "true" ? true : v === "false" ? false : isNaN(+v) ? v : +v;
      st.settings[ds.set] = v; save(); var y3 = window.pageYOffset; settings(); window.scrollTo(0, y3); return;
    }
    if (ds.backup) return backup();
    if (ds.restore) return restore();
  });
  app.addEventListener("change", function (e) {
    if (e.target.id === "voice") { st.settings.voice = e.target.value; save(); }
  });

  window.__fpa = { st: function () { return st; }, findBuild: findBuild, focusQueue: focusQueue, feedbackPrompt: feedbackPrompt };
  home();
})();
