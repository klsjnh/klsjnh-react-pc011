/**
 * 存储桶服务（storagecenter · julyStorage/v1/*）
 * 后端契约（2026-09-24 快照，docs/contracts/2026-09-24-openapi.json）：
 *   GET  /julyStorage/v1/getBucket?storageCode=&bucketCode=  → StorageBucketVo011（不存在 404）
 *   POST /julyStorage/v1/selectBucketList|selectBucketListByPage → StorageBucketVo011[] / PageResult011<StorageBucketVo011>
 *   POST /julyStorage/v1/insertBucket  入参 StorageBucketInsertVo011：bucketCode / bucketName 必填，isDefault / region 可选
 *   POST /julyStorage/v1/removeBucket  入参 StorageBucketRemoveVo011：bucketCode 必填
 *   POST /julyStorage/v1/testBucketConnection
 * ⚠️ 2026-09-24 起桶是独立实体，**以 bucketCode 为唯一键**（旧版出参是桶名字符串数组 / BucketInfo{bucketName, creationDate}，已废弃）。
 *    归属实例（storageCode）由入参决定，出参不回带，这里回填供「归属实例」列展示。
 */
import { api } from '@/api/request';
import { STORAGECENTER_BASE } from '@/services/storageCenter/base';
import { storageBucketStore } from '@/stores/storageCenter/storageBucketStore';
import type { PageResult011 } from '@/types/common';
import type {
  StorageBucket, StorageBucketInsertVo011, StorageBucketQuery, StorageBucketRemoveVo011, StorageBucketVo011,
} from '@/types/storageCenter';

/** 存储桶动作路径（相对 STORAGECENTER_BASE） */
const BUCKET_ACTIONS = {
  selectListByPage: '/julyStorage/v1/selectBucketListByPage',
  selectList: '/julyStorage/v1/selectBucketList',
  getByCode: '/julyStorage/v1/getBucket',
  insert: '/julyStorage/v1/insertBucket',
  remove: '/julyStorage/v1/removeBucket',
  testConnection: '/julyStorage/v1/testBucketConnection',
} as const;

/**
 * 后端桶行（StorageBucketVo011）→ 前端统一行：补上**入参**决定的归属实例
 * （桶级接口只认 storageCode 入参，不回带 storageCode）。
 * 兼容纯字符串形态（更老契约 / 非分页接口若回 List<String>），避免形状变动再次打崩渲染。
 */
function toBucketRows(rows: (StorageBucketVo011 | string)[] | null | undefined, storageCode?: string): StorageBucket[] {
  return (rows || []).map((row) => {
    if (typeof row === 'string') return { bucketCode: row, bucketName: row, storageCode };
    return {
      ...row,
      bucketCode: String(row?.bucketCode ?? ''),
      bucketName: String(row?.bucketName ?? ''),
      storageCode,
    };
  });
}

/** 分页查询（后端回 PageResult011<StorageBucketVo011>，这里补 storageCode 供「归属实例」列展示） */
export async function selectBucketListByPage(query: StorageBucketQuery = {}): Promise<PageResult011<StorageBucket>> {
  const res = await api.post<PageResult011<StorageBucketVo011>>(BUCKET_ACTIONS.selectListByPage, query, STORAGECENTER_BASE);
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

/** 新增桶（StorageBucketInsertVo011：bucketCode / bucketName 必填） */
export async function insertBucket(params: StorageBucketInsertVo011): Promise<void> {
  await api.post(BUCKET_ACTIONS.insert, params, STORAGECENTER_BASE);
  await fetchBucketPage(storageBucketStore.getSnapshot().query);
}

/** 删除桶（StorageBucketRemoveVo011：按 bucketCode） */
export async function removeBucket(storageCode: string | undefined, bucketCode: string): Promise<void> {
  const body: StorageBucketRemoveVo011 = { storageCode, bucketCode };
  await api.post(BUCKET_ACTIONS.remove, body, STORAGECENTER_BASE);
  await fetchBucketPage(storageBucketStore.getSnapshot().query);
}

/** 某实例下的桶列表（对象选择器用）：后端回 StorageBucketVo011[] */
export async function listBuckets(storageCode?: string): Promise<StorageBucket[]> {
  const rows = await api.post<StorageBucketVo011[]>(BUCKET_ACTIONS.selectList, { storageCode }, STORAGECENTER_BASE);
  return toBucketRows(rows, storageCode);
}
