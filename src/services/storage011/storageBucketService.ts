/**
 * 存储桶服务（storagecenter · julyStorage/v1/*）
 * 桶名即主键，无 id；所有动作带 storageCode 归属某个存储实例。
 * 后端契约（核对实时 OpenAPI 2026-09-17）：
 *   GET  /julyStorage/v1/getBucket?storageCode=&bucketName=  → {bucketName, exists}（**不存在时 404**）
 *   POST /julyStorage/v1/selectBucketList|selectBucketListByPage  → BucketInfo[] / PageResult011<BucketInfo>
 *        （BucketInfo = {bucketName, creationDate} —— 是对象数组，不再是桶名字符串数组）
 *   POST /julyStorage/v1/insertBucket|removeBucket|testBucketConnection
 *   POST /julyStorage/v1/selectListByPage                     → 存储实例分页（非桶）
 * 区域（region）只在新建入参里，出参不回；创建时间已随 BucketInfo 返回。
 */
import { api } from '@/api/request';
import { STORAGECENTER_BASE } from '@/services/storage011/base';
import { storageBucketStore } from '@/stores/storage011/storageBucketStore';
import type { PageResult011 } from '@/types/common';
import type {
  BucketInfo, StorageBucket, StorageBucketExists, StorageBucketQuery, StorageTestResult,
} from '@/types/storage011';

/** 存储桶动作路径（相对 STORAGECENTER_BASE） */
const BUCKET_ACTIONS = {
  selectListByPage: '/julyStorage/v1/selectBucketListByPage',
  selectList: '/julyStorage/v1/selectBucketList',
  getByName: '/julyStorage/v1/getBucket',
  insert: '/julyStorage/v1/insertBucket',
  remove: '/julyStorage/v1/removeBucket',
  testConnection: '/julyStorage/v1/testBucketConnection',
} as const;

/**
 * 后端桶行 → 前端统一行。
 * 后端回 BucketInfo{bucketName, creationDate}；这里补上**入参**决定的归属实例
 * （桶级接口只认 storageCode 入参，不回带 storageCode）。
 * 兼容纯字符串形态（老契约 / 非分页接口若回 List<String>），避免形状变动再次打崩渲染。
 */
function toBucketRows(rows: (BucketInfo | string)[] | null | undefined, storageCode?: string): StorageBucket[] {
  return (rows || []).map((row) => {
    if (typeof row === 'string') return { bucketName: row, storageCode };
    return { bucketName: String(row?.bucketName ?? ''), creationDate: row?.creationDate, storageCode };
  });
}

/** 分页查询（后端回 PageResult011<BucketInfo>，这里补 storageCode 供「归属实例」列展示） */
export async function selectBucketListByPage(query: StorageBucketQuery = {}): Promise<PageResult011<StorageBucket>> {
  const res = await api.post<PageResult011<BucketInfo>>(BUCKET_ACTIONS.selectListByPage, query, STORAGECENTER_BASE);
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
  await api.post(BUCKET_ACTIONS.insert, { storageCode, bucketName, region }, STORAGECENTER_BASE);
  await fetchBucketPage(storageBucketStore.getSnapshot().query);
}

/** 删除桶 */
export async function removeBucket(storageCode: string | undefined, bucketName: string): Promise<void> {
  await api.post(BUCKET_ACTIONS.remove, { storageCode, bucketName }, STORAGECENTER_BASE);
  await fetchBucketPage(storageBucketStore.getSnapshot().query);
}

/** 某实例下的桶列表（对象选择器用）：后端回 BucketInfo[] */
export async function listBuckets(storageCode?: string): Promise<StorageBucket[]> {
  const rows = await api.post<BucketInfo[]>(BUCKET_ACTIONS.selectList, { storageCode }, STORAGECENTER_BASE);
  return toBucketRows(rows, storageCode);
}

/**
 * 桶是否存在（GET + query）：后端回 {bucketName, exists}，**桶不存在时直接 404**。
 * 调用方需自行 catch 404（404 语义即「不存在」）。
 */
export function getBucketByName(storageCode: string | undefined, bucketName: string): Promise<StorageBucketExists> {
  return api.get<StorageBucketExists>(BUCKET_ACTIONS.getByName, { storageCode, bucketName }, STORAGECENTER_BASE);
}

/** 桶连接测试（恒 200，看 data.success / data.bucketCount） */
export function testBucketConnection(storageCode?: string): Promise<StorageTestResult> {
  return api.post<StorageTestResult>(BUCKET_ACTIONS.testConnection, { storageCode }, STORAGECENTER_BASE);
}
