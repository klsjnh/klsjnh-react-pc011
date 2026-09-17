/**
 * 低代码元数据设计器 —— **后端尚未实现的接口的本地占位实现（PENDING-BACKEND）**
 *
 * 【为什么在这里】后端 docs 038（2026-09-16 定案）明确「本期只做 CRUD」，docs 033 明确「publish 不做」；
 * `previewDdl / publish / publishMenu / listRuntimeMenus / openApiConfig / saveOpenApiConfig /
 * rotateApiKey / importDataFromSql / importStatus / syncData` 在 java17 源码中零命中。
 * 为让「建模 → 元数据 → 发布 → 运行时」整条链路可被演示与自测，前端先落到本地实现。
 *
 * 【契约来源】老项目 `klsjnh-react-dev011_20260909_011/src/services/july011/metadata.ts`
 * （类型见 `@/types/lowcode011/metadataDesigner`）。
 *
 * 【后端补齐后怎么切】`services/lowcode011/metadataDesignerService.ts` 里每个函数都有
 * 「PENDING-BACKEND」标记，把本地调用换成 `api.post(action, body, BASE)` 即可，调用方无需改动。
 *
 * 【状态是内存态】刷新页面即重置（占位实现的固有局限，非缺陷）。
 */
import type { JulyMetadataVo011, JulyMetadataFieldVo011 } from '@/types/lowcode011/julyMetadata';
import type {
  ImportDataResult, ImportStatusResult, OpenApiConfigResult, PublishMenuResult, PublishResult,
  RuntimeMenuRow, SaveOpenApiConfigPayload,
} from '@/types/lowcode011/metadataDesigner';

const delay = (ms: number) => new Promise<void>((resolve) => { setTimeout(resolve, ms); });

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
    s = { publishStatus: 'draft', version: '', physicalTable: objectName, dataInitialized: false };
    stateMap.set(objectName, s);
  }
  return s;
}

/** FieldType011 → 物理列类型（占位口径，真实 DDL 由后端生成） */
function columnType(f: JulyMetadataFieldVo011): string {
  const t = (f.fieldType || 'string').toLowerCase();
  const len = Number(f.fieldLength) || 0;
  switch (t) {
    case 'id': return 'CHAR(32)';
    case 'status': return 'VARCHAR(3)';
    case 'create_by':
    case 'update_by': return 'VARCHAR(32)';
    case 'create_time':
    case 'update_time':
    case 'date': return 'DATETIME';
    case 'int': return 'INT';
    case 'float': return 'DECIMAL(18,4)';
    case 'boolean': return 'TINYINT(1)';
    case 'text': return 'TEXT';
    default: return len > 0 ? `VARCHAR(${len})` : 'VARCHAR(255)';
  }
}

/**
 * 由元数据生成建表 DDL（**占位实现**，PENDING-BACKEND）。
 * 真实实现应由后端读元数据 + 方言生成器产出，这里仅保证形态与前端预览可用。
 */
export function buildDdl(meta: JulyMetadataVo011): string {
  const table = meta.objectName || 'unknown_object';
  const fields = meta.fields || [];
  const pk = fields.find((f) => (f.fieldType || '').toLowerCase() === 'id')?.fieldCode || 'id';
  const lines = fields.map((f) => {
    const nullable = f.requiredField ? ' NOT NULL' : '';
    return `  \`${f.fieldCode}\` ${columnType(f)}${nullable} COMMENT '${f.fieldName || f.fieldCode}'`;
  });
  lines.push(`  PRIMARY KEY (\`${pk}\`)`);
  return [
    `-- 元数据对象：${table}（${meta.description || '无描述'}）`,
    `-- ⚠️ PENDING-BACKEND：本 DDL 为前端占位生成，后端实现 previewDdl 后以服务端为准`,
    `CREATE TABLE \`${table}\` (`,
    lines.join(',\n'),
    `) COMMENT '${meta.description || table}';`,
  ].join('\n');
}

/** 生成 apiKey（占位：随机 32 位 hex） */
function fakeApiKey(): string {
  let out = '';
  for (let i = 0; i < 32; i += 1) {
    out += '0123456789abcdef'[Math.floor(Math.random() * 16)];
  }
  return out;
}

/** 预览建表 DDL（PENDING-BACKEND） */
export async function pendingPreviewDdl(meta: JulyMetadataVo011): Promise<string> {
  await delay(400);
  return buildDdl(meta);
}

/** 发布建表（PENDING-BACKEND） */
export async function pendingPublish(objectName: string, migrateData: boolean): Promise<PublishResult> {
  await delay(600);
  const s = stateOf(objectName);
  const nextVersion = String(Math.max(1, Number(s.version || '0') + 1));
  s.publishStatus = 'published';
  s.version = nextVersion;
  s.physicalTable = objectName;
  s.backupTable = migrateData ? `${objectName}_bak_${Date.now().toString().slice(-6)}` : s.backupTable;
  return {
    objectName, version: nextVersion, publishStatus: 'published',
    physicalTable: s.physicalTable, backupTable: s.backupTable,
  };
}

/** 发布 SSR 菜单（PENDING-BACKEND） */
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

/** 运行时菜单列表（PENDING-BACKEND） */
export async function pendingListRuntimeMenus(): Promise<RuntimeMenuRow[]> {
  await delay(300);
  return Array.from(menuMap.values()).map((m) => {
    const s = stateOf(m.objectName);
    return {
      objectName: m.objectName,
      routerPath: `/runtime/${m.objectName}`,
      runtimeObjectName: m.objectName,
      menuCode: m.menuCode,
      version: s.version,
    };
  });
}

/** 读取开放 API 配置（PENDING-BACKEND） */
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

/** 保存开放 API 配置（PENDING-BACKEND；首次切换 apiKey 时返回明文 key，仅此一次） */
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

/** 轮换 apiKey（PENDING-BACKEND） */
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

/** 读取数据同步状态（PENDING-BACKEND） */
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

/** 分页导入数据（PENDING-BACKEND；模拟每页 100 条、共 3 页） */
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
