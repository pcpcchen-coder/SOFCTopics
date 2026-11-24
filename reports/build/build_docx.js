// 產生 Word 報告：node build_docx.js
const fs = require("fs");
const path = require("path");
const {
  Document, Packer, Paragraph, TextRun, HeadingLevel, ImageRun, Table, TableRow, TableCell,
  WidthType, ShadingType, AlignmentType, LevelFormat, PageBreak, BorderStyle, Footer, PageNumber,
  TableOfContents,
} = require("docx");

const ROOT = path.resolve(__dirname, "..", "..");
const FIG = path.join(ROOT, "models", "results", "figures");
const OUT = path.join(ROOT, "reports", "SOFC_GW_RAIBA_報告_2026-11-23.docx");

const FONT = { ascii: "Calibri", hAnsi: "Calibri", eastAsia: "Microsoft JhengHei", cs: "Calibri" };
const ACCENT = "1F4E79";
const MUTED = "595959";
const TEXT_W = 9026; // A4 減 1" 邊界（DXA）

// ---- 行內標記：**粗體** ----
function runs(text, base = {}) {
  const out = [];
  const parts = text.split(/(\*\*[^*]+\*\*)/);
  for (const p of parts) {
    if (!p) continue;
    if (p.startsWith("**")) out.push(new TextRun({ text: p.slice(2, -2), bold: true, font: FONT, ...base }));
    else out.push(new TextRun({ text: p, font: FONT, ...base }));
  }
  return out;
}
const P = (t, o = {}) => new Paragraph({ children: runs(t, o.run || {}), spacing: { after: 120, line: 300 }, ...o.para });
const H1 = (t) => new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun({ text: t, font: FONT })] });
const H2 = (t) => new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun({ text: t, font: FONT })] });
const B = (t, level = 0) => new Paragraph({ numbering: { reference: "bul", level }, children: runs(t), spacing: { after: 60, line: 290 } });
let numInst = 0;
const NUMS = (...items) => { numInst++; return items.map((t) => new Paragraph({ numbering: { reference: "num", level: 0, instance: numInst }, children: runs(t), spacing: { after: 60, line: 290 } })); };
const NOTE = (t) => new Paragraph({ children: runs(t, { color: MUTED, size: 19, italics: true }), spacing: { after: 120 } });

function table(headers, rows, widths, opts = {}) {
  const total = widths.reduce((a, b) => a + b, 0);
  const border = { style: BorderStyle.SINGLE, size: 4, color: "BFBFBF" };
  const borders = { top: border, bottom: border, left: border, right: border };
  const cell = (t, i, head) => new TableCell({
    width: { size: widths[i], type: WidthType.DXA },
    borders,
    shading: head ? { type: ShadingType.CLEAR, fill: "DEEAF6", color: "auto" } : undefined,
    margins: { top: 60, bottom: 60, left: 100, right: 100 },
    children: [new Paragraph({ children: runs(String(t), { size: 19, bold: head || undefined }), spacing: { after: 0, line: 260 } })],
  });
  return new Table({
    width: { size: total, type: WidthType.DXA },
    columnWidths: widths,
    rows: [
      new TableRow({ tableHeader: true, children: headers.map((h, i) => cell(h, i, true)) }),
      ...rows.map((r) => new TableRow({ children: r.map((c, i) => cell(c, i, false)) })),
    ],
  });
}
const gap = () => new Paragraph({ children: [], spacing: { after: 120 } });

function figure(file, caption, wIn = 6.27) {
  const p = path.isAbsolute(file) ? file : path.join(FIG, file);
  const buf = fs.readFileSync(p);
  const w = buf.readUInt32BE(16), h = buf.readUInt32BE(20);
  const wpx = Math.round(wIn * 96), hpx = Math.round((wpx * h) / w);
  return [
    new Paragraph({ alignment: AlignmentType.CENTER, keepNext: true, spacing: { before: 120, after: 60 },
      children: [new ImageRun({ type: "png", data: buf, transformation: { width: wpx, height: hpx },
        altText: { title: caption, description: caption, name: file } })] }),
    new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 200 },
      children: runs(caption, { size: 19, color: MUTED }) }),
  ];
}

