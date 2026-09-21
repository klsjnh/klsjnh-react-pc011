/**
 * AI 提示词 store（aiCenter · julyAiDomainPrompt）：只负责状态
 * 分层：store 只负责「状态 + 本地持久化」，不调用 service。
 * 2026-09-21 新契约：query.pkMt = 当前选中业务域 id（右栏按域直查）；
 * 分页固定 200 上限（管理端规模），不再走 pageSizePref。
 */
import { createStore, useStoreState } from '@/stores/createStore';
import type { JulyAiDomainPromptVo011, JulyAiDomainPromptQueryVo011 } from '@/types/aiCenter/aiPrompt/vo';

/** store 状态 */
export interface JulyAiPromptState {
  list: JulyAiDomainPromptVo011[];
  total: number;
  totalPages: number;
  loading: boolean;
  query: JulyAiDomainPromptQueryVo011;
}

const DEFAULT_QUERY: JulyAiDomainPromptQueryVo011 = { pageIndex: 1, pageSize: 200 };

const base = createStore<JulyAiPromptState>({
  list: [], total: 0, totalPages: 1, loading: false, query: DEFAULT_QUERY,
});

export const julyAiPromptStore = {
  getSnapshot: base.getSnapshot,
  subscribe: base.subscribe,
  setState: base.setState,
  replace: base.replace,
};

export function useJulyAiPromptState(): JulyAiPromptState {
  return useStoreState(base);
}
