# reports/

| 檔案 | 內容 |
|---|---|
| `SOFC_GW_RAIBA_報告_2026-11-23.docx` | Word 報告（12 頁）：執行摘要、背景、RAIBA 對應、查證、模型、結果、kill criteria、參考文獻 |
| `SOFC_GW_RAIBA_簡報_2026-11-23.pptx` | PowerPoint 簡報（17 頁，含講者備註，圖表為 PowerPoint 原生圖表） |
| `build/` | 產生上面兩個檔案的程式，資料直接讀 `models/results/results.json` |

## 重新產生

模型更新後（`cd models && python3 -m sofc_lcoe.run_all`），依序執行：

```bash
cd reports/build && npm install
```

```bash
cd reports/build && python3 make_figs.py
```

```bash
cd reports/build && node build_docx.js
```

```bash
cd reports/build && NODE_PATH=$PWD/node_modules node build_pptx.js
```

`build_pptx.js` 用到 Claude pptx skill 的 `apply_theme.js`（寫入佈景主題色），路徑寫在檔案開頭；在其他環境執行時要改成對應路徑，或拿掉 `applyTheme` 那一行（簡報仍可產生，只是主題色會變成 Office 預設色）。
