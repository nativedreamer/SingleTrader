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
        background: { type: ColorType.Solid, color: '#1c1917' },
        textColor: '#a8a29e',
        fontSize: 11,
        fontFamily: "'SF Mono', ui-monospace, Menlo, monospace",
      },
      grid: {
        vertLines: { color: '#2a2623' },
        horzLines: { color: '#2a2623' },
      },
      crosshair: {
        mode: 1,
        vertLine: { color: '#57534e', width: 1, style: LineStyle.Dashed },
        horzLine: { color: '#57534e', width: 1, style: LineStyle.Dashed },
      },
      rightPriceScale: {
        borderColor: '#44403c',
        scaleMargins: { top: 0.1, bottom: 0.12 },
      },
      timeScale: {
        borderColor: '#44403c',
        timeVisible: true,
        secondsVisible: false,
      },
      handleScroll: true,
      handleScale: true,
    });

    const candleSeries = chart.addSeries(CandlestickSeries, {
      upColor: '#6b9b7a',
      downColor: '#c45c5c',
      borderVisible: false,
      wickUpColor: '#6b9b7a',
      wickDownColor: '#c45c5c',
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

  useEffect(() => {
    if (!candleSeriesRef.current || !candles?.length) return;

    const sorted = [...candles]
      .filter((c, i, arr) => i === 0 || c.time !== arr[i - 1].time)
      .sort((a, b) => a.time - b.time)
      .map((c) => ({
        time: c.time as any,
        open: c.open,
        high: c.high,
        low: c.low,
        close: c.close,
      }));

    candleSeriesRef.current.setData(sorted);

    if (activeSignal && activeSignal.price > 0) {
      try {
        if (activeSignal.tp2 > 0) {
          candleSeriesRef.current.createPriceLine({
            price: activeSignal.tp2,
            color: '#6b9b7a',
            lineWidth: 1,
            lineStyle: LineStyle.Dotted,
            axisLabelVisible: true,
            title: 'TP2',
          });
        }
        if (activeSignal.sl > 0) {
          candleSeriesRef.current.createPriceLine({
            price: activeSignal.sl,
            color: '#c45c5c',
            lineWidth: 1,
            lineStyle: LineStyle.Solid,
            axisLabelVisible: true,
            title: 'SL',
          });
        }
        candleSeriesRef.current.createPriceLine({
          price: activeSignal.price,
          color: '#d4a574',
          lineWidth: 1,
          lineStyle: LineStyle.Dashed,
          axisLabelVisible: true,
          title: 'Entry',
        });
      } catch {
        /* */
      }
    }
  }, [candles, activeSignal]);

  const timeframes: ('1m' | '5m' | '15m' | '1h' | '4h')[] = ['1m', '5m', '15m', '1h', '4h'];

  return (
    <div className="group-card overflow-hidden">
      <div className="flex items-center justify-between gap-2 px-3 py-2.5 border-b border-[var(--border-subtle)]">
        <div className="min-w-0">
          <div className="text-[13px] font-semibold tracking-tight text-[var(--label)]">BTC/USD</div>
          <div className="text-[10px] text-[var(--tertiary)] font-mono truncate">{source}</div>
        </div>
        <div className="flex items-center gap-0.5 p-0.5 rounded-[10px] bg-[var(--bg)] border border-[var(--border-subtle)]">
          {timeframes.map((tf) => (
            <button
              key={tf}
              type="button"
              onClick={() => onTimeframeChange(tf)}
              className={`pressable h-8 min-w-[36px] px-2 rounded-[8px] text-[11px] font-mono tabular-nums ${
                timeframe === tf
                  ? 'bg-[var(--surface-2)] text-[var(--label)] font-semibold'
                  : 'text-[var(--tertiary)]'
              }`}
            >
              {tf.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      <div className="w-full h-[300px] sm:h-[360px] relative" ref={chartContainerRef}>
        {(!candles || candles.length === 0) && (
          <div className="absolute inset-0 flex items-center justify-center bg-[var(--surface)]/90 z-10">
            <div className="text-xs text-[var(--secondary)] flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-[var(--accent)] animate-pulse" />
              Loading chart…
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
