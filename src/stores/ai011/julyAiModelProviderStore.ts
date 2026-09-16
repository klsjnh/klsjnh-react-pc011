/**
 * AI 模型供应商 store（ai011 · julyAiModelProvider）：只负责状态
 * 分层：store 只负责「状态 + 本地持久化」，不调用 service。
 * 分页偏好：每页条数走 utils/pageSizePref（localStorage `pc011-julyAiModelProvider-pageSize`）。
 */
import { createStore, useStoreState } from '@/stores/createStore';
import { loadPageSize, persistPageSize } from '@/utils/pageSizePref';
import type { AiModelProviderItem, AiModelProviderQueryVo011 } from '@/types/ai011/aiModelProvider/vo';

/** store 状态 */
export interface AiModelProviderState {
  list: AiModelProviderItem[];
  total: number;
  totalPages: number;
  loading: boolean;
  query: AiModelProviderQueryVo011;
}

const SCOPE = 'julyAiModelProvider';

const DEFAULT_QUERY: AiModelProviderQueryVo011 = { pageIndex: 1, pageSize: loadPageSize(SCOPE) };

const base = createStore<AiModelProviderState>({
  list: [], total: 0, totalPages: 1, loading: false, query: DEFAULT_QUERY,
});

/** 用户改动每页条数 → 落盘（其余状态不落盘） */
persistPageSize(base, SCOPE);

export const julyAiModelProviderStore = {
  getSnapshot: base.getSnapshot,
  subscribe: base.subscribe,
  setState: base.setState,
  replace: base.replace,
};

export function useAiModelProviderState(): AiModelProviderState {
  return useStoreState(base);
}
