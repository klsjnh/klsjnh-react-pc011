/**
 * 前端路由常量与解析
 * 系统管理模块（system011）页面路由统一为 /system011/julyXxx。
 */

export const SYSTEM011_ROUTES = {
  julyMenu: '/system011/julyMenu',
  julyUser: '/system011/julyUser',
  julyPermission: '/system011/julyPermission',
  julyOrganization: '/system011/julyOrganization',
} as const;

/** 默认落地页 */
export const DEFAULT_ROUTE = '/dashboard';
