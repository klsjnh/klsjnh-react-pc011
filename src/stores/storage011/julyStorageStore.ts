/**
 * 存储实例 store（storage011 · storage）：只负责状态 + 分页偏好。
 * 分页偏好：每页条数走 utils/pageSizePref（localStorage `pc011-julyStorage-pageSize`）。
 */
import { createStore, useStoreState } from '@/stores/createStore';
import { loadPageSize, persistPageSize } from '@/utils/pageSizePref';
import type { JulyStorage, JulyStorageQuery } from '@/types/storage011';

export interface StorageState {
  list: JulyStorage[];
  total: number;
  totalPages: number;
  loading: boolean;
  query: JulyStorageQuery;
}

const SCOPE = 'julyStorage';

const DEFAULT_QUERY: JulyStorageQuery = { pageIndex: 1, pageSize: loadPageSize(SCOPE) };

const base = createStore<StorageState>({
  list: [], total: 0, totalPages: 1, loading: false, query: DEFAULT_QUERY,
});

/** 用户改动每页条数 → 落盘（其余状态不落盘） */
persistPageSize(base, SCOPE);

export const julyStorageStore = {
  getSnapshot: base.getSnapshot,
  subscribe: base.subscribe,
  setState: base.setState,
  replace: base.replace,
};

export function useStorageState(): StorageState {
  return useStoreState(base);
}
