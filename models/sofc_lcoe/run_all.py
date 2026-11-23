"""執行全部分析，輸出 results/*.json、results/*.md、results/figures/*.png。

用法（在 models/ 目錄下）：
    python3 -m sofc_lcoe.run_all
"""
import json
import time
from dataclasses import replace, asdict
from pathlib import Path

import numpy as np
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
from matplotlib import font_manager

from .params import Params, NGCC, CAPEX_SCENARIOS
from .homogeneous import calibrate, optimum, simulate as homog_sim
from . import fleet

OUT = Path(__file__).resolve().parent.parent / "results"
FIG = OUT / "figures"
FIG.mkdir(parents=True, exist_ok=True)

# ---- 圖表樣式（dataviz 參考色盤，類別色依固定順序） ----
SERIES = ["#2a78d6", "#eb6834", "#1baf7a", "#eda100", "#e87ba4", "#008300", "#6250d6", "#e34948"]
SURFACE, INK, INK2, GRID = "#fcfcfb", "#0b0b0b", "#52514e", "#e4e3df"
for f in ["/usr/share/fonts/truetype/wqy/wqy-zenhei.ttc"]:
    if Path(f).exists():
        font_manager.fontManager.addfont(f)
        plt.rcParams["font.family"] = font_manager.FontProperties(fname=f).get_name()
plt.rcParams.update({
    "figure.facecolor": SURFACE, "axes.facecolor": SURFACE, "savefig.facecolor": SURFACE,
    "axes.edgecolor": GRID, "axes.labelcolor": INK2, "xtick.color": INK2, "ytick.color": INK2,
    "text.color": INK, "axes.grid": True, "grid.color": GRID, "grid.linewidth": 0.6,
    "axes.spines.top": False, "axes.spines.right": False, "lines.linewidth": 2.0,
    "axes.unicode_minus": False, "font.size": 10, "axes.axisbelow": True,
})

SEEDS = (0, 1, 2)
N_MOD = 50


def r2(x):
    return float(np.round(x, 2))


# ===================================================================
# 1. 第一層：超額配置 × 電流密度 × 電堆壽命
# ===================================================================
def tier1(p):
    best, base, r, J, D = optimum(p)
    curves = {}
    for di, d in enumerate(D):
        curves[f"{d:.2f}"] = {"k": r["k"][:, di].tolist(), "j0": J.tolist(),
                              "lcoe": [None if np.isnan(v) else float(v) for v in r["lcoe"][:, di]],
                              "life": [None if np.isnan(v) else float(v) for v in r["stack_life_yr"][:, di]]}
    return best, base, curves


def fig_tier1(p, best, base, curves):
    fig, axes = plt.subplots(1, 2, figsize=(11, 4.2))
    ax = axes[0]
    for i, (d, c) in enumerate(curves.items()):
        k = np.array(c["k"]) * 100
        L = np.array([np.nan if v is None else v for v in c["lcoe"]])
        ax.plot(k, L, color=SERIES[i], label=f"δ_EOL = {float(d)*100:.0f}%")
    ax.plot(best["k"] * 100, best["lcoe"], "o", ms=8, color=INK, mec=SURFACE, mew=2, zorder=5)
    ax.annotate(f"最佳 k={best['k']*100:.0f}%\n{best['lcoe']:.1f} $/MWh", (best["k"] * 100, best["lcoe"]),
                xytext=(best["k"] * 100 + 30, best["lcoe"] * 0.975), textcoords="data", fontsize=9, color=INK,
                arrowprops=dict(arrowstyle="-", color=INK2, lw=0.8))
    ax.axvline(0, color=INK2, lw=0.8, ls=":")
    ax.set_xlabel("超額配置比例 k（%），相對於額定電流密度 j_nom 所需面積")
    ax.set_ylabel("LCOE（$/MWh）")
    ax.set_title("LCOE 與超額配置比例", loc="left", fontsize=11)
    ax.set_xlim(-40, 150)
    lo = np.nanmin([np.nanmin([np.nan if v is None else v for v in c["lcoe"]]) for c in curves.values()])
    ax.set_ylim(lo * 0.94, lo * 1.6)
    ax.legend(frameon=False, fontsize=8.5)

    ax = axes[1]
    labels = ["k = 0\n(j0 = j_nom)", f"最佳點\n(k = {best['k']*100:.0f}%)"]
    comps = [("lcoe_capex", "資本支出"), ("lcoe_fuel", "燃料"), ("lcoe_repl", "換堆"), ("lcoe_fom", "固定 O&M")]
    bottom = np.zeros(2)
    for i, (key, name) in enumerate(comps):
        vals = np.array([base[key], best[key]])
        ax.bar(labels, vals, bottom=bottom, color=SERIES[i], width=0.5, label=name,
               edgecolor=SURFACE, linewidth=2)
        bottom += vals
    for x, tot in enumerate(bottom):
        ax.text(x, tot + 0.8, f"{tot:.1f}", ha="center", fontsize=10, color=INK)
    ax.set_ylabel("LCOE（$/MWh）")
    ax.set_title("LCOE 組成", loc="left", fontsize=11)
    ax.legend(frameon=False, fontsize=8.5, loc="upper right", ncol=2)
    ax.set_ylim(0, bottom.max() * 1.25)
    fig.tight_layout()
    fig.savefig(FIG / "fig1_tier1_overprovision.png", dpi=160)
    plt.close(fig)


