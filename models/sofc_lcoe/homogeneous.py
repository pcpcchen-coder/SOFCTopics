"""第一層模型：均質電堆、確定性。

問題：給定 1 GW 淨輸出，選 BOL 操作電流密度 j0（等價於超額配置比例 k）
與 EOL 判準 δ，讓 LCOE 最低。

取捨：
  j0 低 → 需要更多電池面積（資本支出↑），但電壓高（燃料↓）、劣化慢（換堆↓）
  j0 高 → 面積少，但燃料多、換堆頻繁
  δ 大 → 換堆少，但後期效率差（燃料↑）

運轉策略：每片電池維持定功率 p0；ASR 上升時電流自動增加（電壓下降），
直到電壓降到 (1-δ)·V_BOL 時換堆。

全部運算對 (j0, δ) 陣列向量化。
"""
import numpy as np

from .params import Params
from .cell import j_for_power, asr_rate, asr_eol_from_v


def simulate(p: Params, j0, delta):
    j0 = np.asarray(j0, dtype=float)
    delta = np.asarray(delta, dtype=float)
    j0, delta = np.broadcast_arrays(j0, delta)

    P_dc = p.P_dc_W()
    P_net_kW = p.P_net_MW * 1000.0
    V0 = p.E0 - p.ASR0 * j0
    p0 = j0 * V0                                  # W/cm²
    A = P_dc / p0                                 # 總活性面積 cm²
    A_nom = P_dc / p.p_nom
    k = A / A_nom - 1.0                           # 超額配置比例

    ASR_eol = asr_eol_from_v(p0, p.E0, V0, delta)
    j_eol = p0 / ((1 - delta) * V0)
    feasible = (j0 >= p.j_min_thermal) & (j_eol <= p.j_max) & ((1 - delta) * V0 > p.E0 / 2)

    capex = p.capex_fixed_per_kWnet * P_net_kW + (p.stack_cost_per_cm2 + p.module_cost_per_cm2) * A
    repl_cost_each = A * p.stack_cost_per_cm2 * p.stack_replace_mult

    n_steps = int(round(p.plant_life_yr * 8760 / p.dt_h))
    op_h = p.dt_h * p.dispatch_factor
    a = p.a_deg_per_h

    ASR = np.full(j0.shape, p.ASR0)
    pv_fuel = np.zeros(j0.shape)
    pv_repl = np.zeros(j0.shape)
    pv_fom = 0.0
    pv_energy = 0.0
    fuel_kWh_total = np.zeros(j0.shape)
    n_repl = np.zeros(j0.shape)
    first_eol_h = np.full(j0.shape, np.nan)

    for t in range(n_steps):
        df = (1 + p.discount_rate) ** (-(t + 0.5) * p.dt_h / 8760)
        j = j_for_power(p0, ASR, p.E0)
        j = np.where(np.isnan(j), p.j_max, j)
        amp_h = j * A * op_h
        pv_fuel += amp_h * p.fuel_cost_per_A_h * df
        fuel_kWh_total += amp_h * 1.039 / p.U_f / 1000.0
        ASR = ASR + asr_rate(j, 1.0, a, p.j_ref, p.n_deg) * op_h
        hit = ASR >= ASR_eol
        if hit.any():
            first_eol_h = np.where(hit & np.isnan(first_eol_h), (t + 1) * p.dt_h, first_eol_h)
            pv_repl += np.where(hit, repl_cost_each * df, 0.0)
            n_repl += hit
            ASR = np.where(hit, p.ASR0, ASR)
        e = P_net_kW * op_h
        pv_energy += e * df
        pv_fom += p.fom_per_kW_yr * P_net_kW * p.dt_h / 8760 * df

    # 殘值：電廠結束時電堆剩餘裕度
    df_end = (1 + p.discount_rate) ** (-p.plant_life_yr)
    margin = np.clip((ASR_eol - ASR) / (ASR_eol - p.ASR0), 0, 1)
    pv_repl -= repl_cost_each * margin * df_end

    to_MWh = 1000.0 / pv_energy                    # $/kWh → $/MWh
    out = {
        "j0": j0, "delta": delta, "k": k, "p0": p0, "V0": V0,
        "lcoe_capex": capex * to_MWh,
        "lcoe_fuel": pv_fuel * to_MWh,
        "lcoe_repl": pv_repl * to_MWh,
        "lcoe_fom": np.full(j0.shape, pv_fom * to_MWh),
        "stack_life_yr": first_eol_h / 8760.0,
        "n_repl": n_repl,
        "eta_net_avg": (P_net_kW * op_h * n_steps) / fuel_kWh_total,
        "capex_per_kWnet": capex / P_net_kW,
        "feasible": feasible,
    }
    total = out["lcoe_capex"] + out["lcoe_fuel"] + out["lcoe_repl"] + out["lcoe_fom"]
    out["lcoe"] = np.where(feasible, total, np.nan)
    return out


def optimum(p: Params, j_grid=None, delta_grid=None):
    """在 (j0, δ) 網格上找最低 LCOE。回傳最佳點與 k=0（j0=j_nom）下最佳 δ 的基準點。"""
    if j_grid is None:
        j_grid = np.round(np.arange(0.12, 0.86, 0.01), 3)
    if delta_grid is None:
        delta_grid = np.round(np.arange(0.05, p.delta_max + 1e-9, 0.05), 3)
    J, D = np.meshgrid(j_grid, delta_grid, indexing="ij")
    r = simulate(p, J, D)
    L = r["lcoe"]
    idx = np.unravel_index(np.nanargmin(L), L.shape)
    best = {key: float(np.asarray(v)[idx]) for key, v in r.items()}
    # 基準：j0 = j_nom（k=0），δ 取最佳
    i_nom = int(np.argmin(np.abs(j_grid - p.j_nom)))
    d_idx = int(np.nanargmin(L[i_nom, :]))
    base = {key: float(np.asarray(v)[i_nom, d_idx]) for key, v in r.items()}
    return best, base, r, j_grid, delta_grid


def calibrate(p: Params) -> Params:
    """反推 d_ref_pct_per_kh，使 j_nom、δ=calib_delta 下的電堆壽命 = calib_life_yr。"""
    from dataclasses import replace
    if not p.calibrate:
        return p
    lo, hi = 0.01, 10.0
    for _ in range(60):
        mid = (lo * hi) ** 0.5
        q = replace(p, d_ref_pct_per_kh=mid, plant_life_yr=max(p.calib_life_yr * 3, 30))
        life = float(simulate_life(q, p.j_nom, p.calib_delta))
        if np.isnan(life) or life < p.calib_life_yr:
            hi = mid
        else:
            lo = mid
    return replace(p, d_ref_pct_per_kh=(lo * hi) ** 0.5, calibrate=False)


def simulate_life(p: Params, j0, delta, dt_h=24.0):
    """單點、細時間步長計算到 EOL 的日曆年數。"""
    V0 = p.E0 - p.ASR0 * j0
    p0 = j0 * V0
    ASR_eol = asr_eol_from_v(p0, p.E0, V0, delta)
    ASR = p.ASR0
    t = 0.0
    op = dt_h * p.dispatch_factor
    while t < 60 * 8760:
        j = j_for_power(p0, ASR, p.E0)
        if np.isnan(j):
            return t / 8760
        ASR += float(asr_rate(j, 1.0, p.a_deg_per_h, p.j_ref, p.n_deg)) * op
        t += dt_h
        if ASR >= ASR_eol:
            return t / 8760
    return np.nan
