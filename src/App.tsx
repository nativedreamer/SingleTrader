import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Header } from './components/Header';
import { HeroSignalCard } from './components/HeroSignalCard';
import { TradingChart } from './components/TradingChart';
import { BacktestStatsPanel } from './components/BacktestStatsPanel';
import { SignalLogTable } from './components/SignalLogTable';
import { ControlDrawer } from './components/ControlDrawer';
import { OfflineIndicator } from './components/OfflineIndicator';
import { fetchLiveTicker, fetchMarketCandles } from './lib/marketData';
import { evaluateSignals } from './lib/pineEngine';
import { playSignalChime, requestNotificationPermission, sendLocalNotification } from './lib/notifications';
import {
  appendStoredSignal,
  getStoredConfig,
  getStoredSignals,
  saveStoredConfig,
  saveStoredSignals,
} from './lib/storage';
import { BacktestSummary, LiveTicker, MarketCandle, SignalRecord, StrategyConfig } from './types/signal';
import { Activity, ShieldCheck, Terminal, Layers } from 'lucide-react';

export default function App() {
  const [config, setConfig] = useState<StrategyConfig>(getStoredConfig);
  const [ticker, setTicker] = useState<LiveTicker>({
    symbol: 'BTC/USD',
    price: 68500,
    change24h: 0,
    high24h: 69200,
    low24h: 67800,
    volume24h: 24500,
    timestamp: Date.now(),
    source: 'Connecting...',
  });
  const [candles, setCandles] = useState<MarketCandle[]>([]);
  const [marketSource, setMarketSource] = useState<string>('Initializing live stream...');
  const [activeSignal, setActiveSignal] = useState<SignalRecord | null>(null);
  const [signalsHistory, setSignalsHistory] = useState<SignalRecord[]>(getStoredSignals);
  const [backtestStats, setBacktestStats] = useState<BacktestSummary>({
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
    verdict: 'CALCULATING',
  });
  const [indicators, setIndicators] = useState<any>({});
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isTestingPush, setIsTestingPush] = useState(false);
  const [lastApiSignalId, setLastApiSignalId] = useState<string | null>(null);

  const prevSignalIdRef = useRef<string | null>(null);

  // Main data load and indicator computation
  const loadData = useCallback(async () => {
    setIsRefreshing(true);
    try {
      // 1. Fetch live market candles
      const { candles: newCandles, source } = await fetchMarketCandles(
        config.timeframe,
        config.twelveDataApiKey
      );
      setCandles(newCandles);
      setMarketSource(source);

      // 2. Fetch live ticker quote
      const newTicker = await fetchLiveTicker(config.twelveDataApiKey);
      setTicker(newTicker);

      // 3. Evaluate Pine Script 2:1 Strategy
      const evalResult = evaluateSignals(newCandles, config);
      setActiveSignal(evalResult.activeSignal);
      setBacktestStats(evalResult.backtest);
      setIndicators(evalResult.latestIndicators);

      // Merge newly generated signals with history
      if (evalResult.history.length > 0) {
        setSignalsHistory(prev => {
          const merged = [...prev];
          for (const s of evalResult.history) {
            if (!merged.some(m => m.id === s.id)) {
              merged.push(s);
            }
          }
          merged.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
          saveStoredSignals(merged);
          return merged;
        });
      }

      // Check if new signal triggered alert
      if (
        evalResult.activeSignal &&
        evalResult.activeSignal.action !== 'HOLD' &&
        prevSignalIdRef.current &&
        prevSignalIdRef.current !== evalResult.activeSignal.id
      ) {
        if (config.soundAlerts && (evalResult.activeSignal.action === 'BUY' || evalResult.activeSignal.action === 'SELL')) {
          playSignalChime(evalResult.activeSignal.action);
        }
        if (config.pushNotifications) {
          sendLocalNotification(
            `BTC/USD ${evalResult.activeSignal.action} Signal`,
            `Entry: $${evalResult.activeSignal.price} | TP2: $${evalResult.activeSignal.tp2} | SL: $${evalResult.activeSignal.sl}`
          );
        }
      }
      if (evalResult.activeSignal) {
        prevSignalIdRef.current = evalResult.activeSignal.id;
      }
    } catch (err) {
      console.error('Failed to load market telemetry', err);
    } finally {
      setIsRefreshing(false);
    }
  }, [config]);

  // Check /api/signal endpoint for incoming signals pushed by Python script
  const checkApiSignals = useCallback(async () => {
    try {
      const res = await fetch('/api/signal');
      if (res.ok) {
        const data = await res.json();
        if (data && data.latest && data.latest.id !== lastApiSignalId) {
          const pushedSignal: SignalRecord = {
            ...data.latest,
            source: 'python_script',
          };
          setLastApiSignalId(pushedSignal.id);
          setActiveSignal(pushedSignal);
          const updatedHistory = appendStoredSignal(pushedSignal);
          setSignalsHistory(updatedHistory);

          if (config.soundAlerts && (pushedSignal.action === 'BUY' || pushedSignal.action === 'SELL')) {
            playSignalChime(pushedSignal.action);
          }
          if (config.pushNotifications) {
            sendLocalNotification(
              `Script Hook: ${pushedSignal.symbol} ${pushedSignal.action}`,
              `Price: $${pushedSignal.price} | Target: $${pushedSignal.tp2}`
            );
          }
        }
      }
    } catch (e) {
      // Endpoint may not be active yet during static load
    }
  }, [lastApiSignalId, config]);

  // Initial load
  useEffect(() => {
    loadData();
    if (config.pushNotifications) {
      requestNotificationPermission();
    }
  }, [loadData, config.pushNotifications]);

  // Periodic polling interval
  useEffect(() => {
    const intervalMs = Math.max(5, config.autoRefreshInterval) * 1000;
    const interval = setInterval(() => {
      loadData();
      checkApiSignals();
    }, intervalMs);

    return () => clearInterval(interval);
  }, [loadData, checkApiSignals, config.autoRefreshInterval]);

  const handleSaveConfig = (newConfig: StrategyConfig) => {
    setConfig(newConfig);
    saveStoredConfig(newConfig);
  };

  const handleClearHistory = () => {
    setSignalsHistory([]);
    saveStoredSignals([]);
  };

  // Test Push Webhook Signal handler
  const handleTestPushSignal = async () => {
    setIsTestingPush(true);
    try {
      const testPrice = ticker.price || 68500;
      const testPayload = {
        symbol: 'BTCUSD',
        action: 'BUY',
        price: testPrice,
        tp1: Math.round((testPrice + 1200) * 100) / 100,
        tp2: Math.round((testPrice + 2400) * 100) / 100,
        sl: Math.round((testPrice - 800) * 100) / 100,
        confidence: 91,
        timestamp: new Date().toISOString(),
        indicators: {
          rsi: 34.2,
          macd: 'bullish_cross',
          supertrend: 'buy_confirmed',
        },
      };

      const res = await fetch('/api/signal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(testPayload),
      });

      if (res.ok) {
        const json = await res.json();
        if (json.signal) {
          setActiveSignal(json.signal);
          const updated = appendStoredSignal(json.signal);
          setSignalsHistory(updated);
          if (config.soundAlerts) playSignalChime('BUY');
          if (config.pushNotifications) {
            sendLocalNotification('Test Webhook Signal Received', `BTCUSD BUY at $${testPrice}`);
          }
        }
      }
    } catch (e) {
      console.error('Test push error', e);
    } finally {
      setIsTestingPush(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#090d16] text-[#e2e8f0] flex flex-col font-sans selection:bg-[#2563eb]/30 selection:text-white">
      {/* Top Header */}
      <Header
        ticker={ticker}
        isOnline={navigator.onLine}
        isRefreshing={isRefreshing}
        onRefresh={loadData}
        onOpenSettings={() => setIsDrawerOpen(true)}
        hasTwelveDataKey={!!config.twelveDataApiKey}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Method Badge & Verification Sub-Strip */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-2.5 bg-[#0c1220] border border-[#1e293b] rounded-lg text-xs text-slate-400">
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <span className="flex items-center gap-1.5 text-slate-200 font-medium">
              <ShieldCheck className="w-4 h-4 text-[#00d09c]" />
              Pine Script Leo 2:1 Strategy Engine
            </span>
            <span>·</span>
            <span>Supertrend (Factor {config.sensitivity}, ATR 10)</span>
            <span>·</span>
            <span>MACD(12,26,9)</span>
            <span>·</span>
            <span>EMA 150/250 & HMA 55</span>
            <span>·</span>
            <span className="hidden sm:inline">ATR 2.2 Dynamic SL</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="font-mono text-slate-300">Hook:</span>
            <code className="bg-[#111827] px-2 py-0.5 rounded border border-[#1e293b] text-[#00d09c] font-mono">
              POST /api/signal
            </code>
          </div>
        </div>

        {/* Primary Row: Active Hero Signal Card */}
        {activeSignal ? (
          <HeroSignalCard signal={activeSignal} currentPrice={ticker.price} />
        ) : (
          <div className="bg-[#0c1220] border border-[#1e293b] rounded-xl p-8 text-center text-slate-400">
            <Activity className="w-8 h-8 mx-auto text-blue-500 animate-pulse mb-2" />
            <div className="text-sm font-semibold text-white">Analyzing BTC/USD Market Candles...</div>
            <div className="text-xs text-slate-500 mt-1">
              Executing Supertrend, Donchian, and 200 EMA confluence tests.
            </div>
          </div>
        )}

        {/* Live Candlestick Chart */}
        <TradingChart
          candles={candles}
          activeSignal={activeSignal}
          timeframe={config.timeframe}
          onTimeframeChange={tf => {
            const updated = { ...config, timeframe: tf };
            setConfig(updated);
            saveStoredConfig(updated);
          }}
          source={marketSource}
        />

        {/* Pine Script Backtest Matrix & Gann/Fib Anchors */}
        <BacktestStatsPanel stats={backtestStats} indicators={indicators} />

        {/* Secondary Panel: Signal History & Log Table */}
        <SignalLogTable signals={signalsHistory} onClearHistory={handleClearHistory} />
      </main>

      {/* Control Drawer / Settings Modal */}
      <ControlDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        config={config}
        onSaveConfig={handleSaveConfig}
        onTestPushSignal={handleTestPushSignal}
        isTestingPush={isTestingPush}
        onRefreshData={loadData}
      />

      {/* Offline Status Toast */}
      <OfflineIndicator />

      {/* Footer */}
      <footer className="border-t border-[#1e293b] bg-[#090d16] py-5 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div>
            SingleTrader BTC/USD · Quantitative Signal Generator & Pine Script 2:1 Analytics PWA
          </div>
          <div className="flex items-center gap-3">
            <span>Stand-alone PWA</span>
            <span>·</span>
            <span>IndexedDB & LocalStorage Cache</span>
            <span>·</span>
            <span>Real Spot Telemetry</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
