/**
 * 应用配置：数据模式（mock / api）
 * 优先级：localStorage 运行时切换 > VITE_DATA_MODE 环境变量 > 默认 mock
 */
import { useSyncExternalStore } from 'react';
import type { DataMode, RunState, AppConfigState } from '@/types/view/appConfig';

export type { DataMode, RunState };

const MODE_KEY = 'pc011-data-mode';
const RUN_KEY = 'pc011-run-state';
const BASE_KEY = 'pc011-api-base-url';

function initDataMode(): DataMode {
  try {
    const stored = localStorage.getItem(MODE_KEY);
    if (stored === 'mock' || stored === 'api') return stored;
  } catch { /* ignore */ }
  const env = import.meta.env?.VITE_DATA_MODE as string | undefined;
  return env === 'api' ? 'api' : 'mock';
}

function initRunState(): RunState {
  try {
    const stored = localStorage.getItem(RUN_KEY);
    if (stored === 'development' || stored === 'production') return stored;
  } catch { /* ignore */ }
  // 跟随 Vite 运行态：vite dev 默认开发态（可用免密登录），vite build 默认生产态
  const env = import.meta.env?.VITE_RUN_STATE as string | undefined;
  if (env === 'development' || env === 'production') return env;
  return import.meta.env?.DEV ? 'development' : 'production';
}

function initBaseUrl(): string {
  try {
    const stored = localStorage.getItem(BASE_KEY);
    if (stored) return stored;
  } catch { /* ignore */ }
  // 默认指向后端 java17-framework011（经 vite proxy /klsjnh 转发，免去 CORS）
  return import.meta.env?.VITE_API_BASE_URL || '/klsjnh/system011';
}

let state: AppConfigState = {
  dataMode: initDataMode(),
  runState: initRunState(),
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
  setRunState: (runState: RunState) => {
    try { localStorage.setItem(RUN_KEY, runState); } catch { /* ignore */ }
    setState({ runState });
  },
  setApiBaseUrl: (url: string) => {
    try { localStorage.setItem(BASE_KEY, url); } catch { /* ignore */ }
    setState({ apiBaseUrl: url });
  },
  setLastApiError: (msg: string | null) => setState({ lastApiError: msg }),
};

/** 当前是否 mock 模式（非响应式，供 store 内部同步判断） */
export const isMockMode = () => state.dataMode === 'mock';/** 当前是否开发态（非响应式，供 store / 页面内部同步判断；开发态可用免密登录） */
export const isDevelopment = () => state.runState === 'development';

export function useAppConfig(): AppConfigState {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}
