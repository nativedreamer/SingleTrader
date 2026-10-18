import React, { useState } from 'react';
import { ArrowDownRight, ArrowUpRight, Download, Filter, Search, Trash2 } from 'lucide-react';
import { SignalRecord } from '../types/signal';

interface SignalLogTableProps {
  signals: SignalRecord[];
  onClearHistory: () => void;
}

export const SignalLogTable: React.FC<SignalLogTableProps> = ({ signals, onClearHistory }) => {
  const [filterAction, setFilterAction] = useState<'ALL' | 'BUY' | 'SELL'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const filtered = signals.filter(sig => {
    if (filterAction !== 'ALL' && sig.action !== filterAction) {
      return false;
    }
    if (searchQuery.trim().length > 0) {
      const q = searchQuery.toLowerCase();
      const matchSymbol = sig.symbol.toLowerCase().includes(q);
      const matchSource = (sig.source || '').toLowerCase().includes(q);
      const matchStrength = (sig.strength || '').toLowerCase().includes(q);
      if (!matchSymbol && !matchSource && !matchStrength) return false;
    }
    return true;
  });

  const exportCSV = () => {
    if (signals.length === 0) return;
    const headers = ['Timestamp', 'Symbol', 'Action', 'Strength', 'Price', 'SL', 'TP1', 'TP2', 'Confidence', 'Source'];
    const rows = signals.map(s => [
      s.timestamp,
      s.symbol,
      s.action,
      s.strength || '',
      s.price,
      s.sl,
      s.tp1,
      s.tp2,
      s.confidence,
      s.source,
    ]);
    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `singletrader_signals_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="bg-[#0c1220] border border-[#1e293b] rounded-xl overflow-hidden">
      {/* Table Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 border-b border-[#1e293b]">
        <div>
          <h3 className="text-sm font-semibold text-white">Signal History & Verification Log</h3>
          <div className="text-xs text-slate-400 mt-0.5">
            Deterministic execution log backed by 2:1 Pine Script algorithm
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Action Filter Segmented Control */}
          <div className="flex items-center gap-1 bg-[#111827] p-1 rounded-lg border border-[#1e293b]">
            <button
              onClick={() => setFilterAction('ALL')}
              className={`px-2.5 py-1 text-xs font-medium rounded transition-colors ${
                filterAction === 'ALL' ? 'bg-[#1e293b] text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              All ({signals.length})
            </button>
            <button
              onClick={() => setFilterAction('BUY')}
              className={`px-2.5 py-1 text-xs font-medium rounded transition-colors ${
                filterAction === 'BUY' ? 'bg-[#00d09c]/20 text-[#00d09c] font-semibold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              BUY
            </button>
            <button
              onClick={() => setFilterAction('SELL')}
              className={`px-2.5 py-1 text-xs font-medium rounded transition-colors ${
                filterAction === 'SELL' ? 'bg-[#ef4444]/20 text-[#ef4444] font-semibold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              SELL
            </button>
          </div>

          {/* Search Box */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search log..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="bg-[#111827] border border-[#1e293b] rounded-lg pl-8 pr-3 py-1 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 w-32 sm:w-40 font-mono"
            />
          </div>

          {/* Export CSV */}
          <button
            onClick={exportCSV}
            title="Download CSV"
            className="flex items-center gap-1.5 px-3 py-1 text-xs font-medium text-slate-300 bg-[#111827] hover:bg-[#1e293b] border border-[#1e293b] rounded-lg transition-colors whitespace-nowrap"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Export</span>
          </button>

          {/* Clear Log */}
          {signals.length > 0 && (
            <button
              onClick={onClearHistory}
              title="Clear Log"
              className="p-1.5 text-slate-400 hover:text-red-400 bg-[#111827] hover:bg-[#1e293b] border border-[#1e293b] rounded-lg transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Table Content */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-[#090d16] text-slate-400 uppercase tracking-wider text-[10px] font-semibold border-b border-[#1e293b]">
              <th className="py-2.5 px-4 font-mono">Time (UTC)</th>
              <th className="py-2.5 px-4">Action</th>
              <th className="py-2.5 px-4 font-mono text-right">Entry ($)</th>
              <th className="py-2.5 px-4 font-mono text-right">Dynamic SL</th>
              <th className="py-2.5 px-4 font-mono text-right">TP1 (1:1)</th>
              <th className="py-2.5 px-4 font-mono text-right">TP2 (2:1 Core)</th>
              <th className="py-2.5 px-4 font-mono text-center">Score</th>
              <th className="py-2.5 px-4 text-right">Engine Source</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#1e293b]">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-8 text-center text-slate-500">
                  No signals recorded matching the active criteria.
                </td>
              </tr>
            ) : (
              filtered.map(sig => {
                const isBuy = sig.action === 'BUY';
                const isSell = sig.action === 'SELL';
                return (
                  <tr
                    key={sig.id}
                    className="hover:bg-[#111827]/70 transition-colors font-mono tabular-nums"
                  >
                    <td className="py-2.5 px-4 text-slate-400 whitespace-nowrap">
                      {new Date(sig.timestamp).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit',
                      })}
                    </td>
                    <td className="py-2.5 px-4 whitespace-nowrap font-sans font-semibold">
                      <div className="flex items-center gap-1.5">
                        {isBuy ? (
                          <ArrowUpRight className="w-3.5 h-3.5 text-[#00d09c]" />
                        ) : isSell ? (
                          <ArrowDownRight className="w-3.5 h-3.5 text-[#ef4444]" />
                        ) : null}
                        <span className={isBuy ? 'text-[#00d09c]' : isSell ? 'text-[#ef4444]' : 'text-slate-400'}>
                          {sig.strength || sig.action}
                        </span>
                      </div>
                    </td>
                    <td className="py-2.5 px-4 text-right text-white font-medium">
                      ${sig.price.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-2.5 px-4 text-right text-[#ef4444]">
                      ${sig.sl.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-2.5 px-4 text-right text-[#00d09c]">
                      ${sig.tp1.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-2.5 px-4 text-right text-[#00d09c] font-bold">
                      ${sig.tp2.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-2.5 px-4 text-center">
                      <span className="text-white font-bold">{sig.confidence}%</span>
                    </td>
                    <td className="py-2.5 px-4 text-right text-slate-400 font-sans text-[11px] truncate max-w-[120px]">
                      {sig.source === 'pine_script_engine'
                        ? 'Pine Script 2:1'
                        : sig.source === 'python_script'
                        ? 'Python REST Hook'
                        : sig.source}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
