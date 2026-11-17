import { API_CONFIG } from '../config/api';
import { DemoSettings } from '../types';

const SETTINGS_STORAGE_KEY = 'qg_demo_settings_v1';

export const DEFAULT_DEMO_SETTINGS: DemoSettings = {
  simulatedLatencyMs: API_CONFIG.defaultSimulatedDelayMs,
  simulateNetworkError: false,
  apiBaseUrl: API_CONFIG.baseUrl,
  defaultTestTimeoutSec: 30,
  strictFipsMode: true,
};

export function getDemoSettings(): DemoSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (!raw) return DEFAULT_DEMO_SETTINGS;
    return { ...DEFAULT_DEMO_SETTINGS, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_DEMO_SETTINGS;
  }
}

export function saveDemoSettings(settings: DemoSettings): void {
  try {
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
  } catch {
    // Ignore storage quota errors in prototype mode
  }
}

export async function simulateServiceCall<T>(
  operationName: string,
  resolver: () => T
): Promise<T> {
  const settings = getDemoSettings();
  const delay = Math.max(0, settings.simulatedLatencyMs);

  await new Promise((resolve) => setTimeout(resolve, delay));

  if (settings.simulateNetworkError) {
    throw new Error(
      `Simulated API Error during "${operationName}" (${settings.apiBaseUrl}). Disable error simulation in Settings to resume demo data.`
    );
  }

  return resolver();
}
