"""第二層模型：異質電堆機隊（Monte Carlo），比較三種架構。

架構
----
A  固定串聯（基準）：
   - 每個模組（熱箱）S 個電堆串聯，接一台模組級 DC/DC。
   - 模組之間平均分配功率（有上限時做 water-filling）。
   - 模組內所有電堆電流相同。
   - 任一電堆故障，或最弱電堆到 EOL → 整個模組停機維修，S 個電堆全部換新。
     這是 Bloom 式「整個 power module 更換」的簡化。

A-sel  固定串聯＋選擇性換堆：
   - 拓樸、調度、停機觸發都跟 A 一樣（沒有 bypass，任一電堆故障整個模組停機）。
   - 但維修時只換「故障／EOL／剩餘裕度 < θ」的電堆。
   - 用途：把「選擇性換堆」的價值和「電氣可重組」的價值分開。

R-lite  RAIBA 隔離版：
   - 電堆級 DC/DC，可以單獨隔離（HOT-IDLE），其他電堆分攤功率。
   - 電堆之間平均分配功率（不做劣化感知）。
   - 一個模組隔離的電堆數 ≥ trigger 才排維修。維修時只換「已隔離＋剩餘裕度 < θ」的電堆。
   - 熱箱內換堆仍需降溫，所以維修時整個模組停機（不假設能熱抽換）。

所有架構：每次開熱箱維修，未更換的電堆都承受一次熱循環懲罰（thermal_cycle_penalty）。

R  RAIBA 完整版：
   - R-lite ＋ 劣化感知的經濟調度（degradation-aware economic dispatch）。
   - 每個時步解：min Σ [ c_ASR·dASR_i/dt + c_fuel·j_i ]  s.t. Σ p_i = P_target
     c_ASR = 換堆成本 / ASR 裕度，也就是每消耗 1 單位 ASR 裕度的成本。
   - 一階條件：c_ASR·∂rate_i/∂j + c_f = λ·∂p_i/∂j，對 λ 做二分搜尋。
   - 劣化快（m_i 大）或 ASR 高的電堆自動分到較少功率。

輸出：LCOE、可用率、每 GW-yr 換堆數、每個電堆的全壽命交付能量（RAIBA 北極星指標）。
"""
from dataclasses import dataclass
import numpy as np

from .params import Params, V_LHV_CH4
from .cell import j_for_power, power_at_j, asr_rate, asr_eol_from_v


@dataclass
class FleetResult:
    arch: str
    lcoe: float
    lcoe_capex: float
    lcoe_fuel: float
    lcoe_repl: float
    lcoe_fom: float
    availability: float
    eta_net_avg: float
    stacks_replaced_per_GWyr: float
    energy_per_stack_MWh: float
    service_events_per_module_yr: float


def _waterfill(caps, total):
    """平均分配 total 給各單元，每個單元上限 caps。回傳分配量。"""
    caps = np.asarray(caps, float)
    if caps.size == 0:
        return caps
    if caps.sum() <= total:
        return caps.copy()
    s = np.sort(caps)
    n = s.size
    csum = np.concatenate([[0.0], np.cumsum(s)])
    # 找 level L：Σ min(caps, L) = total
    for i in range(n):
        L = (total - csum[i]) / (n - i)
        if L <= s[i]:
            return np.minimum(caps, L)
    return caps.copy()


def _econ_dispatch(ASR, m, active, P_target, p: Params, c_asr, c_f, jmin, jcap):
    """劣化感知經濟調度。回傳每個電堆的電流密度 j（非 active 為 0）。"""
    a, jr, n, E0 = p.a_deg_per_h, p.j_ref, p.n_deg, p.E0
    A_s = p.stack_area_cm2
    A_ = ASR[active]
    m_ = m[active]
    jc = jcap[active]

    def j_of_lambda(lam):
        if abs(n - 1.0) < 1e-9:
            j = (E0 - (c_asr * a * m_ / jr + c_f) / lam) / (2 * A_)
        elif abs(n - 2.0) < 1e-9:
            j = (lam * E0 - c_f) / (2 * c_asr * a * m_ / jr**2 + 2 * lam * A_)
        else:   # 一般 n ≥ 1：g(j) 單調遞增，內層二分搜尋
            lo = np.zeros_like(A_)
            hi = jc.copy()
            for _ in range(40):
                mid = 0.5 * (lo + hi)
                g = c_asr * a * m_ * n * np.power(np.maximum(mid, 1e-12), n - 1) / jr**n + c_f \
                    - lam * (E0 - 2 * A_ * mid)
                hi = np.where(g > 0, mid, hi)
                lo = np.where(g > 0, lo, mid)
            j = 0.5 * (lo + hi)
        return np.clip(j, jmin, jc)

    lo, hi = 1e-9, 1e3
    for _ in range(60):
        lam = (lo * hi) ** 0.5
        Ptot = (power_at_j(j_of_lambda(lam), A_, E0) * A_s).sum()
        if Ptot < P_target:
            lo = lam
        else:
            hi = lam
    out = np.zeros_like(ASR)
    out[active] = j_of_lambda((lo * hi) ** 0.5)
    return out


