/**
 * 组织 store（system011 · julyOrganization）
 * 只负责状态；树/增删改业务在 services/system011/julyOrganizationService。
 * 分层：page → service → store；page 只读写状态。
 */
import { createStore, useStoreState } from '@/stores/createStore';
import type { OrgState } from '@/types/system011/julyOrganization';

export type { OrgState };

const base = createStore<OrgState>({ tree: [], orgNameById: new Map(), loading: false });

export const julyOrganizationStore = {
  getSnapshot: base.getSnapshot,
  subscribe: base.subscribe,
  setState: base.setState,
  replace: base.replace,
};

export function useOrganizationState(): OrgState {
  return useStoreState(base);
}
