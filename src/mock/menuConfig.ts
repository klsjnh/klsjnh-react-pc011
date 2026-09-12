/**
 * PC 端菜单配置（侧边栏菜单结构，非移动端 TabBar）
 */

export interface MenuConfig {
  id: number;
  parentId: number;
  name: string;
  path: string;
  icon: string;
  title: string;
  type: 'tab' | 'page' | 'button';
  sort: number;
  visible: boolean;
  children?: MenuConfig[];
}

const initialMenuConfig: MenuConfig[] = [
  {
    id: 1, parentId: 0, name: 'SystemRoot', path: '/system', icon: '⚙️', title: '系统管理', type: 'page', sort: 1, visible: true,
    children: [
      { id: 101, parentId: 1, name: 'Menus', path: '/menus', icon: '📋', title: '菜单管理', type: 'page', sort: 1, visible: true },
      { id: 104, parentId: 1, name: 'Departments', path: '/departments', icon: '🏢', title: '组织管理', type: 'page', sort: 2, visible: true },
      { id: 105, parentId: 1, name: 'Users', path: '/users', icon: '👥', title: '用户管理', type: 'page', sort: 3, visible: true },
      { id: 102, parentId: 1, name: 'Permissions', path: '/permissions', icon: '🔑', title: '权限管理', type: 'page', sort: 4, visible: true },
    ],
  },
  {
    id: 2, parentId: 0, name: 'BusinessRoot', path: '/business', icon: '💼', title: '业务中心', type: 'page', sort: 2, visible: true,
    children: [
      { id: 201, parentId: 2, name: 'Config', path: '/business/config', icon: '⚙️', title: '配置管理', type: 'page', sort: 1, visible: true },
      { id: 202, parentId: 2, name: 'Scheduler', path: '/business/scheduler', icon: '⏰', title: '定时任务', type: 'page', sort: 2, visible: true },
      { id: 203, parentId: 2, name: 'Datasource', path: '/business/datasource', icon: '🗄', title: '数据源', type: 'page', sort: 3, visible: true },
      { id: 204, parentId: 2, name: 'Storage', path: '/business/storage', icon: '💾', title: '存储中心', type: 'page', sort: 4, visible: true },
      { id: 205, parentId: 2, name: 'Params', path: '/business/params', icon: '📜', title: '参数设置', type: 'page', sort: 5, visible: true },
      { id: 206, parentId: 2, name: 'Dict', path: '/business/dict', icon: '📖', title: '字典管理', type: 'page', sort: 6, visible: true },
      { id: 207, parentId: 2, name: 'Template', path: '/business/template', icon: '✉️', title: '通知模板', type: 'page', sort: 7, visible: true },
      { id: 208, parentId: 2, name: 'Push', path: '/business/push', icon: '📣', title: '消息推送', type: 'page', sort: 8, visible: true },
      { id: 209, parentId: 2, name: 'Stats', path: '/business/stats', icon: '📊', title: '数据统计', type: 'page', sort: 9, visible: true },
      { id: 210, parentId: 2, name: 'Trend', path: '/business/trend', icon: '📈', title: '趋势分析', type: 'page', sort: 10, visible: true },
      { id: 211, parentId: 2, name: 'Charts', path: '/business/charts', icon: '🎛', title: '图表展示', type: 'page', sort: 11, visible: true },
      { id: 212, parentId: 2, name: 'Export', path: '/business/export', icon: '📤', title: '数据导出', type: 'page', sort: 12, visible: true },
      { id: 213, parentId: 2, name: 'Dashboard', path: '/business/dashboard', icon: '🖥', title: '数据大屏', type: 'page', sort: 13, visible: true },
      { id: 214, parentId: 2, name: 'Calc', path: '/business/calc', icon: '🧮', title: '数据计算', type: 'page', sort: 14, visible: true },
      { id: 215,parentId: 2, name: 'Query', path: '/business/query', icon: '🔍', title: '数据查询', type: 'page', sort: 15, visible: true },
    ],
  },
  {
    id: 3, parentId: 0, name: 'ToolsRoot', path: '/tools', icon: '🛠', title: '系统工具', type: 'page', sort: 3, visible: true,
    children: [
      { id: 301, parentId: 3, name: 'Notifications', path: '/notifications', icon: '🔔', title: '消息通知', type: 'page', sort: 1, visible: true },
      { id: 302, parentId: 3, name: 'Audit', path: '/audit', icon: '📝', title: '审计日志', type: 'page', sort: 2, visible: true },
      { id: 303, parentId: 3, name: 'Monitor', path: '/business/monitor', icon: '📡', title: '系统监控', type: 'page', sort: 3, visible: true },
      { id: 304, parentId: 3, name: 'Online', path: '/business/online', icon: '👤', title: '在线用户', type: 'page', sort: 4, visible: true },
      { id: 305, parentId: 3, name: 'Cache', path: '/business/cache', icon: '🧹', title: '缓存管理', type: 'page', sort: 5, visible: true },
      { id: 306, parentId: 3, name: 'ServiceLog', path: '/business/servicelog', icon: '🔄', title: '服务日志', type: 'page', sort: 6, visible: true },
      { id: 307, parentId: 3, name: 'Settings', path: '/settings', icon: '⚙️', title: '系统设置', type: 'page', sort: 7, visible: true },
      { id: 308, parentId: 3, name: 'Help', path: '/help', icon: '❓', title: '帮助反馈', type: 'page', sort: 8, visible: true },
      { id: 309, parentId: 3, name: 'About', path: '/about', icon: 'ℹ️', title: '关于系统', type: 'page', sort: 9, visible: true },
    ],
  },
  {
    id: 4, parentId: 0, name: 'ProfileRoot', path: '/profile', icon: '👤', title: '个人中心', type: 'page', sort: 4, visible: true,
  },
  {
    id: 5, parentId: 0, name: 'ReportsRoot', path: '/reports', icon: '📈', title: '数据报表', type: 'page', sort: 5, visible: true,
  },
];

