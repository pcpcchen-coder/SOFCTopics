"""開箱代價情境分析：用文獻範圍重跑 RAIBA（R）vs 固定串聯＋選擇性換堆（A-sel）。

用法（在 models/ 目錄下）：
    python3 -m sofc_lcoe.service_scenarios

輸出：results/service_cost.json、results/SERVICE_COST.md、results/figures/fig6_service_cost_map.png
"""
import json
from dataclasses import replace
from pathlib import Path

import numpy as np
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt

from .params import Params
from .homogeneous import optimum
from . import fleet
from .service_cost import cost_per_opening, scenario_params, penalty_from_voltage_loss
from .run_all import SERIES, SURFACE, INK, INK2  # 沿用圖表樣式與字型設定

OUT = Path(__file__).resolve().parent.parent / "results"
SEEDS = (0, 1, 2)
N_MOD = 50

# ---- 情境值【暫定，待文獻查證後更新】來源將整理於 docs/sources/THERMAL_CYCLING_SERVICE_2026-11-24.zh-TW.md ----
# v_loss：每次完整熱循環的電壓損失（比例）；p_leak：每次循環電堆洩漏／失效機率
# direct：每次開箱直接成本 $；downtime_days：降溫＋換堆＋升溫天數
SCENARIOS = {
    "低（金屬支撐／最佳實務）": dict(v_loss=0.0005, p_leak=0.0, direct=10000.0, downtime_days=7),
    "中（陽極支撐、良好密封）": dict(v_loss=0.005, p_leak=0.002, direct=30000.0, downtime_days=14),
    "高（陽極支撐、玻璃密封）": dict(v_loss=0.02, p_leak=0.01, direct=60000.0, downtime_days=30),
}


def run_pair(q, j0):
    a, _ = fleet.run_seeds(q, j0, "A-sel", seeds=SEEDS, n_modules=N_MOD)
    r, _ = fleet.run_seeds(q, j0, "R", seeds=SEEDS, n_modules=N_MOD)
    return a, r


def main():
    p = Params()
    best, *_ = optimum(p)
    j0, delta = best["j0"], best["delta"]
    out = {"j0": j0, "delta": delta, "scenarios": {}, "grid": {}}

    # 1) 文獻情境
    for name, sc in SCENARIOS.items():
        br = cost_per_opening(p, j0, delta, sc["v_loss"], sc["p_leak"], sc["direct"], sc["downtime_days"])
        q = scenario_params(p, j0, delta, sc["v_loss"], sc["p_leak"], sc["direct"], sc["downtime_days"])
        a, r = run_pair(q, j0)
        out["scenarios"][name] = {
            **sc, "breakdown": br, "penalty": q.thermal_cycle_penalty,
            "lcoe_Asel": a["lcoe"], "lcoe_R": r["lcoe"],
            "R_vs_Asel_pct": (a["lcoe"] - r["lcoe"]) / a["lcoe"] * 100,
            "svc_Asel": a["service_events_per_module_yr"], "svc_R": r["service_events_per_module_yr"],
            "E_stack_gain_pct": (r["energy_per_stack_MWh"] / a["energy_per_stack_MWh"] - 1) * 100,
        }
        print(name, round(out["scenarios"][name]["R_vs_Asel_pct"], 2))

    # 2) 二維掃描：直接成本 × 每次循環電壓損失
    directs = [3000.0, 10000.0, 20000.0, 40000.0, 80000.0]
    vlosses = [0.0, 0.0025, 0.005, 0.01, 0.02]
    Z = np.zeros((len(vlosses), len(directs)))
    for i, v in enumerate(vlosses):
        for k, d in enumerate(directs):
            q = scenario_params(p, j0, delta, v, 0.0, d, 30)
            a, r = run_pair(q, j0)
            Z[i, k] = (a["lcoe"] - r["lcoe"]) / a["lcoe"] * 100
    out["grid"] = {"directs": directs, "vlosses": vlosses, "R_vs_Asel_pct": Z.tolist()}

    # 圖：熱圖（單一色相，順序型）＋ K2 門檻標註
    fig, ax = plt.subplots(figsize=(7.6, 4.6))
    im = ax.imshow(Z, origin="lower", aspect="auto", cmap="Oranges", vmin=min(0, Z.min()), vmax=max(6, Z.max()))
    for i in range(len(vlosses)):
        for k in range(len(directs)):
            v = Z[i, k]
            tag = "進" if v >= 3 else ("有條件" if v >= 1 else "停")
            ax.text(k, i, f"{v:.1f}%\n{tag}", ha="center", va="center", fontsize=9,
                    color="white" if v > 0.6 * Z.max() else INK)
    ax.set_xticks(range(len(directs)))
    ax.set_xticklabels([f"${d/1000:g}k" for d in directs])
    ax.set_yticks(range(len(vlosses)))
    ax.set_yticklabels([f"{v*100:g}%" for v in vlosses])
    ax.set_xlabel("每次開箱直接成本（人工、吊裝、耗材）")
    ax.set_ylabel("每次熱循環電壓損失")
    ax.set_title("RAIBA（R）相對 A-sel 的 LCOE 降幅與 K2 判定", loc="left", fontsize=11)
    ax.grid(False)
    cb = fig.colorbar(im, ax=ax, shrink=0.85)
    cb.set_label("LCOE 降幅（%）")
    fig.tight_layout()
    fig.savefig(OUT / "figures" / "fig6_service_cost_map.png", dpi=160)
    plt.close(fig)

    (OUT / "service_cost.json").write_text(json.dumps(out, indent=2, ensure_ascii=False, default=float))

    # Markdown
    s = "# 開箱代價情境分析（自動產生）\n\n由 `python3 -m sofc_lcoe.service_scenarios` 產生。\n\n"
    s += f"操作點：j0 = {j0}、δ_EOL = {delta}（第一層最佳點）\n\n## 文獻情境\n\n"
    s += "| 情境 | 電壓損失/次 | 洩漏機率/次 | 直接成本 | 停機天數 | 熱循環傷害 $/次 | 停機損失上限 $/次 | 合計（不含停機）| R 相對 A-sel |\n|---|---|---|---|---|---|---|---|---|\n"
    for n, d in out["scenarios"].items():
        b = d["breakdown"]
        s += (f"| {n} | {d['v_loss']*100:g}% | {d['p_leak']*100:g}% | ${d['direct']:,.0f} | {d['downtime_days']} | "
              f"${b['thermal']:,.0f} | ${b['downtime_upper']:,.0f} | ${b['total_no_downtime']:,.0f} | **{d['R_vs_Asel_pct']:.1f}%** |\n")
    s += "\n## 二維掃描：R 相對 A-sel 的 LCOE 降幅（%）\n\n| 電壓損失/次 ＼ 直接成本 | " + " | ".join(f"${d/1000:g}k" for d in directs) + " |\n|---|" + "---|" * len(directs) + "\n"
    for i, v in enumerate(vlosses):
        s += f"| {v*100:g}% | " + " | ".join(f"{Z[i,k]:.1f}" for k in range(len(directs))) + " |\n"
    (OUT / "SERVICE_COST.md").write_text(s)
    print("done")


if __name__ == "__main__":
    main()
