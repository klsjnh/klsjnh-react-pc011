/**
 * 低代码元数据设计器 —— **后端尚未实现的接口的本地占位实现（PENDING-BACKEND）**
 *
 * 【为什么在这里】后端 039 分三期（`java17/docs/requirement011/039.topic-lowcode-designer-runtime.md`）：
 *  - **一期（✅ 2026-09-17 上线）设计闭环、零改库**：`listModels` `load` `save` `previewDdl`
 *    → 前端已切真实接口，本文件不再承载（原本地 DDL 生成器同期移除，避免与后端方言漂移）；
 *  - **二期（✅ 2026-09-17 上线）发布闭环**：`publish` `importDataFromSql` `importStatus`
 *    → 前端亦已切真实接口（`MetadataDdlExecutorPort` / `JdbcTemplateMetadataDataWriter` 已实装），
 *    **本文件同步移除这三个占位**，避免「真接口 + 假实现」并存造成误判；
 *  - **三期（⏳）运行时 + 开放 API**：`publishMenu` `listRuntimeMenus` + 动态 CRUD
 *    + `openApiConfig` `saveOpenApiConfig` `rotateApiKey` —— **仅剩这些仍为占位**。
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
  OpenApiConfigResult, PublishMenuResult, RuntimeMenuRow, SaveOpenApiConfigPayload,
} from '@/types/lowcode011/metadataDesigner';

const delay = (ms: number) => new Promise<void>((resolve) => { setTimeout(resolve, ms); });

const openApiMap = new Map<string, OpenApiConfigResult>();
const menuMap = new Map<string, PublishMenuResult>();

/** 生成 apiKey（占位：随机 32 位 hex） */
function fakeApiKey(): string {
  let out = '';
  for (let i = 0; i < 32; i += 1) {
    out += '0123456789abcdef'[Math.floor(Math.random() * 16)];
  }
  return out;
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
  return Array.from(menuMap.values()).map((m) => ({
    objectName: m.objectName,
    // 本项目运行时页是两级扁平路由，objectName 走 query（不入路径段）
    routerPath: `/lowcode011/schemaRuntime?objectName=${m.objectName}`,
    runtimeObjectName: m.objectName,
    menuCode: m.menuCode,
  }));
}

/** 读取开放 API 配置（039 三期，PENDING-BACKEND） */
export async function pendingGetOpenApiConfig(objectName: string): Promise<OpenApiConfigResult> {
  await delay(250);
  const cached = openApiMap.get(objectName);
  if (cached) return cached;
  return {
    objectName,
    enabled: false,
    authMode: 'closed',
    allowedOps: ['query'],
    apiKeyConfigured: false,
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
