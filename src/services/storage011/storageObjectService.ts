/**
 * 对象（文件）服务（storage011 · object/*）
 * 后端契约（核对 Java 源码 StorageObjectController / StorageObjectUseCase）：
 *   POST /object/selectList|selectListByPage  → List<String> / PageResult011<String>（**只有对象键**）
 *   GET  /object/stat|readText|presignedUrl|download （全部走 query，objectName 必填）
 *   POST /object/upload（multipart：query 带 storageCode/bucketName/objectName，part 名 file）
 *   POST /object/saveText|remove|batchRemove（JSON body）
 * ⚠️ 列表只有键，size/lastModified/contentType 必须另调 stat；列表接口没有元数据字段。
 * 上传/下载绕过 api.post 信封（multipart / blob），需拼完整基址 + 手动带鉴权头。
 */
import { api, ApiError } from '@/api/request';
import { isMockMode } from '@/config/appConfig';
import { authStore } from '@/stores/authStore';
import { STORAGE011_BASE, resolveStorageBase } from './base';
import { storageObjectStore } from '@/stores/storage011/storageObjectStore';
import type { PageResult011 } from '@/types/common';
import type { ObjectStat, StorageObject, StorageObjectQuery, StorageTextContent } from '@/types/storage011';

/** 对象动作路径（相对 STORAGE011_BASE） */
const OBJECT_ACTIONS = {
  selectListByPage: '/object/selectListByPage',
  selectList: '/object/selectList',
  upload: '/object/upload',
  download: '/object/download',
  readText: '/object/readText',
  saveText: '/object/saveText',
  stat: '/object/stat',
  remove: '/object/remove',
  batchRemove: '/object/batchRemove',
  presignedUrl: '/object/presignedUrl',
} as const;

/** 在线文本读写的编辑器类型推断 */
export type ObjectEditorKind = 'sql' | 'markdown' | 'text';

/** 读取结果：后端 StorageTextContent + 前端推断的编辑器类型 */
export type ReadTextResult = StorageTextContent & { editorKind: ObjectEditorKind };

function resolveEditorKind(objectName: string): ObjectEditorKind {
  const lower = objectName.trim().toLowerCase();
  if (lower.endsWith('.sql')) return 'sql';
  if (lower.endsWith('.md') || lower.endsWith('.markdown')) return 'markdown';
  return 'text';
}

/** 对象键字符串 → 行（补上归属实例 / 桶，后端列表不回带） */
function toObjectRows(keys: string[] | null | undefined, storageCode?: string, bucketName?: string): StorageObject[] {
  return (keys || []).map((key) => ({ objectName: key, storageCode, bucketName }));
}

/** 触发浏览器下载（blob → a[download]） */
function triggerDownload(blob: Blob, fileName: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(url);
}

/** 分页查询：后端只回对象键，这里补成行 */
export async function selectObjectListByPage(query: StorageObjectQuery = {}): Promise<PageResult011<StorageObject>> {
  const res = await api.post<PageResult011<string>>(OBJECT_ACTIONS.selectListByPage, query, STORAGE011_BASE);
  return { ...res, rows: toObjectRows(res.rows, query.storageCode, query.bucketName) };
}

/** 拉取对象分页并写入 store */
export async function fetchObjectPage(patch: Partial<StorageObjectQuery> = {}): Promise<void> {
  const query = { ...storageObjectStore.getSnapshot().query, ...patch } as StorageObjectQuery;
  storageObjectStore.setState({ loading: true, query });
  try {
    const res = await selectObjectListByPage(query);
    storageObjectStore.setState({ list: res.rows || [], total: res.total || 0, totalPages: res.totalPages || 1, loading: false });
  } catch {
    storageObjectStore.setState({ list: [], total: 0, totalPages: 1, loading: false });
  }
}

/** 某桶下的对象键列表（树/前缀浏览用） */
export async function listObjects(query: StorageObjectQuery): Promise<StorageObject[]> {
  const keys = await api.post<string[]>(OBJECT_ACTIONS.selectList, query, STORAGE011_BASE);
  return toObjectRows(keys, query.storageCode, query.bucketName);
}

/**
 * 对象元数据（GET + query）：列表只有键，size/lastModified/contentType 靠它补齐。
 * 对象不存在时后端 404，调用方按需降级为 '-'。
 */
export function statObject(storageCode: string | undefined, bucketName: string | undefined, objectName: string): Promise<ObjectStat> {
  return api.get<ObjectStat>(OBJECT_ACTIONS.stat, { storageCode, bucketName, objectName }, STORAGE011_BASE);
}

/** 删除对象 */
export async function removeObject(storageCode: string | undefined, bucketName: string, objectName: string): Promise<void> {
  await api.post(OBJECT_ACTIONS.remove, { storageCode, bucketName, objectName }, STORAGE011_BASE);
  await fetchObjectPage(storageObjectStore.getSnapshot().query);
}

