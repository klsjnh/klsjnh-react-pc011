/**
 * 存储实例服务（storagecenter · julyStorage/v1/*）
 * 分层：page → service → store；store 不调用 service。
 * 后端契约（核对 Java 源码 + 实时 OpenAPI 2026-09-17）：
 *   GET  /julyStorage/v1/getById?id=          GET /julyStorage/v1/getByCode?code=
 *   POST /julyStorage/v1/selectListByPage     POST /julyStorage/v1/insert|update|logicDelete|logicDeleteBatch|testConnection
 *   POST /julyStorage/v1/insertBucket|removeBucket|selectBucketList|selectBucketListByPage|testBucketConnection
 *   GET  /julyStorage/v1/getBucket?storageCode=&bucketName=  → Boolean
 */
import { api } from '@/api/request';
import { STORAGECENTER_BASE } from './base';
import { julyStorageStore } from '@/stores/storage011/julyStorageStore';
import type { PageResult011, IdVo011, BatchDeleteResultVo011 } from '@/types/common';
import type { JulyStorage, JulyStorageConnect, JulyStorageQuery, StorageTestResult } from '@/types/storage011';

/** 存储实例动作路径（相对 STORAGECENTER_BASE） */
const STORAGE_ACTIONS = {
  selectListByPage: '/julyStorage/v1/selectListByPage',
  getById: '/julyStorage/v1/getById',
  getByCode: '/julyStorage/v1/getByCode',
  insert: '/julyStorage/v1/insert',
  update: '/julyStorage/v1/update',
  logicDelete: '/julyStorage/v1/logicDelete',
  logicDeleteBatch: '/julyStorage/v1/logicDeleteBatch',
  testConnection: '/julyStorage/v1/testConnection',
} as const;

/** 分页查询 */
export function selectStorageListByPage(body: object = {}): Promise<PageResult011<JulyStorage>> {
  return api.post<PageResult011<JulyStorage>>(STORAGE_ACTIONS.selectListByPage, body, STORAGECENTER_BASE);
}

/** 拉取存储实例分页并写入 store */
export async function fetchStoragePage(patch: Partial<JulyStorageQuery> = {}): Promise<void> {
  const query = { ...julyStorageStore.getSnapshot().query, ...patch } as JulyStorageQuery;
  julyStorageStore.setState({ loading: true, query });
  try {
    const res = await selectStorageListByPage(query);
    julyStorageStore.setState({ list: res.rows || [], total: res.total || 0, totalPages: res.totalPages || 1, loading: false });
  } catch {
    julyStorageStore.setState({ list: [], total: 0, totalPages: 1, loading: false });
  }
}

/** 主键查（GET + query） */
export function getStorageById(id: string): Promise<JulyStorage> {
  return api.get<JulyStorage>(STORAGE_ACTIONS.getById, { id }, STORAGECENTER_BASE);
}

/** 编码查（GET + query） */
export function getStorageByCode(code: string): Promise<JulyStorage> {
  return api.get<JulyStorage>(STORAGE_ACTIONS.getByCode, { code }, STORAGECENTER_BASE);
}

/** 新增 / 修改存储实例（有 id = 修改，编码不可变；secretKey 留空 = 保持原值） */
export async function saveStorage(params: Partial<JulyStorage> & { id?: string }): Promise<string> {
  const { id, ...rest } = params;
  const { id: savedId } = id
    ? await api.post<IdVo011>(STORAGE_ACTIONS.update, { ...rest, id } as JulyStorage, STORAGECENTER_BASE)
    : await api.post<IdVo011>(STORAGE_ACTIONS.insert, rest as JulyStorage, STORAGECENTER_BASE);
  const q = julyStorageStore.getSnapshot().query;
  await fetchStoragePage({ ...q, pageIndex: id ? q.pageIndex : 1 });
  return savedId;
}

/** 逻辑删除（单个） */
export async function removeStorage(id: string): Promise<void> {
  await api.post<IdVo011>(STORAGE_ACTIONS.logicDelete, { id } as IdVo011, STORAGECENTER_BASE);
  await fetchStoragePage(julyStorageStore.getSnapshot().query);
}

/** 逻辑删除（批量） */
export async function removeStorages(ids: string[]): Promise<BatchDeleteResultVo011> {
  const res = await api.post<BatchDeleteResultVo011>(STORAGE_ACTIONS.logicDeleteBatch, { ids }, STORAGECENTER_BASE);
  await fetchStoragePage(julyStorageStore.getSnapshot().query);
  return res;
}

/** 连接测试（恒 200，连通与否看 data.success）；入参只接受 JulyStorageConnectVo011 的字段（id + 连接字段），多余字段会导致 400 */
export function testStorageConnection(data: JulyStorageConnect): Promise<StorageTestResult> {
  return api.post<StorageTestResult>(STORAGE_ACTIONS.testConnection, data, STORAGECENTER_BASE);
}

/**
 * 实例下拉列表（bucket / object 选择器用）。
 * 后端无 selectList，这里用 selectListByPage 取一页（下拉不需要真分页）。
 */
export async function listStorages(status?: string): Promise<JulyStorage[]> {
  const res = await api.post<PageResult011<JulyStorage>>(
    STORAGE_ACTIONS.selectListByPage,
    { pageIndex: 1, pageSize: 200, status },
    STORAGECENTER_BASE,
  );
  return res.rows || [];
}
