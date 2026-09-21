/**
 * AI 业务域 store（aiCenter · julyAiDomain）：只负责状态
 * 分层：store 只负责「状态 + 本地持久化」，不调用 service。
 * 2026-09-21 树形态：仅 tree（selectTree 成品树）；分页/平铺机制随平铺查询退役。
 */
import { createStore, useStoreState } from '@/stores/createStore';
import type { JulyAiDomainItem } from '@/types/aiCenter/aiDomain/vo';

/** store 状态 */
export interface JulyAiDomainState {
  /** 域树（selectTree 出参） */
  tree: JulyAiDomainItem[];
  loading: boolean;
}

const base = createStore<JulyAiDomainState>({
  tree: [], loading: false,
});

export const julyAiDomainStore = {
  getSnapshot: base.getSnapshot,
  subscribe: base.subscribe,
  setState: base.setState,
  replace: base.replace,
};

export function useJulyAiDomainState(): JulyAiDomainState {
  return useStoreState(base);
}
