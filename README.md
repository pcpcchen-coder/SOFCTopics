# SOFCTopics

研究主題：**把大量 SOFC（固態氧化物燃料電池）擴展成 GW 級天然氣發電廠的挑戰與解法。**

三個主軸：

1. **成本**：資本支出、燃料、電堆更換、LCOE
2. **預測性維護**：千萬片等級電池的劣化監測、預測與更換
3. **類 RAIBA 架構**：借用 [RAIBA](https://github.com/pcpcchen-coder/RAIBA)（Reconfigurable Array of Inexpensive Battery Architecture）的可重組陣列思維，提升電廠的韌性與穩健性

## 從這裡開始

| 文件 | 內容 |
|---|---|
| [`docs/brief/00_ORIGINAL_BRIEF.md`](docs/brief/00_ORIGINAL_BRIEF.md) | 原始題目與 Gemini 回覆（逐字保存） |
| [`docs/brief/01_BRIEF_SUMMARY.zh-TW.md`](docs/brief/01_BRIEF_SUMMARY.zh-TW.md) | 題目整理與初步觀察 |
| [`docs/research/SOFC_GW_RAIBA_MAPPING.zh-TW.md`](docs/research/SOFC_GW_RAIBA_MAPPING.zh-TW.md) | RAIBA 架構對應到 SOFC 電廠 |
| [`docs/sources/LITERATURE_TO_VERIFY.md`](docs/sources/LITERATURE_TO_VERIFY.md) | 待查證文獻與事實清單 |
| [`docs/session/`](docs/session/) | 各次工作 session 的紀錄 |

## Evidence Layers

所有文件都要區分：

- 【RAIBA 事實】：RAIBA repo 已有的內容
- 【外部】：外部文獻或公開資訊，必須查證
- 【假說】：本專案提出的工程假說
- 【未知】：必須取得資料才能回答

不可以把假說寫成事實。

## Repository 結構

```text
SOFCTopics/
├── README.md
├── CLAUDE.md          # AI 工作區規則
└── docs/
    ├── brief/         # 題目
    ├── research/      # 分析與架構
    ├── sources/       # 文獻、外部回覆（Gemini / ChatGPT）、查證紀錄
    └── session/       # session 紀錄
```
