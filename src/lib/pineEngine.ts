import { BacktestSummary, MarketCandle, SignalRecord, StrategyConfig } from '../types/signal';

/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * PINE SCRIPT QUANTITATIVE ENGINE (LEO 2:1 STRATEGY & GAUSSIAN TREND SUITE)
 * Direct mathematical translation of the Pine Script v5/v6 indicators.
 * ═══════════════════════════════════════════════════════════════════════════════
 */

// Simple Moving Average (SMA)
export function calculateSMA(data: number[], length: number): number[] {
  const result: number[] = new Array(data.length).fill(NaN);
  let sum = 0;
  for (let i = 0; i < data.length; i++) {
    sum += data[i];
    if (i >= length) {
      sum -= data[i - length];
    }
    if (i >= length - 1) {
      result[i] = sum / length;
    }
  }
  return result;
}

// Exponential Moving Average (EMA)
export function calculateEMA(data: number[], length: number): number[] {
  const result: number[] = new Array(data.length).fill(NaN);
  if (data.length < length) return result;
  const k = 2 / (length + 1);

  // Initialize with SMA
  let initialSum = 0;
  for (let i = 0; i < length; i++) {
    initialSum += data[i];
  }
  result[length - 1] = initialSum / length;

  for (let i = length; i < data.length; i++) {
    result[i] = data[i] * k + result[i - 1] * (1 - k);
  }
  return result;
}

// Weighted Moving Average (WMA)
export function calculateWMA(data: number[], length: number): number[] {
  const result: number[] = new Array(data.length).fill(NaN);
  if (data.length < length) return result;
  const denominator = (length * (length + 1)) / 2;

  for (let i = length - 1; i < data.length; i++) {
    let sum = 0;
    for (let j = 0; j < length; j++) {
      sum += data[i - length + 1 + j] * (j + 1);
    }
    result[i] = sum / denominator;
  }
  return result;
}

// Hull Moving Average (HMA) - ta.hma(src, length)
export function calculateHMA(data: number[], length: number): number[] {
  const halfLen = Math.floor(length / 2);
  const sqrtLen = Math.floor(Math.sqrt(length));

  const wmaHalf = calculateWMA(data, halfLen);
  const wmaFull = calculateWMA(data, length);

  const diff: number[] = new Array(data.length).fill(NaN);
  for (let i = 0; i < data.length; i++) {
    if (!isNaN(wmaHalf[i]) && !isNaN(wmaFull[i])) {
      diff[i] = 2 * wmaHalf[i] - wmaFull[i];
    }
  }

  // WMA of the diff with sqrt(length)
  const validStartIndex = diff.findIndex(x => !isNaN(x));
  if (validStartIndex === -1 || data.length - validStartIndex < sqrtLen) {
    return new Array(data.length).fill(NaN);
  }

  const hma = new Array(data.length).fill(NaN);
  const den = (sqrtLen * (sqrtLen + 1)) / 2;

  for (let i = validStartIndex + sqrtLen - 1; i < data.length; i++) {
    let sum = 0;
    let valid = true;
    for (let j = 0; j < sqrtLen; j++) {
      const val = diff[i - sqrtLen + 1 + j];
      if (isNaN(val)) {
        valid = false;
        break;
      }
      sum += val * (j + 1);
    }
    if (valid) {
      hma[i] = sum / den;
    }
  }
  return hma;
}

// True Range (TR) & Average True Range (ATR)
export function calculateATR(candles: MarketCandle[], length: number): number[] {
  const atr: number[] = new Array(candles.length).fill(NaN);
  if (candles.length === 0) return atr;

  const tr: number[] = [];
  for (let i = 0; i < candles.length; i++) {
    const cur = candles[i];
    if (i === 0) {
      tr.push(cur.high - cur.low);
    } else {
      const prevClose = candles[i - 1].close;
      const trueRange = Math.max(
        cur.high - cur.low,
        Math.abs(cur.high - prevClose),
        Math.abs(cur.low - prevClose)
      );
      tr.push(trueRange);
    }
  }

  if (candles.length < length) return atr;

  // First ATR is simple average of first 'length' TRs
  let firstAtr = 0;
  for (let i = 0; i < length; i++) {
    firstAtr += tr[i];
  }
  atr[length - 1] = firstAtr / length;

  // Wilder's smoothing
  for (let i = length; i < candles.length; i++) {
    atr[i] = (atr[i - 1] * (length - 1) + tr[i]) / length;
  }
  return atr;
}

