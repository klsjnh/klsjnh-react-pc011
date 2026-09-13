/** Mock：角色（julyRole） */
import { ok, delay, pageResult, type Handler } from './common';
import type { JulyRoleVo011 } from '@/types/system011';

/** 与真实后端一致：仅一个内置角色 admin */
export const mockRoles: JulyRoleVo011[] = [
  { id: '9b1c1b8c9b8e444ea53de7c0f9bf821e', roleCode: 'admin', roleName: '超级管理员', isBuiltin: '1', remark: '内置', status: '1', createTime: '2026-09-12T22:29:43', updateTime: '2026-09-13T09:50:29' },
];

/** 附加角色（仅前端演示用，不影响与真实后端的一致性；如需完全对齐可清空） */
export const mockExtraRoles: JulyRoleVo011[] = [
  { id: 'role-demo-manager', roleCode: 'manager', roleName: '部门经理', isBuiltin: '0', remark: '管理部门内用户', status: '1', createTime: '2026-02-15 10:00:00' },
  { id: 'role-demo-editor', roleCode: 'editor', roleName: '编辑人员', isBuiltin: '0', remark: '负责内容编辑与发布', status: '1', createTime: '2026-03-01 10:00:00' },
  { id: 'role-demo-viewer', roleCode: 'viewer', roleName: '只读用户', isBuiltin: '0', remark: '仅可查看数据', status: '1', createTime: '2026-04-10 10:00:00' },
];

/** 前端专用：角色 → 权限编码（mock 内置；真实后端经 julyRole/v1/updatePermission 维护）
 * 采用与后端菜单 permissionCode 一致的编码，使权限勾选树与菜单树对齐 */
export const mockRolePermissions: Record<string, string[]> = {
  admin: ['system:menu:list', 'organization:view', 'system:user:list', 'system:role:list', 'scheduler:view', 'datasource:view', 'storage:view', 'audit:login:view'],
  manager: ['system:user:list', 'organization:view', 'audit:login:view'],
  editor: ['system:user:list'],
  viewer: [],
};

export const handlers: Record<string, Handler> = {
  // ===== 角色分页 =====
  '/julyRole/v1/selectListByPage': async (body) => {
    await delay(350);
    let rows = [...mockRoles, ...mockExtraRoles];
    const kw = (body?.keyword || '').trim().toLowerCase();
    if (kw) rows = rows.filter((r) => r.roleCode.toLowerCase().includes(kw) || (r.roleName || '').toLowerCase().includes(kw));
    return ok(pageResult(rows, body?.pageIndex || 1, body?.pageSize || 10));
  },
};
