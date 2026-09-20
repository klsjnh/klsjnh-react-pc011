/**
 * 对象 store（storageCenter · object）：负责列表状态 + 分页偏好 + 当前选中（实例/桶）。
 * 分页偏好：每页条数走 utils/pageSizePref（localStorage `pc011-storageObject-pageSize`）。
 *
 * 选中态（storageCode / bucketName）也放 store：StorageObjectPane 内部组件实例每回重建，
 * localStorage 比内存多一层 → 这里只在「选择」时写；pageSize 走 persistPageSize 持久化，
 * 选择态不持久化（会话级），但可跨组件实例保留（同一会话内切走再切回仍记住）。
 */
import { createStore, useStoreState } from '@/stores/createStore';
import { loadPageSize, persistPageSize } from '@/utils/pageSizePref';
import type { StorageObject, StorageObjectQuery } from '@/types/storageCenter';

export interface StorageObjectState {
  list: StorageObject[];
  total: number;
  totalPages: number;
  loading: boolean;
  query: StorageObjectQuery;
}

const SCOPE = 'storageObject';

const DEFAULT_QUERY: StorageObjectQuery = { pageIndex: 1, pageSize: loadPageSize(SCOPE) };

const base = createStore<StorageObjectState>({
  list: [], total: 0, totalPages: 1, loading: false, query: DEFAULT_QUERY,
});

persistPageSize(base, SCOPE);

export const storageObjectStore = {
  getSnapshot: base.getSnapshot,
  subscribe: base.subscribe,
  setState: base.setState,
  replace: base.replace,
  /** 选实例：重置桶 + 跳到第一页 */
  selectStorage: (storageCode: string) => base.setState((s) => ({
    ...s,
    query: { ...s.query, pageIndex: 1, storageCode, bucketName: undefined, prefix: undefined },
  })),
  /** 选桶：跳到第一页 */
  selectBucket: (bucketName: string) => base.setState((s) => ({
    ...s,
    query: { ...s.query, pageIndex: 1, bucketName, prefix: undefined },
  })),
  /** 进入子文件夹：设置 prefix（始终以 '/' 结尾）+ 跳到第一页 */
  navigateToPrefix: (prefix: string) => base.setState((s) => ({
    ...s,
    query: { ...s.query, pageIndex: 1, prefix: prefix.endsWith('/') ? prefix : `${prefix}/` },
  })),
  /** 回到指定 prefix（面包屑跳转）：移除 prefix 或设为某个上级 */
  setPrefix: (prefix: string | undefined) => base.setState((s) => ({
    ...s,
    query: { ...s.query, pageIndex: 1, prefix },
  })),
};

export function useStorageObjectState(): StorageObjectState {
  return useStoreState(base);
}