// Relative Strength Index (RSI 14)
export function calculateRSI(data: number[], length: number = 14): number[] {
  const rsi: number[] = new Array(data.length).fill(NaN);
  if (data.length <= length) return rsi;

  let gains = 0;
  let losses = 0;

  for (let i = 1; i <= length; i++) {
    const change = data[i] - data[i - 1];
    if (change > 0) gains += change;
    else losses -= change;
  }

  let avgGain = gains / length;
  let avgLoss = losses / length;

  rsi[length] = avgLoss === 0 ? 100 : 100 - 100 / (1 + avgGain / avgLoss);

  for (let i = length + 1; i < data.length; i++) {
    const change = data[i] - data[i - 1];
    const curGain = change > 0 ? change : 0;
    const curLoss = change < 0 ? -change : 0;

    avgGain = (avgGain * (length - 1) + curGain) / length;
    avgLoss = (avgLoss * (length - 1) + curLoss) / length;

    if (avgLoss === 0) {
      rsi[i] = 100;
    } else {
      const rs = avgGain / avgLoss;
      rsi[i] = 100 - 100 / (1 + rs);
    }
  }
  return rsi;
}

// MACD (12, 26, 9)
export function calculateMACD(data: number[], fast = 12, slow = 26, signal = 9) {
  const fastEMA = calculateEMA(data, fast);
  const slowEMA = calculateEMA(data, slow);
  const macdLine: number[] = new Array(data.length).fill(NaN);

  for (let i = 0; i < data.length; i++) {
    if (!isNaN(fastEMA[i]) && !isNaN(slowEMA[i])) {
      macdLine[i] = fastEMA[i] - slowEMA[i];
    }
  }

  // Filter valid items to compute Signal EMA
  const validStart = macdLine.findIndex(v => !isNaN(v));
  const signalLine: number[] = new Array(data.length).fill(NaN);
  const histogram: number[] = new Array(data.length).fill(NaN);

  if (validStart !== -1 && data.length - validStart >= signal) {
    const validMacd = macdLine.slice(validStart);
    const validSignal = calculateEMA(validMacd, signal);
    for (let i = 0; i < validSignal.length; i++) {
      const targetIdx = validStart + i;
      signalLine[targetIdx] = validSignal[i];
      if (!isNaN(macdLine[targetIdx]) && !isNaN(validSignal[i])) {
        histogram[targetIdx] = macdLine[targetIdx] - validSignal[i];
      }
    }
  }

  return { macdLine, signalLine, histogram };
}

// Supertrend(ohlc4, factor, atrPeriod)
export function calculateSupertrend(candles: MarketCandle[], factor = 5, atrPeriod = 10) {
  const len = candles.length;
  const supertrend: number[] = new Array(len).fill(NaN);
  const direction: (1 | -1)[] = new Array(len).fill(1);
  const upperBands: number[] = new Array(len).fill(NaN);
  const lowerBands: number[] = new Array(len).fill(NaN);

  const atr = calculateATR(candles, atrPeriod);

  let prevUpper = NaN;
  let prevLower = NaN;
  let prevSupertrend = NaN;
  let prevDir: 1 | -1 = 1;

  for (let i = atrPeriod; i < len; i++) {
    const c = candles[i];
    const prevC = candles[i - 1];
    const curAtr = atr[i];
    const hl2 = (c.high + c.low) / 2;

    let upper = hl2 + factor * curAtr;
    let lower = hl2 - factor * curAtr;

    if (!isNaN(prevLower)) {
      lower = lower > prevLower || prevC.close < prevLower ? lower : prevLower;
    }
    if (!isNaN(prevUpper)) {
      upper = upper < prevUpper || prevC.close > prevUpper ? upper : prevUpper;
    }

    let dir: 1 | -1 = 1;
    let st = lower;

    if (!isNaN(prevSupertrend)) {
      if (prevSupertrend === prevUpper) {
        dir = c.close > upper ? 1 : -1;
      } else {
        dir = c.close < lower ? -1 : 1;
      }
    }

    st = dir === 1 ? lower : upper;

    supertrend[i] = st;
    direction[i] = dir;
    upperBands[i] = upper;
    lowerBands[i] = lower;

    prevUpper = upper;
    prevLower = lower;
    prevSupertrend = st;
    prevDir = dir;
  }

  return { supertrend, direction, upperBands, lowerBands };
}

