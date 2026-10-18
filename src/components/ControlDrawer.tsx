import React, { useState } from 'react';
import { Bell, Check, Copy, Key, Play, RefreshCw, Settings, Sliders, Volume2, X } from 'lucide-react';
import { StrategyConfig } from '../types/signal';

interface ControlDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  config: StrategyConfig;
  onSaveConfig: (newConfig: StrategyConfig) => void;
  onTestPushSignal: () => Promise<void>;
  isTestingPush: boolean;
  onRefreshData: () => void;
}

export const ControlDrawer: React.FC<ControlDrawerProps> = ({
  isOpen,
  onClose,
  config,
  onSaveConfig,
  onTestPushSignal,
  isTestingPush,
  onRefreshData,
}) => {
  const [formData, setFormData] = useState<StrategyConfig>({ ...config });
  const [apiKeyInput, setApiKeyInput] = useState(config.twelveDataApiKey || '');
  const [copiedCurl, setCopiedCurl] = useState(false);
  const [copiedPython, setCopiedPython] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSave = () => {
    const updated = {
      ...formData,
      twelveDataApiKey: apiKeyInput.trim(),
    };
    onSaveConfig(updated);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2000);
  };

  const curlExample = `curl -X POST https://your-domain.vercel.app/api/signal \\
  -H "Content-Type: application/json" \\
  -d '{
    "symbol": "BTCUSD",
    "action": "BUY",
    "price": 68500.00,
    "tp1": 70000.00,
    "tp2": 72000.00,
    "sl": 67000.00,
    "confidence": 88,
    "timestamp": "${new Date().toISOString()}",
    "indicators": { "rsi": 32, "macd": "bullish_cross" }
  }'`;

  const pythonExample = `import requests
import datetime

url = "https://your-domain.vercel.app/api/signal" # or http://localhost:3000/api/signal
payload = {
    "symbol": "BTCUSD",
    "action": "BUY",
    "price": 68500.00,
    "tp1": 70000.00,
    "tp2": 72000.00,
    "sl": 67000.00,
    "confidence": 88,
    "timestamp": datetime.datetime.utcnow().isoformat() + "Z",
    "indicators": {"rsi": 32.4, "macd": "bullish_cross"}
}

response = requests.post(url, json=payload)
print(response.status_code, response.json())`;

  const copyToClipboard = (text: string, type: 'curl' | 'python') => {
    navigator.clipboard.writeText(text);
    if (type === 'curl') {
      setCopiedCurl(true);
      setTimeout(() => setCopiedCurl(false), 2000);
    } else {
      setCopiedPython(true);
      setTimeout(() => setCopiedPython(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/60 backdrop-blur-xs flex justify-end">
      <div className="w-full max-w-lg bg-[#0c1220] border-l border-[#1e293b] h-full overflow-y-auto flex flex-col p-6 text-slate-200">
        {/* Drawer Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[#1e293b]">
          <div className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-blue-400" />
            <h2 className="text-base font-bold text-white">Engine Parameters & API Hooks</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-[#1e293b] transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-6 py-6 flex-1">
          {/* Section 1: Twelve Data API Key */}
          <div className="bg-[#111827] border border-[#1e293b] rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2 text-white font-semibold text-sm">
              <Key className="w-4 h-4 text-amber-400" />
              Twelve Data Live Market API Key
            </div>
            <p className="text-xs text-slate-400 mb-3">
              Input your personal Twelve Data API key to route live BTC/USD ticks & candlestick series
              directly from Twelve Data.
            </p>

            <div className="flex gap-2">
              <input
                type="password"
                value={apiKeyInput}
                onChange={e => setApiKeyInput(e.target.value)}
                placeholder="Enter Twelve Data API key..."
                className="flex-1 bg-[#090d16] border border-[#1e293b] rounded-lg px-3 py-2 text-xs font-mono text-white placeholder-slate-600 focus:outline-none focus:border-blue-500"
              />
              <button
                onClick={() => {
                  handleSave();
                  onRefreshData();
                }}
                className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-medium transition whitespace-nowrap"
              >
                Apply Key
              </button>
            </div>
            {apiKeyInput ? (
              <div className="text-[11px] text-[#00d09c] mt-2 flex items-center gap-1.5 font-medium">
                <Check className="w-3.5 h-3.5" /> Key saved locally in browser storage
              </div>
            ) : (
              <div className="text-[11px] text-slate-400 mt-2">
                Running on public high-frequency live exchange spot feeds (Binance / Coinbase).
              </div>
            )}
          </div>

          {/* Section 2: Pine Script Strategy Parameters */}
          <div className="bg-[#111827] border border-[#1e293b] rounded-xl p-4 space-y-4">
            <div className="flex items-center gap-2 text-white font-semibold text-sm">
              <Sliders className="w-4 h-4 text-blue-400" />
              Pine Script Quantitative Inputs
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <label className="text-slate-400 block mb-1">Supertrend Factor (Sensitivity)</label>
                <input
                  type="number"
                  step="0.5"
                  min="1"
                  max="15"
                  value={formData.sensitivity}
                  onChange={e =>
                    setFormData({ ...formData, sensitivity: parseFloat(e.target.value) || 5.0 })
                  }
                  className="w-full bg-[#090d16] border border-[#1e293b] rounded-lg px-3 py-1.5 font-mono text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Strategy Execution Mode</label>
                <select
                  value={formData.stratMode}
                  onChange={e =>
                    setFormData({
                      ...formData,
                      stratMode: e.target.value as 'Confirmed' | 'Normal',
                    })
                  }
                  className="w-full bg-[#090d16] border border-[#1e293b] rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="Confirmed">Confirmed (Leo Confluence)</option>
                  <option value="Normal">Normal (Cross Supertrend)</option>
                </select>
              </div>

              <div>
                <label className="text-slate-400 block mb-1">TP 1 Multiplier (1:1 RRR)</label>
                <input
                  type="number"
                  step="0.1"
                  value={formData.multTP1}
                  onChange={e =>
                    setFormData({ ...formData, multTP1: parseFloat(e.target.value) || 1.0 })
                  }
                  className="w-full bg-[#090d16] border border-[#1e293b] rounded-lg px-3 py-1.5 font-mono text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1">TP 2 Multiplier (2:1 Core)</label>
                <input
                  type="number"
                  step="0.1"
                  value={formData.multTP2}
                  onChange={e =>
                    setFormData({ ...formData, multTP2: parseFloat(e.target.value) || 2.0 })
                  }
                  className="w-full bg-[#090d16] border border-[#1e293b] rounded-lg px-3 py-1.5 font-mono text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Stop Loss (ATR 14 Band)</label>
                <input
                  type="number"
                  step="0.1"
                  value={formData.slAtrMult}
                  onChange={e =>
                    setFormData({ ...formData, slAtrMult: parseFloat(e.target.value) || 2.2 })
                  }
                  className="w-full bg-[#090d16] border border-[#1e293b] rounded-lg px-3 py-1.5 font-mono text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Live Polling Interval</label>
                <select
                  value={formData.autoRefreshInterval}
                  onChange={e =>
                    setFormData({
                      ...formData,
                      autoRefreshInterval: parseInt(e.target.value, 10) || 15,
                    })
                  }
                  className="w-full bg-[#090d16] border border-[#1e293b] rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500"
                >
                  <option value={5}>Every 5s (High Frequency)</option>
                  <option value={15}>Every 15s (Optimal)</option>
                  <option value={30}>Every 30s</option>
                  <option value={60}>Every 1 min</option>
                </select>
              </div>
            </div>

            {/* Alert & Audio Toggles */}
            <div className="pt-2 border-t border-[#1e293b] flex items-center justify-between text-xs">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.soundAlerts}
                  onChange={e => setFormData({ ...formData, soundAlerts: e.target.checked })}
                  className="rounded border-slate-700 bg-slate-800 text-blue-600 focus:ring-0"
                />
                <Volume2 className="w-3.5 h-3.5 text-slate-400" />
                <span>Audio Chimes on Signal</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.pushNotifications}
                  onChange={e => setFormData({ ...formData, pushNotifications: e.target.checked })}
                  className="rounded border-slate-700 bg-slate-800 text-blue-600 focus:ring-0"
                />
                <Bell className="w-3.5 h-3.5 text-slate-400" />
                <span>Web Push Notifications</span>
              </label>
            </div>
          </div>

          {/* Section 3: Python Analysis Script / Webhook Endpoint */}
          <div className="bg-[#111827] border border-[#1e293b] rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="text-white font-semibold text-sm">Python Script Hook / Webhook</div>
              <span className="text-[10px] font-mono text-[#00d09c] bg-[#00d09c]/10 px-2 py-0.5 rounded border border-[#00d09c]/20">
                POST /api/signal
              </span>
            </div>

            <p className="text-xs text-slate-400">
              Your external Python script or hosted bot can POST signals directly into this PWA
              using the standardized schema:
            </p>

            <div className="flex gap-2">
              <button
                onClick={() => copyToClipboard(pythonExample, 'python')}
                className="flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs font-medium bg-[#1e293b] hover:bg-[#334155] rounded-lg transition"
              >
                {copiedPython ? <Check className="w-3.5 h-3.5 text-[#00d09c]" /> : <Copy className="w-3.5 h-3.5" />}
                Copy Python Script
              </button>

              <button
                onClick={() => copyToClipboard(curlExample, 'curl')}
                className="flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs font-medium bg-[#1e293b] hover:bg-[#334155] rounded-lg transition"
              >
                {copiedCurl ? <Check className="w-3.5 h-3.5 text-[#00d09c]" /> : <Copy className="w-3.5 h-3.5" />}
                Copy cURL Hook
              </button>
            </div>

            {/* Test Hook Button */}
            <div className="pt-2">
              <button
                onClick={onTestPushSignal}
                disabled={isTestingPush}
                className="w-full flex items-center justify-center gap-2 py-2 text-xs font-medium bg-[#0f172a] hover:bg-[#1e293b] border border-blue-500/40 text-blue-400 rounded-lg transition"
              >
                <Play className="w-3.5 h-3.5" />
                {isTestingPush ? 'Dispatching test signal to /api/signal...' : 'Test Push Live Signal to API Hook'}
              </button>
            </div>
          </div>
        </div>

        {/* Drawer Footer */}
        <div className="pt-4 border-t border-[#1e293b] flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white transition"
          >
            Cancel
          </button>

          <button
            onClick={() => {
              handleSave();
              onRefreshData();
              onClose();
            }}
            className="px-5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition shadow-sm"
          >
            {savedSuccess ? 'Settings Saved!' : 'Save & Recalculate'}
          </button>
        </div>
      </div>
    </div>
  );
};
