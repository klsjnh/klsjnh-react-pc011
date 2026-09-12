/**
 * 应用配置：数据模式（mock / api）
 * 优先级：localStorage 运行时切换 > VITE_DATA_MODE 环境变量 > 默认 mock
 */
import { useSyncExternalStore } from 'react';

export type DataMode = 'mock' | 'api';

interface AppConfigState {
  dataMode: DataMode;
  apiBaseUrl: string;
  /** 最近一次 API 请求错误（模式切换下拉里展示） */
  lastApiError: string | null;
}

const MODE_KEY = 'pc011-data-mode';
const BASE_KEY = 'pc011-api-base-url';

function initDataMode(): DataMode {
  try {
    const stored = localStorage.getItem(MODE_KEY);
    if (stored === 'mock' || stored === 'api') return stored;
  } catch { /* ignore */ }
  const env = (import.meta as any).env?.VITE_DATA_MODE as string | undefined;
  return env === 'api' ? 'api' : 'mock';
}

function initBaseUrl(): string {
  try {
    const stored = localStorage.getItem(BASE_KEY);
    if (stored) return stored;
  } catch { /* ignore */ }
  return (import.meta as any).env?.VITE_API_BASE_URL || '/api/v1';
}

let state: AppConfigState = {
  dataMode: initDataMode(),
  apiBaseUrl: initBaseUrl(),
  lastApiError: null,
};

const listeners = new Set<() => void>();
function getSnapshot(): AppConfigState { return state; }
function subscribe(l: () => void) { listeners.add(l); return () => { listeners.delete(l); }; }
function setState(patch: Partial<AppConfigState>) {
  state = { ...state, ...patch };
  listeners.forEach(l => l());
}

export const appConfigStore = {
  getSnapshot,
  subscribe,
  setDataMode: (mode: DataMode) => {
    try { localStorage.setItem(MODE_KEY, mode); } catch { /* ignore */ }
    setState({ dataMode: mode, lastApiError: null });
  },
  setApiBaseUrl: (url: string) => {
    try { localStorage.setItem(BASE_KEY, url); } catch { /* ignore */ }
    setState({ apiBaseUrl: url });
  },
  setLastApiError: (msg: string | null) => setState({ lastApiError: msg }),
};

/** 当前是否 mock 模式（非响应式，供 store 内部同步判断） */
export const isMockMode = () => state.dataMode === 'mock';

export function useAppConfig(): AppConfigState {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}
