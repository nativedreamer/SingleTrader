export type SignalAction = 'BUY' | 'SELL' | 'HOLD';
export type SignalStrength = 'STRONG_BUY' | 'BUY' | 'NEUTRAL' | 'SELL' | 'STRONG_SELL';

export interface IndicatorSnapshot {
  rsi?: number;
  macd?: string | number;
  macdLine?: number;
  macdSignal?: number;
  macdHist?: number;
  supertrend?: number;
  supertrendDirection?: 1 | -1;
  ema200?: number;
  ema150?: number;
  ema250?: number;
  hma55?: number;
  vwap?: number;
  atr?: number;
  adx?: number;
  gaussianTrend?: 'BULL' | 'BEAR' | 'RANGING';
  donchianTrend?: 1 | -1;
  gannLevels?: {
    r1: number;
    r2: number;
    s1: number;
    s2: number;
  };
  fibLevels?: {
    extremeUp: number;
    tp2Up: number;
    tp1Up: number;
    openLevel: number;
    tp1Dn: number;
    tp2Dn: number;
    extremeDn: number;
  };
  [key: string]: any;
}

export interface SignalRecord {
  id: string;
  symbol: string;
  action: SignalAction;
  strength?: SignalStrength;
  price: number;
  tp1: number;
  tp2: number;
  tp3?: number;
  sl: number;
  trailingSl?: number;
  confidence: number;
  timestamp: string;
  indicators: IndicatorSnapshot;
  source: 'pine_script_engine' | 'python_script' | 'twelve_data_live' | 'webhook';
  status?: 'ACTIVE' | 'HIT_TP1' | 'HIT_TP2' | 'HIT_TP3' | 'STOPPED_OUT' | 'CLOSED';
}

export interface MarketCandle {
  time: number; // Unix timestamp in seconds
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface LiveTicker {
  symbol: string;
  price: number;
  change24h: number;
  high24h: number;
  low24h: number;
  volume24h: number;
  timestamp: number;
  source: string;
}

export interface StrategyConfig {
  sensitivity: number;       // default 5.0
  atrPeriod: number;         // default 10
  multTP1: number;           // default 1.0 (1:1 R:R)
  multTP2: number;           // default 2.0 (2:1 R:R - Leo Strategy core)
  multTP3: number;           // default 3.0 (3:1 R:R)
  slAtrMult: number;         // default 2.2
  stratMode: 'Normal' | 'Confirmed'; // default 'Confirmed'
  useTrailingSL: boolean;
  timeframe: '1m' | '5m' | '15m' | '1h' | '4h';
  soundAlerts: boolean;
  pushNotifications: boolean;
  twelveDataApiKey: string;
  apiWebhookUrl: string;
  autoRefreshInterval: number; // in seconds (e.g. 10s)
}

export interface BacktestSummary {
  totalTrades: number;
  buys: number;
  sells: number;
  wins: number;
  losses: number;
  winRate: number;
  profitFactor: number;
  netR: number;
  avgR: number;
  tp1Hits: number;
  tp2Hits: number;
  maxConsecutiveLosses: number;
  verdict: string;
}
