# Gemini 引用查證報告（7 筆）

> 查證日期：2026-11-23
> 方法：逐筆抓取原始頁面。被擋時改用 Crossref、OpenAlex、Europe PMC、Semantic Scholar 的 metadata 與摘要。每筆都註明實際讀到的範圍（全文／摘要／metadata）。
> 整理後的狀態也同步到 [`LITERATURE_TO_VERIFY.md`](./LITERATURE_TO_VERIFY.md)。

## 總結

- **7 筆全部真實存在**，沒有捏造的引用。
- **#1、#2 的核心數字對得上，但 Gemini 有兩處誤讀：**
  1. 「模組 >300 kW 時 LCOE $0.155/kWh」是錯的。$0.155/kWh 是 **1 GW 單一模組**的最低值；300 kW 只是 hybrid 設計開始比 standard 設計便宜的**交叉點**。
  2. #1 是在「固定 1 GW 總輸出」下改變模組大小的情境分析。作者明說，1 GW 單一模組不是實際的設計點。
- **#3** 只是 20 kW 等級的系統，摘要裡沒有任何 $/kW、kW/L 或劣化率數字。
- **#7** 是 SOFC 分類綜述，跟 BoP／經濟性無關，不應該拿來當作那方面的引用。

---

## 1. Nature Communications 2026（Wei et al.）：**有出入**

多數數字正確，但 LCOE 的條件被誤讀。

