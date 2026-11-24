"""SOFC GW 電廠 LCOE + 劣化模型的參數。

每個參數都標出 evidence layer：
  [外部]  有外部出處（見 docs/sources/），附來源
  [假說]  本專案的工程假說，沒有可靠出處，必須做敏感度分析
  [未知]  目前沒有數據，給的是佔位值

所有參數集中在這裡。改完後重跑 run_all.py。
"""
from dataclasses import dataclass, field, replace

# 物理常數
F = 96485.0                      # C/mol
# CH4 LHV 802.3 kJ/mol，完全氧化 8 個電子 → 等效電壓 802300/(8F) = 1.039 V
# 意思是：每 1 A 電流需要 1.039 W（LHV）的燃料，再除以燃料利用率 U_f
V_LHV_CH4 = 802300.0 / (8 * F)   # ≈ 1.039 V
KWH_TO_MMBTU = 0.003412          # 1 kWh = 3412 Btu


@dataclass
class Params:
    # ---------------- 電廠 ----------------
    P_net_MW: float = 1000.0          # 淨輸出 [題目設定]
    plant_life_yr: float = 25.0       # [假說]，常見 20–30 年
    discount_rate: float = 0.08       # [假說]；EIA AEO2026 WACC 7.27%，Wei 2026 用 5%
    dispatch_factor: float = 0.92     # 調度因數：可用時有多少比例在發電 [假說]，基載
    dt_h: float = 730.0               # 時間步長 = 1 個月

    # ---------------- 電池電化學（線性極化近似） ----------------
    # V = E0 - ASR * j
    E0: float = 1.00                  # 有效開路電壓（含燃料利用的 Nernst 平均）[假說]
    # ASR0 由 NETL 2022 標稱點反推：0.8 V @ 0.4 A/cm² → (1.0-0.8)/0.4 = 0.5 [外部＋假說 E0]
    ASR0: float = 0.50                # BOL 面積比電阻 Ω·cm²
    U_f: float = 0.85                 # 系統燃料利用率（含陽極再循環）[假說]
    eta_pe: float = 0.97              # DC→AC 電力電子效率 [假說]
    f_parasitic: float = 0.05         # BoP 寄生耗電佔 DC 毛輸出比例 [假說]

    j_nom: float = 0.40               # 額定電流密度 A/cm²（k=0 基準）[外部：NETL 2022 標稱 400 mA/cm²]
    j_max: float = 0.90               # 電流密度上限（燃料匱乏／熱應力）[假說]
    pe_headroom: float = 0.10         # 電力電子額定 = 設計功率 × (1+10%)，限制單元最大出力 [假說]
    j_min_thermal: float = 0.15       # 熱自持下限：太低則電堆發熱不足以維持溫度 [未知]

    # ---------------- 劣化 ----------------
    # dASR/dt = a * m_i * (j/j_ref)^n
    # a 由「在 j_ref、BOL、定電流下，電壓劣化 d_ref %/kh」換算
    # [外部] NETL 2022 NGFC 報告 0.2%/kh；Ceres <0.2%/kh；Jülich 100kh 平均 0.5%/kh；DOE 系統現況 1–1.5%/kh
    d_ref_pct_per_kh: float = 0.20
    j_ref: float = 0.40               # 劣化率的參考電流密度
    n_deg: float = 1.0                # ASR 增長率對電流密度的指數 [假說；文獻無通用式，Hagen 2006 vs Jülich 2020 結論相反]
    delta_EOL: float = 0.15           # EOL：電壓（=效率）比 BOL 下降 15% [假說，會掃描]
    delta_max: float = 0.25           # δ 的實務上限（電壓太低→發熱與冷卻空氣需求過大）[假說]

    # 校準（預設關閉，改用 NETL 的 d_ref）：反推 d_ref，使 j_nom、δ=calib_delta 下壽命 = calib_life_yr
    # 錨點可選：Wei 2026 的 5 年、Bloom 2018+ 批次 ≥5 年、NETL 2022 的 7.3 年 [外部]
    calibrate: bool = False
    calib_life_yr: float = 5.0
    calib_delta: float = 0.15

    # ---------------- 幾何 ----------------
    cell_area_cm2: float = 550.0      # [外部：NETL 2022]
    cells_per_stack: int = 100        # [外部：NETL 2022，17.6 kW DC/stack]
    stacks_per_module: int = 20       # 一個熱箱裡的電堆數 [假說；NETL 模組 64 堆，Bloom PM 約 50 kW]

    # ---------------- 成本 ----------------
    # 資本支出分兩部分：
    #  (1) 跟淨容量成正比：併網、燃氣處理、廠房、電廠級變流器、控制
    #  (2) 跟電池面積成正比（超額配置會放大）：電堆、熱箱、模組 BoP
    # 都以「額定 kW」(j_nom 下的功率) 計價
    # 基準情境：k=0 時合計 $2,000/kW（介於 DOE 目標 $900 與 Bloom 案例推算的約 $5,700 之間）[假說]
    capex_fixed_per_kWnet: float = 1000.0    # $/kW_net [假說]
    stack_cost_per_kWnom: float = 225.0      # $/kW_nom [外部：NETL 2022 / DOE 目標]
    module_cost_per_kWnom: float = 775.0     # 熱箱＋模組 BoP，$/kW_nom [假說]
    stack_replace_mult: float = 1.2          # 換堆成本 = 電堆成本 × 1.2（含安裝）[假說]
    fom_per_kW_yr: float = 30.0              # 固定 O&M $/kW-yr（不含換堆）[假說]
    gas_price_per_MMBtu: float = 3.85        # [外部：EIA STEO 2026-11，2025 發電用天然氣]

    # ---------------- 機隊模型（異質性、故障、維修） ----------------
    m_sigma: float = 0.30            # 各電堆劣化速率倍率的 lognormal σ [假說]
    asr0_cv: float = 0.05            # 各電堆 BOL ASR 的變異係數 [假說]
    fail_rate_per_stack_yr: float = 0.01   # 電堆突發故障率 [未知]
    module_service_months: int = 1         # 模組維修停機（降溫、換堆、升溫）[假說]
    module_service_cost: float = 20000.0   # 每次開熱箱的人工、吊裝、耗材 $（模組約 350 kW）[假說]
    # 熱循環懲罰：模組維修要降溫再升溫，未更換的電堆每經歷一次熱循環，
    # ASR 增加「EOL 裕度 × 此比例」。換算見 service_cost.py：在 j0=0.31、δ=25% 下，
    # 0.02 ≈ 每次循環電壓損失 0.28%；1% 電壓損失 ≈ 0.071 [文獻範圍見 docs/sources/THERMAL_CYCLING_*]
    thermal_cycle_penalty: float = 0.02

    # ---------------- RAIBA 增量 ----------------
    raiba_extra_capex_per_kWnom: float = 50.0  # 電堆級 DC/DC 相對於模組級的增量成本 [假說]
    raiba_extra_loss: float = 0.005            # 額外轉換損失（絕對效率點）[假說]
    raiba_service_trigger: int = 3             # 一個模組隔離幾個電堆就排維修 [假說]
    raiba_opportunistic_margin: float = 0.30   # 維修時順便換掉剩餘裕度 < 30% 的電堆 [假說]

    # ---------------- 衍生量 ----------------
    @property
    def stack_area_cm2(self) -> float:
        return self.cell_area_cm2 * self.cells_per_stack

    @property
    def p_nom(self) -> float:                 # W/cm² at j_nom, BOL
        return self.j_nom * (self.E0 - self.ASR0 * self.j_nom)

    @property
    def stack_cost_per_cm2(self) -> float:
        return self.stack_cost_per_kWnom * self.p_nom / 1000.0

    @property
    def module_cost_per_cm2(self) -> float:
        return self.module_cost_per_kWnom * self.p_nom / 1000.0

    @property
    def a_deg_per_h(self) -> float:
        """ASR 增長係數 a（Ω·cm²/h）。
        定電流 j_ref 下 dV/dt = -j_ref * dASR/dt = -(d_ref/100) * V_ref / 1000h
        """
        V_ref = self.E0 - self.ASR0 * self.j_ref
        return (self.d_ref_pct_per_kh / 100.0) * V_ref / self.j_ref / 1000.0

    @property
    def fuel_cost_per_A_h(self) -> float:
        """每 1 A·h 電流的燃料成本（$）。"""
        kWh_fuel = V_LHV_CH4 / self.U_f / 1000.0
        return kWh_fuel * KWH_TO_MMBTU * self.gas_price_per_MMBtu

    def P_dc_W(self, extra_loss: float = 0.0) -> float:
        """要達到 P_net 需要的 DC 毛輸出（W）。"""
        return self.P_net_MW * 1e6 / ((self.eta_pe - extra_loss) * (1 - self.f_parasitic))


