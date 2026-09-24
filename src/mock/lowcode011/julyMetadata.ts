/**
 * Mock：元数据（lowcode011 / julyMetadata）—— 一主三子。
 * 内存态存主表 + fields + displays + services；insert/update 整体替换三子。
 *
 * ★ 覆盖**三组口径**（真实后端 2026-09-17 起同时提供）：
 *  - 038 CRUD：`selectListByPage` / `getById` / `getByObjectName` / `insert` / `update` /
 *    `logicDelete` / `logicDeleteBatch` —— 子表键名 `fieldCode` / `fieldName` / `requiredField`
 *  - 039 一期设计器：`listModels` / `load` / `save` / `previewDdl` —— MetaDTO，
 *    三子在**顶层**、键名短名 `code` / `name` / `notNull`
 *  - 039 二期发布：`publish` / `importDataFromSql` / `importStatus` —— 发布态为 mock 内存态
 *
 * ⚠️ mock 的 DDL 生成（`generateDdl` / `generateAddColumns`）**逐字照抄**后端
 * `MySqlMetadataDdlGenerator`（含 `lc_` 前缀、`IF NOT EXISTS`、无 id 时自动补主键、
 * 类型映射与 identifier 白名单），改这里必须同步改后端，否则 mock/真实两态下 DDL 会漂移。
 *
 * ⚠️ mock 的 `publish` **不建真表**（无物理库），只维护内存发布态（版本 / 物理表名 / 初始化标记）；
 * 且按 action 派发**不区分 HTTP 方法** —— 方法错配（GET 写成 POST）在 mock 下永远发现不了。
 */
import { ok, fail, delay, pageResult, type Handler } from '@/mock/system011/common';
import { nowStamp } from '@/utils/formatDate';
import type {
  JulyMetadataVo011, JulyMetadataFieldVo011, JulyMetadataDisplayVo011, JulyMetadataServiceVo011,
  JulyMetadataMetaDto011,
} from '@/types/lowcode011';

function rid(prefix: string): string {
  return prefix + Math.random().toString(36).slice(2, 16);
}

