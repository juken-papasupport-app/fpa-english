// FP&A English — 場面と表現カード
// 表現: [英語の表現, 日本語の意味, 例文(英), 例文(和), チェック用の語句(省略時は表現そのもの)]
// ※学習記録は「場面ID-番号」で結びつくので、既存の表現の順番は変えず、追加は末尾へ。
var C = {
  scenes: [
    { id: "variance", label: "差異説明（予実・前年比）", icon: "📊" },
    { id: "budget", label: "予算・事業計画", icon: "🗂" },
    { id: "forecast", label: "見通し（フォーキャスト）", icon: "🔭" },
    { id: "exec", label: "CFO・経営陣への報告", icon: "👔" },
    { id: "partner", label: "事業部門との打ち合わせ・交渉", icon: "🤝" },
    { id: "scenario", label: "シナリオ・感応度分析", icon: "🎛" },
    { id: "invest", label: "投資判断（NPV・IRR・回収）", icon: "💰" },
    { id: "kpi", label: "KPI・ダッシュボード", icon: "📈" },
    { id: "calls", label: "電話会議の進行・雑談", icon: "📞" }
  ],
  phrases: {},
  builds: {},
  passages: {},
  speeches: {},
  roleplays: {}
};

C.phrases.variance = [
  ["come in below / above plan", "計画を下回る／上回る着地になる", "Revenue came in 3% below plan for the quarter.", "当四半期の売上は計画を3%下回りました。", "came in"],
  ["driven primarily by", "主に〜による", "The shortfall was driven primarily by lower procedure volumes in Japan.", "未達は主に日本での手技件数の減少によるものです。"],
  ["partially offset by", "〜によって一部相殺される", "Lower volumes were partially offset by favorable pricing in the US.", "数量の減少は、米国での有利な価格によって一部相殺されました。"],
  ["unfavorable variance", "不利差異", "We had an unfavorable variance of $1.2 million in freight costs.", "運送費で120万ドルの不利差異がありました。"],
  ["year over year", "前年比で", "Gross margin improved by 150 basis points year over year.", "売上総利益率は前年比で150ベーシスポイント改善しました。"],
  ["basis points", "ベーシスポイント（0.01%）", "Operating margin was down 80 basis points versus last year.", "営業利益率は前年に比べて80ベーシスポイント低下しました。"],
  ["timing-related", "タイミングによる（一時的な）", "About half of the variance is timing-related and should reverse next quarter.", "差異の約半分はタイミングによるもので、来四半期に解消する見込みです。"],
  ["one-time", "一過性の", "Excluding the one-time inventory write-off, OpEx was in line with budget.", "一過性の在庫評価損を除けば、営業費用は予算どおりでした。"],
  ["in line with", "〜と同水準で／想定どおりで", "SG&A was broadly in line with our expectations.", "販管費はおおむね想定どおりでした。"],
  ["headwind", "逆風（マイナス要因）", "FX was a headwind of about two points on reported growth.", "為替は公表ベースの成長率に対して約2ポイントのマイナス要因でした。"],
  ["on a constant currency basis", "為替の影響を除くと", "On a constant currency basis, sales grew 6%.", "為替の影響を除くと、売上は6%成長しました。", "constant currency"],
  ["the bulk of", "〜の大部分", "The bulk of the overspend came from the new product launch.", "超過支出の大部分は新製品の発売によるものでした。"]
];

