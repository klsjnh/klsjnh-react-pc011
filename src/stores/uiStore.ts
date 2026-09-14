/**
 * UI 状态持久化（localStorage）
 * 左侧导航收起状态、菜单管理树的展开/选中状态等
 * 迁移至 zustand，保留 localStorage 持久化与原有 API 表面。
 */
import { createStore, useStoreState } from '@/stores/createStore';
import type { UiState } from '@/types/view/ui';

export type { UiState };

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

const base = createStore<UiState>(load());

/** 订阅状态变化 → 写入 localStorage */
base.subscribe(() => {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(base.getSnapshot())); } catch { /* 存储不可用时仅内存生效 */ }
});

export const uiStore = {
  getSnapshot: base.getSnapshot,
  subscribe: base.subscribe,
  setSidebarCollapsed: (collapsed: boolean) => base.setState({ sidebarCollapsed: collapsed }),
  setMenuTreeExpandedIds: (ids: string[]) => base.setState({ menuTreeExpandedIds: ids }),
  setMenuTreeSelectedId: (id: string | null) => base.setState({ menuTreeSelectedId: id }),
};

export function useUiState(): UiState {
  return useStoreState(base);
}
