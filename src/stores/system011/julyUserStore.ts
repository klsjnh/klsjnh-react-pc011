/**
 * 用户 store（system011 · julyUser）
 * 只负责状态；业务操作（含 CRUD 编排）在 services/system011/julyUserService。
 * 分层：page → service → store；page 只读写状态。
 *
 * 分页偏好：每页条数的读写统一走 utils/pageSizePref（localStorage `pc011-julyUser-pageSize`）。
 * 注意：页面挂载时只重置 pageIndex，**不要**再传 pageSize，否则会把偏好覆盖回默认值。
 */
import { createStore, useStoreState } from '@/stores/createStore';
import { loadPageSize, persistPageSize } from '@/utils/pageSizePref';
import type { JulyUserQueryVo011 } from '@/types/system011';
import type { UserState } from '@/types/system011/julyUser';

export type { UserState };

const SCOPE = 'julyUser';

const DEFAULT_QUERY: JulyUserQueryVo011 = { pageIndex: 1, pageSize: loadPageSize(SCOPE) };

const base = createStore<UserState>({
  list: [], total: 0, totalPages: 1, loading: false, query: DEFAULT_QUERY,
});

/** 用户改动每页条数 → 落盘（其余状态不落盘） */
persistPageSize(base, SCOPE);

export const julyUserStore = {
  getSnapshot: base.getSnapshot,
  subscribe: base.subscribe,
  setState: base.setState,
  replace: base.replace,
};

export function useUserState(): UserState {
  return useStoreState(base);
}
