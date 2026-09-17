/**
 * 低代码元数据设计器 —— **后端尚未实现的接口的本地占位实现（PENDING-BACKEND）**
 *
 * 【为什么在这里】后端 039 分三期（`java17/docs/requirement011/039.topic-lowcode-designer-runtime.md`）：
 *  - **一期（✅ 2026-09-17 已上线）设计闭环、零改库**：`listModels` `load` `save` `previewDdl`
 *    → **前端已切真实接口**，本文件不再承载（原本地 DDL 生成器已于同期移除，避免与后端方言漂移）；
 *  - **二期（⏳）发布闭环**：`publish` `syncData` `importDataFromSql` `importStatus`
 *    （`MetadataDdlExecutorPort` / `DatasourceDdlExecutor` 未实装）；
 *  - **三期（⏳）运行时 + 开放 API**：`publishMenu` `listRuntimeMenus` `initialize` + 动态 CRUD
 *    + `openApiConfig` `saveOpenApiConfig` `rotateApiKey`。
 *
 * 【契约来源】老项目 `klsjnh-react-dev011_20260909_011/src/services/july011/metadata.ts`，
 * 类型见 `@/types/lowcode011/metadataDesigner`。
 *
 * 【后端补齐后怎么切】`services/lowcode011/metadataDesignerService.ts` 里每个函数都带
 * 「PENDING-BACKEND」标记，把本地调用换成 `api.post(action, body, BASE)` 即可，调用方无需改动。
 *
 * 【状态是内存态】刷新页面即重置（占位实现的固有局限，非缺陷）。
 */
import type {
  ImportDataResult, ImportStatusResult, OpenApiConfigResult, PublishMenuResult, PublishResult,
  RuntimeMenuRow, SaveOpenApiConfigPayload,
} from '@/types/lowcode011/metadataDesigner';

const delay = (ms: number) => new Promise<void>((resolve) => { setTimeout(resolve, ms); });

/** 物理表前缀（与后端 `JulyMetadataDesignerUseCase.TABLE_PREFIX` / DDL 生成器一致） */
const TABLE_PREFIX = 'lc_';

/** 每个对象的设计器状态（内存态） */
interface DesignerState {
  publishStatus: 'draft' | 'published';
  version: string;
  physicalTable: string;
  backupTable?: string;
  dataInitialized: boolean;
  lastSyncAt?: string;
}

const stateMap = new Map<string, DesignerState>();
const openApiMap = new Map<string, OpenApiConfigResult>();
const menuMap = new Map<string, PublishMenuResult>();

function stateOf(objectName: string): DesignerState {
  let s = stateMap.get(objectName);
  if (!s) {
    s = {
      publishStatus: 'draft',
      version: '',
      physicalTable: TABLE_PREFIX + objectName,
      dataInitialized: false,
    };
    stateMap.set(objectName, s);
  }
  return s;
}

/**
 * 生成下一个发布版本号。
 * 对齐后端 039 §021 风险条「version 语义对齐老 version011（"0.0.1" 递增字符串）」——
 * **不是**整数递增：空/非法 → `0.0.1`；否则 patch 位 +1。
 */
function nextVersion(prev: string): string {
  const m = /^(\d+)\.(\d+)\.(\d+)$/.exec(prev || '');
  if (!m) return '0.0.1';
  return `${m[1]}.${m[2]}.${Number(m[3]) + 1}`;
}

/** 生成 apiKey（占位：随机 32 位 hex） */
function fakeApiKey(): string {
  let out = '';
  for (let i = 0; i < 32; i += 1) {
    out += '0123456789abcdef'[Math.floor(Math.random() * 16)];
  }
  return out;
}

/** 发布建表（039 二期，PENDING-BACKEND） */
export async function pendingPublish(objectName: string, migrateData: boolean): Promise<PublishResult> {
  await delay(600);
  const s = stateOf(objectName);
  const version = nextVersion(s.version);
  s.publishStatus = 'published';
  s.version = version;
  s.physicalTable = TABLE_PREFIX + objectName;
  s.backupTable = migrateData ? `${TABLE_PREFIX}${objectName}_bak_${Date.now().toString().slice(-6)}` : s.backupTable;
  return {
    objectName, version, publishStatus: 'published',
    physicalTable: s.physicalTable, backupTable: s.backupTable,
  };
}

/** 发布 SSR 菜单（039 三期，PENDING-BACKEND） */
export async function pendingPublishMenu(objectName: string, parentMenuCode?: string): Promise<PublishMenuResult> {
  await delay(500);
  const existing = menuMap.get(objectName);
  if (existing) return existing;
  const result: PublishMenuResult = {
    objectName,
    menuCode: `rt_${objectName}`,
    menuName: objectName,
    parentMenuCode: parentMenuCode || 'business011',
  };
  menuMap.set(objectName, result);
  return result;
}

