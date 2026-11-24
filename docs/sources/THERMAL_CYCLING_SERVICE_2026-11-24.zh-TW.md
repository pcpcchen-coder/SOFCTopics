# 文獻查證：熱循環、redox 與熱箱維修停機

> 查證日期：2026-11-24
> 閱讀深度：〔全文〕實際讀過原文；〔摘要〕只讀到摘要；〔二手〕數字來自別的論文引用或搜尋摘要，原文未讀。
> 用途：量化「開一次熱箱」的代價，見 [`../research/HOTBOX_OPENING_COST.zh-TW.md`](../research/HOTBOX_OPENING_COST.zh-TW.md)。

## 結論

- **模型原本的假設高估了。** 原本假設每次全熱循環消耗 2% 的 EOL 裕度，換算約 0.28% 電壓損失。成熟的工業級電堆實測只有約 0.01%／次。
- **文獻範圍跨了 80 倍**（0.01–0.8%／次）。決定損失大小的是**電堆設計成熟度**（連接板塗層、夾緊機構、封裝），不是支撐類型。成熟的陽極支撐電堆（Delphi、FCE／Versa）也接近零損。
- **有三項沒有任何公開數據：**
  - 每次循環的洩漏／失效機率
  - 單次開箱的直接成本
  - 20 堆以上熱箱的降溫／升溫時間
- **Redox 是最壞情況。** 冷卻時如果失去陽極保護氣，陽極支撐電池可能電解質開裂、整堆報廢，而不是逐步衰退。

---

## A. 全熱循環（室溫 ↔ 操作溫度）

### A1. 每次循環的電壓／性能損失

| # | 電堆／條件 | 數值 | 換算每循環 | 出處 | 深度 |
|---|---|---|---|---|---|
| 1 | Delphi Gen 4，陽極支撐平板，30／40 cell，每循環約 10 h | 40-cell 堆 170 次循環後平均電壓衰退 1.9%；30-cell 堆 "Zero measurable mean voltage degradation" | 約 0.01% | R. Kerr (Delphi), 2014 SECA Workshop. https://netl.doe.gov/sites/default/files/event-proceedings/2014/2014%20SECA%20workshop/Rick-Kerr.pdf | 〔全文〕廠商自報 |
| 2 | FCE／Versa 80-cell 大面積堆，3 °C/min，陽極 N₂ 保護 | "12 deep thermal cycles and 8,295 hours"，含循環在內總衰退 0.49%/kh | 接近 0 | Ghezel-Ayagh, *SOFC Prototype System Test*, DOE Final Technical Report, OSTI 1784013. https://www.osti.gov/servlets/purl/1784013 | 〔全文〕 |
| 3 | FCE cell，750 °C | "10 Thermal Cycles = 8 mV loss; 10 Redox Cycles = 9 mV loss" | 約 0.1% | Ghezel-Ayagh, DOE AMR 2020. https://www.hydrogen.energy.gov/pdfs/review20/fe03_ghezel-ayagh_2020_o.pdf | 〔全文〕 |
| 4 | Honeywell SECA 電堆，2002 | "thermal cycling degradation is 2.3% per 10 cycles" | 約 0.23% | SECA Semi-Annual Report, Honeywell, OSTI 821427 | 〔全文〕 |
| 5 | EPFL／HTceramix 陽極支撐 5-cell 短堆，13 次循環 | −2 mV/cycle；ASR +0.008 Ω·cm²/cycle | 約 0.25% | Van Herle et al., *J. Power Sources* 182 (2008) 389–399 | 〔摘要〕／〔二手〕 |
| 6 | Jülich E-design 2-layer 短堆，800 °C，40 次循環，2 K/min | "degradation rate…(2–3%/1000 h) was not noticeably affected by the repeated thermal cycles" | 接近 0 | Steinberger-Wilckens et al., ECS 203rd Meeting (2003) Abstract 1784. https://www.electrochem.org/dl/ma/203/pdfs/1784.pdf | 〔全文〕 |
| 7 | Jülich 5-layer 堆，20×20 cm²，200–700 °C，100 次 | "successfully cycled"，沒有給損失數字 | — | ResearchGate 摘要 | 〔二手〕未確認 |
| 8 | 外歧管 5-cell 堆，室溫–750 °C，15 次 | "average operating voltage degradation rate is only 0.8% corresponding each thermal cycle" | 0.8% | Pan et al., *IJHE* 45 (2020) 17927, doi:10.1016/j.ijhydene.2020.04.260 | 〔二手〕 |
| 9 | 電堆，35–750 °C，10 次 | 堆電壓降 12.75%，57% 來自歐姆極化 | 約 1.3% | Zheng et al., *Appl. Energy* 381 (2025) 125187 | 〔二手〕 |
| 10 | 3-cell 扁管堆，750–250 °C，105 次 | 工作電壓 −0.063%/cycle | 0.063% | Wu et al., *J. Power Sources* 643 (2025) 237066 | 〔二手〕 |
| 11 | 陽極支撐 button cell，20 次 | 峰值功率密度下降 20.57% | 約 1%（單電池上限） | Zhu et al., *Processes* 13 (2025) 3747, doi:10.3390/pr13113747 | 〔全文〕 |
| 12 | Ceres 金屬支撐堆，**ΔT = 350 °C**，>3,600 次 | 平均電壓看不出下降 | 約 0 | Vesely & Dosanjh, DOE FE0027844, 2018 SOFC Workshop. https://netl.doe.gov/sites/default/files/netl-file/FE14-Vesely-2018.pdf | 〔全文〕 |

> **注意：** Ceres 的循環只有 ΔT 350 °C，沒有冷到室溫，不能直接當成「開熱箱」的等效數據。【外部】
> Elcogen、Sunfire、Topsoe、Kyocera、SOFCMAN、LG Fuel Cell Systems：沒有找到公開的每循環數字。【未知】

