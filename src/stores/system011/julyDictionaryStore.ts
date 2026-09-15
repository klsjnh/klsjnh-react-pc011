/** 字典 store（system011 · julyDictionary）：只负责状态 */
import { createStore, useStoreState } from '@/stores/createStore';
import type { DictionaryState } from '@/types/system011/julyDictionary';

const DEFAULT_QUERY = { pageIndex: 1, pageSize: 10 };

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

export const julyDictionaryStore = {
  getSnapshot: base.getSnapshot,
  subscribe: base.subscribe,
  setState: base.setState,
  replace: base.replace,
};

export function useDictionaryState(): DictionaryState {
  return useStoreState(base);
}