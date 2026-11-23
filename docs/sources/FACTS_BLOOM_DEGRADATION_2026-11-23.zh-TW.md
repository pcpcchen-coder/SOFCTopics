# 事實查核：Bloom Energy 標竿、SOFC 劣化與成本參數

> 查核日期：2026-11-23
> 標記方式：
> - 【外部】有一手或原始出處
> - 【外部，次級】經轉述的出處
> - 【假說】查核者推算或推論的數字
> - 【未知】找不到一手來源
>
> 模型實際採用的數值見 [`../../models/sofc_lcoe/params.py`](../../models/sofc_lcoe/params.py)。

## 重點摘要

- **Bloom 沒有公開三項關鍵數字：** 每 kW 售價、功率模組（PM）更換成本、現行世代 PM 的額定功率。由大型交易推算出的每 kW 數字，只能當上下界參考。
- **NETL 2022 NGFC 報告的參數組最完整，而且彼此一致：** 0.2%/kh、400 mA/cm²、0.8 V、550 cm²、堆疊 $225/kW、換堆週期 7.3 年。本專案模型直接採用這組作為預設值。
- **長期劣化的實測基準：** Jülich 100,000 h 測試全程平均 **0.5%/kh**。0.2%/kh 是目標值，或是運轉後期的穩態值。
- **劣化率對電流密度與溫度的定量關係沒有通用式，** 文獻結論甚至互相矛盾。所以模型把它設成可調參數（指數 n），並做敏感度分析。
- **Bloom 已經做到 PM 級在線抽換。** 這等於在 PM 粒度上實現了 RAIBA 的「隔離＋選擇性更換」。對本專案的意義見 [`../research/SOFC_GW_RAIBA_MAPPING.zh-TW.md`](../research/SOFC_GW_RAIBA_MAPPING.zh-TW.md)。

---

## A. Bloom Energy

### A1. 產品架構

- 【外部】**Energy Server 6.5** 的資料：
  - 銘牌輸出 **325 kW（net AC）**。
  - 累積電效率 **65–53%（LHV net AC）**，熱耗率 5,811–7,127 Btu/kWh（HHV）。
  - 正常運轉時不耗水。
  - 出處：*The Bloom Energy Server 6.5 Data Sheet*，2026-02，https://www.bloomenergy.com/wp-content/uploads/bloom-energy-server-datasheet-feb-2026.pdf
- 【外部】"Average lifetime electrical efficiency: 54%"。325 kW 機組由 **6 個 PM**、1 個 AC 逆變模組、1 個燃料處理模組組成。
  - 出處：*Bloom Energy Server Brochure 2025*，https://www.bloomenergy.com/wp-content/uploads/bloom-energy-server-brochure-2025.pdf
- 【假說】6 個 PM 對 325 kW，推得每個 PM 約 54 kW AC。這是推算，Bloom 沒有公開現行 PM 的額定值。
- 【外部】2019 年 SEC 8-K Ex.99.1 *A Primer to Understanding Fuel Cell Power Module Life*（https://www.sec.gov/Archives/edgar/data/1664703/000166470319000037/ex991_fuelcelllife.htm）：
  - 每個 PM "50 kW at the beginning of life"，每顆電池約 25 W。
  - 更換單位是 PM，可在線抽換，換下的 PM 送回翻修。
  - 中位更換時間：2011 年批次 1.9 年，2015 年批次 4.7 年；2018 年以後的批次預估 **≥5 年**。
- 【外部】Bloom 部落格 *Reaching New Milestones in the Field-Proven Bloom Energy Server Longevity and Reliability*（2020，2025 更新）：
  - 2014–15 年部署的單元 "median recorded life of 4.9 years"，最長 7.7 年。
  - 現場更換 "in under an hour"。
  - 合約常見 "10- to 20-year service commitment"。
- 【外部】FY2025 10-K（https://www.sec.gov/Archives/edgar/data/1664703/000162828026006516/be-20251231.htm）：
  - "Independent power modules can be replaced while the system remains online"。
  - 非冗餘裝置的機群可用率約 99.9%。
  - 性能保證賠付：2025 年 $18.0M，2024 年 $21.2M。
- 【未知】每個 PM 的堆疊數、劣化 %/kh、合約中的效率保證數值。

### A2. 大型交易

