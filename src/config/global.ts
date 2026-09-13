/**
 * 全局配置（应用级静态配置）
 *  - appName：应用名
 *  - menuFromConfig：菜单来源开关。true → 用下方 GLOBAL_MENUS；false → 走接口（menuStore）
 *  - menus：本地菜单列表（开发态默认使用）
 */
import { SYSTEM011_ROUTES } from './routes';
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
  { path: '/business', label: '业务中心', icon: '💼' },
  { path: '/reports', label: '数据报表', icon: '📈' },
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
  { path: '/profile', label: '个人中心', icon: '👤' },
];

export const globalConfig = {
  appName: '企业管理系统',
  /** true：菜单取自 GLOBAL_MENUS；false：走接口（menuStore → selectUserMenuTree） */
  menuFromConfig: !!(import.meta as any).env?.DEV,
};
