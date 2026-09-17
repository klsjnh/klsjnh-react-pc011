/**
 * Mock：存储中心（storagecenter 全模块）
 * 严格对齐后端 24 动作的**真实返回形状**（核对于实时 OpenAPI 2026-09-17）：
 *   - julyStorage 无 selectList；分页查询字段是 keyword
 *   - bucket 的 selectBucketList|selectBucketListByPage 返回 **桶名字符串数组**
 *   - object 的 selectObjectList 返回 **对象键字符串数组**；
 *     selectObjectListByPage 返回 **MapStringObject 数组**（带 key/size/lastModified/contentType）
 *   - stat / readText / presignObjectUrl / downloadObject 都是 GET（本 mock 按 action 派发，不区分方法）
 * 经 src/mock/system011/index.ts 聚合注册（与其它模块共用同一信封解包逻辑）。
 */
import { ok, fail, delay, pageResult, type Handler } from '@/mock/system011/common';
import type { JulyStorage, StorageTextContent } from '@/types/storage011';

let nextId = 100;

/** 存储实例（字段对齐后端 JulyStorageVo011；provider 取 local011/minio011，secure 是 boolean） */
export const mockStorages: JulyStorage[] = [
  {
    id: 'st-0001', storageCode: 'st_local', storageName: '本地存储', provider: 'local011', sortOrder: 1,
    basePath: 'D:/Klsjnh/upload', endpoint: '', accessKey: '', secretKey: '', secure: false,
    defaultBucket: 'default', presignExpirySeconds: 3600, remark: '本地磁盘适配器', status: '1',
    createTime: '2026-09-16 10:00:00', updateTime: '2026-09-16 10:00:00',
  },
  {
    id: 'st-0002', storageCode: 'st_minio', storageName: 'MinIO 对象存储', provider: 'minio011', sortOrder: 2,
    basePath: '', endpoint: 'http://192.168.1.88:12300', accessKey: 'minioadmin', secretKey: 'minioadmin',
    secure: false, defaultBucket: 'klsjnh', presignExpirySeconds: 3600, remark: 'S3 兼容', status: '1',
    createTime: '2026-09-16 10:01:00', updateTime: '2026-09-16 10:01:00',
  },
];

/** 桶：内部按 storageCode 归属，对外一律只回桶名字符串 */
export const mockBuckets: { storageCode: string; bucketName: string }[] = [
  { storageCode: 'st_local', bucketName: 'default' },
  { storageCode: 'st_minio', bucketName: 'klsjnh' },
  { storageCode: 'st_minio', bucketName: 'reports' },
];

/** 对象：内部带 size/content/lastModified（供 stat / readText），对外列表只回对象键 */
export const mockObjects: {
  storageCode: string; bucketName: string; objectName: string;
  size: number; contentType: string; lastModified: string; content: string;
}[] = [
  { storageCode: 'st_local', bucketName: 'default', objectName: 'docs/存储中心说明.md', size: 96, contentType: 'text/markdown', content: '# 本地存储\nlocal011 适配器下的 mock 文本对象。', lastModified: '2026-09-16 10:05:00' },
  { storageCode: 'st_local', bucketName: 'default', objectName: 'sql/storage011_init.sql', size: 320, contentType: 'text/plain', content: '-- storage011 初始化\nCREATE TABLE july_storage (\n  id VARCHAR(64) PRIMARY KEY,\n  storage_code VARCHAR(64) NOT NULL\n);', lastModified: '2026-09-16 10:06:00' },
  { storageCode: 'st_local', bucketName: 'default', objectName: 'export/2026091610.log', size: 512, contentType: 'text/plain', content: '[10:00:00] storage011 mock log', lastModified: '2026-09-16 10:07:00' },
  { storageCode: 'st_minio', bucketName: 'klsjnh', objectName: 'readme.md', size: 128, contentType: 'text/markdown', content: '# 存储中心\n这是一个 mock 文本对象。', lastModified: '2026-09-16 10:10:00' },
  { storageCode: 'st_minio', bucketName: 'klsjnh', objectName: 'init.sql', size: 256, contentType: 'text/plain', content: 'CREATE TABLE t_demo (id BIGINT PRIMARY KEY);', lastModified: '2026-09-16 10:11:00' },
  { storageCode: 'st_minio', bucketName: 'reports', objectName: 'report-202609.pdf', size: 2048, contentType: 'application/pdf', content: '', lastModified: '2026-09-16 10:12:00' },
];

