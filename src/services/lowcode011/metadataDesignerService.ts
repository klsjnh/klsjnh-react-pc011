/**
 * 低代码元数据「设计器」服务 —— 发布建表 / 数据初始化同步 / 开放 API / 运行时菜单
 *
 * ★ **分流矩阵**（用户口径：接口有的对上，没有的说明是 mock）
 *
 *   | 能力 | 来源 | 说明 |
 *   |------|------|------|
 *   | 元数据本体（主+三子） | ✅ 真实接口 | `lowcode011/julyMetadata/v1/*`（038 CRUD） |
 *   | 模型列表 / 载入 MetaDTO / 保存 | ✅ 真实接口 | 039 一期（2026-09-17）`listModels` `load` `save` |
 *   | 预览 DDL | ✅ 真实接口 | 039 一期 `previewDdl`（与 publish 共用生成器） |
 *   | **发布建表（执行 DDL）** | ✅ 真实接口 | 039 二期（2026-09-17）`publish` |
 *   | **数据同步状态 / 分页导入** | ✅ 真实接口 | 039 二期 `importStatus` `importDataFromSql` |
 *   | 发布菜单 / 运行时菜单 | ⚠️ PENDING-BACKEND | 039 三期 |
 *   | 开放 API 配置 / apiKey | ⚠️ PENDING-BACKEND | 039 三期 |
 *
 * 占位实现见 `src/mock/lowcode011/pendingBackend.ts`；后端补齐后，把本文件里的占位调用
 * 换成 `api.post(action, body, BASE)`（BASE = `/klsjnh/lowcode011`）即可，页面无需改动。
 *
 * 后端分期依据：`java17/docs/requirement011/039.topic-lowcode-designer-runtime.md`（一期 ✅ / **二期 ✅** / 三期 ⏳）。
 */
import {
  pendingGetOpenApiConfig, pendingListRuntimeMenus, pendingPublishMenu, pendingRotateApiKey,
  pendingSaveOpenApiConfig,
} from '@/mock/lowcode011/pendingBackend';
import {
  getMetadataImportStatus, importMetadataDataFromSql, previewMetadataDdl, publishMetadata,
} from '@/services/lowcode011/julyMetadataService';
import type {
  ImportDataPayload, ImportDataResult, ImportStatusResult, OpenApiConfigResult, PublishMenuResult,
  PublishPayload, PublishResult, RuntimeMenuRow, SaveOpenApiConfigPayload,
} from '@/types/lowcode011/metadataDesigner';

/* ==================== 发布建表 ==================== */

/**
 * 预览建表 DDL —— **真实接口**（GET `/julyMetadata/v1/previewDdl?objectName=`）。
 * 后端与 publish 共用同一 DDL 生成器，故此处所见即发布将执行的语句；
 * 生成规则（`MySqlMetadataDdlGenerator`）：表名统一 `lc_` 前缀、`CREATE TABLE IF NOT EXISTS`、
 * 首个 `id` 类型字段作主键（无则自动补 `id VARCHAR(33)`）、标识符非法或无字段 → 400。
 */
export function previewDdl(objectName: string): Promise<string> {
  return previewMetadataDdl(objectName);
}

/**
 * 发布建表（真正执行 DDL）—— **真实接口**（POST `/julyMetadata/v1/publish`），039 二期。
 * 首次 CREATE IF NOT EXISTS，之后仅 ADD COLUMN 补齐缺失列（永不 DROP / MODIFY / RENAME）；
 * 受开关 `krt.lowcode.ddl-execute.enabled` 控制（关闭时 → 400 `ddl execute disabled ...`）。
 * `migrateData` / `includeDeleted` 后端当前为预留参数（收而不用的迁移能力）。
 */
export function publish(
  objectName: string, migrateData: boolean, includeDeleted = false,
): Promise<PublishResult> {
  const payload: PublishPayload = { objectName, migrateData, includeDeleted };
  return publishMetadata(payload);
}

/* ==================== 数据初始化 / 同步 ==================== */

/**
 * 读取数据同步状态 —— **真实接口**（GET `/julyMetadata/v1/importStatus?objectName=`），039 二期。
 * 对象不存在时仍回 200（全 false/null/draft），可安全用于「未发布」探测。
 * ⚠️ 后端不返回 `lastSyncAt`（列已建、未读），页面别强依赖。
 */
export function importStatus(objectName: string): Promise<ImportStatusResult> {
  return getMetadataImportStatus(objectName);
}

/**
 * 分页导入数据 —— **真实接口**（POST `/julyMetadata/v1/importDataFromSql`），039 二期。
 * objectName / dataSourceCode / sqlCode 三者在后端**必填**（缺 source 或 sql → 400）；
 * 对象未发布 → 400 `object not published`；对象不存在 → 404。
 * 返回的 `updated` / `unchanged` / `skipped` 后端恒 0，只有 `inserted` 可信。
 */
export function importDataFromSql(payload: ImportDataPayload): Promise<ImportDataResult> {
  return importMetadataDataFromSql(payload);
}

/* ==================== 菜单（039 三期，PENDING-BACKEND） ==================== */

/** 发布 SSR 菜单 */
export function publishMenu(objectName: string, parentMenuCode?: string): Promise<PublishMenuResult> {
  return pendingPublishMenu(objectName, parentMenuCode);
}

/** 运行时菜单列表 */
export function listRuntimeMenus(): Promise<RuntimeMenuRow[]> {
  return pendingListRuntimeMenus();
}

/* ==================== 开放 API（039 三期，PENDING-BACKEND） ==================== */

/** 读取开放 API 配置 */
export function getOpenApiConfig(objectName: string): Promise<OpenApiConfigResult> {
  return pendingGetOpenApiConfig(objectName);
}

/** 保存开放 API 配置 */
export function saveOpenApiConfig(payload: SaveOpenApiConfigPayload): Promise<OpenApiConfigResult> {
  return pendingSaveOpenApiConfig(payload);
}

/** 重新生成 apiKey */
export function rotateApiKey(objectName: string): Promise<OpenApiConfigResult> {
  return pendingRotateApiKey(objectName);
}