# ===================================================================
# 2. 第一層敏感度
# ===================================================================
SENS = [
    ("劣化率 d_ref %/kh", "d_ref_pct_per_kh", [0.1, 0.2, 0.5, 1.0]),
    ("劣化指數 n", "n_deg", [0.0, 1.0, 1.5, 2.0]),
    ("電堆成本 $/kW", "stack_cost_per_kWnom", [200.0, 400.0, 800.0]),
    ("模組 BoP 成本 $/kW", "module_cost_per_kWnom", [300.0, 600.0, 1200.0]),
    ("天然氣 $/MMBtu", "gas_price_per_MMBtu", [3.85, 7.0, 12.0, 29.3]),
    ("折現率", "discount_rate", [0.05, 0.08, 0.10]),
    ("熱自持下限 j_min", "j_min_thermal", [0.10, 0.15, 0.25, 0.35]),
]


def tier1_sensitivity(p0_raw):
    rows = []
    for label, key, vals in SENS:
        for v in vals:
            q = calibrate(replace(p0_raw, **{key: v}))
            b, base, *_ = optimum(q)
            rows.append({
                "param": label, "key": key, "value": v,
                "d_ref_pct_kh": r2(q.d_ref_pct_per_kh * 100) / 100,
                "k_opt_pct": r2(b["k"] * 100), "j0_opt": r2(b["j0"]), "delta_opt": r2(b["delta"]),
                "lcoe_opt": r2(b["lcoe"]), "lcoe_k0": r2(base["lcoe"]),
                "gain_pct": r2((base["lcoe"] - b["lcoe"]) / base["lcoe"] * 100),
                "life_opt_yr": r2(b["stack_life_yr"]), "life_k0_yr": r2(base["stack_life_yr"]),
            })
    return rows


# ===================================================================
# 3. 第二層：架構比較
# ===================================================================
ARCHS = ["A", "A-sel", "R-lite", "R"]
ARCH_NAME = {"A": "A 固定串聯\n整模組換新", "A-sel": "A-sel 固定串聯\n選擇性換堆",
             "R-lite": "R-lite RAIBA\n隔離＋選擇性換堆", "R": "R RAIBA\n＋劣化感知調度"}


def fleet_compare(p, j0):
    out = {}
    for a in ARCHS:
        m, s = fleet.run_seeds(p, j0, a, seeds=SEEDS, n_modules=N_MOD)
        out[a] = {"mean": m, "std": s}
    return out