// =====================================================================
const content = [];
const add = (...xs) => xs.flat().forEach((x) => content.push(x));

// ---- 封面 ----
add(
  new Paragraph({ spacing: { before: 2400, after: 200 }, children: [new TextRun({ text: "GW 級天然氣 SOFC 電廠", font: FONT, size: 52, bold: true, color: ACCENT })] }),
  new Paragraph({ spacing: { after: 400 }, children: [new TextRun({ text: "成本、預測性維護與類 RAIBA 架構的可行性評估", font: FONT, size: 34, color: ACCENT })] }),
  P("研究報告 v1｜2026-11-23", { run: { size: 24, color: MUTED } }),
  P("資料來源：SOFCTopics repository（docs/、models/）", { run: { size: 22, color: MUTED } }),
  gap(), gap(),
  P("**閱讀說明：**每個主張都標有 evidence layer——【外部】有外部出處；【RAIBA 事實】來自 RAIBA repo；【假說】本研究的工程推估；【未知】目前沒有數據。模型輸出屬於【假說】層級，是決策輔助，不是預測。", { run: { size: 21 } }),
  new Paragraph({ children: [new PageBreak()] }),
);

// ---- 目錄 ----
add(
  new Paragraph({ children: [new TextRun({ text: "目錄", font: FONT, size: 32, bold: true, color: ACCENT })], spacing: { after: 200 } }),
  new TableOfContents("目錄", { hyperlink: true, headingStyleRange: "1-2" }),
  NOTE("（在 Word 中按右鍵 →「更新功能變數」即可產生頁碼）"),
  new Paragraph({ children: [new PageBreak()] }),
);

// ---- 1. 執行摘要 ----
add(
  H1("1. 執行摘要"),
  P("本研究評估把大量 SOFC 擴展成 **GW 級天然氣電廠**的三個面向：成本、預測性維護、類 RAIBA（Reconfigurable Array of Inexpensive Battery Architecture）架構。方法是文獻與競品查證，加上一個兩層的 LCOE＋劣化模型。"),
  table(["#", "問題", "答案（基準參數）", "信心"], [
    ["1", "超額配置有沒有用？", "最佳 k≈22%，LCOE 只降 **1.9%**；劣化率 0.5%/kh（Jülich 實測平均）時降 **7.3%**，1%/kh 時降 **16%**", "中"],
    ["2", "RAIBA 電堆級可重組有沒有用？", "主要節省來自「選擇性換堆」維運策略（約 10%）；RAIBA 再省 **1.5%**，損益兩平增量成本 **$107–157/kW**", "低～中"],
    ["3", "RAIBA 的價值由什麼決定？", "**每次開熱箱的代價**：開箱成本 $3k → $100k，RAIBA 優勢從 −1.1% 變成 +11.3%", "高（模型內）"],
    ["4", "能跟 NGCC 競爭嗎？", "美國氣價下，資本支出需 **≤ $1,720/kW** 才打平；目前推算約 $5,000/kW → 今天不具競爭力", "中"],
  ], [500, 2200, 5126, 1200]),
  gap(),
  P("**一句話結論：**超額配置與 RAIBA 都是「改善 10% 左右」的槓桿；決定 GW 級 SOFC 生死的是**資本支出要降一半以上**。RAIBA 能否進場，取決於「開一次熱箱有多貴」——這個數字可以量測，應列為第一優先。"),
);

