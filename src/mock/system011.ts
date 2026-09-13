/**
 * 统一 Mock 后端（system011）
 * 设计目标：让 mock 模式成为真实后端的「离线镜像」——
 *  1) fixture 字段名 / 结构与 docs/swagger-api-docs.json 完全一致（JulyXxxVo011）；
 *  2) 响应统一包六字段信封 { statusCode, message, errorMessage, timestamp, traceId, data }；
 *  3) 以真实 action 路径（/klsjnh/system011/{julyXxx}/v1/{动作}）为 key 注册 handler；
 *  4) 经 src/api/request.ts 的 mock 路由分发，与 API 模式共用同一套解包逻辑与类型。
 *
 * 因此：store / 页面只需调用 services/system011 或 api.post(action)，
 * mock 与 api 两种模式下拿到的数据结构完全相同（仅来源不同）。
 */
import type {
  JulyUserVo011, JulyRoleVo011, JulyMenuVo011, JulyOrganizationVo011,
  JulyUserSessionVo011, PageResult011, JulyUserAuditVo011,
} from '../types/system011';

/** 六字段响应信封（与后端 Response011<T> 一致） */
export interface MockEnvelope<T> {
  statusCode: number;
  message: string;
  errorMessage: string;
  timestamp: number;
  traceId: string;
  data: T;
}

function ok<T>(data: T): MockEnvelope<T> {
  return {
    statusCode: 200,
    message: 'success',
    errorMessage: '',
    timestamp: Date.now(),
    traceId: 'mock-' + Math.random().toString(36).slice(2, 12),
    data,
  };
}

function fail(message: string, statusCode = 401): MockEnvelope<null> {
  return {
    statusCode,
    message: 'error',
    errorMessage: message,
    timestamp: Date.now(),
    traceId: 'mock-' + Math.random().toString(36).slice(2, 12),
    data: null,
  };
}

function delay(ms = 500): Promise<void> {
  return new Promise((r) => setTimeout(r, ms + Math.random() * 300));
}

// ==================== 组织（JulyOrganizationVo011） ====================

/** 与真实后端一致：单根组织「华信集团」，id 为 UUID 风格字符串，pkUser/memberCount 可空 */
const mockOrgs: JulyOrganizationVo011[] = [
  {
    id: 'org0001root000000000000000001', parentId: '', orgCode: 'HX', orgName: '华信集团',
    pkUser: null, orgLevel: 1, sortOrder: 9999, status: '1', memberCount: null,
    children: [], createTime: '2026-09-12T23:20:32', updateTime: '2026-09-13T11:36:07',
  },
];

const orgNameById = new Map<string, string>();
(function indexOrgs(list: JulyOrganizationVo011[]) {
  for (const o of list) { orgNameById.set(o.id, o.orgName); if (o.children) indexOrgs(o.children); }
})(mockOrgs);

// ==================== 角色（JulyRoleVo011） ====================

/** 与真实后端一致：仅一个内置角色 admin */
const mockRoles: JulyRoleVo011[] = [
  { id: '9b1c1b8c9b8e444ea53de7c0f9bf821e', roleCode: 'admin', roleName: '超级管理员', isBuiltin: '1', remark: '内置', status: '1', createTime: '2026-09-12T22:29:43', updateTime: '2026-09-13T09:50:29' },
];

/** 附加角色（仅前端演示用，不影响与真实后端的一致性；如需完全对齐可清空） */
const mockExtraRoles: JulyRoleVo011[] = [
  { id: 'role-demo-manager', roleCode: 'manager', roleName: '部门经理', isBuiltin: '0', remark: '管理部门内用户', status: '1', createTime: '2026-02-15 10:00:00' },
  { id: 'role-demo-editor', roleCode: 'editor', roleName: '编辑人员', isBuiltin: '0', remark: '负责内容编辑与发布', status: '1', createTime: '2026-03-01 10:00:00' },
  { id: 'role-demo-viewer', roleCode: 'viewer', roleName: '只读用户', isBuiltin: '0', remark: '仅可查看数据', status: '1', createTime: '2026-04-10 10:00:00' },
];

// ==================== 用户（JulyUserVo011） ====================

const ORG_ROOT = 'org0001root000000000000000001';

