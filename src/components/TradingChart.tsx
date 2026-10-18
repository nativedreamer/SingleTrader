import React, { useEffect, useRef } from 'react';
import { createChart, ColorType, CandlestickSeries, LineStyle, IChartApi, ISeriesApi } from 'lightweight-charts';
import { MarketCandle, SignalRecord } from '../types/signal';

interface TradingChartProps {
  candles: MarketCandle[];
  activeSignal?: SignalRecord | null;
  timeframe: string;
  onTimeframeChange: (tf: '1m' | '5m' | '15m' | '1h' | '4h') => void;
  source: string;
}

export const TradingChart: React.FC<TradingChartProps> = ({
  candles,
  activeSignal,
  timeframe,
  onTimeframeChange,
  source,
}) => {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const candleSeriesRef = useRef<ISeriesApi<any> | null>(null);

  useEffect(() => {
    if (!chartContainerRef.current) return;

    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: '#090d16' },
        textColor: '#94a3b8',
        fontSize: 11,
        fontFamily: "'JetBrains Mono', monospace",
      },
      grid: {
        vertLines: { color: '#131c2e' },
        horzLines: { color: '#131c2e' },
      },
      crosshair: {
        mode: 1,
        vertLine: {
          color: '#334155',
          width: 1,
          style: LineStyle.Dashed,
        },
        horzLine: {
          color: '#334155',
          width: 1,
          style: LineStyle.Dashed,
        },
      },
      rightPriceScale: {
        borderColor: '#1e293b',
        scaleMargins: {
          top: 0.1,
          bottom: 0.15,
        },
      },
      timeScale: {
        borderColor: '#1e293b',
        timeVisible: true,
        secondsVisible: false,
      },
      handleScroll: true,
      handleScale: true,
    });

    const candleSeries = chart.addSeries(CandlestickSeries, {
      upColor: '#00d09c',
      downColor: '#ef4444',
      borderVisible: false,
      wickUpColor: '#00d09c',
      wickDownColor: '#ef4444',
    });

    chartRef.current = chart;
    candleSeriesRef.current = candleSeries;

    const handleResize = () => {
      if (chartContainerRef.current) {
        chart.applyOptions({
          width: chartContainerRef.current.clientWidth,
          height: chartContainerRef.current.clientHeight,
        });
      }
    };

    window.addEventListener('resize', handleResize);
    handleResize();

    return () => {
      window.removeEventListener('resize', handleResize);
      chart.remove();
      chartRef.current = null;
      candleSeriesRef.current = null;
    };
  }, []);

  // Update candle data and price lines
  useEffect(() => {
    if (!candleSeriesRef.current || !candles || candles.length === 0) return;

    // Filter duplicates and sort chronologically
    const sortedCandles = [...candles]
      .filter((c, i, arr) => i === 0 || c.time > arr[i - 1].time)
      .map(c => ({
        time: c.time as any,
        open: c.open,
        high: c.high,
        low: c.low,
        close: c.close,
      }));

    candleSeriesRef.current.setData(sortedCandles);

    // If active signal exists, draw Target and Stop Loss price lines
    if (activeSignal && activeSignal.price > 0 && chartRef.current) {
      try {
        if (activeSignal.tp2 > 0) {
          candleSeriesRef.current.createPriceLine({
            price: activeSignal.tp2,
            color: '#00d09c',
            lineWidth: 1,
            lineStyle: LineStyle.Dotted,
            axisLabelVisible: true,
            title: 'TP2 (2:1)',
          });
        }
        if (activeSignal.sl > 0) {
          candleSeriesRef.current.createPriceLine({
            price: activeSignal.sl,
            color: '#ef4444',
            lineWidth: 1,
            lineStyle: LineStyle.Solid,
            axisLabelVisible: true,
            title: 'SL (ATR 2.2)',
          });
        }
        candleSeriesRef.current.createPriceLine({
          price: activeSignal.price,
          color: '#f59e0b',
          lineWidth: 1,
          lineStyle: LineStyle.Dashed,
          axisLabelVisible: true,
          title: 'Entry',
        });
      } catch (e) {
        // Line may already exist
      }
    }
  }, [candles, activeSignal]);

  const timeframes: ('1m' | '5m' | '15m' | '1h' | '4h')[] = ['1m', '5m', '15m', '1h', '4h'];

  return (
    <div className="flex flex-col bg-[#0c1220] border border-[#1e293b] rounded-lg overflow-hidden">
      {/* Chart Toolbar */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-[#1e293b] text-xs">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-slate-200">BTC/USD Live Chart</span>
          <span className="text-slate-500">·</span>
          <span className="text-slate-400 font-mono">{source}</span>
        </div>

        {/* Timeframe Segmented Control */}
        <div className="flex items-center gap-1 bg-[#131c2e] p-0.5 rounded-md">
          {timeframes.map(tf => (
            <button
              key={tf}
              onClick={() => onTimeframeChange(tf)}
              className={`px-2 py-1 rounded text-xs font-mono transition-colors ${
                timeframe === tf
                  ? 'bg-[#1e293b] text-white font-medium'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {tf.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Chart Canvas Container */}
      <div className="w-full h-[320px] sm:h-[380px] relative" ref={chartContainerRef}>
        {(!candles || candles.length === 0) && (
          <div className="absolute inset-0 flex items-center justify-center bg-[#090d16]/80 z-10">
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <span className="h-2 w-2 rounded-full bg-blue-500 animate-pulse" />
              Loading real-time candlestick telemetry...
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