export const mockMetadatas: JulyMetadataVo011[] = [
  {
    id: rid('meta'), objectName: 'sys_user', sortOrder: 1, objectType: 'type011',
    description: '系统用户', businessField: 'id,username,status', packageName: 'com.klsjnh.sys',
    routerPath: '/system011/julyUser', remark: '演示元数据', status: '1',
    createBy: 'admin', createTime: '2026-09-16T01:20:44',
    fields: [
      { id: rid('f'), fieldCode: 'id', fieldName: '主键', fieldType: 'id', fieldLength: 32, requiredField: true, defaultValue: null, sortOrder: 1 },
      { id: rid('f'), fieldCode: 'username', fieldName: '用户名', fieldType: 'string', fieldLength: 64, requiredField: true, defaultValue: null, sortOrder: 2 },
      { id: rid('f'), fieldCode: 'status', fieldName: '状态', fieldType: 'int', fieldLength: 2, requiredField: false, defaultValue: '1', sortOrder: 3 },
      { id: rid('f'), fieldCode: 'create_time', fieldName: '创建时间', fieldType: 'create_time', fieldLength: null, requiredField: false, defaultValue: null, sortOrder: 99 },
    ],
    displays: [
      { id: rid('d'), displayCode: 'id', displayName: '主键', align: 'left', width: 220, componentType: 'text', displayType: 'text', param011: '', sortOrder: 1 },
      { id: rid('d'), displayCode: 'username', displayName: '用户名', align: 'left', width: 200, componentType: 'text', displayType: 'text', param011: '', sortOrder: 2 },
      { id: rid('d'), displayCode: 'status', displayName: '状态', align: 'center', width: 100, componentType: 'tag', displayType: 'status', param011: '1=启用,0=停用', sortOrder: 3 },
    ],
    services: [
      { id: rid('s'), serviceCode: 'listUser', serviceName: '用户列表', serviceDescription: '分页查询用户', objectType: 'query', paramType: 'page', enabled: true, sortOrder: 1, serviceContent: 'SELECT id, username, status FROM sys_user WHERE status = #{status} ORDER BY create_time DESC' },
      { id: rid('s'), serviceCode: 'saveUser', serviceName: '保存用户', serviceDescription: '新增/修改用户', objectType: 'save', paramType: 'entity', enabled: true, sortOrder: 2, serviceContent: 'INSERT INTO sys_user(id, username, status) VALUES(#{id}, #{username}, #{status})' },
    ],
  },
  {
    id: rid('meta'), objectName: 'sys_role', sortOrder: 2, objectType: 'type011',
    description: '系统角色', businessField: 'id,role_code', packageName: 'com.klsjnh.sys',
    routerPath: null, remark: null, status: '1',
    createBy: 'admin', createTime: '2026-09-16T01:21:10',
    fields: [
      { id: rid('f'), fieldCode: 'id', fieldName: '主键', fieldType: 'id', fieldLength: 32, requiredField: true, defaultValue: null, sortOrder: 1 },
      { id: rid('f'), fieldCode: 'role_code', fieldName: '角色编码', fieldType: 'string', fieldLength: 64, requiredField: true, defaultValue: null, sortOrder: 2 },
      { id: rid('f'), fieldCode: 'role_name', fieldName: '角色名称', fieldType: 'string', fieldLength: 64, requiredField: true, defaultValue: null, sortOrder: 3 },
    ],
    displays: [
      { id: rid('d'), displayCode: 'role_code', displayName: '角色编码', align: 'left', width: 200, componentType: 'text', displayType: 'text', param011: '', sortOrder: 1 },
      { id: rid('d'), displayCode: 'role_name', displayName: '角色名称', align: 'left', width: 200, componentType: 'text', displayType: 'text', param011: '', sortOrder: 2 },
    ],
    services: [
      { id: rid('s'), serviceCode: 'listRole', serviceName: '角色列表', serviceDescription: '分页查询角色', objectType: 'query', paramType: 'page', enabled: true, sortOrder: 1, serviceContent: 'SELECT id, role_code, role_name FROM sys_role' },
    ],
  },
  {
    id: rid('meta'), objectName: 'sys_menu_tree', sortOrder: 3, objectType: 'type_tree',
    description: '系统菜单树', businessField: 'id,parent_id', packageName: 'com.klsjnh.sys',
    routerPath: '/system011/julyMenu', remark: '树形对象示例', status: '0',
    createBy: 'admin', createTime: '2026-09-16T01:22:00',
    fields: [
      { id: rid('f'), fieldCode: 'id', fieldName: '主键', fieldType: 'id', fieldLength: 32, requiredField: true, defaultValue: null, sortOrder: 1 },
      { id: rid('f'), fieldCode: 'parent_id', fieldName: '父级', fieldType: 'id', fieldLength: 32, requiredField: false, defaultValue: '0', sortOrder: 2 },
      { id: rid('f'), fieldCode: 'menu_name', fieldName: '菜单名', fieldType: 'string', fieldLength: 64, requiredField: true, defaultValue: null, sortOrder: 3 },
    ],
    displays: [
      { id: rid('d'), displayCode: 'menu_name', displayName: '菜单名', align: 'left', width: 240, componentType: 'tree', displayType: 'tree', param011: '', sortOrder: 1 },
    ],
    services: [],
  },
];

