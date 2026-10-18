import React, { useState } from 'react';
import { ArrowDown, ArrowUp, Download, RefreshCw, Settings, Smartphone, Wifi, WifiOff } from 'lucide-react';
import { LiveTicker } from '../types/signal';
import { usePWAInstall } from '../hooks/usePWAInstall';

interface HeaderProps {
  ticker: LiveTicker;
  isOnline: boolean;
  isRefreshing: boolean;
  onRefresh: () => void;
  onOpenSettings: () => void;
  hasTwelveDataKey: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  ticker,
  isOnline,
  isRefreshing,
  onRefresh,
  onOpenSettings,
  hasTwelveDataKey,
}) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSModal, setShowIOSModal] = useState(false);

  const isPositive = ticker.change24h >= 0;

  return (
    <header className="border-b border-[#1e293b] bg-[#0c1220]/95 backdrop-blur-md sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
        {/* Zone 1: Brand & Ticker */}
        <div className="flex items-center gap-4 sm:gap-6">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#090d16] border border-[#1e293b] flex items-center justify-center text-white font-bold text-sm shadow-xs">
              <span className="text-[#00d09c]">S</span>
              <span className="text-blue-500">T</span>
            </div>
            <div>
              <span className="font-bold text-sm sm:text-base tracking-tight text-white whitespace-nowrap block leading-tight">
                SingleTrader
              </span>
              <span className="text-[10px] text-slate-400 font-mono block">
                BTC/USD 2:1 PWA
              </span>
            </div>
          </div>

          {/* Quick BTC/USD Live Price Ticker */}
          <div className="hidden sm:flex items-center gap-3 pl-4 border-l border-[#1e293b] font-mono tabular-nums">
            <div className="text-base font-bold text-white">
              ${ticker.price.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </div>
            <div
              className={`flex items-center gap-0.5 text-xs font-semibold ${
                isPositive ? 'text-[#00d09c]' : 'text-[#ef4444]'
              }`}
            >
              {isPositive ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />}
              {Math.abs(ticker.change24h).toFixed(2)}%
            </div>
            <div className="text-[11px] text-slate-400 hidden md:block">
              24h H: ${ticker.high24h.toLocaleString('en-US', { maximumFractionDigits: 0 })} · L: $
              {ticker.low24h.toLocaleString('en-US', { maximumFractionDigits: 0 })}
            </div>
          </div>
        </div>

        {/* Zone 2: Status & Primary Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Connection Status Indicator */}
          <div
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-mono border ${
              isOnline
                ? 'bg-[#111827] text-slate-300 border-[#1e293b]'
                : 'bg-amber-950/40 text-amber-300 border-amber-800/50'
            }`}
          >
            {isOnline ? (
              <>
                <span className="w-1.5 h-1.5 rounded-full bg-[#00d09c]" />
                <span className="hidden md:inline">
                  {hasTwelveDataKey ? 'Twelve Data' : 'Live Spot'}
                </span>
              </>
            ) : (
              <>
                <WifiOff className="w-3 h-3 text-amber-400" />
                <span>Offline</span>
              </>
            )}
          </div>

          {/* Manual Refresh Button */}
          <button
            onClick={onRefresh}
            disabled={isRefreshing}
            title="Refresh Data & Pine Indicators"
            className="p-2 text-slate-400 hover:text-white bg-[#111827] hover:bg-[#1e293b] border border-[#1e293b] rounded-lg transition"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-blue-400' : ''}`} />
          </button>

          {/* In-App PWA Install Prompt Button (Desktop & Android) */}
          {isInstallable && !isInstalled && (
            <button
              onClick={install}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#00d09c] hover:bg-[#00b98a] text-slate-950 rounded-lg text-xs font-bold transition shadow-xs whitespace-nowrap"
            >
              <Download className="w-3.5 h-3.5 stroke-[2.5]" />
              <span className="hidden sm:inline">Install PWA</span>
            </button>
          )}

          {/* iOS Safari Install Button */}
          {isIOS && !isInstalled && (
            <button
              onClick={() => setShowIOSModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#1e293b] hover:bg-[#334155] text-slate-200 rounded-lg text-xs font-medium transition border border-slate-700 whitespace-nowrap"
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>Install on iOS</span>
            </button>
          )}

          {/* Settings / Drawer Toggle */}
          <button
            onClick={onOpenSettings}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-[#1e293b] hover:bg-[#334155] border border-slate-700 rounded-lg transition whitespace-nowrap"
          >
            <Settings className="w-3.5 h-3.5 text-slate-400" />
            <span className="hidden sm:inline">Settings</span>
          </button>
        </div>
      </div>

      {/* Mobile Sub-Ticker */}
      <div className="sm:hidden px-4 py-1.5 bg-[#090d16] border-t border-[#1e293b] flex items-center justify-between text-xs font-mono">
        <div className="text-white font-bold">
          ${ticker.price.toLocaleString('en-US', { minimumFractionDigits: 2 })}
        </div>
        <div className={isPositive ? 'text-[#00d09c]' : 'text-[#ef4444]'}>
          {isPositive ? '+' : ''}
          {ticker.change24h.toFixed(2)}%
        </div>
        <div className="text-[11px] text-slate-400">
          H: ${ticker.high24h.toFixed(0)} · L: ${ticker.low24h.toFixed(0)}
        </div>
      </div>

      {/* iOS Install Instruction Modal */}
      {showIOSModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-sm rounded-xl bg-[#0c1220] border border-[#1e293b] p-6 text-white shadow-2xl">
            <h3 className="text-base font-bold text-white mb-2">Install SingleTrader on iOS</h3>
            <p className="text-xs text-slate-300 leading-relaxed space-y-2">
              <span className="block">1. Tap the <strong>Share</strong> button (box with upward arrow) in the Safari toolbar.</span>
              <span className="block">2. Scroll down and tap <strong>Add to Home Screen</strong>.</span>
              <span className="block">3. Tap <strong>Add</strong> in the top-right corner to install the standalone PWA.</span>
            </p>
            <button
              onClick={() => setShowIOSModal(false)}
              className="mt-5 w-full rounded-lg bg-blue-600 py-2 text-xs font-semibold text-white hover:bg-blue-700 transition"
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