# 資本支出情境（k=0 時的合計 $/kW）
CAPEX_SCENARIOS = {
    # DOE/NETL 2025–2030 目標：系統 $900/kWe、堆疊 $225/kW [外部]；拆分方式 [假說]
    "DOE 目標 $900/kW": dict(capex_fixed_per_kWnet=375.0, stack_cost_per_kWnom=225.0, module_cost_per_kWnom=300.0),
    "基準 $2,000/kW": dict(capex_fixed_per_kWnet=1000.0, stack_cost_per_kWnom=225.0, module_cost_per_kWnom=775.0),
    # AEP–Google 702 MW / $4B ≈ $5,700/kW（含碳捕集與 BoP）[假說：推算]
    "現況推算 $5,000/kW": dict(capex_fixed_per_kWnet=2000.0, stack_cost_per_kWnom=900.0, module_cost_per_kWnom=2100.0),
}


@dataclass
class NGCC:
    """新建 NGCC 比較基準。"""
    capex_per_kW: float = 1800.0       # [外部] Lazard LCOE+ 2026：$1,450–2,100/kW，取中間
    efficiency_lhv: float = 0.58       # [外部＋換算] Lazard 熱耗率 6,475–6,550 Btu/kWh (HHV) ≈ 58% LHV
    capacity_factor: float = 0.85      # [假說] 基載；Lazard 範圍 30–90%
    fom_per_kW_yr: float = 15.0        # [假說]
    vom_per_MWh: float = 3.5           # [假說]
    life_yr: float = 30.0              # [假說]


def with_(p: Params, **kw) -> Params:
    return replace(p, **kw)