export const handlers: Record<string, Handler> = {
  '/julyMetadata/v1/selectListByPage': async (body) => {
    await delay(300);
    let rows = [...mockMetadatas];
    const kw = (body?.keyword || '').trim().toLowerCase();
    if (kw) rows = rows.filter((m) => m.objectName.toLowerCase().includes(kw) || (m.description || '').toLowerCase().includes(kw));
    if (body?.objectType) rows = rows.filter((m) => m.objectType === body.objectType);
    if (body?.status) rows = rows.filter((m) => m.status === body.status);
    return ok(pageResult(rows, body?.pageIndex || 1, body?.pageSize || 10));
  },
  '/julyMetadata/v1/getById': async (body) => {
    await delay(200);
    const item = mockMetadatas.find((m) => m.id === body?.id);
    if (!item) return fail(`record not found, id=${body?.id}`, 404);
    // 回传主表 + 三子全量（保持 sortOrder 升序）
    return ok({
      ...item,
      fields: [...(item.fields || [])].sort((a, b) => a.sortOrder - b.sortOrder),
      displays: [...(item.displays || [])].sort((a, b) => a.sortOrder - b.sortOrder),
      services: [...(item.services || [])].sort((a, b) => a.sortOrder - b.sortOrder),
    });
  },
  '/julyMetadata/v1/getByObjectName': async (body) => {
    await delay(200);
    const item = mockMetadatas.find((m) => m.objectName === body?.objectName);
    if (!item) return fail(`record not found, objectName=${body?.objectName}`, 404);
    return ok(item);
  },
  '/julyMetadata/v1/insert': async (body) => {
    await delay(350);
    const name = (body?.objectName || '').trim();
    if (!name) return fail('insert: objectName is required', 400);
    if (mockMetadatas.some((m) => m.objectName === name)) return fail(`insert: objectName already exists, ${name}`, 400);
    // 三子整体替换：取 body 里的三子（剔掉前端草稿标记），空则 []
    const item: JulyMetadataVo011 = {
      id: rid('meta'),
      objectName: name,
      sortOrder: body?.sortOrder ?? 9999,
      objectType: body?.objectType || 'type011',
      description: body?.description ?? null,
      businessField: body?.businessField ?? null,
      packageName: body?.packageName ?? null,
      routerPath: body?.routerPath ?? null,
      remark: body?.remark ?? null,
      status: body?.status || '1',
      createBy: 'mock', createTime: nowStamp(),
      fields: cleanSub<JulyMetadataFieldVo011>(body?.fields),
      displays: cleanSub<JulyMetadataDisplayVo011>(body?.displays),
      services: cleanSub<JulyMetadataServiceVo011>(body?.services),
    };
    mockMetadatas.push(item);
    return ok({ id: item.id });
  },
  '/julyMetadata/v1/update': async (body) => {
    await delay(300);
    const item = mockMetadatas.find((m) => m.id === body?.id);
    if (!item) return fail(`record not found, id=${body?.id}`, 404);
    // objectName 不可变：忽略 body.objectName
    if (body?.description !== undefined) item.description = body.description;
    if (body?.businessField !== undefined) item.businessField = body.businessField;
    if (body?.packageName !== undefined) item.packageName = body.packageName;
    if (body?.routerPath !== undefined) item.routerPath = body.routerPath;
    if (body?.remark !== undefined) item.remark = body.remark;
    if (body?.objectType !== undefined) item.objectType = body.objectType;
    if (body?.sortOrder !== undefined) item.sortOrder = body.sortOrder;
    if (body?.status !== undefined) item.status = body.status;
    // 三子整体替换
    item.fields = cleanSub<JulyMetadataFieldVo011>(body?.fields);
    item.displays = cleanSub<JulyMetadataDisplayVo011>(body?.displays);
    item.services = cleanSub<JulyMetadataServiceVo011>(body?.services);
    item.updateTime = nowStamp();
    return ok({ id: item.id });
  },
  '/julyMetadata/v1/logicDelete': async (body) => {
    await delay(300);
    const i = mockMetadatas.findIndex((m) => m.id === body?.id);
    if (i < 0) return fail(`record not found, id=${body?.id}`, 404);
    const [removed] = mockMetadatas.splice(i, 1);
    return ok({ id: removed.id });
  },
  '/julyMetadata/v1/logicDeleteBatch': async (body) => {
    await delay(300);
    const ids: string[] = Array.isArray(body?.ids) ? body.ids : [];
    let n = 0;
    for (let i = mockMetadatas.length - 1; i >= 0; i--) {
      if (ids.includes(mockMetadatas[i].id)) { mockMetadatas.splice(i, 1); n++; }
    }
    return ok({ id: `batch:${n}` });
  },

  /* ---- 039 一期设计器（2026-09-17 后端上线，MetaDTO 口径） ---- */

  '/julyMetadata/v1/listModels': async () => {
    await delay(200);
    // ⚠️ publishStatus / version 与后端一致地硬编码（发布态列已建但 UseCase 未读取）
    return ok(mockMetadatas.map((m) => ({
      objectName: m.objectName,
      description: m.description ?? null,
      objectType: m.objectType,
      publishStatus: 'draft',
      version: '',
    })));
  },
  '/julyMetadata/v1/load': async (body) => {
    await delay(200);
    const item = mockMetadatas.find((m) => m.objectName === body?.objectName);
    if (!item) return fail(`record not found, objectName=${body?.objectName}`, 404);
    return ok(toMetaDto(item));
  },
  '/julyMetadata/v1/save': async (body) => {
    await delay(350);
    const metaData = (body?.metaData || {}) as Record<string, unknown>;
    const name = String(metaData.objectName ?? '').trim();
    if (!name) return fail('metaData required / objectName required in metaData', 400);
    const fields = metaFields(body?.fieldData);
    const displays = metaDisplays(body?.displayData);
    const services = metaServices(body?.serviceData);
    const existing = mockMetadatas.find((m) => m.objectName === name);
    const text = (v: unknown) => (v === undefined ? undefined : (v === null ? null : String(v)));
    if (existing) {
      // objectName 不可变；三子整体替换
      existing.objectType = String(metaData.objectType ?? existing.objectType);
      existing.description = text(metaData.description) ?? null;
      existing.businessField = text(metaData.businessField) ?? null;
      existing.packageName = text(metaData.packageName) ?? null;
      existing.routerPath = text(metaData.routerPath) ?? null;
      existing.remark = text(metaData.remark) ?? null;
      if (typeof metaData.sortOrder === 'number') existing.sortOrder = metaData.sortOrder;
      existing.fields = fields;
      existing.displays = displays;
      existing.services = services;
      existing.updateTime = nowStamp();
      return ok({ id: existing.id });
    }
    const item: JulyMetadataVo011 = {
      id: rid('meta'),
      objectName: name,
      sortOrder: typeof metaData.sortOrder === 'number' ? metaData.sortOrder : 9999,
      objectType: String(metaData.objectType || 'type011'),
      description: text(metaData.description) ?? null,
      businessField: text(metaData.businessField) ?? null,
      packageName: text(metaData.packageName) ?? null,
      routerPath: text(metaData.routerPath) ?? null,
      remark: text(metaData.remark) ?? null,
      status: '1',
      createBy: 'mock', createTime: nowStamp(),
      fields, displays, services,
    };
    mockMetadatas.push(item);
    return ok({ id: item.id });
  },
  '/julyMetadata/v1/previewDdl': async (body) => {
    await delay(250);
    const item = mockMetadatas.find((m) => m.objectName === body?.objectName);
    if (!item) return fail(`record not found, objectName=${body?.objectName}`, 404);
    try {
      return ok({ ddl: generateDdl(item) });
    } catch (e) {
      return fail((e as Error).message, 400);
    }
  },

  /* ---- 039 二期 发布 / 数据同步（2026-09-17 后端上线） ---- */

  /** POST /publish —— 发布态存内存；DDL 与 previewDdl 同源（表已存在且无新列时 ddl=null） */
  '/julyMetadata/v1/publish': async (body) => {
    await delay(500);
    const name = String(body?.objectName ?? '').trim();
    if (!name) return fail('objectName required', 400);
    const item = mockMetadatas.find((m) => m.objectName === name);
    if (!item) return fail(`record not found, id=${name}`, 404);

    const prev = publishStates.get(name);
    const table = DDL_TABLE_PREFIX + name;
    const version = nextVersion(prev?.version || '');
    let ddl: string | null;

    try {
      if (!prev) {
        // 表不存在 → CREATE（与 previewDdl 逐字一致）
        ddl = generateDdl(item);
      } else {
        // 表已存在 → 只补缺失列；无缺失 → null（无事可做）
        const existing = new Set(prev.columns);
        const missing = (item.fields || []).filter((f) => !existing.has((f.fieldCode || '').toLowerCase()));
        ddl = missing.length ? generateAddColumns(table, missing) : null;
      }
    } catch (e) {
      return fail((e as Error).message, 400);
    }

    publishStates.set(name, {
      publishStatus: 'published',
      version,
      physicalTable: table,
      dataInitialized: prev?.dataInitialized ?? false,
      columns: (item.fields || []).map((f) => (f.fieldCode || '').toLowerCase()),
    });

    return ok({
      objectName: name,
      version,
      publishStatus: 'published',
      physicalTable: table,
      backupTable: null,
      ddl,
    });
  },

  /** GET /importStatus?objectName= —— 对象不存在时后端仍回 200（全 false/null/draft） */
  '/julyMetadata/v1/importStatus': async (body) => {
    await delay(200);
    const name = String(body?.objectName ?? '').trim();
    const st = publishStates.get(name);
    return ok({
      objectName: name,
      dataInitialized: st?.dataInitialized ?? false,
      physicalTable: st?.physicalTable ?? null,
      publishStatus: st ? 'published' : 'draft',
    });
  },

  /**
   * POST /importDataFromSql —— 前置：对象存在（否则 404）+ 已发布（否则 400）。
   * 模拟源 SQL 每页 100 条、共 3 页；与后端一致地 updated/unchanged/skipped 恒 0。
   */
  '/julyMetadata/v1/importDataFromSql': async (body) => {
    await delay(450);
    const name = String(body?.objectName ?? '').trim();
    const item = mockMetadatas.find((m) => m.objectName === name);
    if (!item) return fail(`record not found, id=${name}`, 404);
    const st = publishStates.get(name);
    if (!st) return fail(`object not published: ${name}`, 400);
    if (!String(body?.dataSourceCode ?? '').trim()) return fail('dataSourceCode required', 400);
    if (!String(body?.sqlCode ?? '').trim()) return fail('sqlCode required', 400);

    const pageNum = Number(body?.pageNum) > 0 ? Number(body?.pageNum) : 1;
    const rawSize = Number(body?.pageSize) > 0 ? Number(body?.pageSize) : 100;
    const pageSize = Math.min(rawSize, 500);
    const totalPages = 3;
    const hasMore = pageNum < totalPages;
    const mode: 'init' | 'sync' = body?.forceInit === true || !st.dataInitialized ? 'init' : 'sync';

    st.dataInitialized = true;

    return ok({
      objectName: name,
      mode,
      pageNum,
      pageSize,
      hasMore,
      nextPageNum: hasMore ? pageNum + 1 : null,
      inserted: pageSize,
      updated: 0,
      unchanged: 0,
      skipped: 0,
      processed: pageSize,
      dataInitialized: true,
    });
  },
};

