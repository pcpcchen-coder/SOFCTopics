"""電池電化學與劣化函式（線性極化近似，皆可向量化）。"""
import numpy as np


def j_for_power(p, ASR, E0):
    """給定面積功率 p (W/cm²) 與 ASR，求電流密度 j（取低電流的那個根）。
    p = j (E0 - ASR j)  →  ASR j² - E0 j + p = 0
    不可行（p > E0²/4ASR）時回傳 nan。
    """
    disc = E0 * E0 - 4.0 * ASR * p
    with np.errstate(invalid="ignore"):
        j = (E0 - np.sqrt(disc)) / (2.0 * ASR)
    return np.where(disc >= 0, j, np.nan)


def power_at_j(j, ASR, E0):
    return j * (E0 - ASR * j)


def voltage(j, ASR, E0):
    return E0 - ASR * j


def asr_rate(j, m, a, j_ref, n):
    """dASR/dt（Ω·cm²/h）。m 為個別電堆的劣化倍率。"""
    return a * m * np.power(np.maximum(j, 0.0) / j_ref, n)


def asr_eol_from_v(p0, E0, V_bol, delta):
    """EOL 的 ASR：在設計功率密度 p0 下，電壓降到 (1-δ)·V_BOL 時的 ASR。"""
    V_eol = (1.0 - delta) * V_bol
    j_eol = p0 / V_eol
    return (E0 - V_eol) / j_eol
