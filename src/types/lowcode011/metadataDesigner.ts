/**
 * 低代码元数据「设计器」相关类型（发布建表 / 数据同步 / 开放 API / 运行时菜单 / 菜单挂载）
 *
 * 本文件承载的能力按后端 039 分期分发（`java17/docs/requirement011/
 * 039.topic-lowcode-designer-runtime.md`，2026-09-17 定案「全链路做，分三期」）：
 *   - **一期（✅ 2026-09-17 上线）设计闭环**：`listModels` / `load` / `save` / `previewDdl`
 *     —— 已切真实接口，类型见 `JulyMetadataMetaDto011` / `JulyMetadataModelRow011`；
 *   - **二期（✅ 2026-09-17 上线）发布闭环**：`publish` / `importDataFromSql` / `importStatus`
 *     —— 已切真实接口（本文件的 `PublishResult` / `ImportData*` 即后端真实形状）；
 *   - **三期（⏳ PENDING-BACKEND）运行时 + 开放 API**：`publishMenu` / `listRuntimeMenus`
 *     + 动态 CRUD + `openApiConfig` / `saveOpenApiConfig` / `rotateApiKey`。
 *
 * 三期部分前端按老项目（`klsjnh-react-dev011_20260909_011/src/services/july011/metadata.ts`）
 * 的契约定型做成**本地占位实现**（`src/mock/lowcode011/pendingBackend.ts`）。
 * 后端补齐后，只需把 `services/lowcode011/metadataDesignerService.ts` 的分流切到真实 action，类型无需改动。
 */

/** 发布建表入参（POST /publish） */
export interface PublishPayload {
  objectName: string;
  /** 是否迁移数据（后端当前为**预留参数**：`JulyMetadataPublishUseCase` 收了但未使用） */
  migrateData: boolean;
  /** 数据迁移是否含逻辑删除行（同为预留参数） */
  includeDeleted?: boolean;
}

/**
 * 发布建表结果（POST /publish）。
 * 版本号语义 = `0.0.1` 递增字符串（非整数），首次发布 `0.0.1`，其后 patch 位 +1。
 */
export interface PublishResult {
  objectName: string;
  version?: string;
  /** 后端返回小写 `published`；注意 `listModels`/`load` 里的同名字段是**硬编码假数据** */
  publishStatus?: string;
  /** 物理表名（`lc_` 前缀） */
  physicalTable?: string;
  /** 备份表名；后端当前恒返回 null（迁移未实装） */
  backupTable?: string | null;
  /** 本次实际执行的 DDL；表已存在且无新增列时为 null（无事可做） */
  ddl?: string | null;
}

/** 数据同步入参（POST /importDataFromSql；objectName / dataSourceCode / sqlCode 三者后端必填） */
export interface ImportDataPayload {
  objectName: string;
  /** 源数据源编码（必填，缺失 → 400 dataSourceCode required） */
  dataSourceCode: string;
  /** 源 SQL（必填，缺失 → 400 sqlCode required；走业务建模的分页执行器） */
  sqlCode: string;
  /** 页码，1 起；缺省 1 */
  pageNum?: number;
  /** 每页条数；缺省 100，后端上限 500 */
  pageSize?: number;
  /** 强制初始化模式（影响返回的 mode，不改变写入行为） */
  forceInit?: boolean;
}

/**
 * 数据同步结果（单页）。
 * ⚠️ 后端 `updated` / `unchanged` / `skipped` 目前**恒为 0**（写入器只做 upsert 计数），
 * 只有 `inserted` = `processed` = 本页处理行数可用；前端勿据此展示「更新 N 条」。
 */
export interface ImportDataResult {
  objectName: string;
  mode: 'init' | 'sync';
  pageNum: number;
  pageSize: number;
  hasMore: boolean;
  nextPageNum?: number | null;
  inserted: number;
  updated: number;
  unchanged: number;
  skipped: number;
  processed: number;
  dataInitialized?: boolean;
}

/**
 * 数据同步状态（GET /importStatus?objectName=）。
 * ⚠️ 后端目前**不返回** `lastSyncAt` / `sqlCode`（列已建但未读），此处保留可选以备后端补齐。
 * 对象不存在时后端仍回 200，字段为 `false / null / draft`。
 */
export interface ImportStatusResult {
  objectName: string;
  dataInitialized?: boolean;
  lastSyncAt?: string;
  sqlCode?: string;
  publishStatus?: string;
  physicalTable?: string | null;
}

/* ==================== 以下为 039 三期（PENDING-BACKEND） ==================== */

/** 开放 API 鉴权模式：关闭 / 公开只读 / apiKey 鉴权 */
export type OpenApiAuthMode = 'closed' | 'none' | 'apiKey';

/** 开放 API 配置 */
export interface OpenApiConfigResult {
  objectName: string;
  enabled: boolean;
  authMode: OpenApiAuthMode;
  /** 允许的操作：query / insert / update / delete */
  allowedOps: string[];
  /** apiKey 尾号提示 */
  apiKeyHint?: string;
  apiKeyConfigured?: boolean;
  apiKeyUpdatedAt?: number;
  publishStatus?: string;
  openApiBasePath?: string;
  /** 仅在生成 / 轮换时返回一次 */
  apiKey?: string;
}

/** 保存开放 API 配置入参 */
export interface SaveOpenApiConfigPayload {
  objectName: string;
  enabled: boolean;
  authMode: OpenApiAuthMode;
  allowedOps?: string[];
}

/** 运行时菜单行（listRuntimeMenus） */
export interface RuntimeMenuRow {
  objectName: string;
  description?: string;
  routerPath?: string;
  runtimeObjectName?: string;
  menuCode?: string;
  version?: string;
}

/** 发布菜单结果 */
export interface PublishMenuResult {
  objectName: string;
  menuCode: string;
  menuName?: string;
  parentMenuCode?: string;
}