def simulate(p: Params, j0: float, arch: str, n_modules: int = 100, seed: int = 0,
             raiba_cost: bool = True) -> FleetResult:
    rng = np.random.default_rng(seed)
    S = p.stacks_per_module
    N = n_modules * S
    A_s = p.stack_area_cm2
    mod = np.repeat(np.arange(n_modules), S)

    is_raiba = arch in ("R", "R-lite")
    extra_loss = p.raiba_extra_loss if (is_raiba and raiba_cost) else 0.0
    eta_net = (p.eta_pe - extra_loss) * (1 - p.f_parasitic)

    V0 = p.E0 - p.ASR0 * j0
    p0 = j0 * V0
    ASR_eol = asr_eol_from_v(p0, p.E0, V0, p.delta_EOL)
    P_target = p0 * A_s * N                     # 區塊 DC 目標（W）
    p_cap_unit = (1 + p.pe_headroom) * p0       # 單元功率上限（W/cm²）
    P_net_kW_block = P_target * eta_net / 1000.0

    # 抽樣
    def sample(k):
        z1, z2 = rng.standard_normal(k), rng.standard_normal(k)
        m_ = np.exp(p.m_sigma * z1 - 0.5 * p.m_sigma**2)
        a_ = p.ASR0 * np.maximum(1 + p.asr0_cv * z2, 0.5)
        return m_, a_

    m, ASR = sample(N)
    failed = np.zeros(N, bool)      # 突發故障
    isolated = np.zeros(N, bool)    # 已隔離（故障或 EOL）
    svc_left = np.zeros(n_modules, int)   # 模組維修剩餘月數
    svc_pending = np.zeros(n_modules, bool)

    area_total = A_s * N
    capex = p.capex_fixed_per_kWnet * P_net_kW_block \
        + (p.stack_cost_per_cm2 + p.module_cost_per_cm2) * area_total
    if is_raiba and raiba_cost:
        capex += p.raiba_extra_capex_per_kWnom * p.p_nom * area_total / 1000.0
    stack_repl_cost = A_s * p.stack_cost_per_cm2 * p.stack_replace_mult
    c_asr = stack_repl_cost / A_s / (ASR_eol - p.ASR0)     # $/(Ω·cm²)/cm²
    c_f = p.fuel_cost_per_A_h                              # $/(A·h)

    n_steps = int(round(p.plant_life_yr * 8760 / p.dt_h))
    op_h = p.dt_h * p.dispatch_factor
    p_fail = 1 - np.exp(-p.fail_rate_per_stack_yr * p.dt_h / 8760)

    pv = dict(fuel=0.0, repl=0.0, fom=0.0, energy=0.0)
    fuel_kWh = 0.0
    e_net_kWh = 0.0
    e_target_kWh = 0.0
    e_dc_Wh = 0.0
    n_replaced = 0
    n_service = 0

    for t in range(n_steps):
        df = (1 + p.discount_rate) ** (-(t + 0.5) * p.dt_h / 8760)

        # ---- 模組維修進度 ----
        finishing = svc_left == 1
        svc_left = np.maximum(svc_left - 1, 0)
        if finishing.any():
            for mi in np.where(finishing)[0]:
                idx = np.where(mod == mi)[0]
                if arch == "A":
                    repl = idx
                elif arch == "A-sel":
                    margin = (ASR_eol - ASR[idx]) / (ASR_eol - p.ASR0)
                    repl = idx[failed[idx] | (ASR[idx] >= ASR_eol) | (margin < p.raiba_opportunistic_margin)]
                else:
                    margin = (ASR_eol - ASR[idx]) / (ASR_eol - p.ASR0)
                    repl = idx[isolated[idx] | (margin < p.raiba_opportunistic_margin)]
                # 熱循環懲罰：沒換的電堆也經歷了一次降溫／升溫
                keep = np.setdiff1d(idx, repl)
                ASR[keep] += p.thermal_cycle_penalty * (ASR_eol - p.ASR0)
                if repl.size:
                    m[repl], ASR[repl] = sample(repl.size)
                    failed[repl] = False
                    isolated[repl] = False
                    pv["repl"] += repl.size * stack_repl_cost * df
                    n_replaced += repl.size
                pv["repl"] += p.module_service_cost * df
                n_service += 1
                svc_pending[mi] = False

        in_svc = np.repeat(svc_left > 0, S)

        # ---- 調度 ----
        j = np.zeros(N)
        jcap_stack = np.minimum(p.j_max, p.E0 / (2 * ASR))
        # 電力電子功率上限：(1+h)·p0
        j_pe = j_for_power(p_cap_unit, ASR, p.E0)
        jcap_stack = np.where(np.isnan(j_pe), jcap_stack, np.minimum(jcap_stack, j_pe))
        if arch in ("A", "A-sel"):
            mod_bad = np.zeros(n_modules, bool)
            np.logical_or.at(mod_bad, mod, failed | (ASR >= ASR_eol))
            online = (~mod_bad) & (svc_left == 0)
            sumASR = np.bincount(mod, weights=ASR, minlength=n_modules)
            jcap_m = np.minimum(p.j_max, S * p.E0 / (2 * sumASR))
            jcap_m = np.maximum(jcap_m, p.j_min_thermal)
            Pcap_m = A_s * jcap_m * (S * p.E0 - sumASR * jcap_m)
            Pcap_m = np.minimum(Pcap_m, p_cap_unit * A_s * S)
            Pmin_m = A_s * p.j_min_thermal * (S * p.E0 - sumASR * p.j_min_thermal)
            alloc = np.zeros(n_modules)
            on = np.where(online)[0]
            if on.size:
                alloc[on] = _waterfill(Pcap_m[on], P_target)
                alloc[on] = np.maximum(alloc[on], Pmin_m[on])
                # 串聯電流：A_s ΣASR j² − S E0 A_s j + P = 0
                disc = (S * p.E0) ** 2 - 4 * sumASR[on] * alloc[on] / A_s
                jm = (S * p.E0 - np.sqrt(np.maximum(disc, 0))) / (2 * sumASR[on])
                jm_full = np.zeros(n_modules)
                jm_full[on] = jm
                j = jm_full[mod]
        else:
            active = (~isolated) & (~in_svc)
            if active.any():
                if arch == "R-lite":
                    caps = power_at_j(jcap_stack[active], ASR[active], p.E0) * A_s
                    pa = _waterfill(caps, P_target)
                    pmin = power_at_j(p.j_min_thermal, ASR[active], p.E0) * A_s
                    pa = np.maximum(pa, pmin)
                    jj = j_for_power(pa / A_s, ASR[active], p.E0)
                    j[active] = np.nan_to_num(jj, nan=0.0)
                else:
                    j = _econ_dispatch(ASR, m, active, P_target, p, c_asr, c_f,
                                       p.j_min_thermal, jcap_stack)

        P_dc = (power_at_j(j, ASR, p.E0) * A_s).sum()
        P_deliv = min(P_dc, P_target)
        amp_h = (j * A_s).sum() * op_h
        pv["fuel"] += amp_h * c_f * df
        fuel_kWh += amp_h * V_LHV_CH4 / p.U_f / 1000.0
        e_net = P_deliv * eta_net / 1000.0 * op_h
        e_net_kWh += e_net
        e_target_kWh += P_net_kW_block * op_h
        e_dc_Wh += P_dc * op_h
        pv["energy"] += e_net * df
        pv["fom"] += p.fom_per_kW_yr * P_net_kW_block * p.dt_h / 8760 * df

        # ---- 劣化 ----
        running = j > 0
        ASR = ASR + np.where(running, asr_rate(j, m, p.a_deg_per_h, p.j_ref, p.n_deg) * op_h, 0.0)

        # ---- 突發故障與 EOL ----
        new_fail = running & (rng.random(N) < p_fail)
        failed |= new_fail
        eol = ASR >= ASR_eol
        if arch in ("A", "A-sel"):
            bad = np.zeros(n_modules, bool)
            np.logical_or.at(bad, mod, failed | eol)
            start = bad & (svc_left == 0)
            svc_left[start] = p.module_service_months + 1   # 下一步開始算停機
        else:
            isolated |= failed | eol
            cnt = np.bincount(mod, weights=isolated.astype(float), minlength=n_modules)
            start = (cnt >= p.raiba_service_trigger) & (svc_left == 0)
            svc_left[start] = p.module_service_months + 1

    # 殘值
    df_end = (1 + p.discount_rate) ** (-p.plant_life_yr)
    margin = np.clip((ASR_eol - ASR) / (ASR_eol - p.ASR0), 0, 1)
    margin[isolated] = 0.0
    pv["repl"] -= (margin * stack_repl_cost).sum() * df_end

    to = 1000.0 / pv["energy"]
    lc = dict(capex=capex * to, fuel=pv["fuel"] * to, repl=pv["repl"] * to, fom=pv["fom"] * to)
    years = p.plant_life_yr
    GW = P_net_kW_block / 1e6
    return FleetResult(
        arch=arch,
        lcoe=sum(lc.values()),
        lcoe_capex=lc["capex"], lcoe_fuel=lc["fuel"], lcoe_repl=lc["repl"], lcoe_fom=lc["fom"],
        availability=e_net_kWh / e_target_kWh,
        eta_net_avg=e_net_kWh / fuel_kWh,
        stacks_replaced_per_GWyr=n_replaced / years / GW,
        energy_per_stack_MWh=e_dc_Wh / 1e6 / (N + n_replaced),
        service_events_per_module_yr=n_service / years / n_modules,
    )


def run_seeds(p: Params, j0: float, arch: str, seeds=(0, 1, 2), **kw):
    rs = [simulate(p, j0, arch, seed=s, **kw) for s in seeds]
    keys = [k for k in FleetResult.__dataclass_fields__ if k != "arch"]
    mean = {k: float(np.mean([getattr(r, k) for r in rs])) for k in keys}
    std = {k: float(np.std([getattr(r, k) for r in rs])) for k in keys}
    return mean, std