// Donchian Channel Main Trend: dchannel(30)
export function calculateDonchianTrend(candles: MarketCandle[], period = 30): number[] {
  const trend: number[] = new Array(candles.length).fill(0);
  let curTrend = 0;

  for (let i = period; i < candles.length; i++) {
    let hh = -Infinity;
    let ll = Infinity;
    for (let j = 1; j <= period; j++) {
      hh = Math.max(hh, candles[i - j].high);
      ll = Math.min(ll, candles[i - j].low);
    }
    if (candles[i].close > hh) {
      curTrend = 1;
    } else if (candles[i].close < ll) {
      curTrend = -1;
    }
    trend[i] = curTrend;
  }
  return trend;
}

// Session VWAP
export function calculateVWAP(candles: MarketCandle[]): number[] {
  const vwap: number[] = new Array(candles.length).fill(NaN);
  let cumulativeTPV = 0;
  let cumulativeVol = 0;

  for (let i = 0; i < candles.length; i++) {
    const c = candles[i];
    const typicalPrice = (c.high + c.low + c.close) / 3;
    const vol = c.volume || 1;
    cumulativeTPV += typicalPrice * vol;
    cumulativeVol += vol;
    vwap[i] = cumulativeVol > 0 ? cumulativeTPV / cumulativeVol : typicalPrice;
  }
  return vwap;
}

// Smoothed Gaussian Trend Filter [AlgoAlpha]
export function calculateGaussianTrend(closes: number[], period = 15, poles = 3, linregLen = 22) {
  const freq = (2.0 * Math.PI) / period;
  const factorB = (1.0 - Math.cos(freq)) / (Math.pow(1.414, 2.0 / poles) - 1.0);
  const alphaVal = -factorB + Math.sqrt(factorB * factorB + 2.0 * factorB);
  const oneMinusAlpha = 1.0 - alphaVal;

  const gma: number[] = new Array(closes.length).fill(NaN);
  let r1 = closes[0] || 0;
  let r2 = r1;
  let r3 = r1;

  for (let i = 0; i < closes.length; i++) {
    const val = closes[i];
    if (poles === 3) {
      const a3 = alphaVal * alphaVal * alphaVal;
      const oma = oneMinusAlpha;
      const oma2 = oma * oma;
      const oma3 = oma2 * oma;
      const cur = a3 * val + 3.0 * oma * r1 - 3.0 * oma2 * r2 + oma3 * r3;
      r3 = r2;
      r2 = r1;
      r1 = cur;
      gma[i] = cur;
    } else {
      gma[i] = alphaVal * val + oneMinusAlpha * (gma[i - 1] || val);
    }
  }

  // Linear regression smoothing
  const final: number[] = new Array(closes.length).fill(NaN);
  for (let i = linregLen; i < closes.length; i++) {
    let sumX = 0;
    let sumY = 0;
    let sumXY = 0;
    let sumXX = 0;
    for (let j = 0; j < linregLen; j++) {
      const x = j;
      const y = gma[i - linregLen + 1 + j];
      sumX += x;
      sumY += y;
      sumXY += x * y;
      sumXX += x * x;
    }
    const slope = (linregLen * sumXY - sumX * sumY) / (linregLen * sumXX - sumX * sumX);
    const intercept = (sumY - slope * sumX) / linregLen;
    final[i] = intercept + slope * (linregLen - 1);
  }

  return final;
}