/** 运行时菜单列表（039 三期，PENDING-BACKEND） */
export async function pendingListRuntimeMenus(): Promise<RuntimeMenuRow[]> {
  await delay(300);
  return Array.from(menuMap.values()).map((m) => {
    const s = stateOf(m.objectName);
    return {
      objectName: m.objectName,
      // 本项目运行时页是两级扁平路由，objectName 走 query（不入路径段）
      routerPath: `/lowcode011/schemaRuntime?objectName=${m.objectName}`,
      runtimeObjectName: m.objectName,
      menuCode: m.menuCode,
      version: s.version,
    };
  });
}

/** 读取开放 API 配置（039 三期，PENDING-BACKEND） */
export async function pendingGetOpenApiConfig(objectName: string): Promise<OpenApiConfigResult> {
  await delay(250);
  const cached = openApiMap.get(objectName);
  if (cached) return { ...cached, publishStatus: stateOf(objectName).publishStatus };
  return {
    objectName,
    enabled: false,
    authMode: 'closed',
    allowedOps: ['query'],
    apiKeyConfigured: false,
    publishStatus: stateOf(objectName).publishStatus,
    openApiBasePath: `/klsjnh/open/v1/${objectName}`,
  };
}

/** 保存开放 API 配置（039 三期，PENDING-BACKEND；首次切换 apiKey 时返回明文 key，仅此一次） */
export async function pendingSaveOpenApiConfig(
  payload: SaveOpenApiConfigPayload,
): Promise<OpenApiConfigResult> {
  await delay(400);
  const prev = openApiMap.get(payload.objectName);
  const needKey = payload.enabled && payload.authMode === 'apiKey' && !prev?.apiKeyConfigured;
  const apiKey = needKey ? fakeApiKey() : undefined;
  const next: OpenApiConfigResult = {
    objectName: payload.objectName,
    enabled: payload.enabled && payload.authMode !== 'closed',
    authMode: payload.authMode,
    allowedOps: payload.authMode === 'none' ? ['query'] : (payload.allowedOps || ['query']),
    apiKeyConfigured: Boolean(prev?.apiKeyConfigured || apiKey),
    apiKeyHint: apiKey ? `****${apiKey.slice(-4)}` : prev?.apiKeyHint,
    apiKeyUpdatedAt: apiKey ? Date.now() : prev?.apiKeyUpdatedAt,
    publishStatus: stateOf(payload.objectName).publishStatus,
    openApiBasePath: `/klsjnh/open/v1/${payload.objectName}`,
    apiKey,
  };
  openApiMap.set(payload.objectName, { ...next, apiKey: undefined });
  return next;
}

/** 轮换 apiKey（039 三期，PENDING-BACKEND） */
export async function pendingRotateApiKey(objectName: string): Promise<OpenApiConfigResult> {
  await delay(400);
  const prev = openApiMap.get(objectName) || await pendingGetOpenApiConfig(objectName);
  const apiKey = fakeApiKey();
  const next: OpenApiConfigResult = {
    ...prev,
    enabled: true,
    authMode: 'apiKey',
    apiKeyConfigured: true,
    apiKeyHint: `****${apiKey.slice(-4)}`,
    apiKeyUpdatedAt: Date.now(),
    apiKey,
  };
  openApiMap.set(objectName, { ...next, apiKey: undefined });
  return next;
}

/** 读取数据同步状态（039 二期，PENDING-BACKEND） */
export async function pendingImportStatus(objectName: string): Promise<ImportStatusResult> {
  await delay(250);
  const s = stateOf(objectName);
  return {
    objectName,
    dataInitialized: s.dataInitialized,
    lastSyncAt: s.lastSyncAt,
    publishStatus: s.publishStatus,
    physicalTable: s.physicalTable,
  };
}

/** 分页导入数据（039 二期，PENDING-BACKEND；模拟每页 100 条、共 3 页） */
export async function pendingImportDataFromSql(payload: {
  objectName: string; pageNum?: number; pageSize?: number; forceInit?: boolean;
}): Promise<ImportDataResult> {
  await delay(500);
  const s = stateOf(payload.objectName);
  const pageNum = payload.pageNum || 1;
  const pageSize = payload.pageSize || 100;
  const mode: ImportDataResult['mode'] = s.dataInitialized && !payload.forceInit ? 'sync' : 'init';
  const hasMore = pageNum < 3;
  const inserted = mode === 'init' ? pageSize : Math.floor(pageSize / 4);
  const updated = mode === 'sync' ? Math.floor(pageSize / 3) : 0;
  const unchanged = Math.max(0, pageSize - inserted - updated);
  s.dataInitialized = true;
  s.lastSyncAt = new Date().toISOString().replace('T', ' ').slice(0, 19);
  return {
    objectName: payload.objectName, mode, pageNum, pageSize, hasMore,
    nextPageNum: hasMore ? pageNum + 1 : null,
    inserted, updated, unchanged, skipped: 0, processed: pageSize,
    dataInitialized: true,
  };
}
