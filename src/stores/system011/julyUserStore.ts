/**
 * 用户 store（system011 · julyUser）
 * 只负责状态；业务操作（含 CRUD 编排）在 services/system011/julyUserService。
 * 分层：page → service → store；page 只读写状态。
 */
import { createStore, useStoreState } from '../createStore';
import type { JulyUserVo011, JulyUserQueryVo011 } from '../../types/system011';

export interface UserState {
  list: JulyUserVo011[];
  total: number;
  totalPages: number;
  loading: boolean;
  query: JulyUserQueryVo011;
}

const DEFAULT_QUERY: JulyUserQueryVo011 = { pageIndex: 1, pageSize: 10 };

const base = createStore<UserState>({
  list: [], total: 0, totalPages: 1, loading: false, query: DEFAULT_QUERY,
});

export const julyUserStore = {
  getSnapshot: base.getSnapshot,
  subscribe: base.subscribe,
  setState: base.setState,
  replace: base.replace,
  /** 重置为初始状态（切换数据模式 / 登出时用） */
  reset: () => base.replace({ list: [], total: 0, totalPages: 1, loading: false, query: { ...DEFAULT_QUERY } }),
};

export function useUserState(): UserState {
  return useStoreState(base);
}