| 交易 | 規模／條款 | 日期 | 出處 |
|---|---|---|---|
| AEP | 最多 1 GW，首單 100 MW（不是確定的採購承諾） | 2024-11-14 | Bloom PR／BusinessWire https://www.businesswire.com/news/home/20241114493147/en ；FY2025 10-K |
| AEP 行使選擇權 | 約 **$2.65B**，MW 數未確認 | 2026-01-08 申報 | 【外部，次級】Seeking Alpha／POWER 轉述 AEP 申報 |
| AEP–Google Cheyenne, WY | **702 MW**，專案總額 $4B，含碳捕集；Google 簽 20 年 PPA；預計 2028 年底運轉 | 2026-10-14 | 【外部，次級】POWER Magazine https://www.powermag.com/aep-plans-4-billion-fuel-cell-power-plant-for-google-signs-up-to-1-6-gw-mainspring-generator-deal/ |
| AEP Ohio | 約 98 MW，供電 AWS 與 Cologix 資料中心 | 2025 | 同上 |
| Brookfield | 融資架構 "up to $5.0 billion over five years"（上限，不是承諾金額） | 2025-10-13 | BusinessWire https://www.businesswire.com/news/home/20251013114760/en |
| Oracle | 主服務協議最多 **2.8 GW**，其中 1.2 GW 已簽約 | 2026-04 | Bloom PR https://www.bloomenergy.com/news/bloom-energy-and-oracle-expand-strategic-partnership-to-deploy-up-to-2-8-gw-to-accelerate-ai-infrastructure-build-out/ |
| Equinix | 累計超過 100 MW，分布在 19 座 IBX | 2025-02-20 | BusinessWire https://www.businesswire.com/news/home/20250220371127/en |
| 南韓／SK ecoplant | "nearly 682 MW of deployed systems" | FY2025 10-K | 同上 10-K |

> **觀察：** 市場已經有 GW 級的訂單與框架協議，但形式都是「很多個數百 kW 機組的集合」，主要供電給資料中心。目前沒有看到單一 GW 級的 SOFC 電廠。【外部＋推論】

### A3. 成本

- 【未知】Bloom 沒有公開 $/kW 售價、LCOE、PM 更換單價。
- 【假說】AEP–Google 案 $4B ÷ 702 MW ≈ **$5,700/kW**。這是含碳捕集與 BoP 的全專案成本，不等於 Bloom 的設備售價。
- 【外部】營收結構：
  - FY2025 營收 $2,024M，其中產品 $1,531M、服務 $228M。
  - Q3 2026 營收 $1,235.8M；產品毛利率 37.9%，服務毛利率 17.8%；全年指引 $4.4–4.6B。
  - 出處：8-K Ex.99.1，2026-10-22，https://www.sec.gov/Archives/edgar/data/0001664703/000162828026066890/ex991_q326financialresults.htm
- 【假說】服務營收 $228M ÷ 約 1.5 GW 裝置量，粗估服務收入約 $150/kW·yr，大致涵蓋 PM 更換成本。
- 【外部】成本趨勢只有定性說法："costs fell more than 7x since first-generation"，沒有基準年與絕對值。

### A4. 產能

- 【外部】Fremont 廠從 1 GW/yr 擴到 **2 GW/yr**，目標 2026 年底完成。每增加 1 GW 的資本支出約 $100–150M；廠區最高可擴到約 5 GW。（FY2025 10-K）

---

## B. SOFC 劣化與參數

### B1. 劣化率

| 來源 | 條件 | 劣化率 | 出處 |
|---|---|---|---|
| Jülich 100,000 h 短堆疊 | 700 °C、0.5 A/cm²、U_f 40%、H₂ | 前 40 kh 約 1.0%/kh，之後約 0.2%/kh；**全程平均電壓 0.5%/kh，ASR 2.5%/kh** | Fang, Blum, Stolten, *J. Electrochem. Soc.* 166(16) F1320, 2019, DOI 10.1149/2.0751916jes |
| Jülich 其他 | 43.8 kh；APS 塗層互連片 14 kh；甲烷內重組 2.6 kW 4.5 kh | 約 1%/kh；約 0.12%/kh；約 0.3%/kh | Blum et al., *Fuel Cells*, 2012, DOI 10.1002/fuce.201200151 |
| Jülich 4 層堆疊 | 700–750 °C、最高 1 A/cm²、U_f 最高 80%、>10 kh | 約 0.6%/kh | Fang et al., *J. Electrochem. Soc.* 167, 2020, DOI 10.1149/1945-7111/abc843 |
| Ceres／Cummins（廠商自報） | 1 kW 堆疊 40 kh；5 kW 堆疊 3 kh | <0.2%/kh；<0.25%/kh | DOE SOFC Workshop 2019 |
| DOE/NETL 指標 | 系統 | 現況 1–1.5%/kh；2025/2030 目標 **<0.2%/kh** | AMR SOFC Program Overview，2019-04，https://netl.doe.gov/sites/default/files/2020-03/AMR-SOFC-Program-Overview-4-29-2019.pdf |