// Gann Square of 9 support & resistance
export function calculateGannSquareOf9(price: number) {
  let denominator = 0.01;
  if (price >= 10000) denominator = 0.01;
  else if (price >= 1000) denominator = 0.1;
  else if (price >= 100) denominator = 1;
  else if (price >= 10) denominator = 10;
  else denominator = 100;

  const scaled = price * denominator;
  const gannNums: number[] = [0];

  for (let min = 0; min <= 20; min++) {
    for (let i = 0; i < 4; i++) {
      const last = gannNums[gannNums.length - 1];
      let gNum = 0;
      if (min === 0 && i === 0) {
        gNum = min + (min + 2);
      } else if (min > 0 && i === 0) {
        gNum = Math.round(last) + (min + 1) + min;
      } else {
        gNum = Math.round(last) + (min + 2) + min;
      }
      gannNums.push(gNum);
    }
  }

  let resistance = price * 1.02;
  let support = price * 0.98;
  let gannPos = 0;

  for (let i = 0; i < gannNums.length - 1; i++) {
    if (gannNums[i] <= scaled && gannNums[i + 1] > scaled) {
      resistance = gannNums[i + 1] / denominator;
      support = gannNums[i] / denominator;
      gannPos = i;
      break;
    }
  }

  const blueGann = (support + resistance) / 2;
  const r2 = (gannNums[Math.min(gannPos + 2, gannNums.length - 1)] || 0) / denominator;
  const s2 = (gannNums[Math.max(gannPos - 1, 0)] || 0) / denominator;

  return {
    r1: Math.round(resistance * 100) / 100,
    r2: Math.round(r2 * 100) / 100,
    s1: Math.round(support * 100) / 100,
    s2: Math.round(s2 * 100) / 100,
    blueGann: Math.round(blueGann * 100) / 100,
  };
}

// 8 AM / OSTDV Fibonacci expansion ratios from Pine Script
export function calculateOSTDVFibLevels(candles: MarketCandle[]) {
  if (candles.length < 20) return null;
  const slice = candles.slice(-20);
  let sessionHigh = -Infinity;
  let sessionLow = Infinity;
  for (const c of slice) {
    if (c.high > sessionHigh) sessionHigh = c.high;
    if (c.low < sessionLow) sessionLow = c.low;
  }
  const sessionRange = sessionHigh - sessionLow;
  const midpoint = (sessionHigh + sessionLow) / 2;

  // Levels: Extreme 4.0, 2:1 RRR target 2.016, 1:1 RRR target 1.507, 1.0, 0.5, 0.0, -0.507, -1.016, -4.0
  return {
    extremeUp: Math.round((midpoint + (4.0 - 0.5) * sessionRange) * 100) / 100,
    tp2Up: Math.round((sessionLow - (sessionLow - sessionHigh) * 2.016) * 100) / 100,
    tp1Up: Math.round((sessionLow - (sessionLow - sessionHigh) * 1.507) * 100) / 100,
    openLevel: Math.round(midpoint * 100) / 100,
    tp1Dn: Math.round((sessionLow - (sessionLow - sessionHigh) * -0.507) * 100) / 100,
    tp2Dn: Math.round((sessionLow - (sessionLow - sessionHigh) * -1.016) * 100) / 100,
    extremeDn: Math.round((midpoint + (-4.0 - 0.5) * sessionRange) * 100) / 100,
  };
}

/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * FULL STRATEGY EVALUATION & BACKTEST ENGINE
 * Executes the Pine Script logic over the candle history:
 * 1. Calculates all indicator arrays.
 * 2. Identifies Buy/Sell signals (Normal & Confirmed).
 * 3. Applies ATR 2.2 Dynamic Stop Loss and Take Profit R-multiples (1:1, 2:1, 3:1).
 * 4. Computes backtest statistics and returns active signal.
 * ═══════════════════════════════════════════════════════════════════════════════
 */
