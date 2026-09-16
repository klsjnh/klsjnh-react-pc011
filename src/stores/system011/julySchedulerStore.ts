/**
 * 定时任务 store（system011 · julyScheduler）：只负责状态
 * 分页偏好：每页条数走 utils/pageSizePref（localStorage `pc011-julyScheduler-pageSize`）。
 */
import { createStore, useStoreState } from '@/stores/createStore';
import { loadPageSize, persistPageSize } from '@/utils/pageSizePref';
import type { SchedulerState, JulySchedulerQueryVo011 } from '@/types/system011/julyScheduler';

export type { SchedulerState };

const SCOPE = 'julyScheduler';

const DEFAULT_QUERY: JulySchedulerQueryVo011 = { pageIndex: 1, pageSize: loadPageSize(SCOPE) };

const base = createStore<SchedulerState>({
  list: [], total: 0, totalPages: 1, loading: false, query: DEFAULT_QUERY,
});

/** 用户改动每页条数 → 落盘（其余状态不落盘） */
persistPageSize(base, SCOPE);

export const julySchedulerStore = {
  getSnapshot: base.getSnapshot,
  subscribe: base.subscribe,
  setState: base.setState,
  replace: base.replace,
};

export function useSchedulerState(): SchedulerState {
  return useStoreState(base);
}