### B2. 劣化率對電流密度與溫度的關係（文獻結論互相矛盾）

- 【外部】Hagen et al.（Risø），*J. Electrochem. Soc.* 153 A1165, 2006, DOI 10.1149/1.2193400：
  - 劣化 "mainly dependent on the cell polarization"。
  - 高電流、低溫時以陰極劣化為主。
  - "degradation rates obtained were lower at higher operating temperatures, even at higher current densities"。
- 【外部】反例：Jülich 2020 寫 "increase in the current density and fuel utilization… did not fundamentally influence the degradation rate"（DOI 10.1149/1945-7111/abc843）。
- 【外部，次級】扁管型電池在 800 °C 運轉 1000 h：200 mA/cm² 時壓降約 30 mV，1000 mA/cm² 時約 190 mV（J. Asian Ceram. Soc., 2021）。
- 【未知】找不到經過驗證的通用經驗式 → 模型採用 dASR/dt ∝ (j/j_ref)^n，n 設為【假說】並做敏感度掃描。

### B3. 典型電池與堆疊性能

- 【外部】NETL NGFC 模組設計（DOE/NETL-2022-3259，2022-04，https://www.netl.doe.gov/projects/files/TechnoEconomicAnalysisofNaturalGasFuelCellPlantConfigurations_043022.pdf）：
  - 標稱 **0.8 V @ 400 mA/cm²，320 mW/cm²**。
  - 活性面積 **550 cm²**，每堆疊 100 顆電池、17.6 kW DC；每模組 64 個堆疊。
  - 參考案例的電池電壓 0.875 V，功率密度 350 mW/cm²。
- 【外部】Elcogen 電池活性面積 121 cm²；ASR 0.17 Ω·cm² @ 700 °C。
- 【外部】Bloom 每顆電池約 25 W。
- 【未知】OCV 沒有一手數據；教科書值約 1.0–1.1 V。

### B4. DOE／NETL 成本與壽命目標

- 【外部】系統 $900/kWe；堆疊 <$225/kW（2011 美元）；劣化 <0.2%/kh。
- 【外部】NETL 2022 NGFC 報告（2018 美元，天然氣 $4.42/MMBtu）：
  - 堆疊 $225/kW，劣化 0.2%/kh，**換堆週期 7.3 年**，更換成本約 $223/kW-AC，約合 $3.5/MWh。
  - 參考案例（含 CCS）：淨效率 57.9% HHV，LCOE $57.0/MWh。
  - 不含 CCS 的案例：LCOE $40–47/MWh。
- 【外部】CMU 專家調查（*Joule*, 2019）預估 $900/kW 與 0.2%/kh 兩個目標要到 2035–2050 年才會達成。
- 【外部】NETL：單獨 SOFC 電效率 "typically 50% to 60% LHV"。

### B5. NGCC 比較基準與天然氣價

- 【外部】Lazard LCOE+ 2026（v19.0，2026-07）新建 NGCC：
  - 資本 $1,450–2,100/kW；熱耗率 6,475–6,550 Btu/kWh；燃料 $3.45/MMBtu。
  - LCOE **$51–129/MWh**。
  - https://www.lazard.com/media/kcfconhf/lazards-lcoeplus_vf.pdf
- 【外部】EIA AEO2026（2026-04）NGCC LCOE：
  - $77.46/MWh（受 EPA 111 規則限制，容量因數 ≤40%）。
  - 不受限制時 $55.51/MWh。
  - NGCC＋CCS $58.47/MWh。
  - https://www.eia.gov/outlooks/aeo/electricity_generation/pdf/LCOE_report.pdf
- 【假說】6,475 Btu/kWh（HHV）約等於 58% LHV。
- 【外部】EIA STEO 2026-11：發電用天然氣 2025 年 **$3.85/MMBtu**、2026 年 $3.81；Henry Hub 2025 年 $3.53。
