/** Mock：用户（julyUser） */
import { ok, fail, delay, pageResult, type Handler } from '@/mock/system011/common';
import { mockRoles, mockExtraRoles } from '@/mock/system011/julyRole';
import type { JulyUserVo011, JulyUserSessionVo011 } from '@/types/system011';

export const ORG_ROOT = 'org0001root000000000000000001';

/** 与真实后端一致：lisi/zhangsan/klsjnh，id 为 UUID 字符串，可空字段为 null */
export const mockUsers: JulyUserVo011[] = [
  { id: '42996f6ce509409aae527ab777500488', userAccount: 'lisi', userName: '李四', mobile: null, email: null, avatar: null, pkOrg: null, lastLoginTime: null, status: '1', createBy: '8070b9deec124a4bb0913e2ea56023c2', updateBy: '8070b9deec124a4bb0913e2ea56023c2', createTime: '2026-09-13T07:11:38', updateTime: '2026-09-13T07:11:38' },
  { id: '8070b9deec124a4bb0913e2ea56023c2', userAccount: 'zhangsan', userName: '张三', mobile: null, email: null, avatar: 'https://cdn.example.com/avatar/zs.png', pkOrg: ORG_ROOT, lastLoginTime: null, status: '1', createBy: null, updateBy: null, createTime: '2026-09-12T22:29:43', updateTime: '2026-09-13T09:50:29' },
  { id: '19a2c9b330ab46078079e557e732d1ab', userAccount: 'klsjnh', userName: 'klsjnh-改', mobile: null, email: null, avatar: null, pkOrg: null, lastLoginTime: null, status: '1', createBy: null, updateBy: null, createTime: '2026-09-13T09:26:39', updateTime: '2026-09-13T09:50:29' },
];

/** 用户 id → 姓名（供组织负责人 pkUser 解析） */
export const userNameById = new Map<string, string>();
mockUsers.forEach((u) => userNameById.set(u.id, u.userName || u.userAccount));

/** 前端专用：用户→角色编码（后端通过 julyUser/v1/assignRoles 维护，mock 内置） */
export const mockUserRoles: Record<string, string[]> = {
  klsjnh: ['admin'], zhangsan: ['admin'], lisi: ['admin'],
};

/** 前端专用：mock 登录凭据（仅 mock 模式校验；与真实后端密码无关）
 *  ⚠️ 必须与 mockUsers 的 userAccount 集合一一对应，否则密码登录会找不到用户 */
export const mockCredentials: Record<string, string> = {
  klsjnh: 'klsjnh', zhangsan: 'zhangsan', lisi: 'lisi',
};

export const handlers: Record<string, Handler> = {
  // ===== 登录（两端点都返回 JulyUserSessionVo011） =====
  '/julyUser/v1/login': async (body) => {
    await delay(400);
    const acct: string = (body?.userAccount || '').trim();
    const pwd: string = body?.password || '';
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

  // ===== 用户分页（userName 姓名精确 / userAccount 账号模糊，与真实后端一致） =====
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

  // ===== 逻辑删除单个（body 为 { id }） =====
  '/julyUser/v1/logicDelete': async (body) => {
    await delay(350);
    const id = (body as { id?: string })?.id;
    const i = mockUsers.findIndex((x) => x.id === id);
    if (i < 0) return fail(`record not found, id=${id}`, 404);
    const [removed] = mockUsers.splice(i, 1);
    userNameById.delete(removed.id);
    return ok({ id: removed.id });
  },

  // ===== 批量逻辑删除（body 为 { ids: [...] }） =====
  '/julyUser/v1/logicDeleteBatch': async (body) => {
    await delay(350);
    const ids: string[] = Array.isArray((body as { ids?: string[] })?.ids) ? (body as { ids: string[] }).ids : [];
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

  // ===== 本人修改密码（验旧密；mock 按 userAccount 匹配，兼容 id） =====
  '/julyUser/v1/changePassword': async (body) => {
    await delay(300);
    const u = mockUsers.find((x) => x.userAccount === body?.userAccount)
      || mockUsers.find((x) => x.id === body?.id);
    if (!u) return fail('record not found', 404);
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
};
