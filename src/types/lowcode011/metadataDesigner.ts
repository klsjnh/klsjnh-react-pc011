/**
 * 低代码元数据「设计器」相关类型（发布建表 / 数据同步 / 开放 API / 运行时菜单 / 菜单挂载）
 *
 * ⚠️ **PENDING-BACKEND**：本文件承载的能力按后端 039 分期分发（`java17/docs/requirement011/
 * 039.topic-lowcode-designer-runtime.md`，2026-09-17 定案「全链路做，分三期」）：
 *   - **一期（✅ 2026-09-17 上线）设计闭环、零改库**：`listModels` / `load` / `save` / `previewDdl`
 *     —— 已于同期切到真实接口，**不再走本文件的占位**；
 *   - **二期（⏳）发布闭环**：`publish` / `syncData` / `importDataFromSql` / `importStatus`
 *     （`MetadataDdlExecutorPort` 未实装）；
 *   - **三期（⏳）运行时 + 开放 API**：`publishMenu` / `listRuntimeMenus` / `initialize` + 动态 CRUD
 *     + `openApiConfig` / `saveOpenApiConfig` / `rotateApiKey`。
 *
 * 二 / 三期部分前端先按老项目（`klsjnh-react-dev011_20260909_011/src/services/july011/metadata.ts`）
 * 的契约定型做成**本地占位实现**（`src/mock/lowcode011/pendingBackend.ts`）。
 * 后端补齐后，只需把 `services/lowcode011/metadataDesignerService.ts` 的分流切到真实 action，类型无需改动。
 */

/** 发布建表入参 */
export interface PublishPayload {
  objectName: string;
  /** 是否迁移数据（旧表 rename 后按同名列 INSERT） */
  migrateData: boolean;
  includeDeleted?: boolean;
}

/** 发布建表结果 */
export interface PublishResult {
  objectName: string;
  version?: string;
  publishStatus?: string;
  /** 物理表名 */
  physicalTable?: string;
  /** 备份表名（旧表 rename 后的名字） */
  backupTable?: string;
}

/** 数据同步入参（importDataFromSql；分页拉取写入物理表） */
export interface ImportDataPayload {
  objectName: string;
  sqlCode?: string;
  pageNum?: number;
  pageSize?: number;
  /** 强制全量插入（忽略增量比对） */
  forceInit?: boolean;
}

/** 数据同步结果（单页） */
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
  sqlCode?: string;
  dataSourceCode?: string;
}

/** 数据同步状态 */
export interface ImportStatusResult {
  objectName: string;
  dataInitialized?: boolean;
  lastSyncAt?: string;
  sqlCode?: string;
  publishStatus?: string;
  physicalTable?: string;
}

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
