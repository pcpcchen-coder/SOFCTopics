// 產生簡報：node build_pptx.js
const fs = require("fs");
const path = require("path");
const pptxgen = require("pptxgenjs");
const React = require("react");
const ReactDOMServer = require("react-dom/server");
const sharp = require("sharp");
const fa = require("react-icons/fa");
const { applyTheme } = require("/root/.claude/skills/synced/43161c45-ea9a-4b18-a3b3-e0e07d3cd14d_c743e592-211a-4a44-8f1b-8ed7c869972d/pptx/scripts/apply_theme.js");

const ROOT = path.resolve(__dirname, "..", "..");
const RES = JSON.parse(fs.readFileSync(path.join(ROOT, "models/results/results.json"), "utf8").replace(/\bNaN\b/g, "null"));
const CD = JSON.parse(fs.readFileSync(path.join(__dirname, "figs/chart_data.json"), "utf8"));
const OUT = path.join(ROOT, "reports", "SOFC_GW_RAIBA_簡報_2026-11-23.pptx");

const THEME = {
  name: "SOFC Ember",
  headFontFace: "Microsoft JhengHei",
  bodyFontFace: "Microsoft JhengHei",
  colors: {
    dk1: "1B1F24", lt1: "FFFFFF", dk2: "1E2B38", lt2: "F2F4F6",
    accent1: "D9541E", // 餘燼橘：SOFC 高溫
    accent2: "1F6F8B", // 深青
    accent3: "E3A33B", // 琥珀
    accent4: "6B7A89", // 石板灰
    accent5: "4E9A5B", // 綠：進
    accent6: "B23A48", // 紅：停
    hlink: "1F6F8B", folHlink: "6B7A89",
  },
};
const HEX = THEME.colors;

const pres = new pptxgen();
pres.layout = "LAYOUT_WIDE"; // 13.333 x 7.5
pres.theme = { headFontFace: THEME.headFontFace, bodyFontFace: THEME.bodyFontFace };
pres.title = "GW 級天然氣 SOFC 電廠評估";
pres.author = "SOFCTopics";
const C = pres.SchemeColor;
const W = 13.333;

// ---------------- 版面（layouts） ----------------
pres.defineSlideMaster({
  title: "TITLE",
  background: { color: C.text2 },
  objects: [
    { placeholder: { options: { name: "title", type: "title", x: 0.8, y: 2.2, w: 11.7, h: 1.5, fontSize: 44, bold: true, color: C.background1, valign: "bottom", align: "left", margin: 0 }, text: "" } },
    { placeholder: { options: { name: "body", type: "body", x: 0.8, y: 3.85, w: 11.7, h: 1.0, fontSize: 22, color: C.accent3, valign: "top", align: "left", margin: 0 }, text: "" } },
  ],
});
pres.defineSlideMaster({
  title: "SECTION",
  background: { color: C.text2 },
  objects: [
    { placeholder: { options: { name: "body", type: "body", x: 0.8, y: 2.3, w: 11.7, h: 0.6, fontSize: 18, color: C.accent3, align: "left", margin: 0 }, text: "" } },
    { placeholder: { options: { name: "title", type: "title", x: 0.8, y: 2.9, w: 11.7, h: 1.4, fontSize: 40, bold: true, color: C.background1, valign: "top", align: "left", margin: 0 }, text: "" } },
  ],
  slideNumber: { x: 12.3, y: 6.95, w: 0.6, h: 0.3, fontSize: 10, color: C.accent4, align: "right" },
});
pres.defineSlideMaster({
  title: "CONTENT",
  background: { color: C.background1 },
  margin: [0.5, 0.6, 0.7, 0.6],
  objects: [
    { placeholder: { options: { name: "title", type: "title", x: 0.6, y: 0.35, w: 12.1, h: 0.9, fontSize: 30, bold: true, color: C.text2, valign: "middle", align: "left", margin: 0 }, text: "" } },
    { text: { text: "SOFCTopics｜GW 級 SOFC 電廠評估｜2026-11-23", options: { x: 0.6, y: 6.95, w: 8, h: 0.3, fontSize: 10, color: C.accent4, margin: 0 } } },
  ],
  slideNumber: { x: 12.3, y: 6.95, w: 0.6, h: 0.3, fontSize: 10, color: C.accent4, align: "right" },
});

// ---------------- 小工具 ----------------
async function icon(Comp, hex = "FFFFFF") {
  const svg = ReactDOMServer.renderToStaticMarkup(React.createElement(Comp, { color: "#" + hex, size: 256 }));
  const buf = await sharp(Buffer.from(svg)).png().toBuffer();
  return "image/png;base64," + buf.toString("base64");
}
async function iconCircle(slide, Comp, x, y, d = 0.62, fill = C.accent1, name = "icon") {
  slide.addShape(pres.shapes.OVAL, { x, y, w: d, h: d, fill: { color: fill }, line: { type: "none" }, objectName: name + "-circle" });
  const pad = d * 0.24;
  slide.addImage({ data: await icon(Comp), x: x + pad, y: y + pad, w: d - 2 * pad, h: d - 2 * pad, objectName: name + "-glyph", altText: name });
}
function card(slide, x, y, w, h, name, fill = C.background2) {
  slide.addShape(pres.shapes.ROUNDED_RECTANGLE, { x, y, w, h, rectRadius: 0.08, fill: { color: fill }, line: { type: "none" }, objectName: name });
}
function txt(slide, text, o) {
  slide.addText(text, { isTextBox: true, margin: 0, valign: "top", color: C.text1, fontSize: 14, ...o });
}
const content = (sec) => pres.addSlide({ masterName: "CONTENT", sectionTitle: sec });
const chartText = { catAxisLabelFontFace: "+mn-lt", valAxisLabelFontFace: "+mn-lt", legendFontFace: "+mn-lt", dataLabelFontFace: "+mn-lt", titleFontFace: "+mn-lt", valAxisTitleFontFace: "+mn-lt", catAxisTitleFontFace: "+mn-lt" };
const axisStyle = () => ({
  catAxisLabelColor: HEX.accent4, valAxisLabelColor: HEX.accent4, catAxisLabelFontSize: 12, valAxisLabelFontSize: 12,
  valGridLine: { color: "E3E6EA", size: 0.75 }, catGridLine: { style: "none" },
  catAxisLineShow: true, valAxisLineShow: false,
  ...chartText,
});

