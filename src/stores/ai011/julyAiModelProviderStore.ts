/**
 * AI 模型供应商 store（ai011 · julyAiModelProvider）：只负责状态
 * 分层：store 只负责「状态 + 本地持久化」，不调用 service。
 */
import { createStore, useStoreState } from '@/stores/createStore';
import type { AiModelProviderItem, AiModelProviderQueryVo011 } from '@/types/ai011/aiModelProvider/vo';

/** store 状态 */
export interface AiModelProviderState {
  list: AiModelProviderItem[];
  total: number;
  totalPages: number;
  loading: boolean;
  query: AiModelProviderQueryVo011;
}

const DEFAULT_QUERY: AiModelProviderQueryVo011 = { pageIndex: 1, pageSize: 10 };

const base = createStore<AiModelProviderState>({
  list: [], total: 0, totalPages: 1, loading: false, query: DEFAULT_QUERY,
});

export const julyAiModelProviderStore = {
  getSnapshot: base.getSnapshot,
  subscribe: base.subscribe,
  setState: base.setState,
  replace: base.replace,
};

export function useAiModelProviderState(): AiModelProviderState {
  return useStoreState(base);
}
