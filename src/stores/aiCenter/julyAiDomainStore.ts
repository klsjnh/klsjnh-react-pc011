/**
 * AI 业务域 store（aiCenter · julyAiDomain）：只负责状态
 * 分层：store 只负责「状态 + 本地持久化」，不调用 service。
 * 2026-09-21 树形态：tree（selectTree 成品树，左栏树面板）+ list（平铺，反查用）。
 */
import { createStore, useStoreState } from '@/stores/createStore';
import { loadPageSize, persistPageSize } from '@/utils/pageSizePref';
import type { JulyAiDomainItem, JulyAiDomainQueryVo011 } from '@/types/aiCenter/aiDomain/vo';

/** store 状态 */
export interface JulyAiDomainState {
  /** 域树（selectTree 出参） */
  tree: JulyAiDomainItem[];
  /** 平铺列表（flattenDomainTree 派生 / 或分页查询落库） */
  list: JulyAiDomainItem[];
  total: number;
  loading: boolean;
  query: JulyAiDomainQueryVo011;
}

const SCOPE = 'julyAiDomain';

const DEFAULT_QUERY: JulyAiDomainQueryVo011 = { pageIndex: 1, pageSize: loadPageSize(SCOPE) };

const base = createStore<JulyAiDomainState>({
  tree: [], list: [], total: 0, loading: false, query: DEFAULT_QUERY,
});

/** 用户改动每页条数 → 落盘（其余状态不落盘） */
persistPageSize(base, SCOPE);

export const julyAiDomainStore = {
  getSnapshot: base.getSnapshot,
  subscribe: base.subscribe,
  setState: base.setState,
  replace: base.replace,
};

export function useJulyAiDomainState(): JulyAiDomainState {
  return useStoreState(base);
}