// ---- 2. 背景 ----
add(
  H1("2. 背景與問題"),
  H2("2.1 研究題目"),
  P("如何把大量 SOFC 電池擴展成 GW 級天然氣電廠？三個主軸："),
  ...NUMS(
  "**成本**：資本支出（電堆、BoP、電力電子）、燃料、電堆更換、LCOE。",
  "**預測性維護**：千萬片等級電池的劣化監測、預測與更換。",
  "**類 RAIBA 架構**：借用可重組陣列思維，提升整體韌性與穩健性。",
  ),
  H2("2.2 規模數量級"),
  P("1 GW 需要的電池數量會隨電池尺寸差將近 10 倍，但「機隊管理」的本質不變："),
  table(["電池規格", "每片功率", "1 GW 所需電池", "1 GW 所需電堆"], [
    ["NETL 2022 參考設計（550 cm²）【外部】", "約 176 W", "約 570 萬片", "約 5.7 萬個（17.6 kW/堆）"],
    ["Bloom（每片約 25 W）【外部】", "約 25 W", "約 4,000 萬片", "—"],
    ["一般估算（100 cm²，0.3–0.5 W/cm²）【假說】", "30–50 W", "2,000 萬～3,000 萬片", "20 萬～100 萬個"],
  ], [3426, 1400, 2100, 2100]),
  gap(),
  P("這已經是「資料中心等級的機隊管理」：電堆一年 1% 的失效率，就等於每年要處理數百到數千個電堆。"),
);

// ---- 3. RAIBA ----
add(
  H1("3. RAIBA 概念與 SOFC 對應"),
  H2("3.1 RAIBA 是什麼【RAIBA 事實】"),
  B("**要解決的問題：**固定串聯系統中，最弱的模組提前把整個 pack 拖到 EOL。"),
  B("**2.0 架構主張：**低頻拓樸重組（Enable/Bypass）＋選擇性雙向 DC/DC＋確定性安全層＋數位孿生。"),
  B("**鐵律：**AI／最佳化器只能「提議」動作，硬安全迴路由確定性邏輯掌控。"),
  B("**北極星指標：**全壽命安全交付能量、全壽命可用率。"),
  B("**已有成果：**dcdc4、hdc4、hdc8 三組電力電子設計（ngspice 模擬，尚未硬體驗證）。"),
  H2("3.2 搬到 SOFC 要改什麼【假說】"),
  table(["差異", "影響"], [
    ["沒有 SOC，只有劣化", "最佳化目標變成「劣化速率平衡＋效率」"],
    ["工作溫度 600–850°C", "Bypass（零電流）會降溫、造成熱循環損傷 → 改成 HOT-IDLE（熱待機）"],
    ["電、熱、流體耦合", "電堆共用燃料、空氣、尾氣再循環，電氣重組不夠，還需要流體隔離"],
    ["重組粒度", "單電池無法 bypass，最小可控單位是電堆或電堆群"],
    ["時間尺度", "熱時間常數為分鐘到小時，拓樸變更應很少發生"],
    ["安全範圍", "確定性安全層要擴展到燃氣安全（H₂／CO，IEC 61511）"],
  ], [2400, 6626]),
  gap(),
  H2("3.3 SOFC 版動作集合【假說】"),
  table(["電池版", "SOFC 版", "說明"], [
    ["ENABLE", "NORMAL", "正常發電"],
    ["DERATE", "DERATE（主力）", "降電流密度，劣化速率下降"],
    ["REST／BYPASS", "HOT-IDLE", "熱待機，避免熱循環"],
    ["ISOLATE", "ISOLATE", "電氣＋燃料隔離，代價高，用於故障"],
    ["—", "HOT-SWAP", "模組熱抽換（對應 Long-Life Chassis）"],
    ["—", "RECOVERY", "部分劣化可逆（例如硫毒化）"],
  ], [2000, 2400, 4626]),
);

