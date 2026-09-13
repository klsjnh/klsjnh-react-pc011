/** Mock：菜单（julyMenu） */
import { ok, delay, pageResult, type Handler } from './common';
import type { JulyMenuVo011 } from '@/types/system011';

/** 与真实后端 selectUserMenuTree 一致：三棵根树（系统管理/业务中心/系统工具） */
export const mockMenus: JulyMenuVo011[] = [
  {
    id: 'menu0000000000000000000000root1', parentId: '', menuCode: 'system', menuName: '系统管理', menuType: '1',
    menuIcon: '⚙️', menuRoute: '/system', permissionCode: null, component: null, sortOrder: 1, status: '1',
    children: [
      { id: 'menu0000000000000000000000000101', parentId: 'menu0000000000000000000000root1', menuCode: 'menu', menuName: '菜单管理', menuType: '2', menuIcon: '📋', menuRoute: '/system011/julyMenu', permissionCode: 'system:menu:list', component: null, sortOrder: 1, status: '1', children: [] },
      { id: 'menu0000000000000000000000000102', parentId: 'menu0000000000000000000000root1', menuCode: 'organization', menuName: '组织管理', menuType: '2', menuIcon: '🏢', menuRoute: '/system011/julyOrganization', permissionCode: 'organization:view', component: null, sortOrder: 2, status: '1', children: [] },
      { id: 'menu0000000000000000000000000103', parentId: 'menu0000000000000000000000root1', menuCode: 'user', menuName: '用户管理', menuType: '2', menuIcon: '👥', menuRoute: '/system011/julyUser', permissionCode: 'system:user:list', component: null, sortOrder: 3, status: '1', children: [] },
      { id: 'menu0000000000000000000000000104', parentId: 'menu0000000000000000000000root1', menuCode: 'permission', menuName: '权限管理', menuType: '2', menuIcon: '🔑', menuRoute: '/system011/julyPermission', permissionCode: 'system:role:list', component: null, sortOrder: 4, status: '1', children: [] },
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

export const handlers: Record<string, Handler> = {
  // ===== 菜单：当前用户菜单树（RBAC） / 全量树 / 分页 =====
  '/julyMenu/v1/selectUserMenuTree': async () => { await delay(300); return ok(structuredClone(mockMenus)); },
  '/julyMenu/v1/selectTree': async () => { await delay(300); return ok(structuredClone(mockMenus)); },
  '/julyMenu/v1/selectListByPage': async (body) => {
    await delay(300);
    const flat: JulyMenuVo011[] = [];
    (function walk(list: JulyMenuVo011[]) { for (const m of list) { flat.push(m); if (m.children) walk(m.children); } })(mockMenus);
    return ok(pageResult(flat, body?.pageIndex || 1, body?.pageSize || 20));
  },
};
