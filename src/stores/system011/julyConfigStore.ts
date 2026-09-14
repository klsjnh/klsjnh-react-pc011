/** 配置 store（system011 · julyConfig）：只负责状态 */
import { createStore, useStoreState } from '@/stores/createStore';
import type { ConfigState, JulyConfigQueryVo011 } from '@/types/system011/julyConfig';

export type { ConfigState };

const DEFAULT_QUERY: JulyConfigQueryVo011 = { pageIndex: 1, pageSize: 10 };

const base = createStore<ConfigState>({
  list: [], total: 0, totalPages: 1, loading: false, query: DEFAULT_QUERY,
});

export const julyConfigStore = {
  getSnapshot: base.getSnapshot,
  subscribe: base.subscribe,
  setState: base.setState,
  replace: base.replace,
};

export function useConfigState(): ConfigState {
  return useStoreState(base);
}
