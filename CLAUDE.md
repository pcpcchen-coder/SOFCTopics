# CLAUDE.md — SOFCTopics 工作區規則

## 語言
- 與使用者互動、撰寫報告一律使用**繁體中文**。
- 英文原文（題目、文獻、外部 AI 回覆）逐字保存，不翻譯覆蓋。

## 專案背景
- 主題：GW 級天然氣 SOFC 電廠的擴展挑戰，三個主軸是成本、預測性維護、類 RAIBA 架構。
- 新 session 開始時，先讀 `README.md`、最新的 `docs/session/` 紀錄，以及 `docs/research/SOFC_GW_RAIBA_MAPPING.zh-TW.md`。
- RAIBA 參考 repo：https://github.com/pcpcchen-coder/RAIBA（特別是 `handoff.zh-TW.md` 與 `docs/architecture/RAIBA2_ARCHITECTURE.zh-TW.md`）。需要時用 add_repo 掛上來讀，不要憑記憶描述。

## Evidence 規則
- 每個主張都要標出【RAIBA 事實】【外部】【假說】【未知】其中之一。
- 不可以把假說寫成事實。
- 外部數據（特別是 Gemini／ChatGPT 轉述的數字）在 `docs/sources/LITERATURE_TO_VERIFY.md` 登記，查證後更新狀態。
- 正式引用的數字要附原始出處（標題、年份、DOI 或 URL）。

## 檔案慣例
- 分析與架構放 `docs/research/`，中文檔名加 `.zh-TW.md`。
- 外部 AI 回覆與文獻筆記放 `docs/sources/`。
- 每次 session 結束前，在 `docs/session/SESSION_YYYY-MM-DD.zh-TW.md` 記錄做了什麼、結論、下一步。
- 模型與程式（例如 LCOE ＋ 劣化模型）放 `models/`，要能重現，結果與假設一起寫進文件。