/** 清理前端草稿标记（_key/_isNew/_editing/_dirty/_deleted），新行剔除 id */
function cleanSub<T extends { id?: string }>(rows?: Record<string, unknown>[]): T[] {
  if (!Array.isArray(rows)) return [];
  return rows
    .filter((r) => !r._deleted)
    .map((r) => {
      const { _key, _isNew, _editing, _dirty, _deleted, ...rest } = r;
      const o: Record<string, unknown> = { ...rest };
      if (_isNew) delete o.id; // 新行不带主键
      return o as unknown as T;
    });
}

/* ==================== 039 一期设计器：MetaDTO 双向转换 + DDL 生成 ==================== */

/**
 * 一主三子 → MetaDTO（照抄后端 `JulyMetadataDesignerUseCase#toMetaDto`）。
 * 与 CRUD 口径的差别：三子在**顶层**（不嵌 metaData）；子表键名为短名（code / name / length / notNull）。
 */
function toMetaDto(m: JulyMetadataVo011): JulyMetadataMetaDto011 {
  return {
    metaData: {
      objectName: m.objectName,
      objectType: m.objectType,
      description: m.description ?? null,
      businessField: m.businessField ?? null,
      packageName: m.packageName ?? null,
      routerPath: m.routerPath ?? null,
      remark: m.remark ?? null,
      sortOrder: m.sortOrder,
      // 与后端一致地硬编码（发布态列已建但 UseCase 未读取）
      publishStatus: 'draft',
      version: '',
    },
    fieldData: (m.fields || []).map((f) => ({
      code: f.fieldCode,
      name: f.fieldName,
      fieldType: f.fieldType,
      length: f.fieldLength ?? 0,
      notNull: Boolean(f.requiredField),
      defaultValue: f.defaultValue ?? null,
      sort: f.sortOrder,
    })),
    displayData: (m.displays || []).map((d) => ({
      code: d.displayCode,
      name: d.displayName,
      align: d.align || 'left',
      width: d.width ?? null,
      componentType: d.componentType || 'input',
      displayType: d.displayType || 'all',
      param011: d.param011 ?? null,
      sort: d.sortOrder,
    })),
    serviceData: (m.services || []).map((s) => ({
      code: s.serviceCode,
      name: s.serviceName,
      description: s.serviceDescription ?? '',
      objectType: s.objectType,
      paramType: s.paramType,
      serviceContent: s.serviceContent ?? null,
      enabled: Boolean(s.enabled),
      sort: s.sortOrder,
    })),
  };
}

