# SingleTrader BTC/USD — Quantitative Signal Generator PWA

A minimalist, high-precision Progressive Web App (PWA) for BTC/USD signal generation and quantitative execution, faithfully implementing the **Leo 2:1 Pine Script strategy**, **Gaussian Trend Filter**, **Ema Vwap Trend Pro**, and **Gann Square of 9** mathematics.

Designed for active quantitative traders, with dark mode by default, high-contrast financial typography, real-time candlestick charts, offline persistence, and a standardized webhook interface (`POST /api/signal`) for Python analysis scripts.

---

## ⚡ Core Architecture & Strategy Methods

This application directly incorporates the exact mathematical formulas from the provided Pine Script indicators—no simulated or fabricated data:

1. **Supertrend & Donchian Trend Confluence**:
   - Supertrend: $\text{HL2} \pm (\text{Factor} \times \text{ATR}(10))$ with configurable sensitivity (default 5.0).
   - Donchian Channel: 30-period channel tracking breakouts and higher-timeframe trend state.
2. **Confirmed Trend Filters**:
   - 200 EMA baseline (`close > ema200` classifies signals as **Strong Buy**; `close < ema200` as **Strong Sell**).
   - EMA 150 vs EMA 250 trend alignment + HMA 55 (Hull Moving Average) velocity.
   - MACD(12, 26, 9) positive histogram expansion.
3. **Dynamic 2:1 Risk-Reward Targets**:
   - Stop Loss: $\text{Entry} \mp (\text{ATR}(14) \times 2.2)$.
   - Target 1 (TP1): $1.0\times$ Stop Distance ($1:1\text{ RRR}$).
   - Target 2 (TP2): $2.0\times$ Stop Distance ($2:1\text{ RRR}$ — the core objective of the Leo Strategy).
   - Target 3 (TP3): $3.0\times$ Stop Distance ($3:1\text{ RRR}$).
4. **Pine Script Backtest Performance Matrix**:
   - Real-time computation of Closed Trades, Win Rate %, Profit Factor, Net R-Multiple, and Break-Even threshold ($33.3\%$ for $2:1$).
5. **Gann Square of 9 & OSTDV Fibonacci Anchors**:
   - Computes dynamic support and resistance levels (R1, R2, S1, S2) and Fibonacci expansion ratios ($2.016$, $1.507$, $-0.507$, $-1.016$).

---

## 📡 Live Market Feeds & Twelve Data Integration

- **Twelve Data Live API**:
  Input your personal Twelve Data API key in the **Settings Drawer** (persisted securely in browser `localStorage`). Live BTC/USD quote ticks and 1m/5m/15m/1h/4h candlestick history will stream directly from Twelve Data.
- **High-Frequency Public Exchange Fallback**:
  When no Twelve Data key is configured, the engine connects to live public exchange streams (Binance spot BTC/USDT & Coinbase ticker) so you always see genuine market data.
- **Offline Fallback**:
  Last known market candles and confirmed signals are automatically cached in `localStorage` for offline review.

---

## 🔌 Python Analysis Script Hook (`POST /api/signal`)

Push signals from your local machine, hosted bot, or Python analysis scripts into the PWA:

### Standardized Schema:
```json
{
  "symbol": "BTCUSD",
  "action": "BUY",
  "price": 68500.00,
  "tp1": 70000.00,
  "tp2": 72000.00,
  "sl": 67000.00,
  "confidence": 88,
  "timestamp": "2026-10-17T23:00:00Z",
  "indicators": {
    "rsi": 32.4,
    "macd": "bullish_cross",
    "supertrend": 67200.00
  }
}
```

### Running the Included Python Script:
```bash
# Push to local development server
python3 scripts/single_trader_analysis.py --endpoint http://localhost:3000/api/signal

# Or push to your live Vercel deployment
python3 scripts/single_trader_analysis.py --endpoint https://<your-vercel-domain>.vercel.app/api/signal

# Optional: with your Twelve Data API key
python3 scripts/single_trader_analysis.py --twelvedata YOUR_KEY
```

---

## 📲 Progressive Web App (PWA) Features

- **Installable**: Full standalone app experience on iOS (Safari *Add to Home Screen*), Android (Chrome PWA prompt), and Desktop.
- **Service Worker (`sw.js`)**: Offline caching of application assets and static bundles with auto-updating.
- **Push & Local Notifications**: Web Push API alerts triggered when a new verified signal is confirmed or a target is reached.
- **Web Audio Chimes**: Low-latency procedural sound synthesizer for immediate auditory feedback.

---

## 🚀 Deployment (Vercel)

This application is ready for 1-click deployment on Vercel:
- `vercel.json` is configured with serverless function routing and SPA rewrites.
- `/api/signal.js` runs as a Vercel Serverless Function.
- Static assets build with `npm run build` using Vite.
