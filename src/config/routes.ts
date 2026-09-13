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

/** 后端菜单 menuRoute（历史短路径）→ 前端路由，兼容后端仍下发旧值 */
const MENU_ROUTE_ALIAS: Record<string, string> = {
  '/menu': SYSTEM011_ROUTES.julyMenu,
  '/user': SYSTEM011_ROUTES.julyUser,
  '/permission': SYSTEM011_ROUTES.julyPermission,
  '/organization': SYSTEM011_ROUTES.julyOrganization,
};

/** 把后端菜单路径解析为前端路由 */
export function resolveMenuRoute(route: string): string {
  return MENU_ROUTE_ALIAS[route] || route;
}
