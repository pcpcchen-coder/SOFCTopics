// 單頁研究委託：NODE_PATH=$PWD/node_modules node build_onepager.js
const path = require("path");
const pptxgen = require("pptxgenjs");
const { applyTheme } = require("/root/.claude/skills/synced/43161c45-ea9a-4b18-a3b3-e0e07d3cd14d_c743e592-211a-4a44-8f1b-8ed7c869972d/pptx/scripts/apply_theme.js");

const OUT = path.resolve(__dirname, "..", "SOFC_開箱代價_研究委託_單頁.pptx");
const THEME = {
  name: "SOFC Ember",
  headFontFace: "Microsoft JhengHei",
  bodyFontFace: "Microsoft JhengHei",
  colors: { dk1: "1B1F24", lt1: "FFFFFF", dk2: "1E2B38", lt2: "F2F4F6", accent1: "D9541E", accent2: "1F6F8B",
    accent3: "E3A33B", accent4: "6B7A89", accent5: "4E9A5B", accent6: "B23A48", hlink: "1F6F8B", folHlink: "6B7A89" },
};

const pres = new pptxgen();
pres.layout = "LAYOUT_WIDE";
pres.theme = { headFontFace: THEME.headFontFace, bodyFontFace: THEME.bodyFontFace };
pres.title = "研究委託：SOFC 熱箱開箱代價量化";
pres.author = "SOFCTopics";
const C = pres.SchemeColor;

pres.defineSlideMaster({
  title: "BRIEF",
  background: { color: C.background1 },
  objects: [
    { placeholder: { options: { name: "title", type: "title", x: 0.5, y: 0.3, w: 12.3, h: 0.6, fontSize: 28, bold: true, color: C.text2, align: "left", valign: "middle", margin: 0 }, text: "" } },
    { text: { text: "SOFCTopics｜GW 級 SOFC 電廠 × RAIBA 研究｜2026-11-24", options: { x: 0.5, y: 7.1, w: 8, h: 0.25, fontSize: 10, color: C.accent4, margin: 0 } } },
  ],
});

const txt = (s, t, o) => s.addText(t, { isTextBox: true, margin: 0, valign: "top", color: C.text1, fontSize: 13, ...o });

const s = pres.addSlide({ masterName: "BRIEF" });
s.addText("研究委託：量化 SOFC 熱箱「開一次的代價」", { placeholder: "title" });
txt(s, "熱循環劣化 × 失效機率 × 維修工時｜用來決定 GW 級 SOFC 電廠要不要採用電堆級可重組架構（RAIBA）",
  { x: 0.5, y: 0.92, w: 12.3, h: 0.35, fontSize: 14, color: C.accent4 });

// ---------------- 左：痛點 ----------------
s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: 0.5, y: 1.45, w: 4.35, h: 4.85, rectRadius: 0.08, fill: { color: C.background2 }, line: { type: "none" }, objectName: "pain-panel" });
txt(s, "痛點", { x: 0.75, y: 1.6, w: 3.9, h: 0.4, fontSize: 18, bold: true, color: C.accent1 });
const pains = [
  ["決策卡在一個沒人量過的數字", "RAIBA 值不值得做，取決於每次開熱箱的總代價。公開文獻沒有這個數據。"],
  ["熱循環劣化數據差 80 倍", "每次 0.01–0.8% 電壓損失，多為單堆、廠商自報；洩漏／失效機率零統計。"],
  ["實驗室條件 ≠ 熱箱", "20 堆熱箱的降溫升溫時間、溫度梯度、失去保護氣（redox）的整堆報廢風險都未量化。"],
];
pains.forEach(([h, d], i) => {
  const y = 2.1 + i * 1.05;
  s.addShape(pres.shapes.OVAL, { x: 0.75, y: y + 0.03, w: 0.36, h: 0.36, fill: { color: C.accent1 }, line: { type: "none" }, objectName: `pain-num-${i}` });
  txt(s, String(i + 1), { x: 0.75, y: y + 0.03, w: 0.36, h: 0.36, fontSize: 13, bold: true, color: C.background1, align: "center", valign: "middle" });
  txt(s, h, { x: 1.25, y, w: 3.45, h: 0.32, fontSize: 14, bold: true, color: C.text2 });
  txt(s, d, { x: 1.25, y: y + 0.33, w: 3.45, h: 0.68, fontSize: 12 });
});
s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: 0.75, y: 5.25, w: 3.85, h: 0.9, rectRadius: 0.06, fill: { color: C.text2 }, line: { type: "none" }, objectName: "threshold-card" });
txt(s, "≈ $33k／次", { x: 0.95, y: 5.33, w: 1.9, h: 0.5, fontSize: 22, bold: true, color: C.accent3, valign: "middle" });
txt(s, "模型決策分界：高於此值 RAIBA 省 ≥3%，低於 $10k 則不划算", { x: 2.85, y: 5.33, w: 1.65, h: 0.75, fontSize: 10.5, color: C.background1, valign: "middle" });

