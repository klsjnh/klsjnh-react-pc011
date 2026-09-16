/**
 * 存储桶 store（storage011 · bucket）：只负责状态 + 分页偏好。
 * 分页偏好：每页条数走 utils/pageSizePref（localStorage `pc011-storageBucket-pageSize`）。
 */
import { createStore, useStoreState } from '@/stores/createStore';
import { loadPageSize, persistPageSize } from '@/utils/pageSizePref';
import type { StorageBucket, StorageBucketQuery } from '@/types/storage011';

export interface StorageBucketState {
  list: StorageBucket[];
  total: number;
  totalPages: number;
  loading: boolean;
  query: StorageBucketQuery;
}

export type { StorageBucketState };

const SCOPE = 'storageBucket';

const DEFAULT_QUERY: StorageBucketQuery = { pageIndex: 1, pageSize: loadPageSize(SCOPE) };

const base = createStore<StorageBucketState>({
  list: [], total: 0, totalPages: 1, loading: false, query: DEFAULT_QUERY,
});

persistPageSize(base, SCOPE);

export const storageBucketStore = {
  getSnapshot: base.getSnapshot,
  subscribe: base.subscribe,
  setState: base.setState,
  replace: base.replace,
};

export function useStorageBucketState(): StorageBucketState {
  return useStoreState(base);
}
