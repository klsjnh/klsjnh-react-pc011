/**
 * AI 业务域 store（aiCenter · julyAiDomain）：只负责状态
 * 分层：store 只负责「状态 + 本地持久化」，不调用 service。
 */
import { createStore, useStoreState } from '@/stores/createStore';
import { loadPageSize, persistPageSize } from '@/utils/pageSizePref';
import type { JulyAiDomainItem, JulyAiDomainQueryVo011 } from '@/types/aiCenter/aiDomain/vo';

/** store 状态 */
export interface JulyAiDomainState {
  list: JulyAiDomainItem[];
  total: number;
  loading: boolean;
  query: JulyAiDomainQueryVo011;
}

const SCOPE = 'julyAiDomain';

const DEFAULT_QUERY: JulyAiDomainQueryVo011 = { pageIndex: 1, pageSize: loadPageSize(SCOPE) };

const base = createStore<JulyAiDomainState>({
  list: [], total: 0, loading: false, query: DEFAULT_QUERY,
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