def fleet_breakeven(p, j0):
    """RAIBA 可容許的增量成本：讓 R（不含 RAIBA 成本與損失）與 A-sel 打平。"""
    asel, _ = fleet.run_seeds(p, j0, "A-sel", seeds=SEEDS, n_modules=N_MOD)
    r0, _ = fleet.run_seeds(p, j0, "R", seeds=SEEDS, n_modules=N_MOD, raiba_cost=False)
    # 每 1 $/kW_nom 增量資本支出對 LCOE 的影響（數值微分）
    q = replace(p, raiba_extra_capex_per_kWnom=100.0, raiba_extra_loss=0.0)
    r100, _ = fleet.run_seeds(q, j0, "R", seeds=SEEDS, n_modules=N_MOD)
    slope = (r100["lcoe"] - r0["lcoe"]) / 100.0
    q2 = replace(p, raiba_extra_capex_per_kWnom=0.0, raiba_extra_loss=0.01)
    rl, _ = fleet.run_seeds(q2, j0, "R", seeds=SEEDS, n_modules=N_MOD)
    slope_loss = (rl["lcoe"] - r0["lcoe"]) / 1.0      # 每 1 個效率點
    gross = asel["lcoe"] - r0["lcoe"]
    return {"lcoe_Asel": r2(asel["lcoe"]), "lcoe_R_free": r2(r0["lcoe"]),
            "gross_saving": r2(gross), "gross_saving_pct": r2(gross / asel["lcoe"] * 100),
            "lcoe_per_dollar_kWnom": float(slope), "lcoe_per_pt_loss": float(slope_loss),
            "breakeven_capex_at_0loss": r2(gross / slope) if slope > 0 else None,
            "breakeven_capex_at_0p5loss": r2((gross - 0.5 * slope_loss) / slope) if slope > 0 else None}


FLEET_SENS = [
    ("電堆劣化異質性 σ_m", "m_sigma", [0.1, 0.3, 0.5]),
    ("突發故障率 /堆·年", "fail_rate_per_stack_yr", [0.003, 0.01, 0.03]),
    ("模組維修停機（月）", "module_service_months", [1, 3]),
    ("劣化指數 n", "n_deg", [1.0, 2.0]),
    ("每模組電堆數 S", "stacks_per_module", [10, 20, 40]),
    ("熱循環懲罰（裕度比例/次）", "thermal_cycle_penalty", [0.0, 0.02, 0.05, 0.10]),
    ("每次開箱維修成本 $", "module_service_cost", [3000.0, 20000.0, 50000.0, 100000.0]),
]


def fleet_sensitivity(p_cal, j0):
    rows = []
    for label, key, vals in FLEET_SENS:
        for v in vals:
            q = replace(p_cal, **{key: v})
            res = {}
            for a in ["A-sel", "R-lite", "R"]:
                m, _ = fleet.run_seeds(q, j0, a, seeds=SEEDS, n_modules=N_MOD)
                res[a] = m
            rows.append({
                "param": label, "key": key, "value": v,
                "lcoe_Asel": r2(res["A-sel"]["lcoe"]), "lcoe_Rlite": r2(res["R-lite"]["lcoe"]),
                "lcoe_R": r2(res["R"]["lcoe"]),
                "R_vs_Asel_pct": r2((res["A-sel"]["lcoe"] - res["R"]["lcoe"]) / res["A-sel"]["lcoe"] * 100),
                "avail_Asel": r2(res["A-sel"]["availability"] * 100),
                "avail_R": r2(res["R"]["availability"] * 100),
                "E_stack_gain_pct": r2((res["R"]["energy_per_stack_MWh"] / res["A-sel"]["energy_per_stack_MWh"] - 1) * 100),
            })
    return rows


def fig_fleet(cmp, path, title):
    fig, ax = plt.subplots(figsize=(9, 4.2))
    comps = [("lcoe_capex", "資本支出"), ("lcoe_fuel", "燃料"), ("lcoe_repl", "換堆＋維修"), ("lcoe_fom", "固定 O&M")]
    labels = [ARCH_NAME[a] for a in ARCHS]
    bottom = np.zeros(len(ARCHS))
    for i, (key, name) in enumerate(comps):
        vals = np.array([cmp[a]["mean"][key] for a in ARCHS])
        ax.bar(labels, vals, bottom=bottom, color=SERIES[i], width=0.55, label=name,
               edgecolor=SURFACE, linewidth=2)
        bottom += vals
    for x, a in enumerate(ARCHS):
        ax.text(x, bottom[x] + 0.8, f"{bottom[x]:.1f}", ha="center", fontsize=10, color=INK)
    ax.set_ylabel("LCOE（$/MWh）")
    ax.set_title(title, loc="left", fontsize=11)
    ax.legend(frameon=False, fontsize=8.5, ncol=4, loc="upper right")
    ax.set_ylim(0, bottom.max() * 1.22)
    fig.tight_layout()
    fig.savefig(path, dpi=160)
    plt.close(fig)


