/**
 * 全局配置（应用级静态配置）
 *  - appName：应用名
 *  - menuFromConfig：菜单来源开关。true → 用下方 GLOBAL_MENUS；false → 走接口（menuStore）
 *  - menus：本地菜单列表（开发态默认使用）
 */
import { SYSTEM011_ROUTES } from '@/config/routes';
import type { NavItem } from '@/types/view/layout';

/** 本地菜单列表（开发态使用；非开发态走接口 selectUserMenuTree） */
export const GLOBAL_MENUS: NavItem[] = [
  { path: '/dashboard', label: '仪表盘', icon: '📊' },
  {
    path: '/system',
    label: '系统管理',
    icon: '⚙️',
    children: [
      { path: SYSTEM011_ROUTES.julyMenu, label: '菜单管理', icon: '📋' },
      { path: SYSTEM011_ROUTES.julyOrganization, label: '组织管理', icon: '🏢' },
      { path: SYSTEM011_ROUTES.julyUser, label: '用户管理', icon: '👥' },
      { path: SYSTEM011_ROUTES.julyPermission, label: '权限管理', icon: '🔑' },
    ],
  },
  {
    path: '/business',
    label: '业务中心',
    icon: '💼',
    children: [
      { path: '/business/config', label: '配置管理', icon: '⚙️' },
      { path: '/business/scheduler', label: '定时任务', icon: '⏰' },
      { path: '/business/dict', label: '字典管理', icon: '📖' },
      { path: '/business/monitor', label: '系统监控', icon: '📡' },
      { path: '/business/online', label: '在线用户', icon: '🟢' },
      { path: '/business/cache', label: '缓存管理', icon: '⚡' },
      { path: '/business/datasource', label: '数据源', icon: '🗄' },
      { path: '/business/storage', label: '存储中心', icon: '💾' },
      { path: '/business/params', label: '参数设置', icon: '🔧' },
      { path: '/business/template', label: '通知模板', icon: '📝' },
      { path: '/business/push', label: '消息推送', icon: '📢' },
      { path: '/business/stats', label: '数据统计', icon: '📊' },
      { path: '/business/trend', label: '趋势分析', icon: '📈' },
      { path: '/business/charts', label: '图表展示', icon: '📉' },
      { path: '/business/export', label: '数据导出', icon: '📤' },
      { path: '/business/dashboard', label: '数据大屏', icon: '🖥' },
      { path: '/business/calc', label: '数据计算', icon: '🧮' },
      { path: '/business/query', label: '数据查询', icon: '🔍' },
      { path: '/business/servicelog', label: '服务日志', icon: '🪵' },
    ],
  },
  {
    path: '/appcenter',
    label: '应用中心',
    icon: '🧩',
    children: [
      { path: '/reports', label: '数据报表', icon: '📈' },
      { path: '/profile', label: '人中心', icon: '👤' },
    ],
  },
  {
    path: '/tools',
    label: '系统工具',
    icon: '🛠',
    children: [
      { path: '/notifications', label: '消息通知', icon: '🔔' },
      { path: '/audit', label: '审计日志', icon: '📝' },
      { path: '/settings', label: '系统设置', icon: '⚙️' },
      { path: '/help', label: '帮助反馈', icon: '❓' },
      { path: '/about', label: '关于系统', icon: 'ℹ️' },
    ],
  },
];

export const globalConfig = {
  appName: '企业管理系统',
  /** true：菜单取自 GLOBAL_MENUS；false：走接口（menuStore → selectUserMenuTree） */
  menuFromConfig: !!import.meta.env?.DEV,
};
