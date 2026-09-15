/** Mock：菜单（julyMenu） */
import { ok, delay, pageResult, type Handler } from '@/mock/system011/common';
import type { JulyMenuVo011 } from '@/types/system011';

/** 与真实后端 selectUserMenuTree 一致：单根「菜单」节点，下挂系统管理/业务中心/系统工具/数据宝宝/个人中心 */
export const mockMenus: JulyMenuVo011[] = [
  {
    id: 'menu0000000000000000000000root',
    parentId: '',
    menuCode: 'root',
    menuName: '菜单',
    menuType: '1',
    menuIcon: 'MenuOutlined',
    menuRoute: '',
    permissionCode: null,
    component: null,
    sortOrder: 0,
    status: '1',
    children: [
      {
        id: 'menu0000000000000000000000root1', parentId: 'menu0000000000000000000000root', menuCode: 'system', menuName: '系统管理', menuType: '1',
        menuIcon: 'SettingOutlined', menuRoute: '/system', permissionCode: null, component: null, sortOrder: 1, status: '1',
        children: [
          { id: 'menu0000000000000000000000000101', parentId: 'menu0000000000000000000000root1', menuCode: 'menu', menuName: '菜单管理', menuType: '2', menuIcon: 'MenuOutlined', menuRoute: '/system011/julyMenu', permissionCode: 'system:menu:list', component: null, sortOrder: 1, status: '1', children: [] },
          { id: 'menu0000000000000000000000000102', parentId: 'menu0000000000000000000000root1', menuCode: 'organization', menuName: '组织管理', menuType: '2', menuIcon: 'ApartmentOutlined', menuRoute: '/system011/julyOrganization', permissionCode: 'organization:view', component: null, sortOrder: 2, status: '1', children: [] },
          { id: 'menu0000000000000000000000000103', parentId: 'menu0000000000000000000000root1', menuCode: 'user', menuName: '用户管理', menuType: '2', menuIcon: 'TeamOutlined', menuRoute: '/system011/julyUser', permissionCode: 'system:user:list', component: null, sortOrder: 3, status: '1', children: [] },
          { id: 'menu0000000000000000000000000104', parentId: 'menu0000000000000000000000root1', menuCode: 'permission', menuName: '权限管理', menuType: '2', menuIcon: 'KeyOutlined', menuRoute: '/system011/julyPermission', permissionCode: 'system:role:list', component: null, sortOrder: 4, status: '1', children: [] },
        ],
      },
      {
        id: 'menu0000000000000000000000root2', parentId: 'menu0000000000000000000000root', menuCode: 'business', menuName: '业务中心', menuType: '1',
        menuIcon: 'AppstoreOutlined', menuRoute: '/business', permissionCode: null, component: null, sortOrder: 2, status: '1',
        children: [
          { id: 'menu0000000000000000000000000201', parentId: 'menu0000000000000000000000root2', menuCode: 'config', menuName: '配置管理', menuType: '2', menuIcon: 'SettingOutlined', menuRoute: '/system011/julyConfig', permissionCode: null, component: null, sortOrder: 1, status: '1', children: [] },
          { id: 'menu0000000000000000000000000202', parentId: 'menu0000000000000000000000root2', menuCode: 'scheduler', menuName: '定时任务', menuType: '2', menuIcon: 'ClockCircleOutlined', menuRoute: '/system011/julyScheduler', permissionCode: 'scheduler:view', component: null, sortOrder: 2, status: '1', children: [] },
          { id: 'menu0000000000000000000000000203', parentId: 'menu0000000000000000000000root2', menuCode: 'dictionary', menuName: '字典管理', menuType: '2', menuIcon: 'BookOutlined', menuRoute: '/system011/julyDictionary', permissionCode: 'dictionary:view', component: null, sortOrder: 3, status: '1', children: [] },
        ],
      },
      {
        id: 'menu0000000000000000000000rootDataservice', parentId: 'menu0000000000000000000000root', menuCode: 'dataservice', menuName: '数据管理', menuType: '1',
        menuIcon: 'DatabaseOutlined', menuRoute: '/dataService011', permissionCode: null, component: null, sortOrder: 3, status: '1',
        children: [
          { id: 'menu0000000000000000000000000610', parentId: 'menu0000000000000000000000rootDataservice', menuCode: 'datasource', menuName: '数据源', menuType: '2', menuIcon: 'DatabaseOutlined', menuRoute: '/dataService011/julyDatasource', permissionCode: 'datasource:view', component: null, sortOrder: 1, status: '1', children: [] },
        ],
      },
      {
        id: 'menu0000000000000000000000root3', parentId: 'menu0000000000000000000000root', menuCode: 'tools', menuName: '系统工具', menuType: '1',
        menuIcon: 'ToolOutlined', menuRoute: '/tools', permissionCode: null, component: null, sortOrder: 3, status: '1',
        children: [
          { id: 'menu0000000000000000000000000301', parentId: 'menu0000000000000000000000root3', menuCode: 'audit', menuName: '审计日志', menuType: '2', menuIcon: 'FileSearchOutlined', menuRoute: '/audit', permissionCode: 'audit:login:view', component: null, sortOrder: 1, status: '1', children: [] },
          { id: 'menu0000000000000000000000000302', parentId: 'menu0000000000000000000000root3', menuCode: 'settings', menuName: '系统设置', menuType: '2', menuIcon: 'SettingOutlined', menuRoute: '/settings', permissionCode: null, component: null, sortOrder: 2, status: '1', children: [] },
        ],
      },
      {
        id: 'menu0000000000000000000000root4', parentId: 'menu0000000000000000000000root', menuCode: 'dataBaby', menuName: '数据宝宝', menuType: '1',
        menuIcon: 'SmileOutlined', menuRoute: '/data-baby', permissionCode: null, component: null, sortOrder: 4, status: '1',
        children: [
          { id: 'menu0000000000000000000000000401', parentId: 'menu0000000000000000000000root4', menuCode: 'dataOverview', menuName: '数据概览', menuType: '2', menuIcon: 'BarChartOutlined', menuRoute: '/data-baby/overview', permissionCode: null, component: null, sortOrder: 1, status: '1', children: [] },
          { id: 'menu0000000000000000000000000402', parentId: 'menu0000000000000000000000root4', menuCode: 'dataQuery', menuName: '数据查询', menuType: '2', menuIcon: 'SearchOutlined', menuRoute: '/data-baby/query', permissionCode: null, component: null, sortOrder: 2, status: '1', children: [] },
        ],
      },
      {
        id: 'menu0000000000000000000000root5', parentId: 'menu0000000000000000000000root', menuCode: 'personal', menuName: '个人中心', menuType: '1',
        menuIcon: 'UserOutlined', menuRoute: '/personal', permissionCode: null, component: null, sortOrder: 5, status: '1',
        children: [
          { id: 'menu0000000000000000000000000501', parentId: 'menu0000000000000000000000root5', menuCode: 'myProfile', menuName: '我的资料', menuType: '2', menuIcon: 'FormOutlined', menuRoute: '/personal/profile', permissionCode: null, component: null, sortOrder: 1, status: '1', children: [] },
          { id: 'menu0000000000000000000000000502', parentId: 'menu0000000000000000000000root5', menuCode: 'mySettings', menuName: '偏好设置', menuType: '2', menuIcon: 'SettingOutlined', menuRoute: '/personal/settings', permissionCode: null, component: null, sortOrder: 2, status: '1', children: [] },
        ],
      },
    ],
  },
];

export const handlers: Record<string, Handler> = {
  // ===== 菜单：当前用户菜单树（RBAC） / 全量树 / 分页 =====
  // 注意：mock 路径必须与 actions.ts 中的路径完全一致（相对路径，不带 /klsjnh/system011 前缀）
  '/julyMenu/v1/getUserMenuTree': async () => { await delay(300); return ok(structuredClone(mockMenus)); },
  '/julyMenu/v1/getTree': async () => { await delay(300); return ok(structuredClone(mockMenus)); },
  '/julyMenu/v1/selectListByPage': async (body) => {
    await delay(300);
    const flat: JulyMenuVo011[] = [];
    (function walk(list: JulyMenuVo011[]) { for (const m of list) { flat.push(m); if (m.children) walk(m.children); } })(mockMenus);
    return ok(pageResult(flat, body?.pageIndex || 1, body?.pageSize || 20));
  },
};
