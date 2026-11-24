"""開箱代價的量化：把「每次開熱箱」拆成三項，換算成美元，並接回機隊模型。

每次開箱總代價 = 直接成本 + 熱循環傷害 + 停機損失

  1. 直接成本：人工、吊裝、耗材（module_service_cost）
  2. 熱循環傷害：每個「沒被換掉」的電堆都經歷一次室溫↔操作溫度循環，
     消耗一部分壽命裕度。換算成美元 = 消耗的裕度比例 × 換堆成本 × 電堆數。
     若循環造成洩漏或破裂，該電堆要提前更換（以失效機率計）。
  3. 停機損失：模組離線期間少發的電（上限值：沒有備用容量時）。
     有超額配置時，其他模組可以接手，實際損失較小，但它們會跑得更辛苦。

換算關係（線性極化）：
  電壓損失 v（比例）→ ΔASR = v·V0 / j0
  佔 EOL 裕度比例 = ΔASR / (ASR_eol − ASR0)
"""
from dataclasses import replace

from .params import Params
from .cell import asr_eol_from_v


def margin_info(p: Params, j0: float, delta: float):
    V0 = p.E0 - p.ASR0 * j0
    p0 = j0 * V0
    asr_eol = asr_eol_from_v(p0, p.E0, V0, delta)
    return V0, p0, asr_eol - p.ASR0


def penalty_from_voltage_loss(p: Params, j0: float, delta: float, v_loss_frac: float) -> float:
    """每次熱循環電壓損失（比例）→ 消耗的 EOL 裕度比例（即 thermal_cycle_penalty）。"""
    V0, _, margin = margin_info(p, j0, delta)
    return (v_loss_frac * V0 / j0) / margin


def cost_per_opening(p: Params, j0: float, delta: float, v_loss_frac: float, p_leak: float,
                     direct_cost: float, downtime_days: float, power_price_per_MWh: float = 60.0,
                     n_replaced: int = 3):
    """單次開箱的代價拆解（$）。n_replaced：這次開箱換掉的電堆數，其餘電堆承受熱循環。"""
    V0, p0, _ = margin_info(p, j0, delta)
    stack_kW = p0 * p.stack_area_cm2 / 1000.0
    stack_repl = p.stack_cost_per_kWnom * p.p_nom * p.stack_area_cm2 / 1000.0 * p.stack_replace_mult
    S = p.stacks_per_module
    survivors = max(S - n_replaced, 0)
    pen = penalty_from_voltage_loss(p, j0, delta, v_loss_frac)
    thermal = survivors * (pen * stack_repl + p_leak * stack_repl)
    module_MW = stack_kW * S / 1000.0
    downtime = module_MW * 24 * downtime_days * power_price_per_MWh
    return {
        "stack_kW": stack_kW, "stack_repl_cost": stack_repl, "penalty_margin_frac": pen,
        "direct": direct_cost, "thermal": thermal, "downtime_upper": downtime,
        "total_with_downtime": direct_cost + thermal + downtime,
        "total_no_downtime": direct_cost + thermal,
    }


def scenario_params(p: Params, j0: float, delta: float, v_loss_frac: float, p_leak: float,
                    direct_cost: float, downtime_days: float) -> Params:
    """把文獻情境轉成機隊模型參數。洩漏機率以等效裕度消耗計入（洩漏 = 整個裕度歸零）。"""
    pen = penalty_from_voltage_loss(p, j0, delta, v_loss_frac) + p_leak
    months = max(1, int(round(downtime_days / 30.0)))
    return replace(p, thermal_cycle_penalty=pen, module_service_cost=direct_cost,
                   module_service_months=months, delta_EOL=delta)
