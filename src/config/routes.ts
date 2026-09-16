/**
 * 前端路由常量与解析
 * 系统管理模块（system011）页面路由统一为 /system011/julyXxx。
 */

export const SYSTEM011_ROUTES = {
  julyMenu: '/system011/julyMenu',
  julyUser: '/system011/julyUser',
  julyPermission: '/system011/julyPermission',
  julyOrganization: '/system011/julyOrganization',
  julyScheduler: '/system011/julyScheduler',
  julyConfig: '/system011/julyConfig',
  julyDictionary: '/system011/julyDictionary',
} as const;

/** 数据服务模块（dataservice011）路由（前缀大写 dataService011，与页面目录一致） */
export const DATASERVICE011_ROUTES = {
  julyDatasource: '/dataService011/julyDatasource',
  julyBusinessModeling: '/dataService011/JulyBusinessModeling',
  julyBusinessModelingNew: '/dataService011/JulyBusinessModeling/new',
} as const;

/** AI 模块（ai011）路由 */
export const AI011_ROUTES = {
  julyAiModelProvider: '/ai011/julyAiModelProvider',
} as const;

/** 低代码模块（lowcode011）路由 */
export const LOWCODE011_ROUTES = {
  julyMetadata: '/lowcode011/julyMetadata',
} as const;

/** 默认落地页 */
export const DEFAULT_ROUTE = '/dashboard';