let menuConfigDB = JSON.parse(JSON.stringify(initialMenuConfig)) as MenuConfig[];
let nextMenuId = 1000;

function delay(ms = 200): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

export const mockApi = {
  getMenuConfig: async () => {
    await delay();
    return { code: 0, data: JSON.parse(JSON.stringify(menuConfigDB)) as MenuConfig[], message: 'success' };
  },
  saveMenuConfig: async (menus: MenuConfig[]) => {
    await delay();
    menuConfigDB = JSON.parse(JSON.stringify(menus));
    return { code: 0, data: null, message: 'save success' };
  },
  addMenu: async (menu: Omit<MenuConfig, 'id'>) => {
    await delay(200);
    const maxId = Math.max(0, ...menuConfigDB.map(m => m.id), ...menuConfigDB.flatMap(m => (m.children || []).map(c => c.id)));
    const newMenu: MenuConfig = { ...menu, id: maxId + 1 };
    if (newMenu.parentId === 0) {
      menuConfigDB.push(newMenu);
    } else {
      const addToParent = (items: MenuConfig[]): boolean => {
        for (const item of items) {
          if (item.id === newMenu.parentId) {
            if (!item.children) item.children = [];
            item.children.push(newMenu);
            return true;
          }
          if (item.children && addToParent(item.children)) return true;
        }
        return false;
      };
      addToParent(menuConfigDB);
    }
    return { code: 0, data: newMenu, message: 'insert success' };
  },
  updateMenu: async (id: number, data: Partial<MenuConfig>) => {
    await delay(200);
    const updateRecursive = (items: MenuConfig[]): boolean => {
      for (const item of items) {
        if (item.id === id) { Object.assign(item, data); return true; }
        if (item.children && updateRecursive(item.children)) return true;
      }
      return false;
    };
    updateRecursive(menuConfigDB);
    return { code: 0, data: null, message: 'update success' };
  },
  deleteMenu: async (id: number) => {
    await delay(200);
    const deleteRecursive = (items: MenuConfig[]): MenuConfig[] =>
      items.filter(item => item.id !== id).map(item => ({
        ...item,
        children: item.children ? deleteRecursive(item.children) : undefined,
      }));
    menuConfigDB = deleteRecursive(menuConfigDB);
    return { code: 0, data: null, message: 'delete success' };
  },
  toggleVisible: async (id: number) => {
    await delay(100);
    const toggleRecursive = (items: MenuConfig[]): boolean => {
      for (const item of items) {
        if (item.id === id) { item.visible = !item.visible; return true; }
        if (item.children && toggleRecursive(item.children)) return true;
      }
      return false;
    };
    toggleRecursive(menuConfigDB);
    return { code: 0, data: null, message: 'toggle success' };
  },
};

export type { MenuConfig };
