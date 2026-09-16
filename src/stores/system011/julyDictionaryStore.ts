/**
 * 字典 store（system011 · julyDictionary）：只负责状态
 * 分页偏好：每页条数走 utils/pageSizePref（localStorage `pc011-julyDictionary-pageSize`）。
 */
import { createStore, useStoreState } from '@/stores/createStore';
import { loadPageSize, persistPageSize } from '@/utils/pageSizePref';
import type { DictionaryState } from '@/types/system011/julyDictionary';

const SCOPE = 'julyDictionary';

const DEFAULT_QUERY = { pageIndex: 1, pageSize: loadPageSize(SCOPE) };

const base = createStore<DictionaryState>({
  list: [],
  total: 0,
  totalPages: 1,
  loading: false,
  query: DEFAULT_QUERY,
  active: null,
  items: [],
  itemsLoading: false,
});

/** 用户改动每页条数 → 落盘（其余状态不落盘） */
persistPageSize(base, SCOPE);

export const julyDictionaryStore = {
  getSnapshot: base.getSnapshot,
  subscribe: base.subscribe,
  setState: base.setState,
  replace: base.replace,
};

export function useDictionaryState(): DictionaryState {
  return useStoreState(base);
}