// ---- 4. 查證 ----
add(
  H1("4. 文獻與競品查證"),
  H2("4.1 Gemini 引用（7 筆）"),
  P("7 筆全部真實存在，但 3 筆有出入："),
  table(["#", "來源", "結論", "狀態"], [
    ["1", "Wei et al., Nat. Commun. 17, 2421 (2026)", "效率與減量數字正確，但屬於 50 kW 個案。**LCOE $0.155/kWh 是 1 GW 單一模組的值**，不是「>300 kW 模組」；燃料價假設約 $29/MMBtu；模型**不含劣化**", "有出入"],
    ["2", "Lin et al., Chem. Eng. J. 526 (2025)", "3 進 2 出 −50.7%、背壓 +34.6% 正確（原文為 power output）；9-cell 模擬", "已查證"],
    ["3", "Cummins, DOE/OSTI 2481333 (2024)", "20 kW 級系統，摘要沒有 $/kW 或劣化數字", "有出入"],
    ["4", "TU Delft 博士論文 (2025)", "船用 SOFC，題目屬實", "已查證"],
    ["5", "Gandiglio et al., Springer (2018)", "大型固定式 SOFC 電廠回顧", "已查證"],
    ["6", "Ma et al., Sustainability 10(9) (2018)", "10-cell 全堆 quasi 多物理場模型", "已查證"],
    ["7", "Kuterbekov et al., Nanomaterials (2022)", "SOFC 分類綜述，**跟 BoP／經濟性無關**", "有出入"],
  ], [400, 2700, 4826, 1100]),
  gap(),
  H2("4.2 Bloom Energy 標竿【外部】"),
  B("**架構：**Energy Server 6.5 為 325 kW，由 6 個約 50 kW 的功率模組（PM）組成；效率 65–53%（LHV，壽命期累積）。"),
  B("**在線抽換：**10-K 寫 \"Independent power modules can be replaced while the system remains online\"；現場更換不到一小時。"),
  B("**PM 壽命：**2014–15 年批次中位數 4.9 年；2018 年後的批次預估 ≥5 年。"),
  B("**大型交易：**AEP 最多 1 GW（2024-11）；AEP–Google 702 MW / $4B（2026-10，次級來源）；Oracle 最多 2.8 GW（2026-04）；Brookfield 最多 $5B 融資架構（2025-10）。"),
  B("**產能：**Fremont 廠擴到 2 GW/yr，目標 2026 年底。"),
  B("**未公開：**每 kW 售價、PM 更換成本、劣化 %/kh。由 AEP–Google 案推算約 $5,700/kW（含碳捕集與 BoP）【假說】。"),
  P("**意義：**Bloom 已經在模組級做到 RAIBA 的「隔離＋選擇性更換」。RAIBA 對 SOFC 的差異化空間在更細的粒度（熱箱內的電堆或電堆群），或不易在線抽換的大型模組設計。Bloom 也是 FTO 必須優先檢視的對象。【假說】"),
  H2("4.3 劣化與成本參數【外部】"),
  table(["項目", "數值", "來源"], [
    ["劣化率", "NETL／Ceres 0.2%/kh；Jülich 100 kh 平均 0.5%/kh；DOE 系統現況 1–1.5%/kh", "NETL 2022；Fang et al. 2019；DOE AMR 2019"],
    ["劣化對電流密度的依賴", "文獻結論互相矛盾，沒有通用式", "Hagen 2006 vs Jülich 2020"],
    ["標稱操作點", "0.8 V @ 0.4 A/cm²；550 cm²；17.6 kW/堆", "NETL 2022"],
    ["電堆成本／換堆週期", "$225/kW；7.3 年", "NETL 2022"],
    ["系統成本目標", "$900/kWe（DOE 2025/2030）", "DOE AMR 2019"],
    ["NGCC LCOE", "Lazard 2026：$51–129/MWh；EIA AEO2026：$55.5–77.5/MWh", "Lazard、EIA"],
    ["天然氣（發電用）", "2025 年 $3.85/MMBtu", "EIA STEO 2026-11"],
  ], [2300, 4226, 2500]),
);

