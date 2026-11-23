# 01 — 題目整理（繁體中文）

> 原文：[`00_ORIGINAL_BRIEF.md`](./00_ORIGINAL_BRIEF.md)
> 記錄日期：2026-11-23

## 1. 核心問題

如何把大量 SOFC（固態氧化物燃料電池）單元擴展成 **GW 級天然氣發電廠**？主要的挑戰與問題有哪些？

## 2. 三大關注面向

| # | 面向 | 核心問題 |
|---|------|---------|
| 1 | **成本** | 資本支出（電堆、BoP、電力電子）、燃料成本、LCOE 能否跟傳統燃氣電廠競爭 |
| 2 | **預測性維護** | SOFC 單元會衰退、會壞，數量又多到千萬片等級，要怎麼監測、預測與更換 |
| 3 | **類 RAIBA 架構** | 借用 [RAIBA](https://github.com/pcpcchen-coder/RAIBA)（Reconfigurable Array of Inexpensive Battery Architecture）的可重組陣列思維，提升整體韌性與穩健性 |

## 3. Gemini 提供的文獻摘要（尚未查證）

> ⚠️ **Evidence layer：外部資料，尚未查證。** 以下數據都是轉述自 Gemini，還沒有核對原文。正式引用前必須逐一查證，詳見 [`../sources/LITERATURE_TO_VERIFY.md`](../sources/LITERATURE_TO_VERIFY.md)。

**1. 模組化混合電廠**（*Nature Communications*，2026）
- 主題：串並聯模組化 SOFC 架構，搭配陽極／陰極尾氣再循環，目標規模 1 GW
- 電效率 66.3%，加上 Rankine 底循環後為 68.5%
- 外部用水減少 59.9%，新鮮空氣需求減少 22%
- 模組大於 300 kW 時，LCOE 為 **$0.155/kWh**

**2. 電堆均勻性與流道設計**（*Chemical Engineering Journal*，2025）
- 主題：甲烷內重組電堆中，各電池之間的差異（cell-to-cell variation）
- 「3 進 2 出」歧管讓峰值溫差降低 50.7%
- 提高背壓可讓功率密度提升 34.6%，代價是下游容易燃料匱乏

**3. 可擴展系統與 BoP 工程**（美國能源部 OSTI 報告）
- 改用更大活性面積的同向流（co-flow）電池，提高 kW/L、降低 $/kW
- 用校準過的 Simulink 建立 BoP 模型，並做結構負載分析

**4. 其他參考**
- TU Delft 的船用 SOFC 電廠博士論文（2025）
- 大型固定式 SOFC 電廠設計準則（ResearchGate）
- 全電堆 3D 多物理場模擬（MDPI *Sustainability*）

**Gemini 歸納的擴展挑戰：**
- **熱與流體分布**：要避免熱點、熱應力和燃料匱乏
- **BoP 與經濟性**：熱回收、氣體再循環、電力電子的整合，加上資本與燃料成本的控制

## 4. 初步觀察

1. **成本差距很大。** $0.155/kWh 大約是新建複循環燃氣電廠（NGCC）LCOE 的 2～3 倍（NGCC 的數值待查證）。SOFC 的效率優勢（約 66% 對 NGCC 約 60%）在燃料成本上省下的錢不足以彌補，所以成本是第一個關卡。
2. **規模有落差。** GW 級大約需要 **2,000 萬～3,000 萬片電池**，這比較像「資料中心等級的機隊管理」問題，不是傳統電廠「少數大型機組」的思維。估算方式見 [`../research/SOFC_GW_RAIBA_MAPPING.zh-TW.md`](../research/SOFC_GW_RAIBA_MAPPING.zh-TW.md) 第 4 節。
3. **三個面向彼此相連。** 冗餘架構會影響資本成本，但也能把預測性維護從「避免停機」轉成「排程化的批次更換」。三者應該一起最佳化。
4. **諮詢 ChatGPT：** Claude 無法直接呼叫 ChatGPT。取得 ChatGPT 的回覆後，可以放進 `docs/sources/` 做交叉比對。
