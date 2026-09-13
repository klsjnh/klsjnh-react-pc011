/** Mock：通知（/notification/v1/*，独立于 system011 模块） */
import { ok, delay, type Handler } from './common';

export const mockNotifications = [
  { id: 1, title: '系统更新通知', content: '系统将于今晚 22:00-22:30 进行维护升级，升级期间可能无法正常访问。', type: 'system', read: false, createTime: '2026-09-12 09:30:00' },
  { id: 2, title: '新用户注册审核', content: '用户「klsjnh」已完成注册申请，请前往用户管理页面进行审核。', type: 'user', read: false, createTime: '2026-09-12 09:25:00' },
  { id: 3, title: '订单支付成功', content: '订单 #20260912001 已支付成功，金额 ¥299.00。', type: 'order', read: true, createTime: '2026-09-12 09:00:00' },
  { id: 4, title: '权限变更提醒', content: '您的角色权限已被修改。当前角色：部门经理。', type: 'system', read: true, createTime: '2026-09-12 08:00:00' },
  { id: 5, title: '数据备份完成', content: '系统数据已于 2026-09-12 06:00 自动备份完成。', type: 'system', read: true, createTime: '2026-09-12 06:00:00' },
  { id: 6, title: '安全警告', content: '检测到异常登录尝试，如非本人操作请立即修改密码。', type: 'system', read: false, createTime: '2026-09-11 14:00:00' },
];

export const handlers: Record<string, Handler> = {
  '/notification/v1/selectListByPage': async () => { await delay(300); return ok(structuredClone(mockNotifications)); },
  '/notification/v1/read': async (body) => { await delay(150); const n = mockNotifications.find((x) => x.id === body?.id); if (n) n.read = true; return ok(null); },
  '/notification/v1/readAll': async () => { await delay(150); mockNotifications.forEach((n) => (n.read = true)); return ok(null); },
  '/notification/v1/logicDelete': async (body) => { await delay(150); const i = mockNotifications.findIndex((x) => x.id === body?.id); if (i >= 0) mockNotifications.splice(i, 1); return ok(null); },
};