C.phrases.budget = [
  ["top-down target", "トップダウンの目標", "The top-down target implies 8% growth, which is more aggressive than our own view.", "トップダウンの目標は8%成長を意味しており、私たちの見立てより強気です。", "top-down"],
  ["bottom-up build", "積み上げ（ボトムアップ）の計画", "Our bottom-up build from the regions comes in at 5.5% growth.", "各地域からの積み上げでは5.5%成長になります。", "bottom-up"],
  ["bridge the gap", "差を埋める", "We need to identify about $4 million in initiatives to bridge the gap.", "差を埋めるために、約400万ドル分の施策を見つける必要があります。"],
  ["baseline", "基準となる前提（ベースライン）", "The baseline assumes no change in reimbursement rates.", "ベースラインでは償還価格の変更はないと想定しています。"],
  ["phasing", "（月・四半期への）配分", "Let's revisit the quarterly phasing so that it reflects the launch timing.", "発売時期を反映するように、四半期ごとの配分を見直しましょう。"],
  ["headcount plan", "人員計画", "The headcount plan adds twelve sales reps, mostly in the second half.", "人員計画では、主に下期に営業担当を12人増やします。"],
  ["stretch target", "挑戦的な目標", "We'd position the 10% as a stretch target rather than the base plan.", "10%は基本計画ではなく、挑戦目標という位置づけにしたいと考えています。"],
  ["contingency", "予備費・不測の事態への備え", "We've built in a contingency of about 2% for supply chain risk.", "サプライチェーンのリスクに備えて、約2%の予備を織り込んでいます。"],
  ["flat", "横ばいの", "We're planning OpEx to be flat year over year, excluding the launch.", "発売関連を除き、営業費用は前年比横ばいで計画しています。"],
  ["prioritize", "優先する", "We need to prioritize investments that support our core franchises.", "主力事業を支える投資を優先する必要があります。"],
  ["sign off on", "〜を承認する", "We're asking the leadership team to sign off on the plan by the end of the month.", "月末までに経営陣に計画を承認していただくようお願いしています。"],
  ["walk you through the key assumptions", "主要な前提を順に説明する", "Let me walk you through the key assumptions behind the plan.", "計画の背景にある主要な前提を順にご説明します。", "key assumptions"]
];

C.phrases.forecast = [
  ["latest estimate", "最新見通し（LE）", "Our latest estimate for the full year is $412 million.", "通期の最新見通しは4億1200万ドルです。"],
  ["full-year outlook", "通期見通し", "We're maintaining our full-year outlook despite the soft first quarter.", "第1四半期は弱かったものの、通期見通しは据え置きます。"],
  ["revise down / revise up", "下方修正する／上方修正する", "We've revised down our revenue forecast by $5 million.", "売上見通しを500万ドル下方修正しました。", "revised down"],
  ["risks and opportunities", "リスクと機会（上振れ・下振れ要因）", "I've laid out the key risks and opportunities to the forecast on the next slide.", "見通しに対する主なリスクと機会を次のスライドにまとめました。"],
  ["upside", "上振れ（の余地）", "There is some upside if the tender in Germany comes through.", "ドイツの入札が取れれば、多少の上振れがあります。"],
  ["run rate", "現在のペース（ランレート）", "Based on the current run rate, we'll land at around $98 million in Q4.", "現在のペースだと、第4四半期は約9800万ドルで着地します。"],
  ["line of sight", "（達成の）見通しが立っていること", "We have good line of sight to the remaining $10 million.", "残りの1000万ドルについては、十分な見通しが立っています。"],
  ["assumes that", "〜と想定している", "The forecast assumes that the backorder is resolved by mid-November.", "見通しは、入荷待ちが11月中旬までに解消すると想定しています。"],
  ["on the conservative side", "保守的な（控えめな）", "I'd say the forecast is on the conservative side.", "見通しはやや保守的だと思います。", "conservative"],
  ["pull forward", "前倒しする", "Some customers pulled forward orders ahead of the price increase.", "値上げを前に、一部の顧客が注文を前倒ししました。", "pulled forward"],
  ["weigh on", "〜の重荷になる", "The backorder situation is weighing on our Q3 revenue.", "入荷待ちの状況が第3四半期の売上の重荷になっています。", "weighing on"],
  ["tracking ahead of / behind", "〜を上回る／下回るペースで推移している", "We're tracking slightly ahead of the forecast through October.", "10月までは見通しをやや上回るペースで推移しています。", "tracking"]
];