/**
 * 后端 lastModified 由 LocalDateTime 序列化而来，形如 `2026-09-15T20:48:36.1933758`
 * （带 T、带 7 位小数秒）。mock 按同样形状回，好让前端的时间归一化分支在 mock 模式下也被覆盖。
 */
function toBackendTime(v: string): string {
  return `${v.replace(' ', 'T')}.1933758`;
}

/** 对象键（对外列表形态） */
function objectKeys(body?: Record<string, string>): string[] {
  let rows = mockObjects.filter(
    (r) => (!body?.storageCode || r.storageCode === body.storageCode) && (!body?.bucketName || r.bucketName === body.bucketName),
  );
  if (body?.prefix) rows = rows.filter((r) => r.objectName.startsWith(body.prefix));
  return rows.map((r) => r.objectName);
}

/** 桶名（对外列表形态） */
function bucketNames(body?: Record<string, string>): string[] {
  const rows = mockBuckets.filter((r) => !body?.storageCode || r.storageCode === body.storageCode);
  return rows.map((r) => r.bucketName);
}

/** 对象 MapStringObject 列表（selectObjectListByPage 用） */
function objectMapList(body?: Record<string, string>): Array<Record<string, unknown>> {
  let rows = mockObjects.filter(
    (r) => (!body?.storageCode || r.storageCode === body.storageCode) && (!body?.bucketName || r.bucketName === body.bucketName),
  );
  if (body?.prefix) rows = rows.filter((r) => r.objectName.startsWith(body.prefix));
  return rows.map((r) => ({
    key: r.objectName,
    bucket: r.bucketName,
    storageCode: r.storageCode,
    size: r.size,
    lastModified: toBackendTime(r.lastModified),
    contentType: r.contentType,
  }));
}

