"""報告用的補充圖：從 models/results/results.json 讀資料。"""
import json
from pathlib import Path
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
from matplotlib import font_manager

ROOT = Path(__file__).resolve().parents[2]
res = json.loads((ROOT / "models/results/results.json").read_text())
OUT = Path(__file__).resolve().parent / "figs"
f = "/usr/share/fonts/truetype/wqy/wqy-zenhei.ttc"
font_manager.fontManager.addfont(f)
plt.rcParams.update({"font.family": font_manager.FontProperties(fname=f).get_name(),
    "figure.facecolor": "#fcfcfb", "axes.facecolor": "#fcfcfb", "axes.edgecolor": "#e4e3df",
    "axes.labelcolor": "#52514e", "xtick.color": "#52514e", "ytick.color": "#52514e",
    "axes.grid": True, "grid.color": "#e4e3df", "axes.axisbelow": True,
    "axes.spines.top": False, "axes.spines.right": False, "axes.unicode_minus": False, "font.size": 11})

rows = res["fleet_sensitivity"]
keys = []
for r in rows:
    if (r["param"], r["key"]) not in keys:
        keys.append((r["param"], r["key"]))
fig, axes = plt.subplots(2, 4, figsize=(11, 6), sharey=True)
for ax, (label, key) in zip(axes.flat, keys):
    rs = [r for r in rows if r["key"] == key]
    x = [f"{r['value']/1000:g}k" if r["value"] >= 1000 else f"{r['value']:g}" for r in rs]
    y = [r["R_vs_Asel_pct"] for r in rs]
    ax.bar(x, y, color="#2a78d6", width=0.55)
    for xi, yi in zip(x, y):
        ax.text(xi, yi + (0.3 if yi >= 0 else -1.4), f"{yi:.1f}", ha="center", fontsize=10, color="#0b0b0b")
    ax.axhline(0, color="#52514e", lw=0.8)
    ax.set_ylim(-3.2, 12.8)
    ax.set_title(label, fontsize=11, loc="left")
axes.flat[-1].axis("off")
axes[0, 0].set_ylabel("R 相對 A-sel 的 LCOE 降幅（%）")
axes[1, 0].set_ylabel("R 相對 A-sel 的 LCOE 降幅（%）")
fig.tight_layout()
fig.savefig(OUT / "fig4b_raiba_sensitivity_grid.png", dpi=160)
print("ok")

# ---- 給 PPT 原生圖表用的資料 ----
import sys
import numpy as np
sys.path.insert(0, str(ROOT / "models"))
from sofc_lcoe.params import Params
from sofc_lcoe.homogeneous import simulate
p = Params()
j = np.round(np.arange(0.20, 0.53, 0.01), 3)
curves = {}
for d in [0.10, 0.15, 0.25]:
    r = simulate(p, j, np.full(j.shape, d))
    m = (r["k"] >= -0.25) & (r["k"] <= 1.2) & ~np.isnan(r["lcoe"])
    curves[f"{d:.2f}"] = {"k": [round(float(x) * 100, 1) for x in r["k"][m]],
                          "lcoe": [round(float(x), 2) for x in r["lcoe"][m]]}
(OUT / "chart_data.json").write_text(json.dumps({"curves": curves}, ensure_ascii=False, indent=1))
print("chart data ok")
