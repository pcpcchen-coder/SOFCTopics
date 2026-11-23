# models/

## sofc_lcoe — SOFC 電廠 LCOE ＋ 劣化模型

說明與結果解讀：[`docs/research/LCOE_DEGRADATION_MODEL.zh-TW.md`](../docs/research/LCOE_DEGRADATION_MODEL.zh-TW.md)

| 檔案 | 內容 |
|---|---|
| `sofc_lcoe/params.py` | 全部參數，每個都標出 evidence layer 與來源；另有資本支出情境與 NGCC 參數 |
| `sofc_lcoe/cell.py` | 電化學（線性極化）與劣化函式 |
| `sofc_lcoe/homogeneous.py` | 第一層：均質、確定性，掃描 (j₀, δ_EOL)，找超額配置最佳點 |
| `sofc_lcoe/fleet.py` | 第二層：異質機隊 Monte Carlo，比較 A／A-sel／R-lite／R 四種架構 |
| `sofc_lcoe/run_all.py` | 執行全部分析，輸出結果與圖 |
| `results/RESULTS.md` | 自動產生的數字表 |
| `results/results.json` | 全部結果（含參數） |
| `results/figures/` | 圖 |

## 重現

```bash
pip install numpy matplotlib
```

```bash
cd models && python3 -m sofc_lcoe.run_all
```

4 核心約 30 秒。中文字型用 WenQuanYi Zen Hei（`fonts-wqy-zenhei`），沒有的話圖中中文會變方塊，但數字不受影響。

改參數：編輯 `sofc_lcoe/params.py`，再重跑。