C.phrases.exec = [
  ["the key takeaway is", "一番お伝えしたいのは", "The key takeaway is that the margin pressure is temporary.", "一番お伝えしたいのは、利益率の悪化は一時的だということです。", "key takeaway"],
  ["at a high level", "大まかに言うと", "At a high level, we're on track to deliver the plan.", "大まかに言うと、計画は達成できる見込みです。"],
  ["on track", "順調に進んでいる", "We are on track to meet our full-year commitment.", "通期の約束した数字は達成できる見込みです。"],
  ["I'd like to flag", "〜を指摘しておきたい", "I'd like to flag a potential risk around the pricing reform in Europe.", "欧州の価格制度改革に関するリスクを指摘しておきたいと思います。", "flag"],
  ["net-net", "差し引きすると", "Net-net, we expect a small positive impact on operating income.", "差し引きすると、営業利益には小さなプラスの影響を見込んでいます。"],
  ["mitigating actions", "（影響を和らげる）対応策", "We've identified several mitigating actions, including a hiring freeze.", "採用凍結を含む、いくつかの対応策を特定しました。"],
  ["our ask today is", "本日お願いしたいのは", "Our ask today is approval of an additional $2 million for the launch.", "本日お願いしたいのは、発売に向けた追加200万ドルの承認です。", "our ask"],
  ["to put it in context", "（数字の）背景を説明すると", "To put it in context, this is the lowest quarterly growth in three years.", "背景を説明すると、これは過去3年間で最も低い四半期成長率です。", "put it in context"],
  ["I'll defer to", "〜にお任せする（その件は〜から）", "On the clinical timeline, I'll defer to Sarah.", "臨床のスケジュールについては、サラからお答えします。", "defer to"],
  ["let me come back to you on that", "確認してからお答えします", "Good question. Let me come back to you on that by Friday.", "よいご質問です。金曜日までに確認してお答えします。", "come back to you"],
  ["material", "（金額的に）重要な", "The impact is not material at the group level.", "グループ全体で見れば、影響は重要ではありません。"],
  ["deliver on our commitments", "約束した数字を達成する", "We remain confident that we can deliver on our commitments for the year.", "今年の約束した数字は達成できると引き続き考えています。", "deliver on"]
];

C.phrases.partner = [
  ["help me understand", "〜を教えてください（理解を助けてください）", "Help me understand what's driving the increase in T&E.", "出張・交際費が増えている理由を教えてください。"],
  ["push back on", "〜に異議を唱える", "I'd push back on the assumption that volume will recover in Q2.", "第2四半期に数量が回復するという前提には異議があります。"],
  ["that's a fair point", "ごもっともです", "That's a fair point, and I'll reflect it in the forecast.", "ごもっともです。見通しに反映します。", "fair point"],
  ["within the existing envelope", "今ある予算枠の中で", "Can we fund the new program within the existing envelope?", "今ある予算枠の中で、新しいプログラムの費用をまかなえますか。", "envelope"],
  ["trade-off", "トレードオフ（あちらを立てればこちらが立たず）", "The trade-off is between faster growth and lower margins this year.", "今年のトレードオフは、成長の加速と利益率の低下の間にあります。"],
  ["align on", "〜についてすり合わせる", "Let's align on the numbers before we present them to the CFO.", "CFOに説明する前に、数字をすり合わせましょう。"],
  ["meet halfway", "歩み寄る", "Could we meet halfway and phase the investment over two years?", "歩み寄って、投資を2年に分けるのはどうでしょうか。"],
  ["on the same page", "認識がそろっている", "I want to make sure we're on the same page on the price assumptions.", "価格の前提について認識がそろっているか確認したいです。"],
  ["back-of-the-envelope", "ざっくりした（概算の）", "A back-of-the-envelope estimate suggests a payback of about three years.", "ざっくり計算すると、回収期間は約3年です。"],
  ["reallocate", "再配分する", "We could reallocate part of the marketing budget to the field team.", "マーケティング予算の一部を現場の営業チームに再配分できるかもしれません。"],
  ["realistic", "現実的な", "I'm not sure that 15% growth is realistic given the tender delays.", "入札の遅れを考えると、15%成長が現実的かどうかわかりません。"],
  ["follow up offline", "（会議の外で）個別に相談する", "Let's follow up offline on the details.", "詳細は個別に相談しましょう。", "offline"]
];

