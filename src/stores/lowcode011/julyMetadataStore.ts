/**
 * 元数据 store（lowcode011 · julyMetadata）：只负责状态。
 * 分页偏好：每页条数走 utils/pageSizePref（localStorage `pc011-julyMetadata-pageSize`）。
 */
import { createStore, useStoreState } from '@/stores/createStore';
import { loadPageSize, persistPageSize } from '@/utils/pageSizePref';
import type { MetadataState } from '@/types/lowcode011/julyMetadata';

const SCOPE = 'julyMetadata';

const DEFAULT_QUERY = { pageIndex: 1, pageSize: loadPageSize(SCOPE) };

const base = createStore<MetadataState>({
  list: [],
  total: 0,
  totalPages: 1,
  loading: false,
  query: DEFAULT_QUERY,
  selectedRowKeys: [],
});

/** 用户改动每页条数 → 落盘（其余状态不落盘） */
persistPageSize(base, SCOPE);

export const julyMetadataStore = {
  getSnapshot: base.getSnapshot,
  subscribe: base.subscribe,
  setState: base.setState,
  replace: base.replace,
};

export function useMetadataState(): MetadataState {
  return useStoreState(base);
}
