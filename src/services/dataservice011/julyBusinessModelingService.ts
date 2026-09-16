/**
 * 业务建模（低代码）服务（dataservice011 · julyBusinessModeling/v1/*）
 * 后端模块前缀为 /klsjnh/dataservice011（复用 DATASERVICE011_BASE）。
 * 主表 modeling + 子表 fieldData；并提供 probe / executeSql / executeSqlByPage / getModelData。
 * 分层：page → service → store；store 不调用 service。
 */
import { api } from '@/api/request';
import { julyBusinessModelingStore } from '@/stores/dataservice011/julyBusinessModelingStore';
import type {
  JulyBusinessModelingItem,
  JulyBusinessModelingQueryVo011,
  JulyBusinessModelingInsertVo011,
  JulyBusinessModelingUpdateVo011,
  JulyBusinessModelingSqlVo011,
  JulyBusinessModelingProbeResultVo011,
  JulyBusinessModelingSqlResultVo011,
  SaveBusinessModelingParams,
} from '@/types/dataservice011/businessModeling';
import type { PageResult011, IdVo011 } from '@/types/common';
import { DATASERVICE011_BASE } from '@/services/dataservice011/julyDatasourceService';

const MODELING_ACTIONS = {
  selectListByPage: '/julyBusinessModeling/v1/selectListByPage',
  getById: '/julyBusinessModeling/v1/getById',
  insert: '/julyBusinessModeling/v1/insert',
  update: '/julyBusinessModeling/v1/update',
  logicDelete: '/julyBusinessModeling/v1/logicDelete',
  probe: '/julyBusinessModeling/v1/probe',
  executeSql: '/julyBusinessModeling/v1/executeSql',
  executeSqlByPage: '/julyBusinessModeling/v1/executeSqlByPage',
  getModelData: '/julyBusinessModeling/v1/getModelData',
} as const;

/** 分页查询 */
export function selectModelingListByPage(body: object = {}): Promise<PageResult011<JulyBusinessModelingItem>> {
  return api.post<PageResult011<JulyBusinessModelingItem>>(MODELING_ACTIONS.selectListByPage, body, DATASERVICE011_BASE);
}

/** 拉取分页并写入 store */
export async function fetchModelingPage(patch: Partial<JulyBusinessModelingQueryVo011> = {}): Promise<void> {
  const query = { ...julyBusinessModelingStore.getSnapshot().query, ...patch } as JulyBusinessModelingQueryVo011;
  julyBusinessModelingStore.setState({ loading: true, query });
  try {
    const res = await selectModelingListByPage(query);
    julyBusinessModelingStore.setState({ list: res.rows || [], total: res.total || 0, totalPages: res.totalPages || 1, loading: false });
  } catch {
    julyBusinessModelingStore.setState({ list: [], total: 0, totalPages: 1, loading: false });
  }
}

/** 主键查询 */
export function getModelingById(id: string): Promise<JulyBusinessModelingItem> {
  return api.post<JulyBusinessModelingItem>(MODELING_ACTIONS.getById, { id }, DATASERVICE011_BASE);
}

/** 新增 / 修改（有 id = 编辑；编辑时 modelCode / objectName 不可变） */
export async function saveModeling(params: SaveBusinessModelingParams): Promise<string> {
  const { id, modelCode, modelName, objectName, dataSourceCode, remark, status, fieldData } = params;
  const { id: savedId } = id
    ? await api.post<IdVo011>(MODELING_ACTIONS.update, {
        id, modelName, dataSourceCode, remark, status, fieldData,
      } as JulyBusinessModelingUpdateVo011, DATASERVICE011_BASE)
    : await api.post<IdVo011>(MODELING_ACTIONS.insert, {
        modelCode, modelName, objectName, dataSourceCode, remark, fieldData,
      } as JulyBusinessModelingInsertVo011, DATASERVICE011_BASE);
  const q = julyBusinessModelingStore.getSnapshot().query;
  await fetchModelingPage({ ...q, pageIndex: id ? q.pageIndex : 1 });
  return savedId;
}

/** 逻辑删除 */
export async function removeModeling(id: string): Promise<void> {
  await api.post<IdVo011>(MODELING_ACTIONS.logicDelete, { id }, DATASERVICE011_BASE);
  await fetchModelingPage(julyBusinessModelingStore.getSnapshot().query);
}

/** SQL 探测（列结构） */
export function probeSql(body: JulyBusinessModelingSqlVo011): Promise<JulyBusinessModelingProbeResultVo011> {
  return api.post<JulyBusinessModelingProbeResultVo011>(MODELING_ACTIONS.probe, body, DATASERVICE011_BASE);
}

/** SQL 执行（不分页） */
export function executeSql(body: JulyBusinessModelingSqlVo011): Promise<JulyBusinessModelingSqlResultVo011> {
  return api.post<JulyBusinessModelingSqlResultVo011>(MODELING_ACTIONS.executeSql, body, DATASERVICE011_BASE);
}

/** SQL 执行（分页） */
export function executeSqlByPage(body: JulyBusinessModelingSqlVo011): Promise<JulyBusinessModelingSqlResultVo011 & PageResult011<Record<string, unknown>>> {
  return api.post<JulyBusinessModelingSqlResultVo011 & PageResult011<Record<string, unknown>>>(MODELING_ACTIONS.executeSqlByPage, body, DATASERVICE011_BASE);
}

/** 获取模型数据（按模型编码回填示例数据） */
export function getModelData(body: { modelCode?: string; id?: string }): Promise<JulyBusinessModelingSqlResultVo011> {
  return api.post<JulyBusinessModelingSqlResultVo011>(MODELING_ACTIONS.getModelData, body, DATASERVICE011_BASE);
}