/** MetaDTO fieldData[] → 字段子表（照抄后端 `toFields` 的取值口径） */
function metaFields(rows?: unknown): JulyMetadataFieldVo011[] {
  if (!Array.isArray(rows)) return [];
  return (rows as Record<string, unknown>[]).map((r) => ({
    fieldCode: String(r.code ?? ''),
    fieldName: String(r.name ?? ''),
    fieldType: String(r.fieldType ?? 'string'),
    fieldLength: typeof r.length === 'number' ? r.length : null,
    requiredField: r.notNull === true || String(r.notNull) === 'true',
    defaultValue: r.defaultValue === undefined ? null : (r.defaultValue as string | null),
    sortOrder: typeof r.sort === 'number' ? r.sort : 0,
  }));
}

/** MetaDTO displayData[] → 显示列子表（空值回落与后端一致：align=left / componentType=input / displayType=all） */
function metaDisplays(rows?: unknown): JulyMetadataDisplayVo011[] {
  if (!Array.isArray(rows)) return [];
  return (rows as Record<string, unknown>[]).map((r) => ({
    displayCode: String(r.code ?? ''),
    displayName: String(r.name ?? ''),
    align: String(r.align ?? '') || 'left',
    width: typeof r.width === 'number' ? r.width : null,
    componentType: String(r.componentType ?? '') || 'input',
    displayType: String(r.displayType ?? '') || 'all',
    param011: r.param011 === undefined ? null : (r.param011 as string | null),
    sortOrder: typeof r.sort === 'number' ? r.sort : 0,
  }));
}