C.phrases.scenario = [
  ["downside case / upside case", "悲観ケース／楽観ケース", "In the downside case, revenue would be about 4% below the base case.", "悲観ケースでは、売上は基本ケースより約4%低くなります。", "downside case"],
  ["sensitive to", "〜に敏感（影響を受けやすい）", "Operating income is most sensitive to changes in average selling price.", "営業利益は平均販売価格の変化に最も影響を受けやすいです。"],
  ["all else being equal", "他の条件が同じなら", "All else being equal, a 10% stronger yen reduces reported revenue by about 4%.", "他の条件が同じなら、10%の円高で公表ベースの売上は約4%減ります。"],
  ["what-if scenarios", "「もし〜なら」のシナリオ", "We ran a few what-if scenarios on the timing of the approval.", "承認時期について、いくつかの「もし〜なら」のシナリオを試算しました。", "what-if"],
  ["key driver", "主な要因（ドライバー）", "Procedure volume is the key driver of our consumables revenue.", "手技件数は、消耗品売上の主なドライバーです。"],
  ["a range of outcomes", "結果の幅", "We'd rather present a range of outcomes than a single number.", "一つの数字ではなく、結果の幅でお示ししたいと考えています。", "range of outcomes"],
  ["probability-weighted", "確率で加重した", "On a probability-weighted basis, the expected impact is around $1.5 million.", "確率で加重すると、想定される影響は約150万ドルです。"],
  ["stress-test", "ストレステストをする", "We stress-tested the plan against a six-month delay in the launch.", "発売が6か月遅れた場合を想定して、計画のストレステストをしました。", "stress-tested"],
  ["break even", "損益分岐点に達する", "We break even at roughly 1,200 units per year.", "年間約1200台で損益分岐点に達します。"],
  ["flex", "（前提を）上下に動かす", "If we flex the volume assumption by plus or minus 5%, margin moves by about one point.", "数量の前提をプラスマイナス5%動かすと、利益率は約1ポイント動きます。"],
  ["in the worst case", "最悪の場合", "In the worst case, we would need to delay the hiring until next year.", "最悪の場合、採用を来年まで延期する必要があります。", "worst case"],
  ["translate into", "〜につながる（換算すると〜になる）", "Each 1% of price erosion translates into roughly $2 million of gross profit.", "価格が1%下がるごとに、売上総利益は約200万ドル減ります。", "translates into"]
];

C.phrases.invest = [
  ["business case", "投資案件の採算計画（ビジネスケース）", "The business case shows an NPV of $14 million over ten years.", "ビジネスケースでは、10年間のNPVは1400万ドルです。"],
  ["pay back", "（投資を）回収する", "The project pays back in just under four years.", "このプロジェクトは4年弱で回収できます。", "pays back"],
  ["hurdle rate", "最低限必要な利回り（ハードルレート）", "The IRR of 18% comfortably clears our hurdle rate of 12%.", "IRRは18%で、ハードルレートの12%を余裕で上回ります。"],
  ["discount rate", "割引率", "We used a discount rate of 9%, in line with our WACC.", "WACCに合わせて、割引率は9%を使いました。"],
  ["upfront investment", "初期投資", "The upfront investment is around $6 million, mostly for tooling.", "初期投資は約600万ドルで、大半は金型などの設備です。", "upfront"],
  ["incremental", "追加の（その投資による増分の）", "We expect $3 million in incremental revenue in the first full year.", "最初の通年で300万ドルの追加売上を見込んでいます。"],
  ["capitalize rather than expense", "費用ではなく資産計上する", "Part of the software cost can be capitalized rather than expensed.", "ソフトウェア費用の一部は、費用ではなく資産計上できます。", "capitalized"],
  ["ramp-up", "立ち上がり（の期間）", "The model assumes a two-year ramp-up to full capacity.", "モデルでは、フル稼働まで2年の立ち上がり期間を想定しています。"],
  ["terminal value", "残存価値（ターミナルバリュー）", "Most of the value comes from the terminal value, which is a concern.", "価値の大半が残存価値から来ており、そこが懸念点です。"],
  ["opportunity cost", "機会費用", "We also need to consider the opportunity cost of tying up the production line.", "生産ラインを占有することの機会費用も考える必要があります。"],
  ["go/no-go decision", "実行するかどうかの判断", "We'll come back with a go/no-go recommendation next month.", "来月、実行するかどうかの提言を持ってきます。", "no-go"],
  ["accretive to", "〜を押し上げる（増加させる）", "The acquisition would be accretive to margins from year two.", "この買収は2年目から利益率を押し上げます。", "accretive"]
];

