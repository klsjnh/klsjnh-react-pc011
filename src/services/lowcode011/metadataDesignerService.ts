/**
 * 低代码元数据「设计器」服务 —— 发布建表 / 数据初始化同步 / 开放 API / 运行时菜单
 *
 * ★ **分流矩阵**（用户口径：接口有的对上，没有的说明是 mock）
 *
 *   | 能力 | 来源 | 说明 |
 *   |------|------|------|
 *   | 元数据本体（主+三子） | ✅ 真实接口 | `lowcode011/julyMetadata/v1/*` |
 *   | 预览 DDL / 发布建表 | ⚠️ PENDING-BACKEND | 后端 docs 038「只做 CRUD」、033「publish 不做」 |
 *   | 数据初始化 / 同步 | ⚠️ PENDING-BACKEND | 033 定为「后期功能」 |
 *   | 开放 API 配置 / apiKey | ⚠️ PENDING-BACKEND | java17 源码零命中 |
 *   | 发布菜单 / 运行时菜单 | ⚠️ PENDING-BACKEND | 同上 |
 *
 * 占位实现见 `src/mock/lowcode011/pendingBackend.ts`；后端补齐后，把本文件里的占位调用
 * 换成 `api.post(action, body, BASE)`（BASE = `/klsjnh/lowcode011`）即可，页面无需改动。
 */
import {
  pendingGetOpenApiConfig, pendingImportDataFromSql, pendingImportStatus, pendingListRuntimeMenus,
  pendingPreviewDdl, pendingPublish, pendingPublishMenu, pendingRotateApiKey, pendingSaveOpenApiConfig,
} from '@/mock/lowcode011/pendingBackend';
import { getMetadataByObjectName } from '@/services/lowcode011/julyMetadataService';
import type {
  ImportDataResult, ImportStatusResult, OpenApiConfigResult, PublishMenuResult, PublishResult,
  RuntimeMenuRow, SaveOpenApiConfigPayload,
} from '@/types/lowcode011/metadataDesigner';

/* ==================== 发布建表 ==================== */

/** 预览建表 DDL —— 元数据走**真实接口**，DDL 生成为 PENDING-BACKEND 占位 */
export async function previewDdl(objectName: string): Promise<string> {
  const meta = await getMetadataByObjectName(objectName);
  return pendingPreviewDdl(meta);
}

/** 发布建表（PENDING-BACKEND） */
export function publish(objectName: string, migrateData: boolean): Promise<PublishResult> {
  return pendingPublish(objectName, migrateData);
}

/* ==================== 数据初始化 / 同步 ==================== */

/** 读取数据同步状态（PENDING-BACKEND） */
export function importStatus(objectName: string): Promise<ImportStatusResult> {
  return pendingImportStatus(objectName);
}

/** 分页导入数据（PENDING-BACKEND） */
export function importDataFromSql(payload: {
  objectName: string; pageNum?: number; pageSize?: number; forceInit?: boolean;
}): Promise<ImportDataResult> {
  return pendingImportDataFromSql(payload);
}

/* ==================== 菜单 ==================== */

/** 发布 SSR 菜单（PENDING-BACKEND） */
export function publishMenu(objectName: string, parentMenuCode?: string): Promise<PublishMenuResult> {
  return pendingPublishMenu(objectName, parentMenuCode);
}

/** 运行时菜单列表（PENDING-BACKEND） */
export function listRuntimeMenus(): Promise<RuntimeMenuRow[]> {
  return pendingListRuntimeMenus();
}

/* ==================== 开放 API ==================== */

/** 读取开放 API 配置（PENDING-BACKEND） */
export function getOpenApiConfig(objectName: string): Promise<OpenApiConfigResult> {
  return pendingGetOpenApiConfig(objectName);
}

/** 保存开放 API 配置（PENDING-BACKEND） */
export function saveOpenApiConfig(payload: SaveOpenApiConfigPayload): Promise<OpenApiConfigResult> {
  return pendingSaveOpenApiConfig(payload);
}

/** 重新生成 apiKey（PENDING-BACKEND） */
export function rotateApiKey(objectName: string): Promise<OpenApiConfigResult> {
  return pendingRotateApiKey(objectName);
}