/** 与真实后端一致：lisi/zhangsan/klsjnh，id 为 UUID 字符串，可空字段为 null */
const mockUsers: JulyUserVo011[] = [
  { id: '42996f6ce509409aae527ab777500488', userAccount: 'lisi', userName: '李四', mobile: null, email: null, avatar: null, pkOrg: null, lastLoginTime: null, status: '1', createBy: '8070b9deec124a4bb0913e2ea56023c2', updateBy: '8070b9deec124a4bb0913e2ea56023c2', createTime: '2026-09-13T07:11:38', updateTime: '2026-09-13T07:11:38' },
  { id: '8070b9deec124a4bb0913e2ea56023c2', userAccount: 'zhangsan', userName: '张三', mobile: null, email: null, avatar: 'https://cdn.example.com/avatar/zs.png', pkOrg: ORG_ROOT, lastLoginTime: null, status: '1', createBy: null, updateBy: null, createTime: '2026-09-12T22:29:43', updateTime: '2026-09-13T09:50:29' },
  { id: '19a2c9b330ab46078079e557e732d1ab', userAccount: 'klsjnh', userName: 'klsjnh-改', mobile: null, email: null, avatar: null, pkOrg: null, lastLoginTime: null, status: '1', createBy: null, updateBy: null, createTime: '2026-09-13T09:26:39', updateTime: '2026-09-13T09:50:29' },
];

/** 用户 id → 姓名（供组织负责人 pkUser 解析） */
const userNameById = new Map<string, string>();
mockUsers.forEach((u) => userNameById.set(u.id, u.userName || u.userAccount));

/** 前端专用：用户→角色编码（后端通过 julyUser/v1/assignRoles 维护，mock 内置） */
const mockUserRoles: Record<string, string[]> = {
  klsjnh: ['admin'], zhangsan: ['admin'], lisi: ['admin'],
};

/** 前端专用：mock 登录凭据（仅 mock 模式校验；与真实后端密码无关）
 *  ⚠️ 必须与 mockUsers 的 userAccount 集合一一对应，否则密码登录会找不到用户 */
const mockCredentials: Record<string, string> = {
  klsjnh: 'klsjnh', zhangsan: 'zhangsan', lisi: 'lisi',
};

/** 前端专用：角色 → 权限编码（mock 内置；真实后端经 julyRole/v1/updatePermission 维护）
 * 采用与后端菜单 permissionCode 一致的编码，使权限勾选树与菜单树对齐 */
const mockRolePermissions: Record<string, string[]> = {
  admin: ['system:menu:list', 'organization:view', 'system:user:list', 'system:role:list', 'scheduler:view', 'datasource:view', 'storage:view', 'audit:login:view'],
  manager: ['system:user:list', 'organization:view', 'audit:login:view'],
  editor: ['system:user:list'],
  viewer: [],
};

// ==================== 通知（JulyNotificationVo011，mock 内置） ====================

const mockNotifications = [
  { id: 1, title: '系统更新通知', content: '系统将于今晚 22:00-22:30 进行维护升级，升级期间可能无法正常访问。', type: 'system', read: false, createTime: '2026-09-12 09:30:00' },
  { id: 2, title: '新用户注册审核', content: '用户「klsjnh」已完成注册申请，请前往用户管理页面进行审核。', type: 'user', read: false, createTime: '2026-09-12 09:25:00' },
  { id: 3, title: '订单支付成功', content: '订单 #20260912001 已支付成功，金额 ¥299.00。', type: 'order', read: true, createTime: '2026-09-12 09:00:00' },
  { id: 4, title: '权限变更提醒', content: '您的角色权限已被修改。当前角色：部门经理。', type: 'system', read: true, createTime: '2026-09-12 08:00:00' },
  { id: 5, title: '数据备份完成', content: '系统数据已于 2026-09-12 06:00 自动备份完成。', type: 'system', read: true, createTime: '2026-09-12 06:00:00' },
  { id: 6, title: '安全警告', content: '检测到异常登录尝试，如非本人操作请立即修改密码。', type: 'system', read: false, createTime: '2026-09-11 14:00:00' },
];

// ==================== 审计日志（JulyUserAuditVo011，mock 内置） ====================

