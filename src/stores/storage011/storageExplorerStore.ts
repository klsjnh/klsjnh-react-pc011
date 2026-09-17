/**
 * 存储中心「浏览位置」store：跨页共享 存储实例 / 桶 / 对象前缀，并**持久化到 localStorage**。
 *
 * 用途：文件列表页 / 存储管理页共用同一份选择态 —— 选过的存储实例与桶要「记住」：
 *       刷新页面、切走再切回、从存储管理跳到文件列表，都延续上次的实例 + 桶。
 * 分层约定：store 只管 UI 选择状态 + 本地持久化，不落盘业务数据、不调 service。
 *
 * 持久化键：`pc011-storage-explorer`（与 pageSizePref 的 `pc011-<scope>-pageSize` 同前缀）。
 * 读取时逐字段做类型校验，脏数据静默丢弃 → 回落到「未选」，由页面派生第一个可用实例。
 */
import { createStore, useStoreState } from '@/stores/createStore';

export interface StorageExplorerState {
  /** 当前存储实例编码（空表示未选，由页面派生为第一个可用实例） */
  storageCode?: string;
  /** 当前桶名 */
  bucketName?: string;
  /** 对象前缀过滤（文件列表页，进入文件夹 / 点查询时写入） */
  prefix?: string;
}

const STORAGE_KEY = 'pc011-storage-explorer';

/** 只保留字符串型字段，其余（含 JSON 损坏）一律回落到缺省值 */
function loadPersisted(): StorageExplorerState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { prefix: '' };
    const parsed = JSON.parse(raw) as StorageExplorerState | null;
    return {
      storageCode: typeof parsed?.storageCode === 'string' && parsed.storageCode ? parsed.storageCode : undefined,
      bucketName: typeof parsed?.bucketName === 'string' && parsed.bucketName ? parsed.bucketName : undefined,
      prefix: typeof parsed?.prefix === 'string' ? parsed.prefix : '',
    };
  } catch {
    return { prefix: '' };
  }
}

const base = createStore<StorageExplorerState>(loadPersisted());

/** 选择态变化即落盘（订阅一次，避免每个方法各写一遍） */
let lastRaw = JSON.stringify(base.getSnapshot());
base.subscribe((state) => {
  const raw = JSON.stringify({
    storageCode: state?.storageCode,
    bucketName: state?.bucketName,
    prefix: state?.prefix ?? '',
  });
  if (raw === lastRaw) return;
  lastRaw = raw;
  try { localStorage.setItem(STORAGE_KEY, raw); } catch { /* 存储不可用 → 仅内存生效 */ }
});

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

  /** 设置前缀过滤（面包屑跳转：传 undefined 回桶根目录） */
  setPrefix(prefix?: string) {
    base.setState({ prefix: prefix ?? '' });
  },

  /** 进入子文件夹：prefix 统一以 '/' 结尾 */
  navigateToPrefix(prefix: string) {
    base.setState({ prefix: prefix.endsWith('/') ? prefix : `${prefix}/` });
  },

  /** 存储桶页「进入文件」：一次性带上实例 + 桶 */
  enterBucket(storageCode: string | undefined, bucketName: string) {
    base.setState({ storageCode, bucketName, prefix: '' });
  },
};

export function useStorageExplorer(): StorageExplorerState {
  return useStoreState(base);
}