// ---- 5. 模型 ----
add(
  H1("5. LCOE＋劣化模型"),
  H2("5.1 模型結構"),
  P("**第一層（均質、確定性）：**掃描 BOL 操作電流密度 j₀（等價於超額配置比例 k）與換堆判準 δ_EOL，找最低 LCOE。"),
  B("電壓 V = E₀ − ASR·j；劣化 dASR/dt = a·m·(j/j_ref)ⁿ；每片電池定功率運轉。"),
  B("燃料：每 1 A 需要 1.039 W/U_f 的 CH₄（LHV）。"),
  B("25 年月步長折現現金流，折現率 8%；資本支出分「跟淨容量成正比」與「跟電池面積成正比」兩部分。"),
  P("**第二層（異質機隊 Monte Carlo）：**50 個模組 × 20 個電堆，劣化倍率 lognormal（σ=0.3），故障率 1%/堆·年，比較四種架構："),
  table(["架構", "拓樸", "調度", "維修時換什麼"], [
    ["A 固定串聯", "模組內串聯，模組級 DC/DC", "模組間平均", "整個模組"],
    ["A-sel 選擇性換堆", "同 A", "同 A", "故障／EOL／裕度 < 30% 的電堆"],
    ["R-lite RAIBA 隔離版", "電堆級 DC/DC，可單獨隔離", "電堆間平均", "已隔離＋裕度 < 30%"],
    ["R RAIBA 完整版", "同 R-lite", "劣化感知經濟調度", "同 R-lite"],
  ], [2300, 2700, 1900, 2126]),
  gap(),
  P("所有架構：開熱箱維修時整個模組停機 1 個月，未更換的電堆承受一次熱循環懲罰；電力電子額定為設計功率 × 1.1。RAIBA 增量成本 $50/kW，加 0.5 個效率點損失。"),
  H2("5.2 驗證"),
  table(["檢查", "結果"], [
    ["第二層退化成均質、無故障時，是否等於第一層", "49.7 對 49.5 $/MWh ✔"],
    ["額定點、δ=15% 的電堆壽命 vs Bloom ≥5 年", "5.2 年 ✔"],
    ["額定點、δ=25% 的電堆壽命 vs NETL 7.3 年", "7.0 年 ✔"],
  ], [6000, 3026]),
  gap(),
  H2("5.3 主要參數"),
  table(["參數", "值", "Evidence"], [
    ["額定點", "0.8 V @ 0.4 A/cm²（ASR₀ = 0.5 Ω·cm²）", "【外部】NETL；E₀=1.0 V【假說】"],
    ["劣化率", "0.2%/kh（敏感度 0.1–1.0）", "【外部】"],
    ["劣化指數 n", "1（敏感度 0–2）", "【假說】"],
    ["資本支出（k=0）", "$2,000/kW（情境 $900／$2,000／$5,000）", "【假說】"],
    ["天然氣", "$3.85/MMBtu", "【外部】EIA"],
    ["突發故障率", "1%/堆·年", "【未知】"],
    ["每次開箱成本", "$20,000", "【未知】"],
    ["熱循環懲罰", "每次消耗 2% 的 EOL 裕度", "【未知】"],
  ], [2400, 3726, 2900]),
);

