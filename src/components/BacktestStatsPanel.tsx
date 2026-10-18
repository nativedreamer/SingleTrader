import React from 'react';
import { BarChart3, Compass, CheckCircle, AlertTriangle } from 'lucide-react';
import { BacktestSummary } from '../types/signal';

interface BacktestStatsPanelProps {
  stats: BacktestSummary;
  indicators: any;
}

export const BacktestStatsPanel: React.FC<BacktestStatsPanelProps> = ({ stats, indicators }) => {
  const isProfitable = stats.netR >= 0;
  const gann = indicators?.gann;
  const fib = indicators?.fib;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      {/* 2:1 Strategy Backtest Metrics (Pine Script Module) */}
      <div className="lg:col-span-2 bg-[#0c1220] border border-[#1e293b] rounded-xl p-4 sm:p-5">
        <div className="flex items-center justify-between pb-3 mb-3 border-b border-[#1e293b]">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-blue-400" />
            <h4 className="text-sm font-semibold text-white">
              Backtest Performance Matrix (Leo 2:1 Strategy)
            </h4>
          </div>
          <div className="text-xs font-mono">
            <span
              className={`font-semibold ${
                stats.verdict.includes('ABOVE')
                  ? 'text-[#00d09c]'
                  : stats.verdict.includes('BELOW')
                  ? 'text-[#ef4444]'
                  : 'text-amber-400'
              }`}
            >
              {stats.verdict}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono tabular-nums">
          <div className="bg-[#111827] p-2.5 rounded-lg border border-[#1e293b]">
            <div className="text-[11px] text-slate-400 font-sans">Closed Trades (L / S)</div>
            <div className="text-base font-bold text-white mt-1">
              {stats.totalTrades}{' '}
              <span className="text-xs font-normal text-slate-400">
                ({stats.buys} / {stats.sells})
              </span>
            </div>
          </div>

          <div className="bg-[#111827] p-2.5 rounded-lg border border-[#1e293b]">
            <div className="text-[11px] text-slate-400 font-sans">Win Rate % (TP Hit)</div>
            <div
              className={`text-base font-bold mt-1 ${
                stats.winRate >= 33.3 ? 'text-[#00d09c]' : 'text-slate-300'
              }`}
            >
              {stats.winRate.toFixed(1)}%
              <span className="text-[10px] text-slate-400 block font-normal font-sans">
                BE Threshold: 33.3%
              </span>
            </div>
          </div>

          <div className="bg-[#111827] p-2.5 rounded-lg border border-[#1e293b]">
            <div className="text-[11px] text-slate-400 font-sans">Profit Factor</div>
            <div
              className={`text-base font-bold mt-1 ${
                stats.profitFactor >= 1.2 ? 'text-[#00d09c]' : 'text-slate-300'
              }`}
            >
              {stats.profitFactor.toFixed(2)}
            </div>
          </div>

          <div className="bg-[#111827] p-2.5 rounded-lg border border-[#1e293b]">
            <div className="text-[11px] text-slate-400 font-sans">Net R-Multiple</div>
            <div
              className={`text-base font-bold mt-1 ${
                isProfitable ? 'text-[#00d09c]' : 'text-[#ef4444]'
              }`}
            >
              {isProfitable ? '+' : ''}
              {stats.netR.toFixed(2)}R
            </div>
          </div>

          <div className="bg-[#111827] p-2.5 rounded-lg border border-[#1e293b]">
            <div className="text-[11px] text-slate-400 font-sans">Avg R per Trade</div>
            <div className="text-base font-bold text-white mt-1">
              {stats.avgR >= 0 ? '+' : ''}
              {stats.avgR.toFixed(3)}R
            </div>
          </div>

          <div className="bg-[#111827] p-2.5 rounded-lg border border-[#1e293b]">
            <div className="text-[11px] text-slate-400 font-sans">Target Hits (TP1 / TP2)</div>
            <div className="text-base font-bold text-white mt-1">
              {stats.tp1Hits} / <span className="text-[#00d09c]">{stats.tp2Hits}</span>
            </div>
          </div>

          <div className="bg-[#111827] p-2.5 rounded-lg border border-[#1e293b]">
            <div className="text-[11px] text-slate-400 font-sans">Max Loss Streak</div>
            <div className="text-base font-bold text-slate-200 mt-1">
              {stats.maxConsecutiveLosses} trades
            </div>
          </div>

          <div className="bg-[#111827] p-2.5 rounded-lg border border-[#1e293b]">
            <div className="text-[11px] text-slate-400 font-sans">Risk-Reward Model</div>
            <div className="text-base font-bold text-blue-400 mt-1">2.0 : 1 RRR</div>
          </div>
        </div>
      </div>

      {/* Gann Square of 9 & OSTDV Structure */}
      <div className="bg-[#0c1220] border border-[#1e293b] rounded-xl p-4 sm:p-5 flex flex-col justify-between">
        <div>
          <div className="flex items-center gap-2 pb-3 mb-3 border-b border-[#1e293b]">
            <Compass className="w-4 h-4 text-purple-400" />
            <h4 className="text-sm font-semibold text-white">Gann & Fibonacci Anchors</h4>
          </div>

          <div className="space-y-2 text-xs font-mono tabular-nums">
            <div className="flex justify-between items-center py-1 border-b border-[#1e293b]/50">
              <span className="text-slate-400 font-sans">Gann Resistance (R1 / R2)</span>
              <span className="text-[#ef4444] font-semibold">
                ${gann?.r1 || '—'} / ${gann?.r2 || '—'}
              </span>
            </div>
            <div className="flex justify-between items-center py-1 border-b border-[#1e293b]/50">
              <span className="text-slate-400 font-sans">Gann Support (S1 / S2)</span>
              <span className="text-[#00d09c] font-semibold">
                ${gann?.s1 || '—'} / ${gann?.s2 || '—'}
              </span>
            </div>
            <div className="flex justify-between items-center py-1 border-b border-[#1e293b]/50">
              <span className="text-slate-400 font-sans">Gann Equilibrium Pivot</span>
              <span className="text-blue-400 font-semibold">${gann?.blueGann || '—'}</span>
            </div>
            <div className="flex justify-between items-center py-1 border-b border-[#1e293b]/50">
              <span className="text-slate-400 font-sans">OSTDV 2.016 Expansion</span>
              <span className="text-teal-400 font-semibold">${fib?.tp2Up || '—'}</span>
            </div>
            <div className="flex justify-between items-center py-1">
              <span className="text-slate-400 font-sans">OSTDV -1.016 Expansion</span>
              <span className="text-orange-400 font-semibold">${fib?.tp2Dn || '—'}</span>
            </div>
          </div>
        </div>

        <div className="mt-3 pt-2 text-[10px] text-slate-500 font-sans">
          Gann Square of 9 computed from current BTC price denominator.
        </div>
      </div>
    </div>
  );
};