- **書目：** Xinyi Wei, Arthur Waeber, Shivom Sharma, Hangyu Yu, Jan Van herle, François Maréchal. "Scalable modular design of solid oxide fuel cell systems for enhanced large-scale power generation." *Nature Communications* 17, 2421 (2026)。線上發表日 2026-02-06，DOI [10.1038/s41467-026-69110-y](https://doi.org/10.1038/s41467-026-69110-y)，CC BY 4.0，PMC12988180。
- **讀取範圍：** 全文。

**與 Gemini 一致的部分：**
- 有 series-parallel 架構與 anode／cathode off-gas recirculation。
- "the hybrid design achieves 66.3% electrical efficiency while reducing external water use by 59.9% and fresh air demand by 22%"
- "With RC integration, the hybrid system's electrical efficiency increases to 68.5%, compared to 67% for NCNA and 60% for NCHA."

**有出入的部分：**
- **效率數字的基準是 50 kW 個案**（"Case study on a 50 kW SOFC system"，用 10 kW stack），不是 GW 級電廠的效率。
- **1 GW 是固定的年度總輸出情境**，模組大小在 10 kW 到 1 GW 之間變化。原文："a single 1 GW SOFC module is not intended as a realistic present-day design point"。
- **LCOE $0.155/kWh 不是「>300 kW 模組」的條件。**
  - 原文："ranging from 0.229 $/kWh for the 10 kW system module to 0.155 $/kWh for the 1 GW system module"。
  - 300 kW 的意思是 hybrid（策略 B）"outperforming the LCOE of strategy A beyond a system module size of approximately 300 kW"。
  - 其他策略在 1 GW 模組的 LCOE：A 和 D 為 0.162，C 為 0.160 $/kWh。

**LCOE 假設（全文所見）：**

| 項目 | 數值 |
|---|---|
| 燃料價 | 名目 **10 ¢/kWh（以燃料能量計）**，約等於 **$29/MMBtu**。敏感度範圍 5–25 ¢/kWh，OPEX 佔 LCOE 的比例因此從約 50% 升到 95%。單因子不確定性下 LCOE 落在 0.14–0.22 $/kWh |
| Stack／reformer 壽命 | "5 years for stacks and reformers, and 20 years for other high-TRL component modules"。不確定性分析取 5–12 年 |
| 折現率與壽期 | "interest rate (i = 5%) and project lifetime (t = 20 years)" |
| Stack 成本（10 kW 模組） | 策略 A：stack／reformer 916 / 221 $/kW；策略 B：1772 / 1731 $/kW；策略 D 模組 CAPEX 合計 1359 $/kW；到 1 MW 時各策略的 CAPEX 差距 "below 350 $/kW" |
| 容量因數 | 全文沒有看到明確數值 |
| 劣化 | **LCOE 模型沒有納入。** 原文："does not capture long-term degradation"。前言引用 "0.2%/kh at constant power" 只是背景 |

> **對本專案的意義：** 這篇的 LCOE 偏高，**主要是燃料價假設很高**（約 $29/MMBtu，是美國天然氣價的 7–8 倍）。它也完全沒有處理劣化，所以本專案的「劣化＋超額配置」模型正好補上它的空白。

## 2. Chemical Engineering Journal 2025（Lin et al.）：**已查證**

用語有小差異。

- **書目：** Chen Lin, Florian Kerscher, Benjamin Steinrücken, Sören Ohmstedt, Hartmut Spliethoff. "Investigation on cell-to-cell variations within methane-rich internal reforming solid oxide fuel cell (SOFC) stacks." *Chem. Eng. J.* 526, 170901 (2025-12)。DOI [10.1016/j.cej.2025.170901](https://doi.org/10.1016/j.cej.2025.170901)，hybrid OA（CC BY）。
- **讀取範圍：** 只有摘要（ScienceDirect 回 403，摘要取自 OpenAlex）。
- **原文：**
  - "a 9-cell methane-rich internal reforming SOFC stack"（數值模擬）
  - "the 3-in-2-out manifold achieved the best thermal uniformity, reducing the maximum stack temperature difference by 50.7 %"
  - "increasing backpressure improved power output by 34.6 % but also intensified thermal gradients and voltage non-uniformity due to aggravated downstream fuel starvation"
  - 另有一點："maintaining a methane content above 12 %"
- **差異：** 原文寫 "power output"，不是 "power density"。而且是 9-cell 的模擬結果。

> **對本專案的意義：** 這篇直接支持「堆內電池之間的差異是真實存在的」，也就是 RAIBA 所說的弱者問題的物理來源。

## 3. OSTI 2481333（Cummins）：**有出入**

內容大致符合，但沒有量化數字。

- **書目：** Lars Henrichsen. "Improving Cost and Efficiency of the Scalable Solid Oxide Fuel Cells Power System." Technical Report DOE-CUMMINS-FE31941，2024-12-29。研究單位：**Cummins**。贊助：DOE FECM。合約 FE0031941。DOI [10.2172/2481333](https://doi.org/10.2172/2481333)。
- **讀取範圍：** 摘要與 metadata。
- **原文：**
  - "design and develop a 20kW range small-scale solid oxide fuel cells (SOFC) power system"
  - "larger active area for the same manufacturing footprint"
  - 從 cross-flow 改成 R-SOFC co-flow cell
  - "A full SOFC system Simulink model was developed and calibrated with testing data from a fuel cell stack and BOP"
  - 結構分析："no high stress areas for all spatial directions"
  - 運轉時數：">500 hours under load of which over 300 hours was at full load of 20 kW"
- **差異：** 摘要**沒有 $/kW、kW/L 或劣化率數字**，規模只有 20 kW。

## 4. TU Delft 博士論文：**已查證**（metadata 與摘要）

- **書目：** B.N. van Veldhuizen. "Marinisation of Solid Oxide Fuel Cells: Inclination Experiments, Thermodynamic analysis, and Power Plant Design." PhD dissertation，TU Delft，2025-02-25。DOI [10.4233/uuid:879dfbd9-beef-40ea-98e7-f6a3da152b50](https://doi.org/10.4233/uuid:879dfbd9-beef-40ea-98e7-f6a3da152b50)，ISBN 978-94-6506-928-9。
- **讀取範圍：** 摘要（PDF 直連回 403）。
- **概述：**
  - 研究 SOFC 上船整合，包含船舶傾斜實驗與熱力學分析，結論 "identifying methane and ammonia as optimal choices"。
  - 有 MW 級概念設計。
  - 認為 SOFC 適合負載穩定的船型。
  - 摘要沒有效率、劣化或成本數字。

## 5. Springer 書章：**已查證**（metadata）

- **書目：** Marta Gandiglio, Andrea Lanzini, Massimo Santarelli. "Large Stationary Solid Oxide Fuel Cell (SOFC) Power Plants." 收錄於 J. Kupecki（ed.）*Modeling, Design, Construction, and Operation of Power Generators with Solid Oxide Fuel Cells*，Springer，2018，pp. 233–261。DOI [10.1007/978-3-319-75602-8_8](https://doi.org/10.1007/978-3-319-75602-8_8)。
- **讀取範圍：** metadata 與搜尋摘要片段。
- **概述：**
  - 回顧大型固定式 SOFC 系統。
  - 亞洲在固定式 SOFC 最活躍，但大型電廠市場主要在美國。
  - 結尾整理 criticalities、strengths 與 guidelines。

## 6. MDPI Sustainability 10(9):3094：**已查證**

「3D」這個說法需要保留。

- **書目：** Jie Ma, Suning Ma, Xinyi Zhang, Daifen Chen, Juan He. "Development of Large-Scale and Quasi Multi-Physics Model for Whole Structure of the Typical Solid Oxide Fuel Cell Stacks." *Sustainability* 10(9), 3094 (2018)。DOI [10.3390/su10093094](https://doi.org/10.3390/su10093094)。
- **讀取範圍：** 摘要。
- **判斷：**
  - 確實是 10-cell 全堆多物理場模型（"momentum, mass, energy and quasi electrochemical transporting"）。
  - 摘要沒有明寫「3D」。
  - 電化學部分是簡化的 "quasi" 模型。

## 7. PMC9000417：**存在，但跟 BoP／經濟性不相關**

- **書目：** Kuterbekov, K.A. et al. "Classification of Solid Oxide Fuel Cells." *Nanomaterials* 12(7), 1059 (2022)。DOI [10.3390/nano12071059](https://doi.org/10.3390/nano12071059)。
- **內容：** SOFC 類型分類綜述，沒有討論 BoP。**不適合作為 BoP 或經濟性的引用。**