// ---- 6. 結果 ----
add(
  H1("6. 結果"),
  H2("6.1 超額配置"),
  ...figure("fig1_tier1_overprovision.png", "圖 1　LCOE 與超額配置比例（左），以及 k=0 與最佳點的 LCOE 組成（右）"),
  table(["項目", "k = 0（j₀ = 0.40）", "最佳（j₀ = 0.31，k = 22%）"], [
    ["BOL 電壓", "0.800 V", "0.845 V"],
    ["電堆壽命", "7.0 年", "13.8 年"],
    ["平均淨效率（LHV）", "54.6%", "57.7%"],
    ["資本支出", "$2,085/kW", "$2,326/kW"],
    ["LCOE", "54.5 $/MWh", "**53.4 $/MWh（−1.9%）**"],
  ], [3000, 3013, 3013]),
  gap(),
  table(["劣化率 d_ref", "最佳 k", "LCOE 降幅"], [
    ["0.1%/kh", "11%", "0.5%"], ["**0.2%/kh（基準）**", "22%", "1.9%"],
    ["0.5%/kh（Jülich 平均）", "46%", "7.3%"], ["1.0%/kh（DOE 系統現況）", "70%", "16.3%"],
  ], [3600, 2700, 2726]),
  gap(),
  P("**解讀：**超額配置的價值幾乎完全取決於現場劣化率。此外，資本支出達 DOE 目標（$900/kW）時，即使劣化率只有 0.2%/kh，LCOE 也能降 7%。最佳 δ 幾乎都落在 25% 的上限，代表模型傾向晚一點換堆；這個上限需要工程驗證。【假說】"),
  H2("6.2 架構比較"),
  ...figure("fig2_fleet_arch_opt.png", "圖 2　四種架構的 LCOE 組成（最佳超額配置 k=22%）"),
  table(["架構", "LCOE", "淨效率", "換堆 /GW·yr", "每堆交付 MWh", "開箱 /模組·yr"], [
    ["A 整模組換新", "62.9", "60.9%", "17,400", "429", "0.23"],
    ["A-sel 選擇性換堆", "56.7", "58.5%", "5,390", "1,041", "0.31"],
    ["R-lite", "56.3", "57.0%", "4,880", "1,111", "0.16"],
    ["**R**", "**55.8**", "57.4%", "4,760", "1,128", "0.13"],
  ], [2226, 1100, 1200, 1500, 1500, 1500]),
  gap(),
  B("**R 相對 A-sel：**LCOE −1.5%（已扣 RAIBA 成本）；每堆交付能量 +8.3%；開箱次數 −57%。"),
  B("**損益兩平：**可容許的 RAIBA 增量資本支出為 $121/kW（增量損失 0）或 $107/kW（0.5 個效率點）；k=0 時為 $157／$139/kW。"),
  B("**可用率：**各架構都在 99.8–100%，差異不明顯。"),
  ...figure(path.join(__dirname, "figs", "fig4b_raiba_sensitivity_grid.png"), "圖 3　RAIBA（R）相對 A-sel 的 LCOE 降幅：七個參數的敏感度"),
  table(["參數", "掃描值 → R 降幅"], [
    ["**每次開箱成本**", "$3k → −1.1%；$20k → 1.5%；$50k → 5.6%；$100k → **11.3%**"],
    ["**熱循環懲罰**", "0 → 1.1%；2% → 1.5%；5% → 2.2%；10% → 3.2%"],
    ["**突發故障率**", "0.3% → 0.1%；1% → 1.5%；3% → **5.3%**"],
    ["劣化異質性 σ_m", "0.1 → 0.9%；0.5 → 1.9%"],
    ["每模組電堆數", "10 → 1.2%；40 → 1.7%"],
  ], [2800, 6226]),
  gap(),
  P("**解讀：**【假說】"),
  ...NUMS(
  "最大的一筆錢是「不要整模組換新」（A → A-sel 約省 10%），這是維運策略，用固定串聯硬體就能做到。",
  "RAIBA 的增量價值來自**少開熱箱**：先隔離壞的電堆、繼續運轉，累積幾個再一起修。所以價值跟開箱代價和故障率成正比，跟劣化感知調度的關係反而不大（R 相對 R-lite 只再省約 0.9%）。",
  "這跟電池版 RAIBA 不同：電池版的價值主要來自弱者綁架與 SOC 平衡；SOFC 版主要來自避免熱箱開箱。",
  ),
  H2("6.3 跟 NGCC 比較"),
  ...figure("fig5_gas_vs_ngcc.png", "圖 4　燃料價格敏感度：SOFC 與 NGCC", 5.2),
  table(["天然氣", "SOFC/NGCC = 1.0 所需資本支出", "SOFC/NGCC = 1.2 所需資本支出"], [
    ["$3.85/MMBtu（美國）", "≤ $1,720/kW", "≤ $2,450/kW"],
    ["$12/MMBtu（亞洲 LNG 量級）", "≤ $1,920/kW", "≤ $3,240/kW"],
  ], [3000, 3013, 3013]),
  gap(),
  P("**解讀：**氣價越高，SOFC 的效率優勢越值錢；但即使在亞洲氣價下，資本支出也要降到現況推算值（約 $5,000/kW）的一半左右。對 GW 級電廠來說，資本支出這個門檻比預測性維護和 RAIBA 都重要一個量級。尚未納入的因素包括碳價（SOFC 陽極尾氣利於碳捕集）、電網價值與用水。【假說】"),
);