export function evaluateSignals(
  candles: MarketCandle[],
  config: StrategyConfig
): {
  activeSignal: SignalRecord;
  history: SignalRecord[];
  backtest: BacktestSummary;
  latestIndicators: any;
} {
  const defaultSignal: SignalRecord = {
    id: 'sig_default',
    symbol: 'BTCUSD',
    action: 'HOLD',
    strength: 'NEUTRAL',
    price: candles[candles.length - 1]?.close || 68500,
    tp1: 0,
    tp2: 0,
    tp3: 0,
    sl: 0,
    confidence: 50,
    timestamp: new Date().toISOString(),
    indicators: {},
    source: 'pine_script_engine',
    status: 'ACTIVE',
  };

  if (!candles || candles.length < 35) {
    return {
      activeSignal: defaultSignal,
      history: [],
      backtest: {
        totalTrades: 0,
        buys: 0,
        sells: 0,
        wins: 0,
        losses: 0,
        winRate: 0,
        profitFactor: 0,
        netR: 0,
        avgR: 0,
        tp1Hits: 0,
        tp2Hits: 0,
        maxConsecutiveLosses: 0,
        verdict: 'INSUFFICIENT BARS',
      },
      latestIndicators: {},
    };
  }

  const closes = candles.map(c => c.close);
  const len = candles.length;

  // 1. Core Indicators
  const ema200 = calculateEMA(closes, 200);
  const ema150 = calculateEMA(closes, 150);
  const ema250 = calculateEMA(closes, 250);
  const hma55 = calculateHMA(closes, 55);
  const rsi = calculateRSI(closes, 14);
  const macd = calculateMACD(closes, 12, 26, 9);
  const { supertrend, direction: stDir } = calculateSupertrend(candles, config.sensitivity, config.atrPeriod);
  const donchianTrend = calculateDonchianTrend(candles, 30);
  const atr = calculateATR(candles, 14);
  const vwap = calculateVWAP(candles);
  const gaussianLine = calculateGaussianTrend(closes, 15, 3, 22);

  const signalsHistory: SignalRecord[] = [];
  let currentTrade: {
    action: 'BUY' | 'SELL';
    entryPrice: number;
    sl: number;
    tp1: number;
    tp2: number;
    tp3: number;
    entryIndex: number;
    highestPrice: number;
    lowestPrice: number;
    tp1Hit: boolean;
    tp2Hit: boolean;
    tp3Hit: boolean;
  } | null = null;

  let totalWins = 0;
  let totalLosses = 0;
  let totalBuys = 0;
  let totalSells = 0;
  let tp1Hits = 0;
  let tp2Hits = 0;
  let curLossStreak = 0;
  let maxLossStreak = 0;

  // Start evaluating once warmup bars allow indicator stabilization
  const startIdx = Math.max(30, Math.floor(len * 0.15));

  for (let i = startIdx; i < len; i++) {
    const c = candles[i];
    const prevC = candles[i - 1];

    const curClose = c.close;
    const curAtr = atr[i] || c.close * 0.015;
    const curRsi = rsi[i] || 50;
    const curMacd = macd.macdLine[i] || 0;
    const prevMacd = macd.macdLine[i - 1] || 0;
    const curMainTrend = donchianTrend[i] || 0;
    const prevMainTrend = donchianTrend[i - 1] || 0;
    const curSt = supertrend[i];
    const prevSt = supertrend[i - 1];

    const curEma150 = ema150[i] || curClose;
    const curEma250 = ema250[i] || curClose;
    const curEma200 = ema200[i] || curClose;
    const curHma55 = hma55[i] || curClose;
    const prev2Hma55 = hma55[i - 2] || curClose;

    // Cross conditions with Supertrend
    const crossoverST = prevC.close <= prevSt && curClose > curSt;
    const crossunderST = prevC.close >= prevSt && curClose < curSt;
    const prevCrossoverST = i >= 2 && candles[i - 2].close <= supertrend[i - 2] && prevC.close > prevSt;
    const prevCrossunderST = i >= 2 && candles[i - 2].close >= supertrend[i - 2] && prevC.close < prevSt;

    // Pine Script Confirmed Logic:
    // confBull = (crossover || (prevCrossover && prevMainTrend < 0)) && macd > 0 && macd > prevMacd && ema150 > ema250 && hma55 > prev2Hma55 && curMainTrend > 0
    const confBull =
      (crossoverST || (prevCrossoverST && prevMainTrend < 0)) &&
      curMacd > 0 &&
      curMacd > prevMacd &&
      curEma150 > curEma250 &&
      curHma55 > prev2Hma55 &&
      curMainTrend > 0;

    // confBear = (crossunder || (prevCrossunder && prevMainTrend > 0)) && macd < 0 && macd < prevMacd && ema150 < ema250 && hma55 < prev2Hma55 && curMainTrend < 0
    const confBear =
      (crossunderST || (prevCrossunderST && prevMainTrend > 0)) &&
      curMacd < 0 &&
      curMacd < prevMacd &&
      curEma150 < curEma250 &&
      curHma55 < prev2Hma55 &&
      curMainTrend < 0;

    const isBull = config.stratMode === 'Normal' ? crossoverST : confBull;
    const isBear = config.stratMode === 'Normal' ? crossunderST : confBear;

    // Check open trade for TP/SL hits
    if (currentTrade) {
      if (currentTrade.action === 'BUY') {
        currentTrade.highestPrice = Math.max(currentTrade.highestPrice, c.high);
        if (c.high >= currentTrade.tp1 && !currentTrade.tp1Hit) {
          currentTrade.tp1Hit = true;
          tp1Hits++;
        }
        if (c.high >= currentTrade.tp2 && !currentTrade.tp2Hit) {
          currentTrade.tp2Hit = true;
          tp2Hits++;
        }
        if (c.low <= currentTrade.sl) {
          // Stopped out
          if (currentTrade.tp1Hit) {
            totalWins++;
            curLossStreak = 0;
          } else {
            totalLosses++;
            curLossStreak++;
            maxLossStreak = Math.max(maxLossStreak, curLossStreak);
          }
          currentTrade = null;
        } else if (currentTrade.tp2Hit) {
          totalWins++;
          curLossStreak = 0;
          currentTrade = null;
        }
      } else {
        currentTrade.lowestPrice = Math.min(currentTrade.lowestPrice, c.low);
        if (c.low <= currentTrade.tp1 && !currentTrade.tp1Hit) {
          currentTrade.tp1Hit = true;
          tp1Hits++;
        }
        if (c.low <= currentTrade.tp2 && !currentTrade.tp2Hit) {
          currentTrade.tp2Hit = true;
          tp2Hits++;
        }
        if (c.high >= currentTrade.sl) {
          // Stopped out
          if (currentTrade.tp1Hit) {
            totalWins++;
            curLossStreak = 0;
          } else {
            totalLosses++;
            curLossStreak++;
            maxLossStreak = Math.max(maxLossStreak, curLossStreak);
          }
          currentTrade = null;
        } else if (currentTrade.tp2Hit) {
          totalWins++;
          curLossStreak = 0;
          currentTrade = null;
        }
      }
    }

    // New Signal Generation
    if (isBull || isBear) {
      const isStrong = isBull ? curClose > curEma200 : curClose < curEma200;
      const action: 'BUY' | 'SELL' = isBull ? 'BUY' : 'SELL';
      const strength = isBull
        ? isStrong
          ? 'STRONG_BUY'
          : 'BUY'
        : isStrong
        ? 'STRONG_SELL'
        : 'SELL';

      const entryPrice = curClose;
      const atrBand = curAtr * config.slAtrMult;

      let sl = 0;
      let tp1 = 0;
      let tp2 = 0;
      let tp3 = 0;

      if (action === 'BUY') {
        totalBuys++;
        sl = entryPrice - atrBand;
        const riskDist = entryPrice - sl;
        tp1 = entryPrice + riskDist * config.multTP1;
        tp2 = entryPrice + riskDist * config.multTP2; // Leo 2:1 primary
        tp3 = entryPrice + riskDist * config.multTP3;
      } else {
        totalSells++;
        sl = entryPrice + atrBand;
        const riskDist = sl - entryPrice;
        tp1 = entryPrice - riskDist * config.multTP1;
        tp2 = entryPrice - riskDist * config.multTP2;
        tp3 = entryPrice - riskDist * config.multTP3;
      }

      // Calculate indicator confluence score (0 - 100)
      let confidence = 55;
      if (action === 'BUY') {
        if (stDir[i] === 1) confidence += 10;
        if (curMainTrend > 0) confidence += 10;
        if (curMacd > 0 && curMacd > prevMacd) confidence += 10;
        if (curEma150 > curEma250) confidence += 10;
        if (curClose > curEma200) confidence += 5;
      } else {
        if (stDir[i] === -1) confidence += 10;
        if (curMainTrend < 0) confidence += 10;
        if (curMacd < 0 && curMacd < prevMacd) confidence += 10;
        if (curEma150 < curEma250) confidence += 10;
        if (curClose < curEma200) confidence += 5;
      }

      confidence = Math.min(95, Math.max(50, confidence));

      const signalRecord: SignalRecord = {
        id: `sig_${c.time}_${action}`,
        symbol: 'BTCUSD',
        action,
        strength,
        price: Math.round(entryPrice * 100) / 100,
        tp1: Math.round(tp1 * 100) / 100,
        tp2: Math.round(tp2 * 100) / 100,
        tp3: Math.round(tp3 * 100) / 100,
        sl: Math.round(sl * 100) / 100,
        confidence,
        timestamp: new Date(c.time * 1000).toISOString(),
        indicators: {
          rsi: Math.round(curRsi * 10) / 10,
          macd: action === 'BUY' ? 'bullish_expansion' : 'bearish_expansion',
          macdLine: Math.round(curMacd * 100) / 100,
          supertrend: Math.round(curSt * 100) / 100,
          supertrendDirection: stDir[i],
          ema200: Math.round(curEma200 * 100) / 100,
          ema150: Math.round(curEma150 * 100) / 100,
          ema250: Math.round(curEma250 * 100) / 100,
          hma55: Math.round(curHma55 * 100) / 100,
          vwap: Math.round((vwap[i] || curClose) * 100) / 100,
          atr: Math.round(curAtr * 100) / 100,
          donchianTrend: curMainTrend as 1 | -1,
        },
        source: 'pine_script_engine',
        status: i === len - 1 ? 'ACTIVE' : 'CLOSED',
      };

      signalsHistory.unshift(signalRecord);

      currentTrade = {
        action,
        entryPrice,
        sl,
        tp1,
        tp2,
        tp3,
        entryIndex: i,
        highestPrice: c.high,
        lowestPrice: c.low,
        tp1Hit: false,
        tp2Hit: false,
        tp3Hit: false,
      };
    }
  }

  // Active or most recent confirmed signal
  const lastBar = candles[candles.length - 1];
  const lastIdx = len - 1;
  const lastClose = lastBar.close;
  const lastAtr = atr[lastIdx] || lastClose * 0.015;
  const lastStDir = stDir[lastIdx] || 1;
  const lastSt = supertrend[lastIdx] || lastClose;
  const lastRsi = rsi[lastIdx] || 50;
  const lastEma200 = ema200[lastIdx] || lastClose;
  const lastEma150 = ema150[lastIdx] || lastClose;
  const lastEma250 = ema250[lastIdx] || lastClose;
  const lastMacd = macd.macdLine[lastIdx] || 0;
  const lastHma55 = hma55[lastIdx] || lastClose;
  const lastGaussian = gaussianLine[lastIdx] || lastClose;

  // Active signal: either the last generated signal or calculated from active state
  let activeSignal = signalsHistory[0];

  if (!activeSignal || (signalsHistory.length > 0 && signalsHistory[0].status !== 'ACTIVE')) {
    // Current regime state
    const regimeAction: 'BUY' | 'SELL' | 'HOLD' =
      lastStDir === 1 ? 'BUY' : lastStDir === -1 ? 'SELL' : 'HOLD';
    const isStrong = regimeAction === 'BUY' ? lastClose > lastEma200 : lastClose < lastEma200;
    const atrBand = lastAtr * config.slAtrMult;

    const sl = regimeAction === 'BUY' ? lastClose - atrBand : lastClose + atrBand;
    const riskDist = Math.abs(lastClose - sl);
    const tp1 = regimeAction === 'BUY' ? lastClose + riskDist * config.multTP1 : lastClose - riskDist * config.multTP1;
    const tp2 = regimeAction === 'BUY' ? lastClose + riskDist * config.multTP2 : lastClose - riskDist * config.multTP2;
    const tp3 = regimeAction === 'BUY' ? lastClose + riskDist * config.multTP3 : lastClose - riskDist * config.multTP3;

    activeSignal = {
      id: `sig_live_${lastBar.time}`,
      symbol: 'BTCUSD',
      action: regimeAction,
      strength: regimeAction === 'BUY' ? (isStrong ? 'STRONG_BUY' : 'BUY') : (isStrong ? 'STRONG_SELL' : 'SELL'),
      price: Math.round(lastClose * 100) / 100,
      tp1: Math.round(tp1 * 100) / 100,
      tp2: Math.round(tp2 * 100) / 100,
      tp3: Math.round(tp3 * 100) / 100,
      sl: Math.round(sl * 100) / 100,
      confidence: Math.round(
        50 +
          (lastStDir === (regimeAction === 'BUY' ? 1 : -1) ? 15 : 0) +
          (regimeAction === 'BUY' ? (lastEma150 > lastEma250 ? 15 : 0) : (lastEma150 < lastEma250 ? 15 : 0)) +
          (isStrong ? 10 : 0)
      ),
      timestamp: new Date(lastBar.time * 1000).toISOString(),
      indicators: {
        rsi: Math.round(lastRsi * 10) / 10,
        macd: lastMacd > 0 ? 'bullish_cross' : 'bearish_cross',
        macdLine: Math.round(lastMacd * 100) / 100,
        supertrend: Math.round(lastSt * 100) / 100,
        supertrendDirection: lastStDir,
        ema200: Math.round(lastEma200 * 100) / 100,
        ema150: Math.round(lastEma150 * 100) / 100,
        ema250: Math.round(lastEma250 * 100) / 100,
        hma55: Math.round(lastHma55 * 100) / 100,
        vwap: Math.round((vwap[lastIdx] || lastClose) * 100) / 100,
        atr: Math.round(lastAtr * 100) / 100,
      },
      source: 'pine_script_engine',
      status: 'ACTIVE',
    };
  }

  // Calculate Backtest Metrics
  const decidedTrades = totalWins + totalLosses;
  const winRate = decidedTrades > 0 ? (totalWins / decidedTrades) * 100 : 0;
  const netR = totalWins * config.multTP2 - totalLosses * 1.0;
  const avgR = decidedTrades > 0 ? netR / decidedTrades : 0;
  const grossProfit = totalWins * config.multTP2;
  const grossLoss = totalLosses * 1.0;
  const profitFactor = grossLoss > 0 ? grossProfit / grossLoss : grossProfit > 0 ? 9.99 : 0;

  const beRate = 100.0 / (1.0 + config.multTP2);
  const verdict =
    decidedTrades < 10
      ? 'SAMPLE TOO SMALL'
      : winRate > beRate
      ? 'ABOVE BREAK-EVEN (VERIFIED)'
      : 'BELOW BREAK-EVEN';

  const backtest: BacktestSummary = {
    totalTrades: decidedTrades,
    buys: totalBuys,
    sells: totalSells,
    wins: totalWins,
    losses: totalLosses,
    winRate: Math.round(winRate * 10) / 10,
    profitFactor: Math.round(profitFactor * 100) / 100,
    netR: Math.round(netR * 100) / 100,
    avgR: Math.round(avgR * 1000) / 1000,
    tp1Hits,
    tp2Hits,
    maxConsecutiveLosses: maxLossStreak,
    verdict,
  };

  const gann = calculateGannSquareOf9(lastClose);
  const fib = calculateOSTDVFibLevels(candles);

  const latestIndicators = {
    close: lastClose,
    rsi: lastRsi,
    macd: macd.macdLine[lastIdx],
    macdSignal: macd.signalLine[lastIdx],
    macdHist: macd.histogram[lastIdx],
    supertrend: lastSt,
    supertrendDir: lastStDir,
    ema200: lastEma200,
    ema150: lastEma150,
    ema250: lastEma250,
    hma55: lastHma55,
    atr: lastAtr,
    vwap: vwap[lastIdx],
    gaussian: lastGaussian,
    gann,
    fib,
  };

  return {
    activeSignal,
    history: signalsHistory,
    backtest,
    latestIndicators,
  };
}