/** MetaDTO serviceData[] → 服务子表 */
function metaServices(rows?: unknown): JulyMetadataServiceVo011[] {
  if (!Array.isArray(rows)) return [];
  return (rows as Record<string, unknown>[]).map((r) => ({
    serviceCode: String(r.code ?? ''),
    serviceName: String(r.name ?? ''),
    serviceDescription: String(r.description ?? ''),
    objectType: r.objectType === undefined ? undefined : String(r.objectType),
    paramType: r.paramType === undefined ? undefined : String(r.paramType),
    serviceContent: r.serviceContent === undefined ? null : (r.serviceContent as string | null),
    enabled: r.enabled === true || String(r.enabled) === 'true',
    sortOrder: typeof r.sort === 'number' ? r.sort : 0,
  }));
}

/** 标识符白名单（与后端 `MySqlMetadataDdlGenerator.IDENTIFIER` 一致） */
const DDL_IDENTIFIER = /^[A-Za-z_][A-Za-z0-9_]{0,59}$/;
/** VARCHAR 推断上限（与后端 `MAX_VARCHAR` 一致） */
const DDL_MAX_VARCHAR = 2000;
/** 物理表前缀（与后端 `JulyMetadataDesignerUseCase.TABLE_PREFIX` 一致） */
const DDL_TABLE_PREFIX = 'lc_';
/** FieldType011 全集（后端未知类型直接 400） */
const DDL_TYPES = [
  'id', 'status', 'create_by', 'update_by', 'create_time', 'update_time',
  'string', 'int', 'float', 'date', 'boolean', 'text',
];

/** FieldType011 → MySQL 列类型（照抄后端 `columnType`） */
function ddlColumnType(type: string, length: number): string {
  switch (type) {
    case 'id': return 'VARCHAR(33)';
    case 'status': return 'VARCHAR(3)';
    case 'create_by':
    case 'update_by': return 'VARCHAR(33)';
    case 'create_time':
    case 'update_time':
    case 'date': return 'DATETIME';
    case 'int': return 'INT';
    case 'float': return 'DECIMAL(18,4)';
    case 'boolean': return 'TINYINT(1)';
    case 'text': return 'TEXT';
    default: {
      const len = length > 0 && length <= DDL_MAX_VARCHAR ? length : 255;
      return `VARCHAR(${len})`;
    }
  }
}

/** 标识符严格校验（非法直接抛，与后端 `requireIdentifier` 一致） */
function requireIdentifier(value: string): string {
  const v = (value || '').trim();
  if (!DDL_IDENTIFIER.test(v)) throw new Error(`invalid identifier: ${value}`);
  return v;
}

