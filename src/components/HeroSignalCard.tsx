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

  const riskDistance = Math.abs(signal.price - signal.sl);
  const rewardDistanceTP1 = Math.abs(signal.tp1 - signal.price);
  const rewardDistanceTP2 = Math.abs(signal.tp2 - signal.price);

  const priceDiff = currentPrice - signal.price;
  const pnlPct = signal.price > 0 ? ((isBuy ? priceDiff : -priceDiff) / signal.price) * 100 : 0;

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
    <div className="group-card p-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[var(--border-subtle)]">
        <div className="flex items-center gap-3">
          <div
            className={`w-12 h-12 rounded-[14px] flex items-center justify-center border ${
              isBuy
                ? 'bg-[var(--positive)]/15 text-[var(--positive)] border-[var(--positive)]/25'
                : isSell
                  ? 'bg-[var(--negative)]/15 text-[var(--negative)] border-[var(--negative)]/25'
                  : 'bg-[var(--surface-2)] text-[var(--secondary)] border-[var(--border)]'
            }`}
          >
            {isBuy ? (
              <ArrowUpRight className="w-6 h-6" strokeWidth={2.25} />
            ) : isSell ? (
              <ArrowDownRight className="w-6 h-6" strokeWidth={2.25} />
            ) : (
              <Zap className="w-6 h-6" strokeWidth={2.25} />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[20px] font-semibold tracking-tight font-mono tabular-nums">{signal.symbol}</span>
              <span
                className={`text-[13px] font-semibold ${
                  isBuy ? 'text-[var(--positive)]' : isSell ? 'text-[var(--negative)]' : 'text-[var(--secondary)]'
                }`}
              >
                {signal.strength ? signal.strength.replace(/_/g, ' ') : signal.action}
              </span>
            </div>
            <div className="text-[12px] text-[var(--tertiary)] mt-0.5 font-mono tabular-nums">
              {new Date(signal.timestamp).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
              })}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 px-3.5 py-2.5 rounded-[12px] bg-[var(--bg)] border border-[var(--border-subtle)]">
          <div>
            <div className="text-[10px] uppercase tracking-wide text-[var(--tertiary)] font-medium">Confluence</div>
            <div className="text-[17px] font-semibold font-mono tabular-nums">{signal.confidence}%</div>
          </div>
          <div className="w-10 h-10 relative">
            <svg className="w-10 h-10 -rotate-90" viewBox="0 0 40 40">
              <circle cx="20" cy="20" r="16" stroke="var(--border)" strokeWidth="2.5" fill="none" />
              <circle
                cx="20"
                cy="20"
                r="16"
                stroke={isBuy ? 'var(--positive)' : isSell ? 'var(--negative)' : 'var(--accent)'}
                strokeWidth="2.5"
                fill="none"
                strokeDasharray={100}
                strokeDashoffset={100 - signal.confidence}
                strokeLinecap="round"
              />
            </svg>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 py-4 border-b border-[var(--border-subtle)]">
        <div>
          <div className="text-[11px] text-[var(--tertiary)] mb-1">Entry</div>
          <div className="text-[17px] font-semibold font-mono tabular-nums">{formatPrice(signal.price)}</div>
          <div className="text-[11px] text-[var(--tertiary)] font-mono mt-0.5">Spot {formatPrice(currentPrice)}</div>
        </div>
        <div>
          <div className="text-[11px] text-[var(--tertiary)] mb-1 inline-flex items-center gap-1">
            <ShieldAlert className="w-3 h-3 text-[var(--negative)]" /> Stop
          </div>
          <div className="text-[17px] font-semibold font-mono tabular-nums text-[var(--negative)]">
            {formatPrice(signal.sl)}
          </div>
          <div className="text-[11px] text-[var(--tertiary)] font-mono mt-0.5">
            {riskDistance > 0 ? `−$${riskDistance.toFixed(0)}` : '—'}
          </div>
        </div>
        <div>
          <div className="text-[11px] text-[var(--tertiary)] mb-1 inline-flex items-center gap-1">
            <Target className="w-3 h-3 text-[var(--positive)]" /> TP1
          </div>
          <div className="text-[17px] font-semibold font-mono tabular-nums text-[var(--positive)]">
            {formatPrice(signal.tp1)}
          </div>
          <div className="text-[11px] text-[var(--tertiary)] font-mono mt-0.5">
            {rewardDistanceTP1 > 0 ? `+$${rewardDistanceTP1.toFixed(0)}` : '—'}
          </div>
        </div>
        <div>
          <div className="text-[11px] text-[var(--tertiary)] mb-1 inline-flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3 text-[var(--positive)]" /> TP2
          </div>
          <div className="text-[17px] font-semibold font-mono tabular-nums text-[var(--positive)]">
            {formatPrice(signal.tp2)}
          </div>
          <div className="text-[11px] text-[var(--tertiary)] font-mono mt-0.5">
            {rewardDistanceTP2 > 0 ? `+$${rewardDistanceTP2.toFixed(0)}` : '—'}
          </div>
        </div>
      </div>

      <div className="pt-4">
        <div className="flex items-center justify-between text-[11px] text-[var(--tertiary)] mb-2">
          <span>Trajectory SL → TP2</span>
          <span className="font-mono tabular-nums">
            PnL{' '}
            <strong className={pnlPct >= 0 ? 'text-[var(--positive)]' : 'text-[var(--negative)]'}>
              {pnlPct >= 0 ? '+' : ''}
              {pnlPct.toFixed(2)}%
            </strong>
          </span>
        </div>
        <div className="w-full h-2 rounded-full overflow-hidden bg-[var(--bg)] border border-[var(--border-subtle)]">
          <div
            className={`h-full transition-all duration-300 ${
              isBuy ? 'bg-[var(--positive)]' : isSell ? 'bg-[var(--negative)]' : 'bg-[var(--accent)]'
            }`}
            style={{ width: `${progressPct}%` }}
          />
        </div>
        <div className="flex flex-wrap gap-x-3 gap-y-1 mt-3 text-[11px] text-[var(--tertiary)] font-mono tabular-nums">
          <span>
            RSI <span className="text-[var(--label)]">{signal.indicators?.rsi ?? '—'}</span>
          </span>
          <span>
            Supertrend{' '}
            <span className={signal.indicators?.supertrendDirection === 1 ? 'text-[var(--positive)]' : 'text-[var(--negative)]'}>
              {signal.indicators?.supertrendDirection === 1 ? 'Bull' : 'Bear'}
            </span>
          </span>
          <span>
            EMA200{' '}
            <span className="text-[var(--label)]">
              {signal.indicators?.ema200 ? `$${signal.indicators.ema200}` : '—'}
            </span>
          </span>
        </div>
      </div>
    </div>
  );
};
