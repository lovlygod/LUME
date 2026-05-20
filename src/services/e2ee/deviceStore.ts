import type { E2EEDeviceState } from './types';

const STORAGE_KEY = 'lume:e2ee:device-state:v1';

export const getLocalE2EEDeviceState = (): E2EEDeviceState | null => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as E2EEDeviceState;
  } catch (_error) {
    return null;
  }
};

export const saveLocalE2EEDeviceState = (state: E2EEDeviceState) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
};

export const clearLocalE2EEDeviceState = () => {
  localStorage.removeItem(STORAGE_KEY);
};