/** 单引号字面量转义 */
function escapeLiteral(value: string): string {
  return (value || '').replace(/'/g, "''");
}

/**
 * 由元数据生成建表 DDL（**照抄后端 `MySqlMetadataDdlGenerator#generateCreate`**）。
 * mock 与真实接口形态必须逐字一致，否则「预览所见」与「发布执行」会对不上。
 * 规则：表名统一 `lc_` 前缀 + `IF NOT EXISTS`；首个 id 类型字段作主键，无则自动补 `id VARCHAR(33)`；
 * 无字段 / 未知类型 / 非法标识符 → 抛错（handler 转 400）。
 */
function generateDdl(m: JulyMetadataVo011): string {
  const fields = m.fields || [];
  if (!fields.length) throw new Error('metadata has no fields to publish');

  const table = requireIdentifier(DDL_TABLE_PREFIX + m.objectName);
  const lines: string[] = [];
  let primaryKey: string | null = null;

  for (const f of fields) {
    const column = requireIdentifier(f.fieldCode);
    const type = (f.fieldType || '').toLowerCase();
    if (!DDL_TYPES.includes(type)) throw new Error(`unknown field type: ${f.fieldType}`);
    if (type === 'id' && primaryKey === null) primaryKey = column;
    const nullable = f.requiredField ? ' NOT NULL' : '';
    const comment = f.fieldName || f.fieldCode;
    lines.push(
      `  \`${column}\` ${ddlColumnType(type, Number(f.fieldLength) || 0)}${nullable}`
      + ` COMMENT '${escapeLiteral(comment)}'`,
    );
  }

  if (primaryKey === null) {
    primaryKey = 'id';
    lines.unshift("  `id` VARCHAR(33) NOT NULL COMMENT 'primary key'");
  }
  lines.push(`  PRIMARY KEY (\`${primaryKey}\`)`);

  const tableComment = escapeLiteral(m.description || table);
  return `CREATE TABLE IF NOT EXISTS \`${table}\` (\n${lines.join(',\n')}\n)`
    + ` ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='${tableComment}'`;
}

/* ==================== 039 二期：发布态 + 补列 DDL ==================== */

/** 发布态（mock 内存；key = objectName）—— publish 写，importStatus / importDataFromSql 读 */
interface PublishState {
  publishStatus: 'draft' | 'published';
  version: string;
  physicalTable: string;
  dataInitialized: boolean;
  /** 已建列快照（字段编码小写）—— 用于判「无新增列 → ddl = null」 */
  columns: string[];
}

const publishStates = new Map<string, PublishState>();

/**
 * 版本号递增（**照抄后端 `JulyMetadataPublishUseCase#nextVersion`**）：
 * 首次 `0.0.1`，其后 patch 位 +1；最后一段非数字时退化为追加 `.1`。
 */
function nextVersion(latest: string): string {
  if (!latest) return '0.0.1';
  const parts = latest.split('.');
  const patch = Number(parts[parts.length - 1]);
  if (!Number.isFinite(patch)) return `${latest}.1`;
  parts[parts.length - 1] = String(patch + 1);
  return parts.join('.');
}

/**
 * 生成补列 DDL（**照抄后端 `MySqlMetadataDdlGenerator#generateAddColumns`**）。
 * 只产出 `ADD COLUMN`，永不 DROP / MODIFY / RENAME —— 与「发布幂等、绝不删列」的约定一致。
 */
function generateAddColumns(table: string, missing: JulyMetadataFieldVo011[]): string {
  if (!missing.length) throw new Error('no fields to add');
  const t = requireIdentifier(table);
  const clauses = missing.map((f) => {
    const column = requireIdentifier(f.fieldCode);
    const type = (f.fieldType || '').toLowerCase();
    if (!DDL_TYPES.includes(type)) throw new Error(`unknown field type: ${f.fieldType}`);
    const nullable = f.requiredField ? ' NOT NULL' : '';
    const comment = f.fieldName || f.fieldCode;
    return `ADD COLUMN \`${column}\` ${ddlColumnType(type, Number(f.fieldLength) || 0)}${nullable}`
      + ` COMMENT '${escapeLiteral(comment)}'`;
  });
  return `ALTER TABLE \`${t}\`\n  ${clauses.join(',\n  ')}`;
}