def fig_fleet_sens(rows, path):
    keys = [k for _, k, _ in FLEET_SENS]
    fig, axes = plt.subplots(1, len(keys), figsize=(18, 3.8), sharey=True)
    for ax, (label, key, vals) in zip(axes, FLEET_SENS):
        rs = [r for r in rows if r["key"] == key]
        x = [f"{r['value']/1000:g}k" if r["value"] >= 1000 else f"{r['value']:g}" for r in rs]
        y = [r["R_vs_Asel_pct"] for r in rs]
        ax.bar(x, y, color=SERIES[0], width=0.55)
        for xi, yi in zip(x, y):
            ax.text(xi, yi + (0.15 if yi >= 0 else -0.5), f"{yi:.1f}", ha="center", fontsize=8.5, color=INK)
        ax.axhline(0, color=INK2, lw=0.8)
        ax.set_title(label, fontsize=9.5, loc="left")
    axes[0].set_ylabel("R 相對 A-sel 的 LCOE 降幅（%）")
    fig.tight_layout()
    fig.savefig(path, dpi=160)
    plt.close(fig)


# ===================================================================
# 4. 與 NGCC 比較
# ===================================================================
def ngcc_lcoe(n: NGCC, gas, r, life):
    crf = r * (1 + r) ** life / ((1 + r) ** life - 1)
    hours = 8760 * n.capacity_factor
    capex = n.capex_per_kW * crf / hours * 1000
    fom = n.fom_per_kW_yr / hours * 1000
    fuel = 3412 / n.efficiency_lhv / 1e6 * gas * 1000
    return {"capex": capex, "fom": fom, "vom": n.vom_per_MWh, "fuel": fuel,
            "total": capex + fom + n.vom_per_MWh + fuel}


def gas_sweep(p_raw, n: NGCC):
    rows = []
    for gas in [2.5, 3.85, 5.0, 7.0, 10.0, 14.0, 29.3]:
        q = calibrate(replace(p_raw, gas_price_per_MMBtu=gas))
        b, base, *_ = optimum(q)
        ng = ngcc_lcoe(n, gas, q.discount_rate, n.life_yr)
        rows.append({"gas": gas, "sofc_opt": r2(b["lcoe"]), "sofc_k0": r2(base["lcoe"]),
                     "ngcc": r2(ng["total"]), "ratio": r2(b["lcoe"] / ng["total"])})
    return rows


def fig_gas(rows, path):
    fig, ax = plt.subplots(figsize=(7.5, 4))
    g = [r["gas"] for r in rows]
    ax.plot(g, [r["sofc_k0"] for r in rows], color=SERIES[1], marker="o", ms=5, label="SOFC，k = 0")
    ax.plot(g, [r["sofc_opt"] for r in rows], color=SERIES[0], marker="o", ms=5, label="SOFC，最佳超額配置")
    ax.plot(g, [r["ngcc"] for r in rows], color=SERIES[2], marker="o", ms=5, label="NGCC（參考）")
    ax.set_xscale("log")
    ax.minorticks_off()
    ax.set_xticks(g)
    ax.set_xticklabels([f"{x:g}" for x in g])
    ax.set_xlabel("天然氣價格（$/MMBtu，對數軸）")
    ax.set_ylabel("LCOE（$/MWh）")
    ax.set_title("燃料價格敏感度：SOFC 與 NGCC", loc="left", fontsize=11)
    ax.legend(frameon=False, fontsize=9)
    fig.tight_layout()
    fig.savefig(path, dpi=160)
    plt.close(fig)


def capex_parity(p_raw, n: NGCC):
    """把三項資本支出等比例縮放，找出 SOFC（最佳超額配置）LCOE = NGCC × ratio 時的 k=0 資本支出。"""
    rows = []
    base_total = p_raw.capex_fixed_per_kWnet + p_raw.stack_cost_per_kWnom + p_raw.module_cost_per_kWnom
    for gas in [3.85, 12.0]:
        ng = ngcc_lcoe(n, gas, p_raw.discount_rate, n.life_yr)["total"]
        for ratio in [1.0, 1.2]:
            lo, hi = 0.05, 5.0
            for _ in range(40):
                f = 0.5 * (lo + hi)
                q = calibrate(replace(p_raw, gas_price_per_MMBtu=gas,
                                      capex_fixed_per_kWnet=p_raw.capex_fixed_per_kWnet * f,
                                      stack_cost_per_kWnom=p_raw.stack_cost_per_kWnom * f,
                                      module_cost_per_kWnom=p_raw.module_cost_per_kWnom * f))
                b, *_ = optimum(q)
                if b["lcoe"] > ng * ratio:
                    hi = f
                else:
                    lo = f
            rows.append({"gas": gas, "ngcc": r2(ng), "ratio": ratio,
                         "capex_k0_per_kW": r2(base_total * lo)})
    return rows


