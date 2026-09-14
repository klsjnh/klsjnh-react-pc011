/** 定时任务 store（system011 · julyScheduler）：只负责状态 */
import { createStore, useStoreState } from '../createStore';
import type { SchedulerState, JulySchedulerQueryVo011 } from '@/types/system011/julyScheduler';

export type { SchedulerState };

const DEFAULT_QUERY: JulySchedulerQueryVo011 = { pageIndex: 1, pageSize: 10 };

const base = createStore<SchedulerState>({
  list: [], total: 0, totalPages: 1, loading: false, query: DEFAULT_QUERY,
});

export const julySchedulerStore = {
  getSnapshot: base.getSnapshot,
  subscribe: base.subscribe,
  setState: base.setState,
  replace: base.replace,
};

export function useSchedulerState(): SchedulerState {
  return useStoreState(base);
}
