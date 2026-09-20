/**
 * 业务建模（低代码）服务（dataservice011 · julyBusinessModeling/v1/*）
 * 后端模块前缀为 /klsjnh/dataservice011（复用 DATASERVICE011_BASE）。
 * 分层：page → service → store；store 不调用 service。
 *
 * ⚠️⚠️ 2026-09-20 迁移警示（勿当现役接口用）⚠️⚠️
 * 后端换版后 julyBusinessModeling 已随低代码整体迁往新项目，
 * 本仓库对接的 11160 后端**已无该资源**——非 mock 模式下所有请求必然 404。
 * 现状态：侧边栏入口已隐藏（见 stores/system011/julyMenuStore 的 HIDDEN_NAV_ROUTES），
 * 本文件连同页面 / store / mock / types 整体保留，待与新项目的对接方案确定后再处置
 * （迁移 或 删除）。迁移前请勿在此新增调用点。
 *
 * 契约以**后端源码**为准（`java17-web011/.../vo/julybusinessmodeling/*.java`，Swagger 未建模出参形状）：
 *   GET   getById(?id) / getByCode(?modelCode) / getModelData(?id)   ← 走 api.get，body 序列化为 query
 *   POST  其余（insert / update / logicDelete / logicDeleteBatch / selectListByPage / probe / executeSql / executeSqlByPage）
 * 方法错配在本项目表现为 **500**（不是 405），排查时优先核对此处。
 */
import { api } from '@/api/request';
import { julyBusinessModelingStore } from '@/stores/dataservice011/julyBusinessModelingStore';
import type {
  JulyBusinessModelingVo011,
  JulyBusinessModelingQueryVo011,
  JulyBusinessModelingInsertVo011,
  JulyBusinessModelingUpdateVo011,
  JulyBusinessModelingProbeVo011,
  JulyBusinessModelingProbeResultVo011,
  JulyBusinessModelingExecuteVo011,
  JulyBusinessModelingPageExecuteVo011,
  JulyBusinessModelingResultVo011,
  SaveBusinessModelingParams,
} from '@/types/dataservice011/businessModeling';
import type { PageResult011, IdVo011 } from '@/types/common';
import { DATASERVICE011_BASE } from '@/services/dataservice011/julyDatasourceService';

const MODELING_ACTIONS = {
  selectListByPage: '/julyBusinessModeling/v1/selectListByPage',
  getById: '/julyBusinessModeling/v1/getById',
  getByCode: '/julyBusinessModeling/v1/getByCode',
  insert: '/julyBusinessModeling/v1/insert',
  update: '/julyBusinessModeling/v1/update',
  logicDelete: '/julyBusinessModeling/v1/logicDelete',
  logicDeleteBatch: '/julyBusinessModeling/v1/logicDeleteBatch',
  probe: '/julyBusinessModeling/v1/probe',
  executeSql: '/julyBusinessModeling/v1/executeSql',
  executeSqlByPage: '/julyBusinessModeling/v1/executeSqlByPage',
  getModelData: '/julyBusinessModeling/v1/getModelData',
} as const;

