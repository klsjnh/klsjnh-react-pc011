/**
 * 角色 store（system011 · julyRole）
 * 只负责状态 + 本地持久化；业务操作（含 CRUD 编排）在 services/system011/julyRoleService。
 * 分层：page → service → store；store 不调用 service。
 */
import { createStore, useStoreState } from '@/stores/createStore';
import type { RoleState } from '@/types/system011/julyRole/view';

export type { RoleState };
export type { JulyUserView as UserInfo } from '@/types/system011/julyUser/view';

const base = createStore<RoleState>({
  roles: [], users: [], orgTree: [], loaded: false, loading: false,
});

export const roleStore = {
  getSnapshot: base.getSnapshot,
  subscribe: base.subscribe,
  setState: base.setState,
  replace: base.replace,
};

export function useRoleState(): RoleState {
  return useStoreState(base);
}
