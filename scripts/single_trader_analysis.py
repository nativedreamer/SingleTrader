#!/usr/bin/env python3
"""
SingleTrader BTC/USD Analysis Script — Leo 2:1 Strategy
Direct implementation of the Pine Script quantitative strategy for Python.
Computes verified signals from live market candles and pushes them via POST /api/signal.

Usage:
    python scripts/single_trader_analysis.py
    python scripts/single_trader_analysis.py --endpoint https://fluffy-guide-murex.vercel.app/api/signal
    python scripts/single_trader_analysis.py --twelvedata YOUR_KEY
"""

import argparse
import datetime
import json
import math
import sys
import urllib.request
import urllib.error

def fetch_klines(symbol="BTCUSDT", interval="15m", limit=100, twelvedata_key=None):
    if twelvedata_key:
        td_interval = "15min" if interval == "15m" else interval
        url = f"https://api.twelvedata.com/time_series?symbol=BTC/USD&interval={td_interval}&outputsize={limit}&apikey={twelvedata_key}"
        req = urllib.request.Request(url, headers={"User-Agent": "SingleTrader/1.0"})
        with urllib.request.urlopen(req) as resp:
            data = json.loads(resp.read().decode())
            if "values" in data:
                candles = []
                for v in reversed(data["values"]):
                    candles.append({
                        "time": v["datetime"],
                        "open": float(v["open"]),
                        "high": float(v["high"]),
                        "low": float(v["low"]),
                        "close": float(v["close"]),
                        "volume": float(v.get("volume", 0)),
                    })
                return candles

    # Public Binance live BTC/USDT spot candles
    url = f"https://api.binance.com/api/v3/klines?symbol={symbol}&interval={interval}&limit={limit}"
    req = urllib.request.Request(url, headers={"User-Agent": "SingleTrader/1.0"})
    with urllib.request.urlopen(req) as resp:
        raw = json.loads(resp.read().decode())
        candles = []
        for item in raw:
            candles.append({
                "time": item[0],
                "open": float(item[1]),
                "high": float(item[2]),
                "low": float(item[3]),
                "close": float(item[4]),
                "volume": float(item[5]),
            })
        return candles

def calc_ema(values, length):
    ema = []
    k = 2.0 / (length + 1)
    for i, val in enumerate(values):
        if i == 0:
            ema.append(val)
        else:
            ema.append(val * k + ema[-1] * (1 - k))
    return ema

def calc_atr(candles, length=14):
    trs = []
    for i in range(len(candles)):
        c = candles[i]
        if i == 0:
            trs.append(c["high"] - c["low"])
        else:
            prev_close = candles[i-1]["close"]
            tr = max(c["high"] - c["low"], abs(c["high"] - prev_close), abs(c["low"] - prev_close))
            trs.append(tr)
    # Wilder's smoothing
    atr = [sum(trs[:length]) / length]
    for i in range(length, len(trs)):
        atr.append((atr[-1] * (length - 1) + trs[i]) / length)
    pad = [atr[0]] * (len(candles) - len(atr))
    return pad + atr

def calc_supertrend(candles, factor=5.0, atr_period=10):
    atr = calc_atr(candles, atr_period)
    upper_band = []
    lower_band = []
    st = []
    direction = []

    for i in range(len(candles)):
        c = candles[i]
        hl2 = (c["high"] + c["low"]) / 2.0
        cur_atr = atr[i]
        basic_upper = hl2 + factor * cur_atr
        basic_lower = hl2 - factor * cur_atr

        if i == 0:
            upper_band.append(basic_upper)
            lower_band.append(basic_lower)
            st.append(basic_lower)
            direction.append(1)
        else:
            prev_close = candles[i-1]["close"]
            prev_lower = lower_band[-1]
            prev_upper = upper_band[-1]

            cur_lower = basic_lower if (basic_lower > prev_lower or prev_close < prev_lower) else prev_lower
            cur_upper = basic_upper if (basic_upper < prev_upper or prev_close > prev_upper) else prev_upper
            lower_band.append(cur_lower)
            upper_band.append(cur_upper)

            prev_st = st[-1]
            if prev_st == prev_upper:
                dir_val = -1 if c["close"] <= cur_upper else 1
            else:
                dir_val = 1 if c["close"] >= cur_lower else -1

            direction.append(dir_val)
            st.append(cur_lower if dir_val == 1 else cur_upper)

    return st, direction

