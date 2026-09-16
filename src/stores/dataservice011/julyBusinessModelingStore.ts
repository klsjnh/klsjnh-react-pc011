/**
 * 业务建模（低代码）store（dataservice011 · julyBusinessModeling）：只负责状态
 * 分层：store 只负责「状态 + 本地持久化」，不调用 service。
 */
import { createStore, useStoreState } from '@/stores/createStore';
import type { JulyBusinessModelingItem, JulyBusinessModelingQueryVo011 } from '@/types/dataservice011/businessModeling';

/** store 状态 */
export interface BusinessModelingState {
  list: JulyBusinessModelingItem[];
  total: number;
  totalPages: number;
  loading: boolean;
  query: JulyBusinessModelingQueryVo011;
}

const DEFAULT_QUERY: JulyBusinessModelingQueryVo011 = { pageIndex: 1, pageSize: 10 };

const base = createStore<BusinessModelingState>({
  list: [], total: 0, totalPages: 1, loading: false, query: DEFAULT_QUERY,
});

export const julyBusinessModelingStore = {
  getSnapshot: base.getSnapshot,
  subscribe: base.subscribe,
  setState: base.setState,
  replace: base.replace,
};

export function useBusinessModelingState(): BusinessModelingState {
  return useStoreState(base);
}