C.phrases.kpi = [
  ["year-to-date", "年初来（累計）", "Year-to-date, sales are up 7% against last year.", "年初来の売上は前年比7%増です。"],
  ["trending in the right direction", "良い方向に推移している", "DSO is trending in the right direction, down to 62 days.", "売掛金回転日数は良い方向に推移しており、62日まで下がりました。", "trending"],
  ["win rate", "受注率（勝率）", "The win rate on tenders has dropped to around 35%.", "入札の受注率は約35%まで下がりました。"],
  ["leading indicator", "先行指標", "Pipeline coverage is a good leading indicator for next quarter's sales.", "パイプラインのカバー率は、来四半期の売上の良い先行指標です。"],
  ["at a glance", "ひと目で", "The dashboard lets you see the key metrics at a glance.", "このダッシュボードでは、主要な指標がひと目でわかります。"],
  ["drill down into", "〜を掘り下げる", "If we drill down into the regions, most of the decline is in EMEA.", "地域別に掘り下げると、減少の大半は欧州・中東・アフリカです。"],
  ["outlier", "外れ値", "Excluding the outlier in September, inventory turns were stable.", "9月の外れ値を除けば、在庫回転率は安定していました。"],
  ["benchmark against", "〜と比較する（ベンチマークする）", "We benchmark our OpEx ratio against our closest peers.", "営業費用率を、最も近い競合他社と比較しています。", "benchmark"],
  ["in red", "赤（要注意）で表示されている", "Anything shown in red is more than 5% off target.", "赤で表示されているものは、目標から5%以上ずれています。"],
  ["on a rolling twelve-month basis", "直近12か月ベースで", "On a rolling twelve-month basis, revenue growth is 5.4%.", "直近12か月ベースでは、売上成長率は5.4%です。", "rolling twelve-month"],
  ["sequentially", "前の期と比べて（前四半期比で）", "Gross margin improved sequentially from 61% to 63%.", "売上総利益率は前四半期の61%から63%に改善しました。"],
  ["per unit", "1台（1個）あたり", "Cost per unit came down as volume increased.", "数量が増えるにつれて、1台あたりのコストが下がりました。"]
];

C.phrases.calls = [
  ["let's get started", "始めましょう", "It's a couple of minutes past, so let's get started.", "2〜3分過ぎたので、始めましょう。", "get started"],
  ["can everyone hear me okay?", "皆さん、聞こえていますか", "Before we begin, can everyone hear me okay?", "始める前に、皆さん聞こえていますか。", "hear me"],
  ["park that for now", "それはいったん置いておく", "Let's park that for now and come back to it at the end.", "それはいったん置いておいて、最後に戻りましょう。", "park"],
  ["for the sake of time", "時間の都合上", "For the sake of time, I'll skip the backup slides.", "時間の都合上、補足のスライドは飛ばします。"],
  ["feel free to jump in", "遠慮なく割って入ってください", "Please feel free to jump in if you have any questions.", "質問があれば、遠慮なく途中で入ってください。", "jump in"],
  ["to recap", "まとめると", "To recap, we agreed on three action items.", "まとめると、3つのアクションアイテムで合意しました。"],
  ["own this action item", "このアクションアイテムを担当する", "Who will own this action item?", "このアクションアイテムはどなたが担当しますか。", "own"],
  ["circle back", "（あとで）また連絡する・戻ってくる", "I'll circle back with the team and send an update next week.", "チームと確認して、来週また最新情報をお送りします。"],
  ["you're on mute", "ミュートになっていますよ", "Sorry, Tom, I think you're on mute.", "トムさん、すみません、ミュートになっているようです。", "on mute"],
  ["how are things on your end?", "そちらはいかがですか", "How are things on your end? Busy with the year-end close?", "そちらはいかがですか。年度末の決算でお忙しいですか。", "on your end"],
  ["I'll let you go", "（会議を）このへんで終わりにします", "I think we've covered everything, so I'll let you go a few minutes early.", "すべて話せたと思うので、数分早いですが終わりにしましょう。", "let you go"],
  ["touch base", "（軽く）連絡を取り合う", "Let's touch base again after the budget review.", "予算レビューのあとで、また連絡を取り合いましょう。"]
];