# ===================================================================
def main():
    t0 = time.time()
    p_raw = Params()
    p = calibrate(p_raw)
    best, base, curves = tier1(p)
    fig_tier1(p, best, base, curves)
    sens = tier1_sensitivity(p_raw)
    scen = []
    for name, kw in CAPEX_SCENARIOS.items():
        for d in [0.2, 0.5, 1.0]:
            q = calibrate(replace(p_raw, d_ref_pct_per_kh=d, **kw))
            b, b0, *_ = optimum(q)
            scen.append({"scenario": name, "d_ref": d, "k_opt_pct": r2(b["k"] * 100), "j0_opt": r2(b["j0"]),
                         "lcoe_k0": r2(b0["lcoe"]), "lcoe_opt": r2(b["lcoe"]),
                         "gain_pct": r2((b0["lcoe"] - b["lcoe"]) / b0["lcoe"] * 100),
                         "life_k0": r2(b0["stack_life_yr"]), "life_opt": r2(b["stack_life_yr"])})

    pf = replace(p, delta_EOL=best["delta"])
    cmp_opt = fleet_compare(pf, best["j0"])
    cmp_nom = fleet_compare(pf, p.j_nom)
    fig_fleet(cmp_opt, FIG / "fig2_fleet_arch_opt.png", f"架構比較（最佳超額配置 k = {best['k']*100:.0f}%，j0 = {best['j0']}）")
    fig_fleet(cmp_nom, FIG / "fig3_fleet_arch_k0.png", f"架构比較（無超額配置 k = 0，j0 = {p.j_nom}）".replace("构", "構"))
    be_opt = fleet_breakeven(pf, best["j0"])
    be_nom = fleet_breakeven(pf, p.j_nom)
    fsens = fleet_sensitivity(pf, best["j0"])
    fig_fleet_sens(fsens, FIG / "fig4_raiba_sensitivity.png")

    ng = NGCC()
    gs = gas_sweep(p_raw, ng)
    fig_gas(gs, FIG / "fig5_gas_vs_ngcc.png")
    cp = capex_parity(p_raw, ng)

    res = {
        "params_raw": asdict(p_raw), "d_ref_calibrated_pct_kh": p.d_ref_pct_per_kh,
        "ngcc_params": asdict(ng),
        "tier1": {"best": best, "k0": base},
        "tier1_sensitivity": sens,
        "capex_scenarios": scen,
        "fleet_opt": cmp_opt, "fleet_k0": cmp_nom,
        "breakeven_opt": be_opt, "breakeven_k0": be_nom,
        "fleet_sensitivity": fsens,
        "gas_sweep": gs,
        "capex_parity": cp,
        "runtime_s": time.time() - t0,
    }
    (OUT / "results.json").write_text(json.dumps(res, indent=2, ensure_ascii=False, default=float))
    write_md(res)
    print(f"done in {time.time()-t0:.0f}s")


def _tbl(rows, cols, heads):
    s = "| " + " | ".join(heads) + " |\n|" + "---|" * len(heads) + "\n"
    for r in rows:
        s += "| " + " | ".join(str(r[c]) for c in cols) + " |\n"
    return s


