# 待查證文獻清單

> 狀態欄：`未查證` / `已查證` / `有出入` / `找不到` / `部分查證`
> 查證細節：
> - Gemini 引用 → [`VERIFICATION_GEMINI_CITATIONS_2026-11-23.zh-TW.md`](./VERIFICATION_GEMINI_CITATIONS_2026-11-23.zh-TW.md)
> - Bloom、劣化、成本 → [`FACTS_BLOOM_DEGRADATION_2026-11-23.zh-TW.md`](./FACTS_BLOOM_DEGRADATION_2026-11-23.zh-TW.md)

## Gemini 引用

| # | 來源 | 查證結論 | 狀態 |
|---|---|---|---|
| 1 | Wei et al., *Nat. Commun.* 17, 2421 (2026), DOI 10.1038/s41467-026-69110-y | 效率 66.3%／68.5%、用水 −59.9%、空氣 −22% 都正確，但都是 **50 kW 個案**的數字。**LCOE $0.155/kWh 是 1 GW 單一模組的值，不是「>300 kW 模組」**；300 kW 是 hybrid 優於 standard 的交叉點。燃料價假設 10 ¢/kWh（約 $29/MMBtu）、折現率 5%、stack 壽命 5 年；**模型不含劣化** | **有出入** |
| 2 | Lin et al., *Chem. Eng. J.* 526, 170901 (2025), DOI 10.1016/j.cej.2025.170901 | 3 進 2 出 −50.7%、背壓 +34.6% 都正確；原文是 "power output"，不是 "power density"；9-cell 模擬；只讀到摘要 | 已查證 |
| 3 | Henrichsen (Cummins), DOE-CUMMINS-FE31941 (2024), DOI 10.2172/2481333 | 20 kW 級系統；摘要只有定性描述，**沒有 $/kW、kW/L 或劣化數字** | **有出入** |
| 4 | van Veldhuizen, TU Delft 博士論文 (2025), DOI 10.4233/uuid:879dfbd9-beef-40ea-98e7-f6a3da152b50 | 船用 SOFC，題目屬實；只讀到摘要 | 已查證 |
| 5 | Gandiglio, Lanzini, Santarelli, Springer 書章 (2018), DOI 10.1007/978-3-319-75602-8_8 | 大型固定式 SOFC 電廠回顧，題目屬實；只讀到 metadata | 已查證 |
| 6 | Ma et al., *Sustainability* 10(9), 3094 (2018), DOI 10.3390/su10093094 | 10-cell 全堆「quasi」多物理場模型；摘要沒有明寫「3D」 | 已查證 |
| 7 | Kuterbekov et al., *Nanomaterials* 12(7), 1059 (2022), DOI 10.3390/nano12071059 | SOFC 分類綜述，**跟 BoP／經濟性無關，不應拿來當作那方面的引用** | **有出入** |

## 其他事實

| # | 主張 | 查證結論 | 狀態 |
|---|---|---|---|
| A | 新建 NGCC 的 LCOE | Lazard 2026：$51–129/MWh；EIA AEO2026：$55.5（不受 111 規則限制）～$77.5/MWh | 已查證 |
| B | Bloom 的 GW 級交易 | AEP 最多 1 GW（2024-11）；AEP–Google 702 MW / $4B（2026-10，次級來源）；Brookfield 最多 $5B 融資架構（2025-10）；Oracle 最多 2.8 GW（2026-04） | 部分查證（AEP 選擇權的 MW 數、AEP–Google 一手申報未讀） |
| C | 商用電堆壽命與更換週期 | Bloom：2014–15 年批次中位數 4.9 年，2018 年後的批次預估 ≥5 年；NETL 2022 假設 7.3 年 | 已查證 |
| D | 劣化率與電流密度、溫度的關係 | 劣化率：0.2%/kh（NETL、Ceres）～0.5%/kh（Jülich 平均）～1–1.5%/kh（DOE 系統現況）。**對電流密度的依賴文獻互相矛盾，沒有通用式** | 部分查證 |
| E | 單電池活性面積與功率密度 | NETL：550 cm²、320 mW/cm²；Elcogen：121 cm²；Bloom：每片約 25 W | 已查證 |

## 仍待查證

| # | 項目 | 為什麼重要 |
|---|---|---|
| F | 每次 SOFC 熱箱降溫／升溫的劣化（熱循環懲罰） | **決定 RAIBA 價值的關鍵參數**，見模型報告 |
| G | 模組開箱維修的實際成本與停機時間 | 同上 |
| H | 電堆突發故障率（每堆每年） | 影響 RAIBA 價值與可用率 |
| I | 電堆級 DC/DC 在 MW 規模下的增量成本（$/kW）與損失 | 用來對照損益兩平的 $107–157/kW |
| J | 熱自持的最低電流密度 | 決定超額配置的實務上限 |
| K | AEP–Google 702 MW 案的一手申報與成本拆分 | 目前是次級來源 |
