/**
 * 配置 store（system011 · julyConfig）：只负责状态
 * 分页偏好：每页条数走 utils/pageSizePref（localStorage `pc011-julyConfig-pageSize`）。
 */
import { createStore, useStoreState } from '@/stores/createStore';
import { loadPageSize, persistPageSize } from '@/utils/pageSizePref';
import type { ConfigState, JulyConfigQueryVo011 } from '@/types/system011/julyConfig';

export type { ConfigState };

const SCOPE = 'julyConfig';

const DEFAULT_QUERY: JulyConfigQueryVo011 = { pageIndex: 1, pageSize: loadPageSize(SCOPE) };

const base = createStore<ConfigState>({
  list: [], total: 0, totalPages: 1, loading: false, query: DEFAULT_QUERY,
});

/** 用户改动每页条数 → 落盘（其余状态不落盘） */
persistPageSize(base, SCOPE);

export const julyConfigStore = {
  getSnapshot: base.getSnapshot,
  subscribe: base.subscribe,
  setState: base.setState,
  replace: base.replace,
};

export function useConfigState(): ConfigState {
  return useStoreState(base);
}