### A2. 計畫目標（照原文措辭）

- **SECA Phase I：**「Thermal cycle 1, Power Cycle 9, Cycle Degradation <1%」，也就是 10 次瞬態測試（含 1 次全熱循環）衰退 <1%。GE 實測 1.8%，是唯一沒達標的項目。出處：GE Energy, *SECA SOFC Program Final Report*, OSTI 915745。〔全文〕
  - 常被引用的「<1% per 10 thermal cycles」**不是原文措辭**。
- **Versa 電堆出廠要求：** 熱循環到 150 °C 前後 "Cell degradation < 0.006 V"，約 0.7%/cycle 的品管門檻。出處：Borglum (Versa Power), 2009 SECA Workshop。〔全文〕
- **GE 內部 CTQ：** 熱循環次數 LSL 10、Target 50。（OSTI 915745）
- **DOE FE 現行目標：** 只有 0.2%/kh、堆壽命 ≥4 年，沒有找到熱循環數的明確目標。【未知】

### A3. 失效模式

- **Delphi 170 次循環：** "No repeating unit to repeating unit seal leakage measured; Sheet metal component found to be cracked and exhibiting measurable leakage"。也就是說，出問題的是外殼金屬件，不是玻璃封裝。【外部】
- **Zheng 2025：** PEN 抗彎強度降 54%；損失以歐姆部分為主，原因是連接板氧化與封裝老化。【外部，二手】
- **Pan 2020、Wu 2025：** 陰極／連接板介面劣化，加上未塗層 SUS441 氧化。【外部，二手】
- **DTU（Hagen et al., IJHE 45 (2020) 29201）：** 溫度梯度 ≥20 °C/cm（陽極支撐）、≥30 °C/cm（金屬支撐）下，堆都 "remained intact"；最快升溫約 1 h。〔摘要〕
- **每次循環的洩漏／失效機率：沒有任何統計數據。** 公開資料只有單堆、無失效的案例。【未知】

## B. Redox（冷卻時失去陽極保護氣）

- **FCE cell：** 10 次 redox 停機循環損失 5–9 mV，約 0.1%/cycle。〔全文〕
- **Faes et al., *Membranes* 2 (2012) 585：**
  - 不開裂的最大 redox 應變為 "0.2% for ASC, 0.5% for ESC and 1% for MSC"。
  - 在 2000 cm² 的堆面積下，可容許應變降到 0.12%。
  - 原文："ASC is the most sensitive geometry"。
  - 〔全文，部分〕
- **Ceres 金屬支撐：** 60 次 E-stop 後 cell power 仍接近 100%。〔全文，判讀自圖〕
- **Kim et al., IJHE 41 (2016) 23173：** 冷卻時沒有供 H₂ 會明顯劣化；有供 H₂ 或施加負電流則沒有變化。〔二手〕
- **對模型的意涵【假說】：**
  - 冷卻時用 N₂ 或 forming gas 保護陽極，是熱循環損失能壓在 0.1% 以下的前提。
  - 在熱態失去保護氣時，陽極支撐電池應該建模成整堆報廢，而不是逐步衰退。

## C. 停機時間與維修實務

- **升降溫速率：** Jülich 2 K/min；FCE 3 °C/min；測試台典型 3–5 °C/min；DTU 短堆最快約 1 h。【外部】
- **GE SECA 5 kW 系統：** 一次熱循環 "took approximately 2.5 days"。〔全文〕
- **Delphi 單堆：** 一次熱循環約 10 h。〔全文〕
- **熱箱推估：** 20 堆熱箱的降溫＋升溫約 2–5 天，換堆工時另外計。【假說】
- **Bloom：** "swap these fuel cells on-site in under an hour"，整個 power module 抽換，其他模組不停機，因此**避開了「未更換電堆被迫熱循環」的問題**。【外部，二手】
- **單次開箱的直接成本（人工、吊車、耗材）：沒有公開數據。**【未知】

## D. NETL TEA

出處：Iyengar et al., *Techno-Economic Analysis of Natural Gas Fuel Cell Plant Configurations*, DOE/NETL-2022-3259。〔全文〕

- 堆更換：壽命 7.3 年，$223/kW AC，約合 $3.51/MWh。
- 維修人工：全廠每年 $6.60M（$10.15/kW-yr），**沒有按事件拆分**。人工費率 $38.50/h，另加 30% burden。
- "No major equipment spares"：用額外的 SOFC 面積吸收衰退，跟本專案的「超額配置」概念一致。
- 模組規格：64 堆 × 100 cells，550 cm²，每模組 1.126 MWe DC。

## 建議模型參數範圍

| 參數 | 低 | 中 | 高 | 依據 |
|---|---|---|---|---|
| 每次全熱循環電壓損失 | 0.01% | 0.1% | 0.8% | 【外部】區間（Delphi／Jülich／FCE → FCE cell／Honeywell → Pan 2020／Versa 門檻）；取哪個值屬【假說】 |
| 每次循環單堆洩漏／失效機率 | 0.01% | 0.2% | 1% | 【假說】沒有統計數據 |
| 降溫＋升溫停機 | 1 天 | 3 天 | 5 天 | 單堆 10 h、GE 2.5 天【外部】；熱箱值【假說】 |
| 每次開箱直接成本 | $5k | $20k | $50k | 【假說】沒有公開數據；用 NETL 人工費率加吊裝、耗材推估 |

## 待取得原文確認

Pan 2020、Zheng 2025、Wu 2025、Van Herle 2008 的 −2 mV、Jülich 20×20 cm² 堆 100 次循環、Ceres 2014 的 220 次循環、Bloom "under an hour"。
