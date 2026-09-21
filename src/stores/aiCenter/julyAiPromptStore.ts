/**
 * AI 提示词 store（aiCenter · julyAiPrompt）：只负责状态
 * 分层：store 只负责「状态 + 本地持久化」，不调用 service。
 * 分页偏好：每页条数走 utils/pageSizePref（localStorage `pc011-julyAiPrompt-pageSize`）。
 */
import { createStore, useStoreState } from '@/stores/createStore';
import { loadPageSize, persistPageSize } from '@/utils/pageSizePref';
import type { JulyAiPromptItem, JulyAiPromptQueryVo011 } from '@/types/aiCenter/aiPrompt/vo';

/** store 状态 */
export interface JulyAiPromptState {
  list: JulyAiPromptItem[];
  total: number;
  totalPages: number;
  loading: boolean;
  query: JulyAiPromptQueryVo011;
}

const SCOPE = 'julyAiPrompt';

const DEFAULT_QUERY: JulyAiPromptQueryVo011 = { pageIndex: 1, pageSize: loadPageSize(SCOPE) };

const base = createStore<JulyAiPromptState>({
  list: [], total: 0, totalPages: 1, loading: false, query: DEFAULT_QUERY,
});

/** 用户改动每页条数 → 落盘（其余状态不落盘） */
persistPageSize(base, SCOPE);

export const julyAiPromptStore = {
  getSnapshot: base.getSnapshot,
  subscribe: base.subscribe,
  setState: base.setState,
  replace: base.replace,
};

export function useJulyAiPromptState(): JulyAiPromptState {
  return useStoreState(base);
}
