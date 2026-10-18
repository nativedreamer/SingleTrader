import { SignalRecord, StrategyConfig } from '../types/signal';

const STORAGE_KEY_SIGNALS = 'singletrader_signals_v1';
const STORAGE_KEY_CONFIG = 'singletrader_config_v1';

export const DEFAULT_CONFIG: StrategyConfig = {
  sensitivity: 5.0,
  atrPeriod: 10,
  multTP1: 1.0,
  multTP2: 2.0, // Primary 2:1 target
  multTP3: 3.0,
  slAtrMult: 2.2,
  stratMode: 'Confirmed',
  useTrailingSL: false,
  timeframe: '15m',
  soundAlerts: true,
  pushNotifications: true,
  twelveDataApiKey: '',
  apiWebhookUrl: '/api/signal',
  autoRefreshInterval: 15,
};

export function getStoredConfig(): StrategyConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_CONFIG);
    if (raw) {
      return { ...DEFAULT_CONFIG, ...JSON.parse(raw) };
    }
  } catch (e) {
    // fallback
  }
  return DEFAULT_CONFIG;
}

export function saveStoredConfig(config: StrategyConfig): void {
  try {
    localStorage.setItem(STORAGE_KEY_CONFIG, JSON.stringify(config));
  } catch (e) {
    console.error('Failed to save config to localStorage', e);
  }
}

export function getStoredSignals(): SignalRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_SIGNALS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    }
  } catch (e) {
    // fallback
  }
  return [];
}

export function saveStoredSignals(signals: SignalRecord[]): void {
  try {
    // Keep max 100 recent signals
    const capped = signals.slice(0, 100);
    localStorage.setItem(STORAGE_KEY_SIGNALS, JSON.stringify(capped));
  } catch (e) {
    console.error('Failed to save signals to localStorage', e);
  }
}

export function appendStoredSignal(signal: SignalRecord): SignalRecord[] {
  const current = getStoredSignals();
  // Check if exists
  const exists = current.some(s => s.id === signal.id || (s.timestamp === signal.timestamp && s.action === signal.action));
  if (!exists) {
    const updated = [signal, ...current];
    saveStoredSignals(updated);
    return updated;
  }
  return current;
}
