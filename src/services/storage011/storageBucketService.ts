/**
 * 存储桶服务（storage011 · bucket/*）
 * 桶名即主键，无 id；所有动作带 storageCode 归属某个存储实例。
 * 后端契约（核对 Java 源码 StorageBucketController / StorageBucketUseCase）：
 *   GET  /bucket/getByName?storageCode=&bucketName=   → Boolean
 *   POST /bucket/selectList|selectListByPage          → List<String> / PageResult011<String>（**只有桶名**）
 *   POST /bucket/insert|remove|testConnection
 * ⚠️ 桶的区域/创建时间后端不返回，列表页不得展示这两列（否则永远空）。
 */
import { api } from '@/api/request';
import { STORAGE011_BASE } from './base';
import { storageBucketStore } from '@/stores/storage011/storageBucketStore';
import type { PageResult011 } from '@/types/common';
import type { StorageBucket, StorageBucketQuery, StorageTestResult } from '@/types/storage011';

/** 存储桶动作路径（相对 STORAGE011_BASE） */
const BUCKET_ACTIONS = {
  selectListByPage: '/bucket/selectListByPage',
  selectList: '/bucket/selectList',
  getByName: '/bucket/getByName',
  insert: '/bucket/insert',
  remove: '/bucket/remove',
  testConnection: '/bucket/testConnection',
} as const;

/** 桶名字符串 → 行（挂上归属实例，桶级接口只认 storageCode 入参，不回带） */
function toBucketRows(names: string[] | null | undefined, storageCode?: string): StorageBucket[] {
  return (names || []).map((name) => ({ bucketName: name, storageCode }));
}

/** 分页查询（后端返回桶名数组，这里补齐 storageCode 供表格展示「归属实例」） */
export async function selectBucketListByPage(query: StorageBucketQuery = {}): Promise<PageResult011<StorageBucket>> {
  const res = await api.post<PageResult011<string>>(BUCKET_ACTIONS.selectListByPage, query, STORAGE011_BASE);
  return { ...res, rows: toBucketRows(res.rows, query.storageCode) };
}

/** 拉取存储桶分页并写入 store */
export async function fetchBucketPage(patch: Partial<StorageBucketQuery> = {}): Promise<void> {
  const query = { ...storageBucketStore.getSnapshot().query, ...patch } as StorageBucketQuery;
  storageBucketStore.setState({ loading: true, query });
  try {
    const res = await selectBucketListByPage(query);
    storageBucketStore.setState({ list: res.rows || [], total: res.total || 0, totalPages: res.totalPages || 1, loading: false });
  } catch {
    storageBucketStore.setState({ list: [], total: 0, totalPages: 1, loading: false });
  }
}

/** 新增桶 */
export async function insertBucket(storageCode: string | undefined, bucketName: string, region?: string): Promise<void> {
  await api.post(BUCKET_ACTIONS.insert, { storageCode, bucketName, region }, STORAGE011_BASE);
  await fetchBucketPage(storageBucketStore.getSnapshot().query);
}

/** 删除桶 */
export async function removeBucket(storageCode: string | undefined, bucketName: string): Promise<void> {
  await api.post(BUCKET_ACTIONS.remove, { storageCode, bucketName }, STORAGE011_BASE);
  await fetchBucketPage(storageBucketStore.getSnapshot().query);
}

/** 某实例下的桶列表（对象选择器用）：后端返回桶名数组 */
export async function listBuckets(storageCode?: string): Promise<StorageBucket[]> {
  const names = await api.post<string[]>(BUCKET_ACTIONS.selectList, { storageCode }, STORAGE011_BASE);
  return toBucketRows(names, storageCode);
}

/** 桶是否存在（GET + query） */
export function getBucketByName(storageCode: string | undefined, bucketName: string): Promise<boolean> {
  return api.get<boolean>(BUCKET_ACTIONS.getByName, { storageCode, bucketName }, STORAGE011_BASE);
}

/** 桶连接测试（恒 200，看 data.success） */
export function testBucketConnection(storageCode?: string): Promise<StorageTestResult> {
  return api.post<StorageTestResult>(BUCKET_ACTIONS.testConnection, { storageCode }, STORAGE011_BASE);
}