/** 批量删除对象（同一个桶下）：body 是 {storageCode, bucketName, objectNames[]} */
export async function batchRemoveObjects(
  storageCode: string | undefined,
  bucketName: string,
  objectNames: string[],
): Promise<void> {
  await api.post(OBJECT_ACTIONS.batchRemove, { storageCode, bucketName, objectNames }, STORAGE011_BASE);
  await fetchObjectPage(storageObjectStore.getSnapshot().query);
}

/** 预签名 URL（GET + query，返回的是 URL 字符串本身） */
export function presignedUrl(storageCode: string | undefined, bucketName: string, objectName: string): Promise<string> {
  return api.get<string>(OBJECT_ACTIONS.presignedUrl, { storageCode, bucketName, objectName }, STORAGE011_BASE);
}

/**
 * 上传对象，返回后端最终落库的对象键。
 * - mock 模式：无真实传输，api.post 由 mock handler 落内存。
 * - api 模式：multipart/form-data（query 带 storageCode/bucketName/objectName，part 名 file）。
 */
export async function uploadObject(
  storageCode: string | undefined,
  bucketName: string,
  file: File,
  objectName?: string,
): Promise<string> {
  if (isMockMode()) {
    return api.post<string>(
      OBJECT_ACTIONS.upload,
      { storageCode, bucketName, objectName: objectName || file.name, size: file.size, contentType: file.type },
      STORAGE011_BASE,
    );
  }
  const form = new FormData();
  form.append('file', file, file.name);
  const qs = new URLSearchParams();
  if (storageCode) qs.set('storageCode', storageCode);
  qs.set('bucketName', bucketName.trim());
  if (objectName?.trim()) qs.set('objectName', objectName.trim());
  const token = authStore.getSnapshot().token;
  const res = await fetch(`${resolveStorageBase()}${OBJECT_ACTIONS.upload}?${qs.toString()}`, {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: form,
  });
  let envelope: { statusCode?: number; message?: string; errorMessage?: string; data?: string } | null = null;
  try { envelope = await res.json(); } catch { /* ignore */ }
  if (!res.ok || (envelope && envelope.statusCode !== 200)) {
    const msg = envelope?.errorMessage || envelope?.message || `上传失败 HTTP ${res.status}`;
    throw new ApiError(msg, res.status);
  }
  return envelope?.data || objectName || file.name;
}

/**
 * 下载对象（触发浏览器保存）。
 * - mock 模式：无真实字节，生成占位文本 blob 供演示。
 * - api 模式：GET blob 直下；401 转登录失效提示。
 */
export async function downloadObject(storageCode: string | undefined, bucketName: string, objectName: string): Promise<void> {
  const fileName = objectName.includes('/') ? objectName.slice(objectName.lastIndexOf('/') + 1) : objectName;
  if (isMockMode()) {
    triggerDownload(new Blob([`Mock download: ${objectName}\n(storage=${storageCode}, bucket=${bucketName})`], { type: 'text/plain;charset=utf-8' }), fileName);
    return;
  }
  const token = authStore.getSnapshot().token;
  const qs = new URLSearchParams({ bucketName, objectName });
  if (storageCode) qs.set('storageCode', storageCode);
  const res = await fetch(`${resolveStorageBase()}${OBJECT_ACTIONS.download}?${qs.toString()}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (res.status === 401) throw new ApiError('登录已失效，请重新登录', 401);
  if (!res.ok) {
    let detail = `下载失败 HTTP ${res.status}`;
    try { const json = await res.json(); if (json?.message) detail = json.message; } catch { /* ignore */ }
    throw new ApiError(detail, res.status);
  }
  triggerDownload(await res.blob(), fileName);
}

/**
 * 读取对象文本（在线编辑用）：后端是 GET + query。
 * mock 态 api.get 同样走 mock 派发，故两种模式共用一条路径。
 */
export async function readObjectText(
  storageCode: string | undefined,
  bucketName: string,
  objectName: string,
): Promise<ReadTextResult> {
  const row = await api.get<StorageTextContent>(
    OBJECT_ACTIONS.readText,
    { storageCode, bucketName, objectName },
    STORAGE011_BASE,
  );
  const content = row?.content ?? '';
  return { ...row, objectName: row?.objectName || objectName, content, editorKind: resolveEditorKind(objectName) };
}

/** 保存对象文本（在线编辑），返回对象键 */
export function saveObjectText(
  storageCode: string | undefined,
  bucketName: string,
  objectName: string,
  content: string,
): Promise<string> {
  return api.post<string>(
    OBJECT_ACTIONS.saveText,
    { storageCode, bucketName, objectName, content },
    STORAGE011_BASE,
  );
}