// ---- 7. Kill criteria ----
add(
  H1("7. Kill criteria（決策門檻）"),
  NOTE("門檻值是本研究提出的【假說】，用來把「繼續、有條件繼續、停止」講清楚。"),
  table(["#", "判準", "門檻", "基準結果", "判定"], [
    ["K1", "超額配置的 LCOE 降幅", "< 2% 停；2–5% 有條件；≥ 5% 進", "1.9%（0.2%/kh）；7.3%（0.5%/kh）", "**有條件**"],
    ["K2", "RAIBA 相對 A-sel 的淨降幅", "< 1% 停；1–3% 有條件；≥ 3% 進", "1.5%", "**有條件**"],
    ["K3", "損益兩平 vs 實際 DC/DC 增量成本", "實際 > 損益兩平 → 停", "損益兩平 $107–157/kW；實際【未知】", "**待量測**"],
    ["K4", "每堆交付能量增幅", "< 5% 弱；> 10% 值得；> 20% 有吸引力", "8.3%", "**中間**"],
    ["K5", "GW 級 SOFC/NGCC LCOE 比", "> 1.2 → 轉向分散式應用", "$2,000/kW 時 1.08；$5,000/kW 時約 2.0", "**現況不成立**"],
  ], [500, 2100, 2300, 2626, 1500]),
  gap(),
  P("**從「有條件」變成「進」或「停」，最需要量測的五件事：**"),
  ...NUMS(
  "每次熱箱開箱的總代價（人工、吊裝、停機＋熱循環造成的 ASR 增加）→ K2、K4",
  "現場長期劣化率，以及它對電流密度的依賴 → K1",
  "電堆突發故障率 → K2",
  "電堆級 DC/DC 的增量成本與損失 → K3",
  "大規模量產下的系統資本支出 → K5",
  ),
);

// ---- 8. 限制與下一步 ----
add(
  H1("8. 模型限制與下一步"),
  H2("8.1 限制"),
  B("線性極化近似；E₀ 為假設值。"),
  B("劣化只用 ASR 增長表示，沒有區分機理，也沒有可逆劣化。"),
  B("電堆之間沒有熱與燃料分配耦合（實際上會讓弱者問題更嚴重）。"),
  B("沒有燃料側隔離閥的成本與失效；沒有部分負載、啟停、升降載。"),
  B("第二層只模擬 1,000 個電堆並等比例放大；NGCC 用簡化公式，沒有碳價。"),
  H2("8.2 下一步"),
  ...NUMS(
  "**量化開箱代價：**SOFC 熱循環劣化文獻與大型模組維修實務。",
  "**電堆級 DC/DC 成本估算：**用 RAIBA repo 的 dcdc4／hdc 設計換算 SOFC 電堆（約 17.6 kW）的規格與 BOM，跟損益兩平值比較。",
  "**模型強化：**加入電堆間的熱與燃料耦合、部分負載與升降載。",
  "**交叉比對：**納入 ChatGPT 的回覆。",
  ),
);