export const handlers: Record<string, Handler> = {
  // ===================== 存储实例 julyStorage（8 动作，无 selectList） =====================
  '/julyStorage/v1/selectListByPage': async (body) => {
    await delay(300);
    const kw = (body?.keyword || '').trim().toLowerCase();
    let rows = [...mockStorages];
    if (kw) rows = rows.filter((r) => r.storageCode.toLowerCase().includes(kw) || r.storageName.toLowerCase().includes(kw));
    if (body?.provider) rows = rows.filter((r) => r.provider === body.provider);
    if (body?.status) rows = rows.filter((r) => r.status === body.status);
    return ok(pageResult(rows, body?.pageIndex || 1, body?.pageSize || 10));
  },
  '/julyStorage/v1/getById': async (body) => {
    await delay(150);
    const item = mockStorages.find((s) => s.id === body?.id);
    return item ? ok(structuredClone(item)) : fail(`record not found, id=${body?.id}`, 404);
  },
  // 后端签名是 getByCode(@RequestParam("code"))，参数名就是 code
  '/julyStorage/v1/getByCode': async (body) => {
    await delay(150);
    const item = mockStorages.find((s) => s.storageCode === body?.code);
    return item ? ok(structuredClone(item)) : fail(`record not found, code=${body?.code}`, 404);
  },
  '/julyStorage/v1/insert': async (body) => {
    await delay(400);
    const storageCode = (body?.storageCode || '').trim();
    const storageName = (body?.storageName || '').trim();
    if (!storageCode) return fail('insert: storageCode is required', 400);
    if (!storageName) return fail('insert: storageName is required', 400);
    if (mockStorages.some((s) => s.storageCode === storageCode)) return fail(`insert: storageCode ${storageCode} already exists`, 400);
    const item: JulyStorage = {
      id: String(nextId++), storageCode, storageName,
      provider: body?.provider || 'local011', sortOrder: body?.sortOrder ?? 99,
      basePath: body?.basePath || '', endpoint: body?.endpoint || '',
      accessKey: body?.accessKey || '', secretKey: body?.secretKey || '',
      secure: body?.secure === true,
      defaultBucket: body?.defaultBucket || '', presignExpirySeconds: body?.presignExpirySeconds ?? 3600,
      remark: body?.remark || '', status: body?.status || '1',
      createTime: '2026-09-16 10:00:00', updateTime: '2026-09-16 10:00:00',
    };
    mockStorages.unshift(item);
    return ok({ id: item.id });
  },
  '/julyStorage/v1/update': async (body) => {
    await delay(400);
    const item = mockStorages.find((s) => s.id === body?.id);
    if (!item) return fail(`record not found, id=${body?.id}`, 404);
    if (body?.storageName !== undefined) item.storageName = body.storageName;
    if (body?.sortOrder !== undefined) item.sortOrder = body.sortOrder;
    if (body?.provider !== undefined) item.provider = body.provider;
    if (body?.basePath !== undefined) item.basePath = body.basePath;
    if (body?.endpoint !== undefined) item.endpoint = body.endpoint;
    if (body?.accessKey !== undefined) item.accessKey = body.accessKey;
    // secretKey 留空 = 保持原值（后端注释：出参不回显，修改留空保持原值）
    if (body?.secretKey) item.secretKey = body.secretKey;
    if (body?.secure !== undefined) item.secure = body.secure === true;
    if (body?.defaultBucket !== undefined) item.defaultBucket = body.defaultBucket;
    if (body?.presignExpirySeconds !== undefined) item.presignExpirySeconds = body.presignExpirySeconds;
    if (body?.remark !== undefined) item.remark = body.remark;
    if (body?.status !== undefined) item.status = body.status;
    item.updateTime = '2026-09-16 10:00:00';
    return ok({ id: item.id });
  },
  '/julyStorage/v1/logicDelete': async (body) => {
    await delay(300);
    const i = mockStorages.findIndex((s) => s.id === body?.id);
    if (i < 0) return fail(`record not found, id=${body?.id}`, 404);
    const [removed] = mockStorages.splice(i, 1);
    return ok({ id: removed.id });
  },
  '/julyStorage/v1/logicDeleteBatch': async (body) => {
    await delay(500);
    const ids: string[] = body?.ids || [];
    let success = 0;
    const errors: { id: string; message: string }[] = [];
    for (const id of ids) {
      const i = mockStorages.findIndex((s) => s.id === id);
      if (i < 0) { errors.push({ id, message: 'record not found' }); continue; }
      mockStorages.splice(i, 1);
      success++;
    }
    return ok({ total: ids.length, success, failed: errors.length, errors });
  },
  '/julyStorage/v1/testConnection': async (body) => {
    await delay(800);
    const item = body?.id ? mockStorages.find((s) => s.id === body.id) : undefined;
    const endpoint = item?.endpoint || body?.endpoint || '';
    const basePath = item?.basePath || body?.basePath || '';
    const reachable = !!endpoint.startsWith('http') || !!basePath || (!!item && item.status === '1');
    // StorageProbeResult 只有 success / message
    return reachable
      ? ok({ success: true, message: `连接成功（${item?.provider || body?.provider || 'local011'}）` })
      : ok({ success: false, message: '无法连接到该存储' });
  },

  // ===================== 存储桶 julyStorage（列表只回桶名） =====================
  '/julyStorage/v1/selectBucketListByPage': async (body) => {
    await delay(250);
    const kw = (body?.keyword || '').trim().toLowerCase();
    let names = bucketNames(body);
    if (kw) names = names.filter((n) => n.toLowerCase().includes(kw));
    return ok(pageResult(names, body?.pageIndex || 1, body?.pageSize || 10));
  },
  '/julyStorage/v1/selectBucketList': async (body) => {
    await delay(150);
    return ok(bucketNames(body));
  },
  // 后端返回 Response011<Boolean>
  '/julyStorage/v1/getBucket': async (body) => {
    await delay(150);
    return ok(mockBuckets.some((r) => r.storageCode === body?.storageCode && r.bucketName === body?.bucketName));
  },
  '/julyStorage/v1/insertBucket': async (body) => {
    await delay(350);
    const storageCode = body?.storageCode;
    const bucketName = (body?.bucketName || '').trim();
    if (!bucketName) return fail('insert: bucketName is required', 400);
    if (mockBuckets.some((b) => b.storageCode === storageCode && b.bucketName === bucketName)) {
      return fail(`insert: bucket ${bucketName} already exists`, 400);
    }
    mockBuckets.push({ storageCode: storageCode || '', bucketName });
    return ok(bucketName);
  },
  '/julyStorage/v1/removeBucket': async (body) => {
    await delay(300);
    const i = mockBuckets.findIndex((b) => b.storageCode === body?.storageCode && b.bucketName === body?.bucketName);
    if (i < 0) return fail('bucket not found', 404);
    mockBuckets.splice(i, 1);
    return ok(body?.bucketName);
  },
  '/julyStorage/v1/testBucketConnection': async (body) => {
    await delay(600);
    const has = mockStorages.some((s) => s.storageCode === body?.storageCode && s.status === '1');
    return has
      ? ok({ success: true, message: '桶连接正常' })
      : ok({ success: false, message: '所属存储实例不可用' });
  },

  // ===================== 对象 julyObject =====================
  '/julyObject/v1/selectObjectListByPage': async (body) => {
    await delay(250);
    return ok(pageResult(objectMapList(body), body?.pageIndex || 1, body?.pageSize || 10));
  },
  '/julyObject/v1/selectObjectList': async (body) => {
    await delay(150);
    return ok(objectKeys(body));
  },
  '/julyObject/v1/statObject': async (body) => {
    await delay(200);
    const item = mockObjects.find((o) => o.storageCode === body?.storageCode && o.bucketName === body?.bucketName && o.objectName === body?.objectName);
    // ObjectStat: { bucket, key, size, lastModified, contentType }
    return item
      ? ok({ bucket: item.bucketName, key: item.objectName, size: item.size, lastModified: toBackendTime(item.lastModified), contentType: item.contentType })
      : fail(`record not found, ${body?.objectName}`, 404);
  },
  '/julyObject/v1/uploadObject': async (body) => {
    await delay(400);
    const storageCode = body?.storageCode;
    const bucketName = (body?.bucketName || '').trim();
    const objectName = (body?.objectName || '').trim();
    if (!bucketName) return fail('upload: bucketName is required', 400);
    if (!objectName) return fail('upload: objectName is required', 400);
    const existing = mockObjects.find((o) => o.storageCode === storageCode && o.bucketName === bucketName && o.objectName === objectName);
    if (existing) {
      existing.size = body?.size ?? existing.size;
    } else {
      mockObjects.unshift({
        storageCode: storageCode || '', bucketName, objectName,
        size: body?.size ?? 0, contentType: body?.contentType || 'application/octet-stream',
        lastModified: '2026-09-16 10:00:00', content: '',
      });
    }
    // 后端回的是落库后的对象键
    return ok(objectName);
  },
  '/julyObject/v1/downloadObject': async (body) => {
    await delay(200);
    const item = mockObjects.find((o) => o.storageCode === body?.storageCode && o.bucketName === body?.bucketName && o.objectName === body?.objectName);
    return item ? ok({ objectName: item.objectName, size: item.size }) : fail('object not found', 404);
  },
  '/julyObject/v1/readObjectText': async (body) => {
    await delay(300);
    const item = mockObjects.find((o) => o.storageCode === body?.storageCode && o.bucketName === body?.bucketName && o.objectName === body?.objectName);
    if (!item) return fail('object not found', 404);
    const kind = /\.sql$/i.test(item.objectName) ? 'sql' : (/\.(md|markdown)$/i.test(item.objectName) ? 'markdown' : 'text');
    const payload: StorageTextContent = {
      storageCode: item.storageCode, bucketName: item.bucketName, objectName: item.objectName,
      size: item.size, content: item.content, editorKind: kind, contentType: item.contentType,
    };
    return ok(payload);
  },
  '/julyObject/v1/saveObjectText': async (body) => {
    await delay(300);
    const item = mockObjects.find((o) => o.storageCode === body?.storageCode && o.bucketName === body?.bucketName && o.objectName === body?.objectName);
    if (!item) return fail('object not found', 404);
    item.content = body?.content ?? '';
    item.size = item.content.length;
    return ok(item.objectName);
  },
  '/julyObject/v1/removeObject': async (body) => {
    await delay(250);
    const i = mockObjects.findIndex((o) => o.storageCode === body?.storageCode && o.bucketName === body?.bucketName && o.objectName === body?.objectName);
    if (i < 0) return fail('object not found', 404);
    mockObjects.splice(i, 1);
    return ok(body?.objectName);
  },
  // body: { storageCode, bucketName, objectNames[] }
  '/julyObject/v1/batchRemoveObject': async (body) => {
    await delay(400);
    const names: string[] = body?.objectNames || [];
    let success = 0;
    for (const name of names) {
      const i = mockObjects.findIndex((o) => o.storageCode === body?.storageCode && o.bucketName === body?.bucketName && o.objectName === name);
      if (i >= 0) { mockObjects.splice(i, 1); success++; }
    }
    return ok('batch remove success');
  },
  // 后端回的是 URL 字符串本身
  '/julyObject/v1/presignObjectUrl': async (body) => {
    await delay(200);
    return ok(`https://mock.storage/${body?.storageCode || ''}/${body?.bucketName || ''}/${body?.objectName || ''}?sig=mock`);
  },
};