/** 与真实后端同形：auditType 取 LOGIN / LOGIN_FAILED / LOGOUT / CHANGE_PASSWORD / EXPORT */
const mockAudits: JulyUserAuditVo011[] = [
  { id: 'aud0000000000000000000000000001', pkMt: '19a2c9b330ab46078079e557e732d1ab', userAccount: 'klsjnh', auditType: 'LOGIN', objectCode: 'july_user', auditContent: 'passwordless login', auditIp: '192.168.3.30', createTime: '2026-09-13T15:43:16' },
  { id: 'aud0000000000000000000000000002', pkMt: null, userAccount: 'klsjnh', auditType: 'LOGIN_FAILED', objectCode: 'july_user', auditContent: 'wrong account or password', auditIp: '192.168.3.30', createTime: '2026-09-13T15:42:48' },
  { id: 'aud0000000000000000000000000003', pkMt: '19a2c9b330ab46078079e557e732d1ab', userAccount: 'klsjnh', auditType: 'LOGOUT', objectCode: 'july_user', auditContent: 'logout', auditIp: '192.168.3.30', createTime: '2026-09-13T15:30:49' },
  { id: 'aud0000000000000000000000000004', pkMt: '8070b9deec124a4bb0913e2ea56023c2', userAccount: 'zhangsan', auditType: 'LOGIN', objectCode: 'july_user', auditContent: 'password login', auditIp: '192.168.3.31', createTime: '2026-09-13T07:14:29' },
  { id: 'aud0000000000000000000000000005', pkMt: '8070b9deec124a4bb0913e2ea56023c2', userAccount: 'zhangsan', auditType: 'CHANGE_PASSWORD', objectCode: 'july_user', auditContent: 'change password', auditIp: '192.168.3.31', createTime: '2026-09-13T07:10:02' },
  { id: 'aud0000000000000000000000000006', pkMt: '8070b9deec124a4bb0913e2ea56023c2', userAccount: 'zhangsan', auditType: 'EXPORT', objectCode: 'julyUser', auditContent: 'export user list', auditIp: '192.168.3.31', createTime: '2026-09-12T22:29:43' },
];

// ==================== 菜单（JulyMenuVo011，树） ====================

/** 与真实后端 selectUserMenuTree 完全一致：三棵根树（系统管理/业务中心/系统工具），
 *  menuCode 为短名，menuRoute 为短路径，permissionCode 才是授权码（目录节点为 null）。
 *  取自 2026-09-13 对 http://192.168.3.160:11610 的实测返回。 */
const mockMenus: JulyMenuVo011[] = [
  {
    id: 'menu0000000000000000000000root1', parentId: '', menuCode: 'system', menuName: '系统管理', menuType: '1',
    menuIcon: '⚙️', menuRoute: '/system', permissionCode: null, component: null, sortOrder: 1, status: '1',
    children: [
      { id: 'menu0000000000000000000000000101', parentId: 'menu0000000000000000000000root1', menuCode: 'menu', menuName: '菜单管理', menuType: '2', menuIcon: '📋', menuRoute: '/menu', permissionCode: 'system:menu:list', component: null, sortOrder: 1, status: '1', children: [] },
      { id: 'menu0000000000000000000000000102', parentId: 'menu0000000000000000000000root1', menuCode: 'organization', menuName: '组织管理', menuType: '2', menuIcon: '🏢', menuRoute: '/organization', permissionCode: 'organization:view', component: null, sortOrder: 2, status: '1', children: [] },
      { id: 'menu0000000000000000000000000103', parentId: 'menu0000000000000000000000root1', menuCode: 'user', menuName: '用户管理', menuType: '2', menuIcon: '👥', menuRoute: '/user', permissionCode: 'system:user:list', component: null, sortOrder: 3, status: '1', children: [] },
      { id: 'menu0000000000000000000000000104', parentId: 'menu0000000000000000000000root1', menuCode: 'permission', menuName: '权限管理', menuType: '2', menuIcon: '🔑', menuRoute: '/permission', permissionCode: 'system:role:list', component: null, sortOrder: 4, status: '1', children: [] },
    ],
  },
  {
    id: 'menu0000000000000000000000root2', parentId: '', menuCode: 'business', menuName: '业务中心', menuType: '1',
    menuIcon: '💼', menuRoute: '/business', permissionCode: null, component: null, sortOrder: 2, status: '1',
    children: [
      { id: 'menu0000000000000000000000000201', parentId: 'menu0000000000000000000000root2', menuCode: 'config', menuName: '配置管理', menuType: '2', menuIcon: '⚙️', menuRoute: '/business/config', permissionCode: null, component: null, sortOrder: 1, status: '1', children: [] },
      { id: 'menu0000000000000000000000000202', parentId: 'menu0000000000000000000000root2', menuCode: 'scheduler', menuName: '定时任务', menuType: '2', menuIcon: '⏰', menuRoute: '/business/scheduler', permissionCode: 'scheduler:view', component: null, sortOrder: 2, status: '1', children: [] },
      { id: 'menu0000000000000000000000000203', parentId: 'menu0000000000000000000000root2', menuCode: 'datasource', menuName: '数据源', menuType: '2', menuIcon: '🗄', menuRoute: '/business/datasource', permissionCode: 'datasource:view', component: null, sortOrder: 3, status: '1', children: [] },
      { id: 'menu0000000000000000000000000204', parentId: 'menu0000000000000000000000root2', menuCode: 'storage', menuName: '存储中心', menuType: '2', menuIcon: '💾', menuRoute: '/business/storage', permissionCode: 'storage:view', component: null, sortOrder: 4, status: '1', children: [] },
    ],
  },
  {
    id: 'menu0000000000000000000000root3', parentId: '', menuCode: 'tools', menuName: '系统工具', menuType: '1',
    menuIcon: '🛠', menuRoute: '/tools', permissionCode: null, component: null, sortOrder: 3, status: '1',
    children: [
      { id: 'menu0000000000000000000000000301', parentId: 'menu0000000000000000000000root3', menuCode: 'audit', menuName: '审计日志', menuType: '2', menuIcon: '📝', menuRoute: '/audit', permissionCode: 'audit:login:view', component: null, sortOrder: 1, status: '1', children: [] },
      { id: 'menu0000000000000000000000000302', parentId: 'menu0000000000000000000000root3', menuCode: 'settings', menuName: '系统设置', menuType: '2', menuIcon: '⚙️', menuRoute: '/settings', permissionCode: null, component: null, sortOrder: 2, status: '1', children: [] },
    ],
  },
];