// ---------------- 右：要完成的項目 ----------------
txt(s, "要完成的項目", { x: 5.1, y: 1.45, w: 7.7, h: 0.4, fontSize: 18, bold: true, color: C.accent1 });
const H = (t) => ({ text: t, options: { bold: true, color: C.background1, fill: { color: C.text2 }, fontSize: 13 } });
const cell = (t, o = {}) => ({ text: t, options: { fontSize: 12.5, ...o } });
const items = [
  ["W1", "熱循環加速試驗", "≥3 個同批短堆（≥5 cell），各做 ≥30 次室溫↔750 °C 全熱循環（陽極保護氣），附穩態對照", "每次循環電壓／ASR 損失（含 95% 信賴區間）＋ EIS/DRT 拆解"],
  ["W2", "洩漏／失效統計", "每次循環後量 OCV、壓降、氣密；拆堆做失效分析", "每次循環洩漏機率（韋伯模型）＋失效模式"],
  ["W3", "Redox 安全窗", "控制保護氣中斷的時間 × 溫度矩陣", "不可逆損傷門檻圖（安全停機窗口）"],
  ["W4", "熱待機劣化", "熱態 OCV 保持 ≥500 小時，對照定電流運轉", "熱待機劣化率（%/kh）"],
  ["W5", "熱箱維修代價模型", "20 堆熱箱熱傳模型＋維修工序工時拆解", "每次開箱直接成本、停機天數（低／中／高）"],
  ["W6", "參數交付與判定", "W1–W5 結果填入我方 LCOE 模型", "RAIBA 進／停判定（K2）"],
];
s.addTable([[H("#"), H("項目"), H("要做什麼"), H("交付物")],
  ...items.map((r) => [cell(r[0], { bold: true, color: C.accent1 }), cell(r[1], { bold: true, color: C.text2 }), cell(r[2]), cell(r[3])])], {
  x: 5.1, y: 1.95, w: 7.7, colW: [0.45, 1.65, 3.25, 2.35], rowH: [0.4, 0.9, 0.7, 0.62, 0.62, 0.62, 0.5],
  border: { type: "solid", pt: 0.5, color: "D5DAE0" }, fontFace: "Microsoft JhengHei", valign: "middle",
  margin: [0.04, 0.07, 0.04, 0.07], objectName: "work-items",
});

// ---------------- 底：期程、我方提供、成功標準 ----------------
const foot = [
  ["建議期程 9 個月", "M1–2 規劃與試驗台｜M3–7 試驗｜M8–9 分析與報告"],
  ["我方提供", "LCOE＋機隊模型、參數模板、文獻整理、判定門檻"],
  ["成功標準", "每項參數給出低／中／高與信賴區間，足以判定 K2"],
];
foot.forEach(([h, d], i) => {
  const x = 0.5 + i * 4.15;
  s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x, y: 6.45, w: 4.0, h: 0.55, rectRadius: 0.06, fill: { color: C.background2 }, line: { type: "none" }, objectName: `foot-${i}` });
  txt(s, h, { x: x + 0.15, y: 6.45, w: 1.35, h: 0.55, fontSize: 12, bold: true, color: C.accent2, valign: "middle" });
  txt(s, d, { x: x + 1.5, y: 6.45, w: 2.4, h: 0.55, fontSize: 10.5, valign: "middle" });
});

s.addNotes([
  "背景：我們的 LCOE＋機隊模型顯示，GW 級 SOFC 電廠採用電堆級可重組架構（RAIBA）的價值，幾乎完全取決於「每開一次熱箱的總代價」。",
  "決策分界：每次開箱直接成本約 $33k 以上，RAIBA 相對「固定串聯＋選擇性換堆」可省 ≥3% LCOE；$10k 以下則不划算。",
  "文獻現況：每次全熱循環電壓損失 0.01%（Delphi、Jülich、FCE）到 0.8%（Pan 2020、Versa 出廠門檻），差 80 倍；洩漏／失效機率、熱箱維修成本完全沒有公開數據。",
  "試驗電堆來源（校方自製或合作廠商提供）、預算與智財歸屬待議。",
  "完整資料：SOFCTopics repo 的 docs/research/HOTBOX_OPENING_COST.zh-TW.md 與 docs/sources/THERMAL_CYCLING_SERVICE_2026-11-24.zh-TW.md。",
].join("\n"));

(async () => {
  await pres.writeFile({ fileName: OUT });
  await applyTheme(OUT, THEME);
  console.log("wrote", OUT);
})();
