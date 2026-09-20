/**
 * 元数据服务（lowcode011 / julyMetadata/v1/*）—— 一主三子整体管理。
 * 分层：page → service → store；service 编排业务并写 store，不直接被 store 调用。
 *
 * ⚠️⚠️ 2026-09-20 迁移警示（勿当现役接口用）⚠️⚠️
 * 低代码模块已整体迁往新项目，本仓库对接的 11160 后端**已无 lowcode011**——
 * 非 mock 模式下所有请求必然 404。现状态：侧边栏入口已隐藏
 * （见 stores/system011/julyMenuStore 的 HIDDEN_NAV_ROUTES），
 * 本目录（services / pages / stores / mock / types）整体保留，处置方案待定。
 *
 * 本文件覆盖后端 039 已上线的**两期**（2026-09-17）：
 *  - 一期（设计闭环，零改库）：`listMetadataModels` / `loadMetadataDto` / `saveMetadataDto` / `previewMetadataDdl`
 *  - 二期（发布闭环）：`publishMetadata` / `getMetadataImportStatus` / `importMetadataDataFromSql`
 * 三期（运行时 CRUD / 菜单 / 开放 API）后端未实装，前端占位见 `services/lowcode011/metadataDesignerService.ts`。
 */
import { api } from '@/api/request';
import { LOWCODE011_ACTIONS } from '@/services/lowcode011/actions';
import { julyMetadataStore } from '@/stores/lowcode011/julyMetadataStore';
import type {
  JulyMetadataVo011, JulyMetadataQueryVo011, JulyMetadataSaveVo011,
  JulyMetadataMetaDto011, JulyMetadataModelRow011,
  PublishPayload, PublishResult, ImportDataPayload, ImportDataResult, ImportStatusResult,
} from '@/types/lowcode011';
import type { PageResult011, IdVo011 } from '@/types/common';

/** lowcode011 模块 base（api 模式请求前缀） */
const BASE = '/klsjnh/lowcode011';

/* ==================== 主表 + 三子 ==================== */

/** 分页查询元数据主表（含三子计数由前端按需 getById 拉全量） */
export function selectMetadataListByPage(body: JulyMetadataQueryVo011): Promise<PageResult011<JulyMetadataVo011>> {
  return api.post<PageResult011<JulyMetadataVo011>>(LOWCODE011_ACTIONS.metadata.selectListByPage, body, BASE);
}

/** 主键查询（GET）：返回主表 + fields + displays + services 全量 */
export function getMetadataById(id: string): Promise<JulyMetadataVo011> {
  return api.get<JulyMetadataVo011>(LOWCODE011_ACTIONS.metadata.getById, { id }, BASE);
}

/** 按对象名点查（GET） */
export function getMetadataByObjectName(objectName: string): Promise<JulyMetadataVo011> {
  return api.get<JulyMetadataVo011>(LOWCODE011_ACTIONS.metadata.getByObjectName, { objectName }, BASE);
}

/** 拉取分页并写入 store（默认选中无，编辑在抽屉里按需 getById） */
export async function fetchMetadataPage(patch: Partial<JulyMetadataQueryVo011> = {}): Promise<void> {
  const query = { ...julyMetadataStore.getSnapshot().query, ...patch } as JulyMetadataQueryVo011;
  julyMetadataStore.setState({ loading: true, query });
  try {
    const res = await selectMetadataListByPage(query);
    julyMetadataStore.setState({
      list: res.rows || [], total: res.total || 0, totalPages: res.totalPages || 1, loading: false,
    });
  } catch {
    julyMetadataStore.setState({ list: [], total: 0, totalPages: 1, loading: false });
  }
}

/**
 * 新增 / 修改（一主三子整体提交）。
 * 注意：三子为「整体替换」语义，调用方必须回传全部三子，否则未回传的子会被后端清空。
 * @param params 含 id = 修改；无 id = 新增
 */
export async function saveMetadata(params: JulyMetadataSaveVo011): Promise<string> {
  const saved = params.id
    ? await api.post<IdVo011>(LOWCODE011_ACTIONS.metadata.update, params, BASE)
    : await api.post<IdVo011>(LOWCODE011_ACTIONS.metadata.insert, params, BASE);
  const q = julyMetadataStore.getSnapshot().query;
  // 新增后回第一页；修改留在当前页
  await fetchMetadataPage({ ...q, pageIndex: params.id ? q.pageIndex : 1 });
  return params.id || (saved?.id) || 'new';
}

/** 逻辑删除单个（级联删三子） */
export async function removeMetadata(id: string): Promise<void> {
  await api.post<IdVo011>(LOWCODE011_ACTIONS.metadata.logicDelete, { id }, BASE);
  await fetchMetadataPage(julyMetadataStore.getSnapshot().query);
}

/** 批量逻辑删除（级联删三子） */
export async function removeMetadataBatch(ids: string[]): Promise<void> {
  await api.post<IdVo011>(LOWCODE011_ACTIONS.metadata.logicDeleteBatch, { ids }, BASE);
  await fetchMetadataPage(julyMetadataStore.getSnapshot().query);
}

