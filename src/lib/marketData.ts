import { LiveTicker, MarketCandle } from '../types/signal';

const CACHE_KEY_CANDLES = 'singletrader_candles_cache_v1';
const CACHE_KEY_TICKER = 'singletrader_ticker_cache_v1';

/**
 * Fetch live BTC/USD candlestick data.
 * Priority:
 * 1. Twelve Data API (if API key provided by user in settings)
 * 2. Binance BTCUSDT Live Klines (public real-time market data)
 * 3. Local offline cache fallback
 */
export async function fetchMarketCandles(
  timeframe: '1m' | '5m' | '15m' | '1h' | '4h' = '15m',
  twelveDataApiKey?: string
): Promise<{ candles: MarketCandle[]; source: string }> {
  // 1. Try Twelve Data if key exists
  if (twelveDataApiKey && twelveDataApiKey.trim().length > 5) {
    try {
      const intervalMap: Record<string, string> = {
        '1m': '1min',
        '5m': '5min',
        '15m': '15min',
        '1h': '1h',
        '4h': '4h',
      };
      const interval = intervalMap[timeframe] || '15min';
      const url = `https://api.twelvedata.com/time_series?symbol=BTC/USD&interval=${interval}&outputsize=100&apikey=${twelveDataApiKey.trim()}`;

      const res = await fetch(url);
      if (res.ok) {
        const json = await res.json();
        if (json.values && Array.isArray(json.values)) {
          // Twelve Data returns newest first, reverse for chronological order
          const candles: MarketCandle[] = json.values
            .map((v: any) => ({
              time: Math.floor(new Date(v.datetime).getTime() / 1000),
              open: parseFloat(v.open),
              high: parseFloat(v.high),
              low: parseFloat(v.low),
              close: parseFloat(v.close),
              volume: parseFloat(v.volume || '0') || 10,
            }))
            .reverse()
            .filter((c: MarketCandle) => !isNaN(c.close) && !isNaN(c.time));

          if (candles.length > 0) {
            localStorage.setItem(CACHE_KEY_CANDLES, JSON.stringify(candles));
            return { candles, source: 'Twelve Data (Live API Key)' };
          }
        }
      }
    } catch (e) {
      console.warn('Twelve Data request error, falling back to public exchange stream', e);
    }
  }

  // 2. Fetch from Live Binance BTCUSDT REST Klines
  try {
    const binanceInterval = timeframe;
    const url = `https://api.binance.com/api/v3/klines?symbol=BTCUSDT&interval=${binanceInterval}&limit=120`;
    const res = await fetch(url);
    if (res.ok) {
      const rawData = await res.json();
      if (Array.isArray(rawData) && rawData.length > 0) {
        const candles: MarketCandle[] = rawData.map((item: any) => ({
          time: Math.floor(item[0] / 1000),
          open: parseFloat(item[1]),
          high: parseFloat(item[2]),
          low: parseFloat(item[3]),
          close: parseFloat(item[4]),
          volume: parseFloat(item[5]),
        }));

        localStorage.setItem(CACHE_KEY_CANDLES, JSON.stringify(candles));
        return { candles, source: 'Binance Live BTC/USDT' };
      }
    }
  } catch (err) {
    console.warn('Binance klines request failed, checking offline cache', err);
  }

  // 3. Fallback to cached candles from localStorage
  const cached = localStorage.getItem(CACHE_KEY_CANDLES);
  if (cached) {
    try {
      const candles = JSON.parse(cached);
      if (Array.isArray(candles) && candles.length > 0) {
        return { candles, source: 'Cached Local Storage (Offline)' };
      }
    } catch (e) {
      // Ignore
    }
  }

  throw new Error('Could not fetch market data. Please verify internet connection or Twelve Data API key.');
}

/**
 * Fetch latest BTC/USD live ticker quote
 */
export async function fetchLiveTicker(twelveDataApiKey?: string): Promise<LiveTicker> {
  // If Twelve Data key provided
  if (twelveDataApiKey && twelveDataApiKey.trim().length > 5) {
    try {
      const priceRes = await fetch(
        `https://api.twelvedata.com/price?symbol=BTC/USD&apikey=${twelveDataApiKey.trim()}`
      );
      if (priceRes.ok) {
        const json = await priceRes.json();
        if (json.price) {
          const ticker: LiveTicker = {
            symbol: 'BTC/USD',
            price: parseFloat(json.price),
            change24h: 0,
            high24h: parseFloat(json.price) * 1.02,
            low24h: parseFloat(json.price) * 0.98,
            volume24h: 0,
            timestamp: Date.now(),
            source: 'Twelve Data',
          };
          localStorage.setItem(CACHE_KEY_TICKER, JSON.stringify(ticker));
          return ticker;
        }
      }
    } catch (e) {
      // Fallback
    }
  }

  // Public Binance 24hr Ticker
  try {
    const res = await fetch('https://api.binance.com/api/v3/ticker/24hr?symbol=BTCUSDT');
    if (res.ok) {
      const d = await res.json();
      const ticker: LiveTicker = {
        symbol: 'BTC/USD',
        price: parseFloat(d.lastPrice),
        change24h: parseFloat(d.priceChangePercent),
        high24h: parseFloat(d.highPrice),
        low24h: parseFloat(d.lowPrice),
        volume24h: parseFloat(d.volume),
        timestamp: Date.now(),
        source: 'Binance Live Spot',
      };
      localStorage.setItem(CACHE_KEY_TICKER, JSON.stringify(ticker));
      return ticker;
    }
  } catch (err) {
    // Check cached
  }

  const cached = localStorage.getItem(CACHE_KEY_TICKER);
  if (cached) {
    try {
      const parsed = JSON.parse(cached);
      return { ...parsed, source: 'Cached Offline Ticker' };
    } catch (e) {
      //
    }
  }

  return {
    symbol: 'BTC/USD',
    price: 68500,
    change24h: 0,
    high24h: 69200,
    low24h: 67800,
    volume24h: 24500,
    timestamp: Date.now(),
    source: 'Default Baseline',
  };
}
