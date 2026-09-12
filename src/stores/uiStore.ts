/**
 * UI 状态持久化（localStorage）
 * 左侧导航收起状态、菜单管理树的展开/选中状态等
 */
import { useSyncExternalStore } from 'react';

export interface UiState {
  /** 左侧导航侧边栏是否收起 */
  sidebarCollapsed: boolean;
  /** 菜单管理树展开的节点 ID（null = 从未设置，使用默认值：仅第一个顶级展开） */
  menuTreeExpandedIds: number[] | null;
  /** 菜单管理树当前选中节点 */
  menuTreeSelectedId: number | null;
}

const STORAGE_KEY = 'pc011-ui-state';

const defaultState: UiState = {
  sidebarCollapsed: false,
  menuTreeExpandedIds: null,
  menuTreeSelectedId: null,
};

function load(): UiState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return { ...defaultState, ...JSON.parse(raw) };
  } catch { /* 忽略损坏数据 */ }
  return { ...defaultState };
}

let state: UiState = load();
const listeners = new Set<() => void>();

function getSnapshot(): UiState { return state; }
function subscribe(l: () => void) { listeners.add(l); return () => { listeners.delete(l); }; }
function setState(patch: Partial<UiState>) {
  state = { ...state, ...patch };
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch { /* 存储不可用时仅内存生效 */ }
  listeners.forEach(l => l());
}

export const uiStore = {
  getSnapshot,
  subscribe,
  setSidebarCollapsed: (collapsed: boolean) => setState({ sidebarCollapsed: collapsed }),
  setMenuTreeExpandedIds: (ids: number[]) => setState({ menuTreeExpandedIds: ids }),
  setMenuTreeSelectedId: (id: number | null) => setState({ menuTreeSelectedId: id }),
};

export function useUiState(): UiState {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}
