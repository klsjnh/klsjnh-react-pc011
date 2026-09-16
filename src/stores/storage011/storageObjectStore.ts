/**
 * 对象 store（storage011 · object）：只负责状态 + 分页偏好。
 * 分页偏好：每页条数走 utils/pageSizePref（localStorage `pc011-storageObject-pageSize`）。
 */
import { createStore, useStoreState } from '@/stores/createStore';
import { loadPageSize, persistPageSize } from '@/utils/pageSizePref';
import type { StorageObject, StorageObjectQuery } from '@/types/storage011';

export interface StorageObjectState {
  list: StorageObject[];
  total: number;
  totalPages: number;
  loading: boolean;
  query: StorageObjectQuery;
}

export type { StorageObjectState };

const SCOPE = 'storageObject';

const DEFAULT_QUERY: StorageObjectQuery = { pageIndex: 1, pageSize: loadPageSize(SCOPE) };

const base = createStore<StorageObjectState>({
  list: [], total: 0, totalPages: 1, loading: false, query: DEFAULT_QUERY,
});

persistPageSize(base, SCOPE);

export const storageObjectStore = {
  getSnapshot: base.getSnapshot,
  subscribe: base.subscribe,
  setState: base.setState,
  replace: base.replace,
};

export function useStorageObjectState(): StorageObjectState {
  return useStoreState(base);
}