def analyze_and_push(endpoint="http://localhost:3000/api/signal", twelvedata_key=None):
    print(f"[*] Fetching live BTC/USD market candles...")
    candles = fetch_klines(twelvedata_key=twelvedata_key)
    closes = [c["close"] for c in candles]
    cur_close = closes[-1]

    # Calculate Pine Script indicators
    atr = calc_atr(candles, 14)[-1]
    ema200 = calc_ema(closes, 200)[-1]
    ema150 = calc_ema(closes, 150)[-1]
    ema250 = calc_ema(closes, 250)[-1]
    st, direction = calc_supertrend(candles, factor=5.0, atr_period=10)

    cur_dir = direction[-1]
    cur_st = st[-1]

    # Action determination
    action = "BUY" if cur_dir == 1 else "SELL"
    is_strong = (cur_close > ema200) if action == "BUY" else (cur_close < ema200)

    # Risk-Reward 2:1 dynamic targets (Pine Script exact formula)
    atr_band = atr * 2.2
    if action == "BUY":
        sl = round(cur_close - atr_band, 2)
        risk = cur_close - sl
        tp1 = round(cur_close + risk * 1.0, 2)
        tp2 = round(cur_close + risk * 2.0, 2) # Primary Leo target
    else:
        sl = round(cur_close + atr_band, 2)
        risk = sl - cur_close
        tp1 = round(cur_close - risk * 1.0, 2)
        tp2 = round(cur_close - risk * 2.0, 2)

    confidence = 80
    if action == "BUY" and ema150 > ema250:
        confidence += 8
    elif action == "SELL" and ema150 < ema250:
        confidence += 8
    if is_strong:
        confidence += 5

    signal_payload = {
        "symbol": "BTCUSD",
        "action": action,
        "price": round(cur_close, 2),
        "tp1": tp1,
        "tp2": tp2,
        "sl": sl,
        "confidence": min(95, confidence),
        "timestamp": datetime.datetime.utcnow().isoformat() + "Z",
        "indicators": {
            "atr": round(atr, 2),
            "supertrend": round(cur_st, 2),
            "ema200": round(ema200, 2),
            "ema150": round(ema150, 2),
            "ema250": round(ema250, 2),
            "strategy": "Leo_2to1_PineScript",
            "is_strong": is_strong
        }
    }

    print(f"[+] Computed Signal:")
    print(json.dumps(signal_payload, indent=2))

    print(f"[*] Posting signal to hook: {endpoint}")
    data_bytes = json.dumps(signal_payload).encode("utf-8")
    req = urllib.request.Request(
        endpoint,
        data=data_bytes,
        headers={"Content-Type": "application/json", "User-Agent": "SingleTraderPython/1.0"}
    )

    try:
        with urllib.request.urlopen(req) as resp:
            res_body = resp.read().decode()
            print(f"[✓] Signal pushed successfully! Response: {res_body}")
    except urllib.error.URLError as e:
        print(f"[!] Push failed: {e}. Note: Dev server or Vercel URL must be running and accessible.")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="SingleTrader BTC/USD Analysis Script")
    parser.add_argument("--endpoint", default="http://localhost:3000/api/signal", help="Signal webhook endpoint")
    parser.add_argument("--twelvedata", default=None, help="Twelve Data API Key")
    args = parser.parse_args()

    analyze_and_push(endpoint=args.endpoint, twelvedata_key=args.twelvedata)
