/**
 * 数据源服务（dataservice011 · julyDatasource/v1/*）
 * 后端模块前缀为 /klsjnh/dataservice011（与 system011 不同，走 baseOverride）。
 * 字段与后端 JulyDatasourceController 严格对齐：dsCode/dsName/dbType/jdbcUrl/...
 * 分层：page → service → store；store 不调用 service。
 */
import { api } from '@/api/request';
import { julyDatasourceStore } from '@/stores/dataservice011/julyDatasourceStore';
import type {
  DataSourceItem, JulyDatasourceQueryVo011, JulyDatasourceInsertVo011,
  JulyDatasourceUpdateVo011, JulyDatasourceTestVo011, JulyDatasourceTestResultVo011,
  SaveDatasourceParams,
} from '@/types/dataservice011/datasource';
import type { PageResult011, IdVo011 } from '@/types/common';

/** 数据源模块 API 根路径（区别于默认 system011，显式指定 dataservice011） */
export const DATASERVICE011_BASE = '/klsjnh/dataservice011';

/** 数据源动作路径（相对路径，请求 URL = DATASERVICE011_BASE + action） */
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
  return api.post<PageResult011<DataSourceItem>>(DATASOURCE_ACTIONS.selectListByPage, body, DATASERVICE011_BASE);
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

/** 主键查询（后端为 GET + query 参数） */
export function getDatasourceById(id: string): Promise<DataSourceItem> {
  return api.get<DataSourceItem>(DATASOURCE_ACTIONS.getById, { id }, DATASERVICE011_BASE);
}

/** 新增 / 修改数据源（有 id = 编辑；编辑时 dsCode 不可变、password 留空保持原值） */
export async function saveDatasource(params: SaveDatasourceParams): Promise<string> {
  const { id, dsCode, dsName, dbType, jdbcUrl, schemaName, username, password, driverClass, remark } = params;
  const { id: savedId } = id
    ? await api.post<IdVo011>(DATASOURCE_ACTIONS.update, {
        id, dsName, dbType, jdbcUrl, schemaName, username, password, driverClass, remark,
      } as JulyDatasourceUpdateVo011, DATASERVICE011_BASE)
    : await api.post<IdVo011>(DATASOURCE_ACTIONS.insert, {
        dsCode, dsName, dbType, jdbcUrl, schemaName, username, password, driverClass, remark,
      } as JulyDatasourceInsertVo011, DATASERVICE011_BASE);
  const q = julyDatasourceStore.getSnapshot().query;
  await fetchDatasourcePage({ ...q, pageIndex: id ? q.pageIndex : 1 });
  return savedId;
}

/** 逻辑删除（单个），移除后刷新 */
export async function removeDatasource(id: string): Promise<void> {
  await api.post<IdVo011>(DATASOURCE_ACTIONS.logicDelete, { id }, DATASERVICE011_BASE);
  await fetchDatasourcePage(julyDatasourceStore.getSnapshot().query);
}

/** 逻辑删除（批量） */
export async function removeDatasources(ids: string[]): Promise<void> {
  await api.post<{ total: number; success: number; failed: number; errors: { id: string; message: string }[] }>(
    DATASOURCE_ACTIONS.logicDeleteBatch, { ids }, DATASERVICE011_BASE,
  );
  await fetchDatasourcePage(julyDatasourceStore.getSnapshot().query);
}

/** 测试连接（恒 200；连通与否看 data.success） */
export function testDatasourceConnection(
  body: JulyDatasourceTestVo011,
): Promise<JulyDatasourceTestResultVo011> {
  return api.post<JulyDatasourceTestResultVo011>(DATASOURCE_ACTIONS.testConnection, body, DATASERVICE011_BASE);
}

/** 重新加载数据源注册表 */
export function reloadDatasourceRegistry(): Promise<unknown> {
  return api.post(DATASOURCE_ACTIONS.reloadRegistry, {}, DATASERVICE011_BASE);
}