def write_md(res):
    b, k0 = res["tier1"]["best"], res["tier1"]["k0"]
    s = "# 模型輸出（自動產生，請勿手改）\n\n由 `python3 -m sofc_lcoe.run_all` 產生。說明與解讀見 `docs/research/LCOE_DEGRADATION_MODEL.zh-TW.md`。\n\n"
    s += f"校準後劣化率 d_ref = **{res['d_ref_calibrated_pct_kh']:.3f} %/kh**（@ j_ref，定電流）\n\n"
    s += "## 1. 第一層最佳點\n\n| 項目 | k = 0 | 最佳 |\n|---|---|---|\n"
    for key, name in [("j0", "j0 (A/cm²)"), ("k", "超額配置 k"), ("delta", "δ_EOL"), ("V0", "BOL 電壓 (V)"),
                      ("stack_life_yr", "電堆壽命（年）"), ("eta_net_avg", "平均淨效率"),
                      ("capex_per_kWnet", "資本支出 $/kW_net"), ("lcoe_capex", "LCOE 資本"),
                      ("lcoe_fuel", "LCOE 燃料"), ("lcoe_repl", "LCOE 換堆"), ("lcoe_fom", "LCOE O&M"),
                      ("lcoe", "**LCOE 合計**")]:
        s += f"| {name} | {k0[key]:.3f} | {b[key]:.3f} |\n"
    s += "\n## 2. 第一層敏感度\n\n" + _tbl(res["tier1_sensitivity"],
        ["param", "value", "d_ref_pct_kh", "j0_opt", "k_opt_pct", "delta_opt", "life_opt_yr", "lcoe_k0", "lcoe_opt", "gain_pct"],
        ["參數", "值", "d_ref %/kh", "最佳 j0", "最佳 k %", "最佳 δ", "最佳點壽命 年", "LCOE k=0", "LCOE 最佳", "降幅 %"])
    s += "\n## 2b. 資本支出情境 × 劣化率\n\n" + _tbl(res["capex_scenarios"],
        ["scenario", "d_ref", "j0_opt", "k_opt_pct", "life_k0", "life_opt", "lcoe_k0", "lcoe_opt", "gain_pct"],
        ["情境", "d_ref %/kh", "最佳 j0", "最佳 k %", "壽命 k=0", "壽命 最佳", "LCOE k=0", "LCOE 最佳", "降幅 %"])
    for tag, key in [("最佳超額配置", "fleet_opt"), ("k = 0", "fleet_k0")]:
        rows = []
        for a, v in res[key].items():
            m, sd = v["mean"], v["std"]
            rows.append({"arch": a, "lcoe": f"{m['lcoe']:.2f} ± {sd['lcoe']:.2f}", "repl": f"{m['lcoe_repl']:.2f}",
                         "fuel": f"{m['lcoe_fuel']:.2f}", "avail": f"{m['availability']*100:.2f}",
                         "eta": f"{m['eta_net_avg']*100:.1f}", "nrep": f"{m['stacks_replaced_per_GWyr']:.0f}",
                         "e": f"{m['energy_per_stack_MWh']:.0f}", "svc": f"{m['service_events_per_module_yr']:.3f}"})
        s += f"\n## 3. 架構比較（{tag}）\n\n" + _tbl(rows, ["arch", "lcoe", "fuel", "repl", "avail", "eta", "nrep", "e", "svc"],
            ["架構", "LCOE $/MWh", "燃料", "換堆+維修", "可用率 %", "淨效率 %", "換堆數 /GW·yr", "每堆交付 MWh", "維修次數 /模組·yr"])
    for tag, key in [("最佳超額配置", "breakeven_opt"), ("k = 0", "breakeven_k0")]:
        s += f"\n## 4. RAIBA 損益兩平（{tag}）\n\n```\n{json.dumps(res[key], indent=2, ensure_ascii=False)}\n```\n"
    s += "\n## 5. RAIBA 敏感度（R 相對 A-sel）\n\n" + _tbl(res["fleet_sensitivity"],
        ["param", "value", "lcoe_Asel", "lcoe_Rlite", "lcoe_R", "R_vs_Asel_pct", "avail_Asel", "avail_R", "E_stack_gain_pct"],
        ["參數", "值", "A-sel", "R-lite", "R", "R 降幅 %", "A-sel 可用率 %", "R 可用率 %", "每堆交付能量增幅 %"])
    s += "\n## 6. 燃料價格與 NGCC\n\n" + _tbl(res["gas_sweep"], ["gas", "sofc_k0", "sofc_opt", "ngcc", "ratio"],
        ["天然氣 $/MMBtu", "SOFC k=0", "SOFC 最佳", "NGCC", "SOFC/NGCC"])
    s += "\n## 7. 與 NGCC 打平所需資本支出（k=0 口徑，三項等比例縮放）\n\n" + _tbl(res["capex_parity"],
        ["gas", "ngcc", "ratio", "capex_k0_per_kW"], ["天然氣 $/MMBtu", "NGCC LCOE", "目標 SOFC/NGCC", "SOFC 資本支出上限 $/kW"])
    (OUT / "RESULTS.md").write_text(s)


if __name__ == "__main__":
    main()