// ==================== handler 注册表 ====================

type Handler = (body: any) => Promise<MockEnvelope<any>>;

function pageResult<T>(rows: T[], pageIndex: number, pageSize: number): PageResult011<T> {
  const total = rows.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const start = (pageIndex - 1) * pageSize;
  return { pageIndex, pageSize, total, totalPages, rows: rows.slice(start, start + pageSize) };
}

const handlers: Record<string, Handler> = {
  // ===== 登录（两端点都返回 JulyUserSessionVo011） =====
  '/julyUser/v1/login': async (body) => {
    await delay(400);
    const acct: string = (body?.userAccount || '').trim();
    const pwd: string = body?.password || '';
    // 先查用户，再校验密码；禁止对 undefined 解引用
    const u = mockUsers.find((x) => x.userAccount === acct);
    if (!u) return fail('用户名或密码错误');
    if (mockCredentials[acct] === undefined || mockCredentials[acct] !== pwd) return fail('用户名或密码错误');
    return ok<JulyUserSessionVo011>({ token: `mock-${acct}-${Date.now()}`, userAccount: u.userAccount, userName: u.userName, roles: mockUserRoles[acct] || ['viewer'] });
  },
  '/julyUser/v1/loginByUserName': async (body) => {
    await delay(300);
    const acct: string = (body?.userAccount || '').trim();
    const u = mockUsers.find((x) => x.userAccount === acct);
    if (!u) return fail(`用户不存在：${acct}`);
    return ok<JulyUserSessionVo011>({ token: `mock-${acct}-${Date.now()}`, userAccount: u.userAccount, userName: u.userName, roles: mockUserRoles[acct] || ['viewer'] });
  },

  // ===== 用户分页（后端 userName 为姓名精确匹配，userAccount 为账号模糊，与真实后端一致） =====
  '/julyUser/v1/selectListByPage': async (body) => {
    await delay(350);
    let rows = [...mockUsers];
    const acct = (body?.userAccount || '').trim().toLowerCase();
    const name = (body?.userName || '').trim().toLowerCase();
    if (acct) rows = rows.filter((u) => u.userAccount.toLowerCase().includes(acct));
    if (name) rows = rows.filter((u) => (u.userName || '').toLowerCase() === name);
    return ok(pageResult(rows, body?.pageIndex || 1, body?.pageSize || 10));
  },

  // ===== 用户详情 =====
  '/julyUser/v1/getById': async (body) => {
    await delay(200);
    const u = mockUsers.find((x) => x.id === body?.id);
    if (!u) return fail(`record not found, id=${body?.id}`, 404);
    return ok(structuredClone(u));
  },

  // ===== 新增用户（userAccount 唯一；password 必填） =====
  '/julyUser/v1/insert': async (body) => {
    await delay(400);
    const acct = (body?.userAccount || '').trim();
    const name = (body?.userName || '').trim();
    if (!acct) return fail('insert: userAccount is required', 400);
    if (!name) return fail('insert: userName is required', 400);
    if (!body?.password) return fail('insert: password is required', 400);
    if (mockUsers.some((u) => u.userAccount === acct)) return fail(`insert: userAccount already exists, ${acct}`, 400);
    const now = new Date().toISOString().slice(0, 19);
    const nu: JulyUserVo011 = {
      id: 'mockuser' + Math.random().toString(36).slice(2, 10).padEnd(8, '0') + '00000000',
      userAccount: acct, userName: name,
      mobile: body.mobile || null, email: body.email || null, avatar: body.avatar || null,
      pkOrg: body.pkOrg || null, lastLoginTime: null, status: '1',
      createBy: null, updateBy: null, createTime: now, updateTime: now,
    };
    mockUsers.unshift(nu);
    userNameById.set(nu.id, nu.userName || nu.userAccount);
    if (body.password) mockCredentials[acct] = body.password;
    return ok({ id: nu.id });
  },

  // ===== 修改用户资料（不含账号与密码） =====
  '/julyUser/v1/update': async (body) => {
    await delay(350);
    const u = mockUsers.find((x) => x.id === body?.id);
    if (!u) return fail(`record not found, id=${body?.id}`, 404);
    if (!(body?.userName || '').trim()) return fail('update: userName is required', 400);
    u.userName = body.userName.trim();
    if (body.mobile !== undefined) u.mobile = body.mobile || null;
    if (body.email !== undefined) u.email = body.email || null;
    if (body.avatar !== undefined) u.avatar = body.avatar || null;
    if (body.pkOrg !== undefined) u.pkOrg = body.pkOrg || null;
    u.updateTime = new Date().toISOString().slice(0, 19);
    userNameById.set(u.id, u.userName || u.userAccount);
    return ok({ id: u.id });
  },

  // ===== 批量逻辑删除（body 直接为 id 数组） =====
  '/julyUser/v1/logicDelete': async (body) => {
    await delay(350);
    const ids: string[] = Array.isArray(body) ? body : [];
    const errors: { id: string; message: string }[] = [];
    let success = 0;
    for (const id of ids) {
      const i = mockUsers.findIndex((x) => x.id === id);
      if (i < 0) { errors.push({ id, message: 'record not found' }); continue; }
      const [removed] = mockUsers.splice(i, 1);
      userNameById.delete(removed.id);
      success++;
    }
    return ok({ total: ids.length, success, failed: errors.length, errors });
  },

  // ===== 重置密码（管理员动作） =====
  '/julyUser/v1/resetPassword': async (body) => {
    await delay(300);
    const u = mockUsers.find((x) => x.id === body?.id);
    if (!u) return fail(`record not found, id=${body?.id}`, 404);
    if (!body?.password) return fail('resetPassword: password is required', 400);
    mockCredentials[u.userAccount] = body.password;
    return ok({ id: u.id });
  },

  // ===== 本人修改密码（验旧密） =====
  '/julyUser/v1/changePassword': async (body) => {
    await delay(300);
    const u = mockUsers.find((x) => x.id === body?.id);
    if (!u) return fail(`record not found, id=${body?.id}`, 404);
    if (mockCredentials[u.userAccount] !== body?.oldPassword) return fail('old password is incorrect', 400);
    mockCredentials[u.userAccount] = body?.newPassword || '';
    return ok({ id: u.id });
  },

  // ===== 分配角色（整存替换） =====
  '/julyUser/v1/assignRoles': async (body) => {
    await delay(300);
    const u = mockUsers.find((x) => x.id === body?.id);
    if (!u) return fail(`record not found, id=${body?.id}`, 404);
    const codes = (Array.isArray(body?.pkRoles) ? body.pkRoles : [])
      .map((rid: string) => [...mockRoles, ...mockExtraRoles].find((r) => r.id === rid)?.roleCode)
      .filter((c: string | undefined): c is string => !!c);
    mockUserRoles[u.userAccount] = codes;
    return ok({ id: u.id });
  },

  // ===== 审计日志分页（账号模糊 / 类型精确 / 时间段） =====
  '/julyUserAudit/v1/selectListByPage': async (body) => {
    await delay(350);
    let rows = [...mockAudits];
    const acct = (body?.userAccount || '').trim().toLowerCase();
    if (acct) rows = rows.filter((a) => a.userAccount.toLowerCase().includes(acct));
    if (body?.auditType) rows = rows.filter((a) => a.auditType === body.auditType);
    if (body?.beginTime) rows = rows.filter((a) => a.createTime >= body.beginTime);
    if (body?.endTime) rows = rows.filter((a) => a.createTime <= body.endTime);
    rows.sort((a, b) => (a.createTime < b.createTime ? 1 : -1));
    return ok(pageResult(rows, body?.pageIndex || 1, body?.pageSize || 10));
  },

  // ===== 角色分页 =====
  '/julyRole/v1/selectListByPage': async (body) => {
    await delay(350);
    let rows = [...mockRoles, ...mockExtraRoles];
    const kw = (body?.keyword || '').trim().toLowerCase();
    if (kw) rows = rows.filter((r) => r.roleCode.toLowerCase().includes(kw) || (r.roleName || '').toLowerCase().includes(kw));
    return ok(pageResult(rows, body?.pageIndex || 1, body?.pageSize || 10));
  },

  // ===== 菜单：当前用户菜单树（RBAC） / 全量树 / 分页 =====
  '/julyMenu/v1/selectUserMenuTree': async () => { await delay(300); return ok(structuredClone(mockMenus)); },
  '/julyMenu/v1/selectTree': async () => { await delay(300); return ok(structuredClone(mockMenus)); },
  '/julyMenu/v1/selectListByPage': async (body) => {
    await delay(300);
    const flat: JulyMenuVo011[] = [];
    (function walk(list: JulyMenuVo011[]) { for (const m of list) { flat.push(m); if (m.children) walk(m.children); } })(mockMenus);
    return ok(pageResult(flat, body?.pageIndex || 1, body?.pageSize || 20));
  },

  // ===== 组织：真实后端返回 PageResult011（rows 内为组织树） =====
  '/julyOrganization/v1/selectListByPage': async (body) => {
    await delay(300);
    return ok(pageResult(structuredClone(mockOrgs), body?.pageIndex || 1, body?.pageSize || 10));
  },

  // ===== 通知（独立于 system011 模块，沿用统一信封；menu/role 之外的轻量模块） =====
  '/notification/v1/selectListByPage': async () => { await delay(300); return ok(structuredClone(mockNotifications)); },
  '/notification/v1/read': async (body) => { await delay(150); const n = mockNotifications.find(x => x.id === body?.id); if (n) n.read = true; return ok(null); },
  '/notification/v1/readAll': async () => { await delay(150); mockNotifications.forEach(n => (n.read = true)); return ok(null); },
  '/notification/v1/logicDelete': async (body) => { await delay(150); const i = mockNotifications.findIndex(x => x.id === body?.id); if (i >= 0) mockNotifications.splice(i, 1); return ok(null); },
};

/**
 * 按真实 action 路径返回 mock 响应；无对应 handler 时返回 null（调用方回退到真实请求）。
 */
export function getMockResponse(action: string, body?: any): Promise<MockEnvelope<any>> | null {
  const handler = handlers[action];
  if (!handler) return null;
  return handler(body);
}

/** 仅供 store / 页面做 UI 投影使用的前端关系数据（不属于后端契约） */
export const mockRelations = {
  orgName: (id?: string) => (id ? orgNameById.get(id) || '' : ''),
  userName: (id?: string) => (id ? userNameById.get(id) || '' : ''),
  userRoles: (userAccount: string) => mockUserRoles[userAccount] || [],
  rolePermissions: (roleCode: string) => mockRolePermissions[roleCode] || [],
  roleUserAccounts: (roleCode: string) =>
    Object.entries(mockUserRoles).filter(([, codes]) => codes.includes(roleCode)).map(([acct]) => acct),
};