/** 分页查询 */
export function selectModelingListByPage(body: object = {}): Promise<PageResult011<JulyBusinessModelingVo011>> {
  return api.post<PageResult011<JulyBusinessModelingVo011>>(MODELING_ACTIONS.selectListByPage, body, DATASERVICE011_BASE);
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

/** 主键点查（GET，id 走 query；含 metaData + fieldData 产物与 sqlContent） */
export function getModelingById(id: string): Promise<JulyBusinessModelingVo011> {
  return api.get<JulyBusinessModelingVo011>(MODELING_ACTIONS.getById, { id }, DATASERVICE011_BASE);
}

/** 按建模编码点查（GET，modelCode 走 query） */
export function getModelingByCode(modelCode: string): Promise<JulyBusinessModelingVo011> {
  return api.get<JulyBusinessModelingVo011>(MODELING_ACTIONS.getByCode, { modelCode }, DATASERVICE011_BASE);
}

/**
 * 交接产物（GET，仅收 id）—— ★ **业务建模 → 低代码元数据** 的桥。
 * 返回 `metaData` + `fieldData` 两段（含后端自动补齐的公共列）。
 * `ModelDataCodec011` 已固定 key 映射，与 `july_metadata` 表一一对应：
 *   description→description、importField→businessField、url→routerPath、
 *   fieldData[].code/name/fieldType/length/notNull → fields[].fieldCode/fieldName/fieldType/fieldLength/requiredField。
 */
export function getModelData(id: string): Promise<JulyBusinessModelingVo011> {
  return api.get<JulyBusinessModelingVo011>(MODELING_ACTIONS.getModelData, { id }, DATASERVICE011_BASE);
}

/** 新增 / 修改（有 id = 编辑；编辑时 modelCode / objectName 不可变） */
export async function saveModeling(params: SaveBusinessModelingParams): Promise<string> {
  const {
    id, modelCode, modelName, objectName, dataSourceCode, sqlContent,
    objectType, objectDescription, packageName, businessField, routerPath, remark, fieldData,
  } = params;
  const { id: savedId } = id
    ? await api.post<IdVo011>(MODELING_ACTIONS.update, {
        id, modelName, dataSourceCode, sqlContent,
        objectType, objectDescription, packageName, businessField, routerPath, remark, fieldData,
      } as JulyBusinessModelingUpdateVo011, DATASERVICE011_BASE)
    : await api.post<IdVo011>(MODELING_ACTIONS.insert, {
        modelCode, modelName, objectName, dataSourceCode, sqlContent,
        objectType, objectDescription, packageName, businessField, routerPath, remark, fieldData,
      } as JulyBusinessModelingInsertVo011, DATASERVICE011_BASE);
  const q = julyBusinessModelingStore.getSnapshot().query;
  await fetchModelingPage({ ...q, pageIndex: id ? q.pageIndex : 1 });
  return savedId;
}

/** 逻辑删除（单个） */
export async function removeModeling(id: string): Promise<void> {
  await api.post<IdVo011>(MODELING_ACTIONS.logicDelete, { id }, DATASERVICE011_BASE);
  await fetchModelingPage(julyBusinessModelingStore.getSnapshot().query);
}

/** 逻辑删除（批量） */
export async function removeModelingBatch(ids: string[]): Promise<void> {
  await api.post<IdVo011>(MODELING_ACTIONS.logicDeleteBatch, { ids }, DATASERVICE011_BASE);
  await fetchModelingPage(julyBusinessModelingStore.getSnapshot().query);
}

/**
 * SQL 探针（草稿态可用，不落库）。
 * ★ 后端 `probe` 即 `probeAndInfer`：**直接返回推断好的 fieldData**（含公共列补齐），
 * 前端拿回灌进字段子表即可；`success=false` 时为业务失败（HTTP 仍 200）。
 */
export function probeSql(body: JulyBusinessModelingProbeVo011): Promise<JulyBusinessModelingProbeResultVo011> {
  return api.post<JulyBusinessModelingProbeResultVo011>(MODELING_ACTIONS.probe, body, DATASERVICE011_BASE);
}

/** 执行 SQL（不分页；返回 columns + rows） */
export function executeSql(body: JulyBusinessModelingExecuteVo011): Promise<JulyBusinessModelingResultVo011> {
  return api.post<JulyBusinessModelingResultVo011>(MODELING_ACTIONS.executeSql, body, DATASERVICE011_BASE);
}

/** 分页执行 SQL（方言分页；返回 PageResult011，**不返回 columns**，列名需从行数据推） */
export function executeSqlByPage(body: JulyBusinessModelingPageExecuteVo011): Promise<PageResult011<Record<string, unknown>>> {
  return api.post<PageResult011<Record<string, unknown>>>(MODELING_ACTIONS.executeSqlByPage, body, DATASERVICE011_BASE);
}