/* ==================== 设计器（039 一期，2026-09-17 后端上线，MetaDTO 口径） ==================== */

/**
 * 模型列表（GET /listModels）—— 无入参，一次回全量（后端内部固定 pageSize=1000）。
 * ⚠️ 返回的 publishStatus / version 由后端硬编码为 'draft' / ''，非真实发布态。
 */
export function listMetadataModels(): Promise<JulyMetadataModelRow011[]> {
  return api.get<JulyMetadataModelRow011[]>(LOWCODE011_ACTIONS.metadata.listModels, undefined, BASE);
}

/**
 * 载入模型为 MetaDTO（GET /load?objectName=）。
 * ⚠️ 后端未做必填校验：缺 objectName 回 **500**（MissingServletRequestParameterException 未映射为 400），
 * 调用方须自行保证传参。
 */
export function loadMetadataDto(objectName: string): Promise<JulyMetadataMetaDto011> {
  return api.get<JulyMetadataMetaDto011>(LOWCODE011_ACTIONS.metadata.load, { objectName }, BASE);
}

/**
 * 保存模型（POST /save，MetaDTO 口径）—— 后端按 objectName 判 insert / update，**前端不传 id**。
 * 三子为整体替换语义，必须回传全部三子。
 * @returns 对象主键 id
 */
export async function saveMetadataDto(body: JulyMetadataMetaDto011): Promise<string> {
  const res = await api.post<{ id?: string }>(LOWCODE011_ACTIONS.metadata.designerSave, body, BASE);
  await fetchMetadataPage(julyMetadataStore.getSnapshot().query);
  return res?.id || '';
}

/**
 * 预览建表 DDL（GET /previewDdl?objectName=）—— 后端返回 `{ ddl }`，此处解包为字符串。
 * 与 publish 共用同一 DDL 生成器，故预览结果即发布将执行的语句。
 * 后端规则：表名统一 `lc_` 前缀；首个 `id` 类型字段作主键，无则自动补 `id VARCHAR(33)`；
 * 非法标识符 / 无字段 → 400。
 */
export async function previewMetadataDdl(objectName: string): Promise<string> {
  const res = await api.get<{ ddl?: string }>(LOWCODE011_ACTIONS.metadata.previewDdl, { objectName }, BASE);
  return res?.ddl || '';
}

/* ==================== 设计器：发布 / 数据同步（039 二期，2026-09-17 后端上线） ==================== */

/**
 * 发布建表（POST /publish）—— **真正执行 DDL**。
 * 行为：首次 `CREATE TABLE IF NOT EXISTS`；表已存在时**只** `ALTER ... ADD COLUMN` 补齐缺失列，
 * 永不 DROP / MODIFY / RENAME；无事可做时 `ddl` 为 null。
 * 受配置开关 `krt.lowcode.ddl-execute.enabled` 控制（关闭时 → 400 `ddl execute disabled ...`）。
 * 副作用：写入快照表 `july_metadata_version` 并推进主表 `publish_status` / `version` / `physical_table`。
 * ⚠️ `migrateData` / `includeDeleted` 后端当前是**预留参数**（收了不用），返回的 `backupTable` 恒 null。
 * @returns 含 version（`0.0.1` 递增串）、physicalTable、ddl 的结果
 */
export function publishMetadata(body: PublishPayload): Promise<PublishResult> {
  return api.post<PublishResult>(LOWCODE011_ACTIONS.metadata.publish, body, BASE);
}

/**
 * 读取数据同步状态（GET /importStatus?objectName=）。
 * 对象不存在时后端仍回 200（`dataInitialized=false` / `physicalTable=null` / `publishStatus=draft`），
 * 故可用它判「是否已发布 + 是否已初始化」——这也是**唯一**拿到真实发布态的接口
 * （`listModels` / `load` 里的 publishStatus 是硬编码 `draft`）。
 */
export function getMetadataImportStatus(objectName: string): Promise<ImportStatusResult> {
  return api.get<ImportStatusResult>(LOWCODE011_ACTIONS.metadata.importStatus, { objectName }, BASE);
}

/**
 * 分页导入数据（POST /importDataFromSql）—— 源 SQL 分页读 → 目标物理表 upsert。
 * 源 SQL 走业务建模的分页执行器（方言分页），目标表取自最新发布快照。
 * ⚠️ 前置条件：对象**必须先发布**（未发布 → 400 `object not published: xxx`）；
 * 对象不存在 → 404 `record not found`；缺 dataSourceCode / sqlCode → 400。
 * `updated` / `unchanged` / `skipped` 后端恒为 0，只有 `inserted`（= 本页处理行数）可信。
 */
export function importMetadataDataFromSql(body: ImportDataPayload): Promise<ImportDataResult> {
  return api.post<ImportDataResult>(LOWCODE011_ACTIONS.metadata.importDataFromSql, body, BASE);
}
