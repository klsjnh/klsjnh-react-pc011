/**
 * 数据源服务（julyDatasource/v1/*）
 * 后端模块前缀为 dataservice011。
 * 分层：page → service → store；store 不调用 service。
 */
import { api } from '@/api/request';
import { julyDatasourceStore } from '@/stores/dataservice011/julyDatasourceStore';
import type {
  DataSourceItem, JulyDatasourceQueryVo011, JulyDatasourceInsertVo011,
  JulyDatasourceUpdateVo011, SaveDatasourceParams, PageResult011, IdVo011,
} from '@/types/dataservice011/datasource';

/** 数据源动作路径（相对路径，请求 URL = apiBaseUrl + action） */
const DATASOURCE_ACTIONS = {
  selectListByPage: '/julyDatasource/v1/selectListByPage',
  getById: '/julyDatasource/v1/getById',
  insert: '/julyDatasource/v1/insert',
  update: '/julyDatasource/v1/update',
  logicDelete: '/julyDatasource/v1/logicDelete',
  logicDeleteBatch: '/julyDatasource/v1/logicDeleteBatch',
  testConnection: '/julyDatasource/v1/testConnection',
  reloadRegistry: '/julyDatasource/v1/reloadRegistry',
} as const;

/** 分页查询 */
export function selectDatasourceListByPage(body: object = {}): Promise<PageResult011<DataSourceItem>> {
  return api.post<PageResult011<DataSourceItem>>(DATASOURCE_ACTIONS.selectListByPage, body);
}

/** 拉取数据源分页并写入 store */
export async function fetchDatasourcePage(patch: Partial<JulyDatasourceQueryVo011> = {}): Promise<void> {
  const query = { ...julyDatasourceStore.getSnapshot().query, ...patch } as JulyDatasourceQueryVo011;
  julyDatasourceStore.setState({ loading: true, query });
  try {
    const res = await selectDatasourceListByPage(query);
    julyDatasourceStore.setState({ list: res.rows || [], total: res.total || 0, totalPages: res.totalPages || 1, loading: false });
  } catch {
    julyDatasourceStore.setState({ list: [], total: 0, totalPages: 1, loading: false });
  }
}

/** 主键查询 */
export function getDatasourceById(id: number): Promise<DataSourceItem> {
  return api.post(DATASOURCE_ACTIONS.getById, { id });
}

/** 新增 / 修改数据源（有 id = 编辑） */
export async function saveDatasource(params: SaveDatasourceParams): Promise<number> {
  const { id, name, type, host, database, status } = params;
  const { id: savedId } = id
    ? await api.post<IdVo011>(DATASOURCE_ACTIONS.update, { id, name, type, host, database, status: status || 'connected' } as JulyDatasourceUpdateVo011)
    : await api.post<IdVo011>(DATASOURCE_ACTIONS.insert, { name, type, host, database } as JulyDatasourceInsertVo011);
  const q = julyDatasourceStore.getSnapshot().query;
  await fetchDatasourcePage({ ...q, pageIndex: id ? q.pageIndex : 1 });
  return savedId;
}

/** 逻辑删除（单个），移除后刷新 */
export async function removeDatasource(id: number): Promise<void> {
  await api.post(DATASOURCE_ACTIONS.logicDelete, { id });
  await fetchDatasourcePage(julyDatasourceStore.getSnapshot().query);
}

/** 逻辑删除（批量） */
export async function removeDatasources(ids: number[]): Promise<void> {
  await api.post(DATASOURCE_ACTIONS.logicDeleteBatch, { ids });
  await fetchDatasourcePage(julyDatasourceStore.getSnapshot().query);
}

/** 测试连接 */
export function testConnection(body: object): Promise<{ connected: boolean; latency?: string; message?: string }> {
  return api.post(DATASOURCE_ACTIONS.testConnection, body);
}

/** 重新加载数据源注册表 */
export function reloadRegistry(): Promise<void> {
  return api.post(DATASOURCE_ACTIONS.reloadRegistry, {});
}