// ---- 附錄：參考文獻 ----
add(
  H1("附錄　主要參考文獻"),
  ...[
    "Wei, X. et al. Scalable modular design of solid oxide fuel cell systems for enhanced large-scale power generation. Nature Communications 17, 2421 (2026). DOI 10.1038/s41467-026-69110-y",
    "Lin, C. et al. Investigation on cell-to-cell variations within methane-rich internal reforming SOFC stacks. Chem. Eng. J. 526, 170901 (2025). DOI 10.1016/j.cej.2025.170901",
    "Henrichsen, L. (Cummins). Improving Cost and Efficiency of the Scalable Solid Oxide Fuel Cells Power System. DOE-CUMMINS-FE31941 (2024). DOI 10.2172/2481333",
    "DOE/NETL. Techno-Economic Analysis of Natural Gas Fuel Cell Plant Configurations. DOE/NETL-2022-3259 (2022).",
    "Fang, Q., Blum, L., Stolten, D. Electrochemical Performance and Degradation Analysis of an SOFC Short Stack Following Operation of More than 100,000 Hours. J. Electrochem. Soc. 166(16) F1320 (2019). DOI 10.1149/2.0751916jes",
    "Hagen, A. et al. Degradation of Anode Supported SOFCs as a Function of Temperature and Current Load. J. Electrochem. Soc. 153 A1165 (2006). DOI 10.1149/1.2193400",
    "DOE/NETL. SOFC Program Overview, Annual Review Meeting (2019-04).",
    "Bloom Energy. FY2025 Form 10-K; Energy Server 6.5 Data Sheet (2026-02); A Primer to Understanding Fuel Cell Power Module Life (SEC 8-K Ex.99.1, 2019).",
    "Lazard. Levelized Cost of Energy+ v19.0 (2026-07).",
    "U.S. EIA. Levelized Costs of New Generation Resources in the Annual Energy Outlook 2026; Short-Term Energy Outlook (2026-11).",
    "RAIBA repository: https://github.com/pcpcchen-coder/RAIBA",
  ].map((t) => new Paragraph({ numbering: { reference: "ref", level: 0 }, children: runs(t, { size: 19 }), spacing: { after: 60 } })),
  gap(),
  NOTE("完整查證紀錄與模型程式碼：https://github.com/pcpcchen-coder/SOFCTopics"),
);

// =====================================================================
const doc = new Document({
  creator: "SOFCTopics",
  title: "GW 級天然氣 SOFC 電廠：成本、預測性維護與類 RAIBA 架構",
  styles: {
    default: { document: { run: { font: FONT, size: 22 } } },
    paragraphStyles: [
      { id: "Heading1", name: "Heading 1", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { font: FONT, size: 32, bold: true, color: ACCENT },
        paragraph: { spacing: { before: 360, after: 160 }, keepNext: true, outlineLevel: 0 } },
      { id: "Heading2", name: "Heading 2", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { font: FONT, size: 26, bold: true, color: ACCENT },
        paragraph: { spacing: { before: 240, after: 120 }, keepNext: true, outlineLevel: 1 } },
    ],
  },
  numbering: {
    config: [
      { reference: "bul", levels: [
        { level: 0, format: LevelFormat.BULLET, text: "•", alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 540, hanging: 270 } } } },
        { level: 1, format: LevelFormat.BULLET, text: "–", alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 1080, hanging: 270 } } } }] },
      { reference: "num", levels: [
        { level: 0, format: LevelFormat.DECIMAL, text: "%1.", alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 540, hanging: 360 } } } }] },
      { reference: "ref", levels: [
        { level: 0, format: LevelFormat.DECIMAL, text: "[%1]", alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 600, hanging: 600 } } } }] },
    ],
  },
  sections: [{
    properties: { page: { margin: { top: 1440, bottom: 1440, left: 1440, right: 1440 } } },
    footers: { default: new Footer({ children: [new Paragraph({ alignment: AlignmentType.CENTER,
      children: [new TextRun({ children: [PageNumber.CURRENT], font: FONT, size: 18, color: MUTED })] })] }) },
    children: content,
  }],
});

Packer.toBuffer(doc).then((buf) => { fs.writeFileSync(OUT, buf); console.log("wrote", OUT); });
