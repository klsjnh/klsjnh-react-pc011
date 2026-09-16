/**
 * 数据源 store（dataservice011 · julyDatasource）：只负责状态
 * 分页偏好：每页条数走 utils/pageSizePref（localStorage `pc011-julyDatasource-pageSize`）。
 */
import { createStore, useStoreState } from '@/stores/createStore';
import { loadPageSize, persistPageSize } from '@/utils/pageSizePref';
import type { DataSourceItem } from '@/types/dataservice011/datasource';
import type { JulyDatasourceQueryVo011 } from '@/types/dataservice011/datasource';

/** 数据源 store 状态 */
export interface DatasourceState {
  list: DataSourceItem[];
  total: number;
  totalPages: number;
  loading: boolean;
  query: JulyDatasourceQueryVo011;
}

const SCOPE = 'julyDatasource';

const DEFAULT_QUERY: JulyDatasourceQueryVo011 = { pageIndex: 1, pageSize: loadPageSize(SCOPE) };

const base = createStore<DatasourceState>({
  list: [], total: 0, totalPages: 1, loading: false, query: DEFAULT_QUERY,
});

/** 用户改动每页条数 → 落盘（其余状态不落盘） */
persistPageSize(base, SCOPE);

export const julyDatasourceStore = {
  getSnapshot: base.getSnapshot,
  subscribe: base.subscribe,
  setState: base.setState,
  replace: base.replace,
};

export function useDatasourceState(): DatasourceState {
  return useStoreState(base);
}