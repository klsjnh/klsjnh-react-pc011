/**
 * Mock：元数据（lowcode011 / julyMetadata）—— 一主三子。
 * 内存态存主表 + fields + displays + services；insert/update 整体替换三子。
 */
import { ok, fail, delay, pageResult, type Handler } from '@/mock/system011/common';
import type {
  JulyMetadataVo011, JulyMetadataFieldVo011, JulyMetadataDisplayVo011, JulyMetadataServiceVo011,
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
      createBy: 'mock', createTime: new Date().toISOString().slice(0, 19),
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
    item.updateTime = new Date().toISOString().slice(0, 19);
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
