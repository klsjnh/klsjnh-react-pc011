/**
 * 存储中心「浏览位置」store：跨页共享 存储实例 / 桶 / 对象前缀。
 *
 * 用途：存储桶页点「进入文件」→ 文件列表页沿用它选定的实例 + 桶；
 *       两页各自的下拉也回写这里，来回切换不丢选择。
 * 分层约定：store 只管 UI 选择状态，不落盘、不调 service。
 */
import { createStore, useStoreState } from '@/stores/createStore';

export interface StorageExplorerState {
  /** 当前存储实例编码（空表示未选，由页面派生为第一个可用实例） */
  storageCode?: string;
  /** 当前桶名 */
  bucketName?: string;
  /** 对象前缀过滤（文件列表页，点「查询」时才写入） */
  prefix?: string;
}

const base = createStore<StorageExplorerState>({ prefix: '' });

export const storageExplorerStore = {
  getSnapshot: base.getSnapshot,
  subscribe: base.subscribe,
  setState: base.setState,
  replace: base.replace,

  /** 切换存储实例：桶与前缀一并清空（换实例后旧桶不再有效） */
  selectStorage(storageCode?: string) {
    base.setState({ storageCode, bucketName: undefined, prefix: '' });
  },

  /** 切换桶：前缀清空 */
  selectBucket(bucketName?: string) {
    base.setState({ bucketName, prefix: '' });
  },

  /** 设置前缀过滤 */
  setPrefix(prefix: string) {
    base.setState({ prefix });
  },

  /** 存储桶页「进入文件」：一次性带上实例 + 桶 */
  enterBucket(storageCode: string | undefined, bucketName: string) {
    base.setState({ storageCode, bucketName, prefix: '' });
  },
};

export function useStorageExplorer(): StorageExplorerState {
  return useStoreState(base);
}
