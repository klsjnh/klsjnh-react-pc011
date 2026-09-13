/**
 * 组织 store（system011 · julyOrganization）
 * 只负责状态；树/增删改业务在 services/system011/julyOrganizationService。
 * 分层：page → service → store；page 只读写状态。
 */
import { createStore, useStoreState } from '../createStore';
import type { JulyOrganizationVo011 } from '@/types/system011';

export interface OrgState {
  tree: JulyOrganizationVo011[];
  /** 组织 id → 名称（用户「所属组织」列解析用） */
  orgNameById: Map<string, string>;
  loading: boolean;
}

const base = createStore<OrgState>({ tree: [], orgNameById: new Map(), loading: false });

export const julyOrganizationStore = {
  getSnapshot: base.getSnapshot,
  subscribe: base.subscribe,
  setState: base.setState,
  replace: base.replace,
  /** 重置为初始状态 */
  reset: () => base.replace({ tree: [], orgNameById: new Map(), loading: false }),
};

export function useOrganizationState(): OrgState {
  return useStoreState(base);
}
