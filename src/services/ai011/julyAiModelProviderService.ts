/**
 * AI 模型供应商服务（aicenter · julyAiModelProvider/v1/*）
 * ⚠️ 2026-09-20 后端换版：ai011 改名 aicenter，前端 baseOverride 传 AI011_BASE（=/klsjnh/aicenter）。
 * 字段严格对齐后端 AiModelProviderController：主表 provider + 子表 api。
 * 分层：page → service → store；store 不调用 service。
 */
import { api } from '@/api/request';
import { julyAiModelProviderStore } from '@/stores/ai011/julyAiModelProviderStore';
import type {
  AiModelProviderItem,
  AiModelProviderApiItem,
  AiModelProviderQueryVo011,
  AiModelProviderInsertVo011,
  AiModelProviderUpdateVo011,
  AiModelProviderTestVo011,
  AiModelProviderTestResultVo011,
  AiModelProviderApiQueryVo011,
  AiModelProviderApiInsertVo011,
  AiModelProviderApiUpdateVo011,
  SaveAiModelProviderParams,
  SaveAiModelProviderApiParams,
} from '@/types/ai011/aiModelProvider/vo';
import type { PageResult011, IdVo011 } from '@/types/common';

/** AI 模型供应商模块 API 根路径（区别于默认 system011 / datasource） */
export const AI011_BASE = '/klsjnh/aicenter';

/** 动作路径（相对路径，请求 URL = AI011_BASE + action） */
const AI_PROVIDER_ACTIONS = {
  selectListByPage: '/julyAiModelProvider/v1/selectListByPage',
  getById: '/julyAiModelProvider/v1/getById',
  insert: '/julyAiModelProvider/v1/insert',
  update: '/julyAiModelProvider/v1/update',
  logicDelete: '/julyAiModelProvider/v1/logicDelete',
  testConnection: '/julyAiModelProvider/v1/testConnection',
  selectApiListByProvider: '/julyAiModelProvider/v1/selectApiListByProvider',
  insertApi: '/julyAiModelProvider/v1/insertApi',
  updateApi: '/julyAiModelProvider/v1/updateApi',
  logicDeleteApi: '/julyAiModelProvider/v1/logicDeleteApi',
  testConnectionApi: '/julyAiModelProvider/v1/testConnectionApi',
} as const;

/** 供应商分页查询 */
export function selectProviderListByPage(body: object = {}): Promise<PageResult011<AiModelProviderItem>> {
  return api.post<PageResult011<AiModelProviderItem>>(AI_PROVIDER_ACTIONS.selectListByPage, body, AI011_BASE);
}

/** 拉取供应商分页并写入 store */
export async function fetchProviderPage(patch: Partial<AiModelProviderQueryVo011> = {}): Promise<void> {
  const query = { ...julyAiModelProviderStore.getSnapshot().query, ...patch } as AiModelProviderQueryVo011;
  julyAiModelProviderStore.setState({ loading: true, query });
  try {
    const res = await selectProviderListByPage(query);
    julyAiModelProviderStore.setState({ list: res.rows || [], total: res.total || 0, totalPages: res.totalPages || 1, loading: false });
  } catch {
    julyAiModelProviderStore.setState({ list: [], total: 0, totalPages: 1, loading: false });
  }
}

/** 供应商主键查询 */
export function getProviderById(id: string): Promise<AiModelProviderItem> {
  return api.post<AiModelProviderItem>(AI_PROVIDER_ACTIONS.getById, { id }, AI011_BASE);
}

/** 新增 / 修改供应商（有 id = 编辑；编辑时 providerCode 不可变） */
export async function saveProvider(params: SaveAiModelProviderParams): Promise<string> {
  const { id, providerCode, providerName, baseUrl, models, sortOrder, status, remark } = params;
  const { id: savedId } = id
    ? await api.post<IdVo011>(AI_PROVIDER_ACTIONS.update, {
        id, providerName, baseUrl, models, sortOrder, status, remark,
      } as AiModelProviderUpdateVo011, AI011_BASE)
    : await api.post<IdVo011>(AI_PROVIDER_ACTIONS.insert, {
        providerCode, providerName, baseUrl, models, sortOrder, remark,
      } as AiModelProviderInsertVo011, AI011_BASE);
  const q = julyAiModelProviderStore.getSnapshot().query;
  await fetchProviderPage({ ...q, pageIndex: id ? q.pageIndex : 1 });
  return savedId;
}

/** 供应商逻辑删除（级联移除其 API 子表） */
export async function removeProvider(id: string): Promise<void> {
  await api.post<IdVo011>(AI_PROVIDER_ACTIONS.logicDelete, { id }, AI011_BASE);
  await fetchProviderPage(julyAiModelProviderStore.getSnapshot().query);
}

/** 供应商测试连接（恒 200；连通与否看 data.success） */
export function testProviderConnection(body: AiModelProviderTestVo011): Promise<AiModelProviderTestResultVo011> {
  return api.post<AiModelProviderTestResultVo011>(AI_PROVIDER_ACTIONS.testConnection, body, AI011_BASE);
}

/** API 子表：按供应商编码查询 */
export function selectApiListByProvider(body: AiModelProviderApiQueryVo011): Promise<AiModelProviderApiItem[]> {
  return api.post<AiModelProviderApiItem[]>(AI_PROVIDER_ACTIONS.selectApiListByProvider, body, AI011_BASE);
}

/** API 子表：新增 / 修改（有 id = 编辑） */
export async function saveProviderApi(params: SaveAiModelProviderApiParams): Promise<string> {
  const { id, providerCode, apiCode, apiName, apiKey, sortOrder, status, remark } = params;
  const { id: savedId } = id
    ? await api.post<IdVo011>(AI_PROVIDER_ACTIONS.updateApi, {
        id, apiName, apiKey, sortOrder, status, remark,
      } as AiModelProviderApiUpdateVo011, AI011_BASE)
    : await api.post<IdVo011>(AI_PROVIDER_ACTIONS.insertApi, {
        providerCode, apiCode, apiName, apiKey, sortOrder, remark,
      } as AiModelProviderApiInsertVo011, AI011_BASE);
  return savedId;
}

/** API 子表：逻辑删除 */
export async function removeProviderApi(id: string): Promise<void> {
  await api.post<IdVo011>(AI_PROVIDER_ACTIONS.logicDeleteApi, { id }, AI011_BASE);
}

/** API 子表：测试连接（按 id 定位所属供应商） */
export function testProviderApiConnection(id: string): Promise<AiModelProviderTestResultVo011> {
  return api.post<AiModelProviderTestResultVo011>(AI_PROVIDER_ACTIONS.testConnectionApi, { id }, AI011_BASE);
}