const T1 = RES.tier1, FO = RES.fleet_opt, BE = RES.breakeven_opt, BE0 = RES.breakeven_k0;
const f1 = (x) => Number(x).toFixed(1);

async function main() {
  // =================== 開場 ===================
  pres.addSection({ title: "開場" });
  let s = pres.addSlide({ masterName: "TITLE", sectionTitle: "開場" });
  s.addText("GW 級天然氣 SOFC 電廠", { placeholder: "title" });
  s.addText("成本、預測性維護與類 RAIBA 架構的可行性評估｜2026-11-23", { placeholder: "body" });
  await iconCircle(s, fa.FaFire, 0.8, 1.2, 0.75, C.accent1, "title-icon");
  txt(s, "每個主張標有 evidence layer：【外部】【RAIBA 事實】【假說】【未知】。模型輸出屬於【假說】，是決策輔助，不是預測。",
    { x: 0.8, y: 6.2, w: 11.7, h: 0.6, fontSize: 13, color: C.background2 });
  s.addNotes("本簡報彙整 SOFCTopics repo 至今的成果：題目整理、RAIBA 對應、文獻與競品查證、LCOE 加劣化模型。所有模型數字都是假說層級，用來排定該先量測什麼，不是預測值。");

  // ---- 結論先講 ----
  s = content("開場");
  s.addText("結論：資本支出是門檻，RAIBA 取決於開箱代價", { placeholder: "title" });
  const stats = [
    [fa.FaLayerGroup, "1.9–16%", "超額配置的 LCOE 降幅", "劣化率 0.2%/kh 時只有 1.9%；1%/kh 時可達 16%"],
    [fa.FaProjectDiagram, "1.5%", "RAIBA 相對選擇性換堆", "已扣 RAIBA 成本；最大的 10% 來自維運策略"],
    [fa.FaBalanceScale, "$107–157", "RAIBA 損益兩平 $/kW", "電堆級 DC/DC 增量成本必須低於此值"],
    [fa.FaIndustry, "≤ $1,720", "跟 NGCC 打平所需 $/kW", "目前推算約 $5,000/kW，要降一半以上"],
  ];
  for (let i = 0; i < 4; i++) {
    const x = 0.6 + i * 3.08, y = 1.55, w = 2.86, h = 4.6;
    card(s, x, y, w, h, `stat-card-${i}`);
    await iconCircle(s, stats[i][0], x + 0.3, y + 0.3, 0.6, i === 3 ? C.accent6 : C.accent1, `stat-icon-${i}`);
    txt(s, stats[i][1], { x: x + 0.3, y: y + 1.15, w: w - 0.5, h: 0.9, fontSize: 34, bold: true, color: C.text2, valign: "middle", fit: "shrink" });
    txt(s, stats[i][2], { x: x + 0.3, y: y + 2.1, w: w - 0.5, h: 0.7, fontSize: 16, bold: true, color: C.accent1 });
    txt(s, stats[i][3], { x: x + 0.3, y: y + 2.85, w: w - 0.5, h: 1.5, fontSize: 14, color: C.text1 });
  }
  txt(s, "最該先量的是「每次開熱箱的總代價」：維修成本加上熱循環對其他電堆的傷害。", { x: 0.6, y: 6.3, w: 12.1, h: 0.45, fontSize: 15, bold: true, color: C.text2 });
  s.addNotes("四個數字。第一，超額配置的價值取決於現場劣化率。第二，RAIBA 相對已經做選擇性換堆的基準只再省 1.5%。第三，RAIBA 的增量硬體成本要低於每 kW 107 到 157 美元才划算。第四，也是最重要的：GW 級 SOFC 要跟 NGCC 打平，資本支出要降到每 kW 1,720 美元以下，目前推算是 5,000 以上。");

  // ---- 問題與規模 ----
  s = content("開場");
  s.addText("題目：把千萬片電池變成一座 GW 級電廠", { placeholder: "title" });
  const pillars = [
    [fa.FaDollarSign, "成本", "資本支出、燃料、電堆更換、LCOE"],
    [fa.FaWrench, "預測性維護", "千萬片等級電池的劣化監測、預測與更換"],
    [fa.FaProjectDiagram, "類 RAIBA 架構", "借用可重組陣列思維，提升韌性與穩健性"],
  ];
  for (let i = 0; i < 3; i++) {
    const y = 1.6 + i * 1.6;
    await iconCircle(s, pillars[i][0], 0.6, y, 0.7, C.accent1, `pillar-${i}`);
    txt(s, pillars[i][1], { x: 1.55, y: y - 0.02, w: 4.6, h: 0.45, fontSize: 20, bold: true, color: C.text2 });
    txt(s, pillars[i][2], { x: 1.55, y: y + 0.45, w: 4.6, h: 0.8, fontSize: 15 });
  }
  card(s, 6.75, 1.55, 5.95, 4.95, "scale-card");
  txt(s, "1 GW 需要多少電池？", { x: 7.1, y: 1.8, w: 5.3, h: 0.45, fontSize: 18, bold: true, color: C.text2 });
  const scale = [["570 萬片", "NETL 2022 參考設計｜550 cm²、每片約 176 W【外部】"], ["4,000 萬片", "Bloom｜每片約 25 W【外部】"], ["約 1%/年", "電堆失效率 → 每年處理數百到數千個電堆【假說】"]];
  scale.forEach(([big, small], i) => {
    const y = 2.45 + i * 1.3;
    txt(s, big, { x: 7.1, y, w: 5.3, h: 0.6, fontSize: 30, bold: true, color: C.accent1 });
    txt(s, small, { x: 7.1, y: y + 0.6, w: 5.3, h: 0.5, fontSize: 14, color: C.text1 });
  });
  s.addNotes("三個主軸是使用者最初提出的：成本、預測性維護、類 RAIBA 架構。規模上，電池數量會隨電池尺寸差將近 10 倍，但不管哪一種，都已經是資料中心等級的機隊管理問題，跟傳統電廠少數大型機組的思維完全不同。");

  // =================== 查證 ===================
  pres.addSection({ title: "查證" });
  s = pres.addSlide({ masterName: "SECTION", sectionTitle: "查證" });
  s.addText("01｜文獻與競品查證", { placeholder: "body" });
  s.addText("Gemini 引用、Bloom 標竿、劣化與成本", { placeholder: "title" });

  s = content("查證");
  s.addText("Gemini 的 7 筆引用都存在，但 3 筆有出入", { placeholder: "title" });
  const hdr = (t) => ({ text: t, options: { bold: true, color: C.background1, fill: { color: C.text2 }, fontSize: 13 } });
  const chip = (t) => ({ text: t, options: { bold: true, fontSize: 13, color: t === "有出入" ? C.accent6 : C.accent5 } });
  const cell = (t) => ({ text: t, options: { fontSize: 13 } });
  const rows = [
    ["Wei et al., Nat. Commun. (2026)", "LCOE $0.155/kWh 是 1 GW 單一模組的值，不是「>300 kW 模組」；燃料價約 $29/MMBtu；模型不含劣化", "有出入"],
    ["Lin et al., Chem. Eng. J. (2025)", "3 進 2 出 −50.7%、背壓 +34.6% 正確；9-cell 模擬", "已查證"],
    ["Cummins, DOE/OSTI (2024)", "20 kW 級系統，摘要沒有 $/kW 或劣化數字", "有出入"],
    ["TU Delft 博士論文 (2025)", "船用 SOFC，題目屬實", "已查證"],
    ["Gandiglio et al., Springer (2018)", "大型固定式 SOFC 電廠回顧", "已查證"],
    ["Ma et al., Sustainability (2018)", "10-cell 全堆 quasi 多物理場模型", "已查證"],
    ["Kuterbekov et al., Nanomaterials (2022)", "SOFC 分類綜述，跟 BoP／經濟性無關", "有出入"],
  ];
  s.addTable([[hdr("來源"), hdr("查證結論"), hdr("狀態")], ...rows.map((r) => [cell(r[0]), cell(r[1]), chip(r[2])])], {
    x: 0.6, y: 1.5, w: 12.1, colW: [3.6, 7.2, 1.3], border: { type: "solid", pt: 0.5, color: "D5DAE0" },
    fontFace: "Microsoft JhengHei", valign: "middle", rowH: 0.6, margin: [0.05, 0.1, 0.05, 0.1], objectName: "gemini-table",
  });
  s.addNotes("七筆引用全部真實存在，沒有捏造。最嚴重的誤讀是 Nature Communications 那篇的 LCOE：0.155 美元是 1 GW 單一模組、燃料價約每 MMBtu 29 美元條件下的值，而且那篇模型完全沒有算劣化。");

  s = content("查證");
  s.addText("Bloom 已經在模組級做到「隔離＋在線抽換」", { placeholder: "title" });
  card(s, 0.6, 1.55, 4.7, 4.75, "bloom-stat-card", C.text2);
  txt(s, "325 kW", { x: 0.95, y: 1.85, w: 4.0, h: 0.9, fontSize: 48, bold: true, color: C.background1 });
  txt(s, "= 6 個約 50 kW 的功率模組（PM）", { x: 0.95, y: 2.8, w: 4.0, h: 0.5, fontSize: 16, color: C.accent3 });
  txt(s, "\"Independent power modules can be replaced while the system remains online\"", { x: 0.95, y: 3.55, w: 4.0, h: 1.2, fontSize: 14, italic: true, color: C.background2 });
  txt(s, "— Bloom FY2025 10-K【外部】", { x: 0.95, y: 4.8, w: 4.0, h: 0.4, fontSize: 12, color: C.accent4 });
  const bl = [
    [fa.FaClock, "PM 壽命", "2014–15 年批次中位數 4.9 年；2018 年後預估 ≥5 年"],
    [fa.FaHandshake, "GW 級交易", "AEP 最多 1 GW；Oracle 最多 2.8 GW；AEP–Google 702 MW / $4B"],
    [fa.FaIndustry, "產能", "Fremont 廠擴到 2 GW/yr（目標 2026 年底）"],
    [fa.FaQuestion, "未公開", "$/kW 售價、PM 更換成本、劣化 %/kh"],
  ];
  for (let i = 0; i < 4; i++) {
    const y = 1.6 + i * 1.22;
    await iconCircle(s, bl[i][0], 5.75, y, 0.58, i === 3 ? C.accent4 : C.accent2, `bloom-${i}`);
    txt(s, bl[i][1], { x: 6.55, y: y - 0.03, w: 6.1, h: 0.4, fontSize: 17, bold: true, color: C.text2 });
    txt(s, bl[i][2], { x: 6.55, y: y + 0.38, w: 6.1, h: 0.7, fontSize: 14 });
  }
  txt(s, "意義：RAIBA 對 SOFC 的差異化空間在更細的粒度（熱箱內的電堆），而 Bloom 是 FTO 必須優先檢視的對象。【假說】", { x: 0.6, y: 6.55, w: 12.1, h: 0.35, fontSize: 13, bold: true, color: C.accent1 });
  s.addNotes("Bloom 是最直接的標竿。它的功率模組本身就能在線抽換，等於在模組級做到了 RAIBA 的隔離加選擇性更換。所以 RAIBA 進 SOFC 的空間，在比 PM 更細的粒度。AEP–Google 702 MW 案是次級來源，換算約每 kW 5,700 美元，但含碳捕集與 BoP，不等於 Bloom 的設備售價。");

  s = content("查證");
  s.addText("模型參數錨定在 NETL 2022 的一組完整數據", { placeholder: "title" });
  const prow = [
    ["標稱操作點", "0.8 V @ 0.4 A/cm²；550 cm²；17.6 kW/堆", "NETL 2022"],
    ["劣化率", "NETL／Ceres 0.2%/kh；Jülich 100 kh 平均 0.5%/kh；DOE 系統現況 1–1.5%/kh", "NETL；Fang 2019；DOE"],
    ["劣化對電流密度", "文獻結論互相矛盾，沒有通用式 → 模型設為可調參數 n", "Hagen 2006 vs Jülich 2020"],
    ["電堆成本／換堆", "$225/kW；7.3 年", "NETL 2022"],
    ["系統成本目標", "$900/kWe（2025/2030）", "DOE"],
    ["NGCC LCOE", "$51–129/MWh（Lazard 2026）；$55.5–77.5（EIA AEO2026）", "Lazard、EIA"],
    ["天然氣（發電用）", "2025 年 $3.85/MMBtu", "EIA STEO"],
  ];
  s.addTable([[hdr("項目"), hdr("數值"), hdr("來源")], ...prow.map((r) => r.map(cell))], {
    x: 0.6, y: 1.5, w: 12.1, colW: [2.3, 7.4, 2.4], border: { type: "solid", pt: 0.5, color: "D5DAE0" },
    fontFace: "Microsoft JhengHei", valign: "middle", rowH: 0.58, margin: [0.05, 0.1, 0.05, 0.1], objectName: "param-table",
  });
  txt(s, "交叉驗證：用這組參數，額定點電堆壽命 δ=15% 時 5.2 年（Bloom ≥5 年）、δ=25% 時 7.0 年（NETL 7.3 年）。", { x: 0.6, y: 6.35, w: 12.1, h: 0.45, fontSize: 14, bold: true, color: C.accent2 });
  s.addNotes("NETL 2022 報告提供了一組彼此一致的參數，所以直接當模型基準。驗證上，模型算出的電堆壽命跟 Bloom 和 NETL 兩個獨立來源都對得上。劣化對電流密度的依賴，文獻結論相反，所以設成可調參數做敏感度分析。");

  // =================== RAIBA × SOFC ===================
  pres.addSection({ title: "RAIBA × SOFC" });
  s = pres.addSlide({ masterName: "SECTION", sectionTitle: "RAIBA × SOFC" });
  s.addText("02｜RAIBA 搬到 SOFC", { placeholder: "body" });
  s.addText("能直接用的、必須改的，以及怎麼建模", { placeholder: "title" });

  s = content("RAIBA × SOFC");
  s.addText("SOFC 不是電池：Bypass 要改成熱待機", { placeholder: "title" });
  const cmp = [
    ["沒有 SOC，只有劣化", "最佳化目標變成「劣化速率平衡＋效率」"],
    ["工作溫度 600–850°C", "零電流會降溫、傷電堆 → 改用熱待機"],
    ["電、熱、流體耦合", "電氣重組不夠，還需要流體隔離"],
    ["重組粒度", "最小可控單位是電堆或電堆群"],
    ["安全範圍", "確定性安全層擴展到燃氣安全（IEC 61511）"],
  ];
  txt(s, "必須改寫的地方【假說】", { x: 0.6, y: 1.5, w: 6.9, h: 0.45, fontSize: 18, bold: true, color: C.text2 });
  cmp.forEach(([a, b], i) => {
    const y = 2.1 + i * 0.88;
    card(s, 0.6, y, 6.9, 0.76, `diff-${i}`);
    txt(s, a, { x: 0.8, y: y + 0.08, w: 2.3, h: 0.6, fontSize: 15, bold: true, color: C.accent1, valign: "middle" });
    txt(s, b, { x: 3.1, y: y + 0.08, w: 4.3, h: 0.6, fontSize: 14, valign: "middle" });
  });
  txt(s, "SOFC 版動作集合【假說】", { x: 7.9, y: 1.5, w: 4.8, h: 0.45, fontSize: 18, bold: true, color: C.text2 });
  const acts = [["NORMAL", "正常發電"], ["DERATE（主力）", "降電流密度，劣化變慢"], ["HOT-IDLE", "熱待機，避免熱循環"], ["ISOLATE", "電氣＋燃料隔離"], ["HOT-SWAP", "模組熱抽換"], ["RECOVERY", "可逆劣化恢復"]];
  acts.forEach(([a, b], i) => {
    const y = 2.1 + i * 0.73;
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: 7.9, y, w: 2.1, h: 0.58, rectRadius: 0.08, fill: { color: i === 1 ? C.accent1 : C.text2 }, line: { type: "none" }, objectName: `act-${i}` });
    txt(s, a, { x: 7.9, y, w: 2.1, h: 0.58, fontSize: 13, bold: true, color: C.background1, align: "center", valign: "middle" });
    txt(s, b, { x: 10.2, y, w: 2.5, h: 0.58, fontSize: 14, valign: "middle" });
  });
  s.addNotes("RAIBA 的核心精神，不讓最弱的成員決定整個系統壽命，完全適用 SOFC，而且 SOFC 的弱者問題可能更嚴重，因為會連鎖失效。但 SOFC 在高溫下運轉，把電堆 bypass 成零電流會讓它降溫，造成熱循環損傷，所以要改成熱待機。最強的控制手段是降載。");

  s = content("RAIBA × SOFC");
  s.addText("兩層模型：先找超額配置最佳點，再比較四種架構", { placeholder: "title" });
  card(s, 0.6, 1.55, 4.2, 4.95, "tier1-card");
  await iconCircle(s, fa.FaChartLine, 0.9, 1.85, 0.6, C.accent2, "tier1");
  txt(s, "第一層：均質、確定性", { x: 1.65, y: 1.9, w: 3.0, h: 0.5, fontSize: 17, bold: true, color: C.text2, valign: "middle" });
  txt(s, [
    { text: "掃描 BOL 電流密度 j₀（＝超額配置 k）與換堆判準 δ", options: { bullet: true, breakLine: true } },
    { text: "V = E₀ − ASR·j；dASR/dt ∝ (j/j_ref)ⁿ", options: { bullet: true, breakLine: true } },
    { text: "25 年月步長折現現金流，折現率 8%", options: { bullet: true, breakLine: true } },
    { text: "δ 上限 25%（發熱與冷卻空氣限制）", options: { bullet: true, breakLine: true } },
    { text: "輸出：最佳 k*、δ*、LCOE 組成、電堆壽命", options: { bullet: true } },
  ], { x: 0.9, y: 2.7, w: 3.7, h: 3.5, fontSize: 14, paraSpaceAfter: 8 });
  const archs = [
    ["A", "固定串聯", "任一電堆壞 → 整模組換新"],
    ["A-sel", "固定串聯＋選擇性換堆", "只換壞的電堆（維運策略）"],
    ["R-lite", "RAIBA 隔離版", "電堆級 DC/DC，可單獨隔離"],
    ["R", "RAIBA 完整版", "＋劣化感知經濟調度"],
  ];
  txt(s, "第二層：異質機隊 Monte Carlo（1,000 個電堆 × 3 種子）", { x: 5.2, y: 1.55, w: 7.5, h: 0.45, fontSize: 17, bold: true, color: C.text2 });
  archs.forEach(([k, a, b], i) => {
    const x = 5.2 + (i % 2) * 3.8, y = 2.15 + Math.floor(i / 2) * 1.75;
    card(s, x, y, 3.55, 1.55, `arch-${i}`);
    txt(s, k, { x: x + 0.25, y: y + 0.2, w: 1.2, h: 0.55, fontSize: 24, bold: true, color: i >= 2 ? C.accent1 : C.accent4 });
    txt(s, a, { x: x + 0.25, y: y + 0.75, w: 3.1, h: 0.35, fontSize: 14, bold: true, color: C.text2 });
    txt(s, b, { x: x + 0.25, y: y + 1.1, w: 3.1, h: 0.35, fontSize: 13 });
  });
  txt(s, "共同條件：開熱箱維修整模組停機 1 個月；未換的電堆承受熱循環懲罰；RAIBA 增量 $50/kW＋0.5 個效率點。", { x: 5.2, y: 5.75, w: 7.5, h: 0.75, fontSize: 13, color: C.accent4 });
  s.addNotes("第一層回答超額配置的問題。第二層用 50 個模組、每個 20 個電堆的異質機隊，比較四種架構。A-sel 很重要：它用的是固定串聯的硬體，只是改成只換壞的電堆。有了它，才能把維運策略的價值跟 RAIBA 電氣可重組的價值分開。");

  // =================== 模型結果 ===================
  pres.addSection({ title: "模型結果" });
  s = pres.addSlide({ masterName: "SECTION", sectionTitle: "模型結果" });
  s.addText("03｜模型結果", { placeholder: "body" });
  s.addText("超額配置、架構比較、與 NGCC 比較", { placeholder: "title" });

  // ---- 超額配置 ----
  s = content("模型結果");
  s.addText("超額配置的價值取決於現場劣化率", { placeholder: "title" });
  const scatterData = [];
  const allK = [...new Set(Object.values(CD.curves).flatMap((c) => c.k))].sort((a, b) => a - b);
  scatterData.push({ name: "k", values: allK });
  for (const [d, label] of [["0.10", "δ = 10%"], ["0.25", "δ = 25%"]]) {
    const map = new Map(CD.curves[d].k.map((k, i) => [k, CD.curves[d].lcoe[i]]));
    scatterData.push({ name: label, values: allK.map((k) => (map.has(k) ? map.get(k) : null)) });
  }
  s.addChart(pres.charts.SCATTER, scatterData, {
    x: 0.6, y: 1.45, w: 7.3, h: 5.2, objectName: "overprov-chart",
    lineSize: 2.5, lineDataSymbol: "none", chartColors: [HEX.accent4, HEX.accent1],
    showLegend: true, legendPos: "t", legendFontSize: 12, legendColor: HEX.accent4,
    valAxisMinVal: 52, valAxisMaxVal: 64, valAxisMajorUnit: 2, catAxisMinVal: -20, catAxisMaxVal: 80, catAxisMajorUnit: 20, catAxisCrossesAt: -20, valAxisCrossesAt: 52,
    showValAxisTitle: true, valAxisTitle: "LCOE（$/MWh）", valAxisTitleFontSize: 12, valAxisTitleColor: HEX.accent4,
    showCatAxisTitle: true, catAxisTitle: "超額配置比例 k（%）", catAxisTitleFontSize: 12, catAxisTitleColor: HEX.accent4,
    ...axisStyle(),
  });
  card(s, 8.3, 1.45, 4.4, 2.1, "overprov-best");
  txt(s, `k* ≈ ${Math.round(T1.best.k * 100)}%`, { x: 8.6, y: 1.65, w: 3.9, h: 0.7, fontSize: 32, bold: true, color: C.accent1 });
  txt(s, `基準 0.2%/kh\nLCOE ${f1(T1.k0.lcoe)} → ${f1(T1.best.lcoe)}（−1.9%）\n電堆壽命 7.0 → 13.8 年`, { x: 8.6, y: 2.4, w: 3.9, h: 1.0, fontSize: 14 });
  const dg = RES.tier1_sensitivity.filter((r) => r.key === "d_ref_pct_per_kh");
  s.addTable([[hdr("劣化率"), hdr("最佳 k"), hdr("LCOE 降幅")], ...dg.map((r) => [cell(`${r.value}%/kh`), cell(`${Math.round(r.k_opt_pct)}%`), { text: `${f1(r.gain_pct)}%`, options: { fontSize: 13, bold: r.value >= 0.5, color: r.value >= 0.5 ? C.accent1 : C.text1 } }])], {
    x: 8.3, y: 3.8, w: 4.4, colW: [1.6, 1.2, 1.6], border: { type: "solid", pt: 0.5, color: "D5DAE0" }, fontFace: "Microsoft JhengHei", rowH: 0.42, valign: "middle", objectName: "deg-table",
  });
  txt(s, "0.5%/kh 是 Jülich 長期實測平均；1%/kh 是 DOE 估計的系統現況。", { x: 8.3, y: 6.0, w: 4.4, h: 0.6, fontSize: 12, color: C.accent4 });
  s.addNotes("曲線是 LCOE 對超額配置比例。劣化率 0.2%/kh 時，最佳點只比不做超額配置便宜 1.9%。但如果現場劣化率是 Jülich 實測的 0.5%/kh，降幅變成 7.3%；1%/kh 時是 16%。所以要先量現場劣化率，才知道超額配置值不值得做。");

  // ---- 架構比較 ----
  s = content("模型結果");
  s.addText("最大的節省來自維運策略，不是 RAIBA", { placeholder: "title" });
  const ARCH = ["A", "A-sel", "R-lite", "R"];
  const AN = { "A": "A 整模組換新", "A-sel": "A-sel 選擇性換堆", "R-lite": "R-lite RAIBA 隔離", "R": "R RAIBA 完整" };
  const labels = ARCH.map((a) => `${AN[a]}｜${f1(FO[a].mean.lcoe)}`);
  const comp = [["lcoe_capex", "資本支出"], ["lcoe_fuel", "燃料"], ["lcoe_repl", "換堆＋維修"], ["lcoe_fom", "固定 O&M"]];
  s.addChart(pres.charts.BAR, comp.map(([k, n]) => ({ name: n, labels, values: ARCH.map((a) => +FO[a].mean[k].toFixed(2)) })), {
    x: 0.6, y: 1.45, w: 7.6, h: 5.2, objectName: "arch-chart", barDir: "bar", barGrouping: "stacked", barGapWidthPct: 60,
    chartColors: [HEX.accent2, HEX.accent1, HEX.accent3, HEX.accent4], showLegend: true, legendPos: "t", legendFontSize: 12, legendColor: HEX.accent4,
    
    catAxisOrientation: "maxMin", valAxisMinVal: 0, valAxisMaxVal: 70, valAxisMajorUnit: 10,
    showValAxisTitle: true, valAxisTitle: "LCOE（$/MWh）", valAxisTitleFontSize: 12, valAxisTitleColor: HEX.accent4,
    ...axisStyle(),
  });
  const callouts = [
    ["−10%", "A → A-sel", "只換壞的電堆。固定串聯硬體就能做到。"],
    ["−1.5%", "A-sel → R", "RAIBA 的增量（已扣成本）；每堆交付能量 +8.3%、開箱次數 −57%"],
    [`$${Math.round(BE.breakeven_capex_at_0p5loss)}–${Math.round(BE0.breakeven_capex_at_0loss)}/kW`, "損益兩平", "電堆級 DC/DC 增量成本的上限"],
  ];
  callouts.forEach(([big, lab, desc], i) => {
    const y = 1.45 + i * 1.75;
    card(s, 8.6, y, 4.1, 1.55, `arch-callout-${i}`);
    txt(s, big, { x: 8.85, y: y + 0.15, w: 2.3, h: 0.6, fontSize: 26, bold: true, color: i === 0 ? C.accent2 : C.accent1, fit: "shrink" });
    txt(s, lab, { x: 11.0, y: y + 0.22, w: 1.6, h: 0.5, fontSize: 14, bold: true, color: C.text2, align: "right" });
    txt(s, desc, { x: 8.85, y: y + 0.82, w: 3.7, h: 0.65, fontSize: 13 });
  });
  s.addNotes("四種架構的 LCOE 組成。從 A 到 A-sel，也就是不再整模組換新、只換壞的電堆，就省了約 10%，這不需要任何新硬體。RAIBA 完整版相對 A-sel 再省 1.5%，已扣掉 RAIBA 自己的成本。換算下來，電堆級 DC/DC 的增量成本要低於每 kW 107 到 157 美元才划算。");

  // ---- RAIBA 價值取決於開箱代價 ----
  s = content("模型結果");
  s.addText("RAIBA 的價值取決於開一次熱箱有多貴", { placeholder: "title" });
  const fsn = RES.fleet_sensitivity;
  const svc = fsn.filter((r) => r.key === "module_service_cost");
  s.addChart(pres.charts.BAR, [{ name: "R 相對 A-sel 的 LCOE 降幅（%）", labels: svc.map((r) => `$${r.value / 1000}k`), values: svc.map((r) => r.R_vs_Asel_pct) }], {
    x: 0.6, y: 1.45, w: 7.3, h: 5.2, objectName: "svc-chart", barDir: "col", barGapWidthPct: 70,
    chartColors: [HEX.accent1], invertedColors: [HEX.accent4], showLegend: false,
    showTitle: true, title: "每次開箱成本 → RAIBA 相對 A-sel 的 LCOE 降幅（%）", titleFontSize: 14, titleColor: HEX.dk2,
    showValue: true, dataLabelPosition: "outEnd", dataLabelFontSize: 13, dataLabelColor: HEX.dk1, dataLabelFormatCode: "0.0",
    valAxisMinVal: -2, valAxisMaxVal: 12, valAxisMajorUnit: 2,
    ...axisStyle(),
  });
  const other = [
    ["熱循環懲罰", fsn.filter((r) => r.key === "thermal_cycle_penalty"), (v) => `${v * 100}%`],
    ["突發故障率 /堆·年", fsn.filter((r) => r.key === "fail_rate_per_stack_yr"), (v) => `${v * 100}%`],
  ];
  other.forEach(([lab, rs, fmt], i) => {
    const y = 1.45 + i * 2.15;
    card(s, 8.3, y, 4.4, 1.95, `sens-card-${i}`);
    txt(s, lab, { x: 8.55, y: y + 0.15, w: 3.9, h: 0.4, fontSize: 15, bold: true, color: C.text2 });
    txt(s, rs.map((r) => `${fmt(r.value)} → ${f1(r.R_vs_Asel_pct)}%`).join("\n"), { x: 8.55, y: y + 0.6, w: 3.9, h: 1.25, fontSize: 14, color: C.text1 });
  });
  txt(s, "兩者目前都是【未知】→ 第一優先量測項目", { x: 8.3, y: 5.85, w: 4.4, h: 0.6, fontSize: 14, bold: true, color: C.accent1 });
  s.addNotes("RAIBA 在 SOFC 的價值，主要來自少開熱箱：先把壞的電堆隔離、繼續運轉，累積幾個再一起修。所以每次開箱越貴、熱循環傷害越大、故障率越高，RAIBA 越值錢。開箱成本 3 千美元時 RAIBA 反而較差；10 萬美元時省 11%。這跟電池版 RAIBA 的價值來源不同。");

  // ---- NGCC ----
  s = content("模型結果");
  s.addText("跟 NGCC 打平，資本支出要降到一半以下", { placeholder: "title" });
  const gs = RES.gas_sweep.filter((r) => r.gas <= 14);
  s.addChart(pres.charts.LINE, [
    { name: "SOFC，k = 0", labels: gs.map((r) => `$${r.gas}`), values: gs.map((r) => r.sofc_k0) },
    { name: "SOFC，最佳超額配置", labels: gs.map((r) => `$${r.gas}`), values: gs.map((r) => r.sofc_opt) },
    { name: "NGCC（參考）", labels: gs.map((r) => `$${r.gas}`), values: gs.map((r) => r.ngcc) },
  ], {
    x: 0.6, y: 1.45, w: 7.3, h: 5.2, objectName: "gas-chart", lineSize: 2.5, lineDataSymbol: "circle", lineDataSymbolSize: 7,
    chartColors: [HEX.accent4, HEX.accent1, HEX.accent2], showLegend: true, legendPos: "t", legendFontSize: 12, legendColor: HEX.accent4,
    valAxisMinVal: 40, valAxisMaxVal: 120, valAxisMajorUnit: 20,
    showValAxisTitle: true, valAxisTitle: "LCOE（$/MWh）", valAxisTitleFontSize: 12, valAxisTitleColor: HEX.accent4,
    showCatAxisTitle: true, catAxisTitle: "天然氣價格（$/MMBtu）", catAxisTitleFontSize: 12, catAxisTitleColor: HEX.accent4,
    ...axisStyle(),
  });
  const cp = RES.capex_parity;
  const g = (gas, ratio) => cp.find((r) => r.gas === gas && r.ratio === ratio).capex_k0_per_kW;
  card(s, 8.3, 1.45, 4.4, 3.05, "parity-card");
  txt(s, "SOFC 資本支出上限（$/kW）", { x: 8.55, y: 1.6, w: 3.9, h: 0.4, fontSize: 15, bold: true, color: C.text2 });
  s.addTable([[hdr("天然氣"), hdr("= NGCC"), hdr("≤ 1.2×")],
    [cell("$3.85"), cell(`$${Math.round(g(3.85, 1.0)).toLocaleString()}`), cell(`$${Math.round(g(3.85, 1.2)).toLocaleString()}`)],
    [cell("$12"), cell(`$${Math.round(g(12, 1.0)).toLocaleString()}`), cell(`$${Math.round(g(12, 1.2)).toLocaleString()}`)]], {
    x: 8.55, y: 2.15, w: 3.9, colW: [1.2, 1.35, 1.35], border: { type: "solid", pt: 0.5, color: "D5DAE0" }, fontFace: "Microsoft JhengHei", rowH: 0.5, valign: "middle", objectName: "parity-table",
  });
  card(s, 8.3, 4.7, 4.4, 1.95, "now-card", C.text2);
  txt(s, "目前推算 ≈ $5,000/kW", { x: 8.55, y: 4.85, w: 3.9, h: 0.55, fontSize: 20, bold: true, color: C.accent3 });
  txt(s, "由 AEP–Google 702 MW / $4B 推算（含碳捕集與 BoP）【假說】", { x: 8.55, y: 5.45, w: 3.9, h: 1.0, fontSize: 13, color: C.background1 });
  s.addNotes("曲線假設 SOFC 資本支出每 kW 2,000 美元，這時 SOFC 只比 NGCC 貴 8%。但目前由 Bloom 案例推算的實際成本是 5,000 以上。要跟 NGCC 打平，美國氣價下要降到 1,720；即使是亞洲氣價，也要降到 1,900 左右。這是比預測性維護和 RAIBA 重要一個量級的門檻。碳價、碳捕集還沒納入模型。");

  // =================== 決策 ===================
  pres.addSection({ title: "決策" });
  s = content("決策");
  s.addText("Kill criteria：兩項有條件、一項待量測、一項以現況不成立", { placeholder: "title" });
  const vcol = { "有條件": C.accent3, "待量測": C.accent4, "中間": C.accent2, "現況不成立": C.accent6 };
  const kc = [
    ["K1", "超額配置 LCOE 降幅", "<2% 停；2–5% 有條件；≥5% 進", "1.9%（0.2%/kh）；7.3%（0.5%/kh）", "有條件"],
    ["K2", "RAIBA 相對 A-sel 淨降幅", "<1% 停；1–3% 有條件；≥3% 進", "1.5%", "有條件"],
    ["K3", "損益兩平 vs 實際 DC/DC 成本", "實際 > 損益兩平 → 停", "損益兩平 $107–157/kW；實際【未知】", "待量測"],
    ["K4", "每堆交付能量增幅", "<5% 弱；>10% 值得", "8.3%", "中間"],
    ["K5", "GW 級 SOFC/NGCC LCOE 比", ">1.2 → 轉向分散式應用", "$2,000/kW 時 1.08；$5,000/kW 時約 2.0", "現況不成立"],
  ];
  s.addTable([[hdr("#"), hdr("判準"), hdr("門檻"), hdr("基準結果"), hdr("判定")],
    ...kc.map((r) => [cell(r[0]), cell(r[1]), cell(r[2]), cell(r[3]), { text: r[4], options: { bold: true, fontSize: 13, color: C.background1, fill: { color: vcol[r[4]] }, align: "center" } }])], {
    x: 0.6, y: 1.5, w: 12.1, colW: [0.6, 3.0, 3.1, 3.7, 1.7], border: { type: "solid", pt: 0.5, color: "D5DAE0" },
    fontFace: "Microsoft JhengHei", rowH: 0.72, valign: "middle", margin: [0.05, 0.1, 0.05, 0.1], objectName: "kill-table",
  });
  txt(s, "門檻值是本研究提出的【假說】，用來把「繼續、有條件繼續、停止」講清楚。", { x: 0.6, y: 6.3, w: 12.1, h: 0.4, fontSize: 13, color: C.accent4 });
  s.addNotes("五個決策門檻。超額配置和 RAIBA 都落在有條件繼續，要靠量測資料決定。DC/DC 成本還沒估。GW 級電廠以目前成本計不成立，如果資本支出降不下來，應該轉向資料中心這類分散式應用。");

  s = pres.addSlide({ masterName: "SECTION", sectionTitle: "決策" });
  s.addText("下一步", { placeholder: "body" });
  s.addText("量完這五件事，就能決定進或停", { placeholder: "title" });
  const nexts = [
    ["開箱總代價", "人工、吊裝、停機＋熱循環傷害", "K2、K4"],
    ["現場劣化率", "以及它對電流密度的依賴", "K1"],
    ["突發故障率", "每堆每年", "K2"],
    ["DC/DC 增量成本", "用 RAIBA dcdc4／hdc 設計換算", "K3"],
    ["量產資本支出", "系統 $/kW", "K5"],
  ];
  nexts.forEach(([a, b, k], i) => {
    const x = 0.8 + i * 2.38, y = 4.65;
    s.addShape(pres.shapes.OVAL, { x, y, w: 0.6, h: 0.6, fill: { color: C.accent1 }, line: { type: "none" }, objectName: `next-num-${i}` });
    txt(s, String(i + 1), { x, y, w: 0.6, h: 0.6, fontSize: 18, bold: true, color: C.background1, align: "center", valign: "middle" });
    txt(s, a, { x, y: y + 0.75, w: 2.2, h: 0.4, fontSize: 16, bold: true, color: C.background1 });
    txt(s, b, { x, y: y + 1.15, w: 2.2, h: 0.7, fontSize: 13, color: C.background2 });
    txt(s, k, { x, y: y + 1.85, w: 2.2, h: 0.3, fontSize: 12, bold: true, color: C.accent3 });
  });
  s.addNotes("下一步是量測，不是再加模型複雜度。第一優先是開一次熱箱的總代價，它直接決定 RAIBA 值不值得做。完整資料、查證紀錄和可重現的模型程式碼都在 SOFCTopics repo。");

  await pres.writeFile({ fileName: OUT });
  await applyTheme(OUT, THEME);
  console.log("wrote", OUT);
}
main().catch((e) => { console.error(e); process.exit(1); });
