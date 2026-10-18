import React from 'react';
import { ArrowDownRight, ArrowUpRight, CheckCircle2, ShieldAlert, Target, Zap } from 'lucide-react';
import { SignalRecord } from '../types/signal';

interface HeroSignalCardProps {
  signal: SignalRecord;
  currentPrice: number;
}

export const HeroSignalCard: React.FC<HeroSignalCardProps> = ({ signal, currentPrice }) => {
  const isBuy = signal.action === 'BUY';
  const isSell = signal.action === 'SELL';
  const isHold = signal.action === 'HOLD';

  const riskDistance = Math.abs(signal.price - signal.sl);
  const rewardDistanceTP1 = Math.abs(signal.tp1 - signal.price);
  const rewardDistanceTP2 = Math.abs(signal.tp2 - signal.price);

  const priceDiff = currentPrice - signal.price;
  const pnlPct = signal.price > 0 ? ((isBuy ? priceDiff : -priceDiff) / signal.price) * 100 : 0;

  // Calculation of progress bar from SL to TP2
  let progressPct = 50;
  if (isBuy && signal.tp2 > signal.sl) {
    progressPct = Math.min(100, Math.max(0, ((currentPrice - signal.sl) / (signal.tp2 - signal.sl)) * 100));
  } else if (isSell && signal.sl > signal.tp2) {
    progressPct = Math.min(100, Math.max(0, ((signal.sl - currentPrice) / (signal.sl - signal.tp2)) * 100));
  }

  const formatPrice = (val: number) =>
    val > 0
      ? `$${val.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
      : '—';

  return (
    <div className="bg-[#0c1220] border border-[#1e293b] rounded-xl p-5 sm:p-6 transition-all">
      {/* Top Banner: Signal Action & Confidence */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-[#1e293b]">
        <div className="flex items-center gap-3">
          <div
            className={`w-12 h-12 rounded-lg flex items-center justify-center font-bold text-lg ${
              isBuy
                ? 'bg-[#00d09c]/15 text-[#00d09c] border border-[#00d09c]/30'
                : isSell
                ? 'bg-[#ef4444]/15 text-[#ef4444] border border-[#ef4444]/30'
                : 'bg-slate-800 text-slate-300 border border-slate-700'
            }`}
          >
            {isBuy ? (
              <ArrowUpRight className="w-6 h-6 stroke-[2.5]" />
            ) : isSell ? (
              <ArrowDownRight className="w-6 h-6 stroke-[2.5]" />
            ) : (
              <Zap className="w-6 h-6 stroke-[2.5]" />
            )}
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl font-bold tracking-tight text-white font-mono">
                {signal.symbol}
              </span>
              <span className="text-slate-500">·</span>
              <span
                className={`text-sm font-semibold tracking-wide ${
                  isBuy ? 'text-[#00d09c]' : isSell ? 'text-[#ef4444]' : 'text-slate-400'
                }`}
              >
                {signal.strength ? signal.strength.replace('_', ' ') : signal.action}
              </span>
            </div>

            <div className="text-xs text-slate-400 flex items-center gap-2 mt-0.5">
              <span>Confirmed on 2:1 Pine Engine</span>
              <span>·</span>
              <span className="font-mono">
                {new Date(signal.timestamp).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                  second: '2-digit',
                })}
              </span>
            </div>
          </div>
        </div>

        {/* Confidence Gauge */}
        <div className="flex items-center gap-4 bg-[#111827] px-4 py-2.5 rounded-lg border border-[#1e293b]/70 shrink-0">
          <div>
            <div className="text-[11px] uppercase tracking-wider text-slate-400 font-medium">
              Confluence Score
            </div>
            <div className="text-lg font-bold text-white font-mono flex items-center gap-1.5">
              <span>{signal.confidence}%</span>
              <span className="text-xs font-normal text-slate-400">algorithm</span>
            </div>
          </div>

          <div className="w-10 h-10 rounded-full border-2 border-slate-700 flex items-center justify-center relative">
            <svg className="w-10 h-10 transform -rotate-90">
              <circle
                cx="20"
                cy="20"
                r="16"
                stroke="currentColor"
                strokeWidth="2.5"
                fill="transparent"
                className="text-slate-800"
              />
              <circle
                cx="20"
                cy="20"
                r="16"
                stroke="currentColor"
                strokeWidth="2.5"
                fill="transparent"
                strokeDasharray={100}
                strokeDashoffset={100 - signal.confidence}
                strokeLinecap="round"
                className={isBuy ? 'text-[#00d09c]' : isSell ? 'text-[#ef4444]' : 'text-blue-500'}
              />
            </svg>
          </div>
        </div>
      </div>

      {/* Main Trade Parameters Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 py-5 border-b border-[#1e293b]">
        {/* Entry Price */}
        <div>
          <div className="text-xs text-slate-400 mb-1 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
            Entry Price
          </div>
          <div className="text-lg sm:text-xl font-bold font-mono text-white">
            {formatPrice(signal.price)}
          </div>
          <div className="text-[11px] text-slate-400 font-mono mt-0.5">
            Spot: {formatPrice(currentPrice)}
          </div>
        </div>

        {/* Stop Loss */}
        <div>
          <div className="text-xs text-slate-400 mb-1 flex items-center gap-1.5">
            <ShieldAlert className="w-3.5 h-3.5 text-[#ef4444]" />
            Dynamic Stop Loss
          </div>
          <div className="text-lg sm:text-xl font-bold font-mono text-[#ef4444]">
            {formatPrice(signal.sl)}
          </div>
          <div className="text-[11px] text-slate-400 font-mono mt-0.5">
            Risk: {riskDistance > 0 ? `-$${riskDistance.toFixed(1)}` : '—'}
          </div>
        </div>

        {/* Take Profit 1 (1:1 RRR) */}
        <div>
          <div className="text-xs text-slate-400 mb-1 flex items-center gap-1.5">
            <Target className="w-3.5 h-3.5 text-[#00d09c]" />
            Target 1 (1:1 RRR)
          </div>
          <div className="text-lg sm:text-xl font-bold font-mono text-[#00d09c]">
            {formatPrice(signal.tp1)}
          </div>
          <div className="text-[11px] text-slate-400 font-mono mt-0.5">
            Gain: {rewardDistanceTP1 > 0 ? `+$${rewardDistanceTP1.toFixed(1)}` : '—'}
          </div>
        </div>

        {/* Take Profit 2 (2:1 RRR - Core) */}
        <div>
          <div className="text-xs text-slate-400 mb-1 flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-[#00d09c]" />
            Target 2 (2:1 Core)
          </div>
          <div className="text-lg sm:text-xl font-bold font-mono text-[#00d09c]">
            {formatPrice(signal.tp2)}
          </div>
          <div className="text-[11px] text-slate-400 font-mono mt-0.5">
            Gain: {rewardDistanceTP2 > 0 ? `+$${rewardDistanceTP2.toFixed(1)}` : '—'}
          </div>
        </div>
      </div>

      {/* Real-time Target Trajectory Meter */}
      <div className="pt-4">
        <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
          <span>Target Trajectory (SL ➜ TP2)</span>
          <span className="font-mono">
            Unrealized PnL:{' '}
            <strong className={pnlPct >= 0 ? 'text-[#00d09c]' : 'text-[#ef4444]'}>
              {pnlPct >= 0 ? '+' : ''}
              {pnlPct.toFixed(2)}%
            </strong>
          </span>
        </div>

        <div className="w-full bg-[#111827] h-2.5 rounded-full overflow-hidden relative border border-[#1e293b]">
          <div
            className={`h-full transition-all duration-500 ${
              isBuy ? 'bg-[#00d09c]' : isSell ? 'bg-[#ef4444]' : 'bg-blue-500'
            }`}
            style={{ width: `${progressPct}%` }}
          />
        </div>

        {/* Indicator Confluence Telemetry */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 mt-3.5 text-xs text-slate-400 font-mono">
          <div>
            RSI(14): <span className="text-white font-medium">{signal.indicators?.rsi || '—'}</span>
          </div>
          <span>·</span>
          <div>
            Supertrend:{' '}
            <span
              className={
                signal.indicators?.supertrendDirection === 1 ? 'text-[#00d09c]' : 'text-[#ef4444]'
              }
            >
              {signal.indicators?.supertrendDirection === 1 ? 'Bullish' : 'Bearish'}
            </span>
          </div>
          <span>·</span>
          <div>
            200 EMA Baseline:{' '}
            <span className="text-white font-medium">
              {signal.indicators?.ema200 ? `$${signal.indicators.ema200}` : '—'}
            </span>
          </div>
          <span>·</span>
          <div>
            Source: <span className="text-slate-300">{signal.source}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
