/**
 * system011 后端服务层（API 模式调用）
 * 统一 action 路径 = 后端真实路径：/klsjnh/system011/{julyXxx}/v1/{动作}
 * 与 docs/swagger-api-docs.json 一一对应；Mock 层在 store 内部分流（全局 dataMode 开关）。
 *
 * 注意（运行态区分，来自 Swagger 标注）：
 *  - julyUser/v1/login          账号密码登录，任何环境可用（生产/开发通用）
 *  - julyUser/v1/loginByUserName 免密登录，仅 debug / development 运行态（生产拒用）
 *  - julyUser/v1/logout         登出（客户端清除 token）
 */
import { api } from '../api/request';
import type {
  JulyUserLoginVo011,
  JulyUserSessionVo011,
  JulyUserLoginByNameVo011,
  JulyMenuVo011,
  JulyUserVo011,
  JulyRoleVo011,
  JulyOrganizationVo011,
  PageResult011,
} from '../types/system011';

/** 统一 action 路径常量（禁止在 store 里再写分散的 /menu、/role 等旧路径） */
export const SYSTEM011_ACTIONS = {
  user: {
    login: '/julyUser/v1/login',
    loginByUserName: '/julyUser/v1/loginByUserName',
    logout: '/julyUser/v1/logout',
    selectListByPage: '/julyUser/v1/selectListByPage',
  },
  menu: {
    selectUserMenuTree: '/julyMenu/v1/selectUserMenuTree',
    selectTree: '/julyMenu/v1/selectTree',
    selectListByPage: '/julyMenu/v1/selectListByPage',
  },
  role: {
    selectListByPage: '/julyRole/v1/selectListByPage',
  },
} as const;

/** 账号密码登录（任何运行态可用） */
export function login(userAccount: string, password: string): Promise<JulyUserSessionVo011> {
  return api.post<JulyUserSessionVo011>(SYSTEM011_ACTIONS.user.login, { userAccount, password } as JulyUserLoginVo011);
}

/** 免密登录（仅 debug / development 运行态；生产后端会拒绝） */
export function loginByUserName(userAccount: string): Promise<JulyUserSessionVo011> {
  return api.post<JulyUserSessionVo011>(SYSTEM011_ACTIONS.user.loginByUserName, { userAccount } as JulyUserLoginByNameVo011);
}

/** 登出 */
export function logout(): Promise<void> {
  return api.post<void>(SYSTEM011_ACTIONS.user.logout, {});
}

/** 当前登录人的菜单树（RBAC 侧边栏数据源；内置角色走全量旁路） */
export function selectUserMenuTree(): Promise<JulyMenuVo011[]> {
  return api.post<JulyMenuVo011[]>(SYSTEM011_ACTIONS.menu.selectUserMenuTree, {});
}

/** 全量菜单树 */
export function selectMenuTree(): Promise<JulyMenuVo011[]> {
  return api.post<JulyMenuVo011[]>(SYSTEM011_ACTIONS.menu.selectTree, {});
}

/** 菜单分页查询 */
export function selectMenuListByPage(body: object = {}): Promise<PageResult011<JulyMenuVo011>> {
  return api.post<PageResult011<JulyMenuVo011>>(SYSTEM011_ACTIONS.menu.selectListByPage, body);
}

/** 用户分页查询 */
export function selectUserListByPage(body: object = {}): Promise<PageResult011<JulyUserVo011>> {
  return api.post<PageResult011<JulyUserVo011>>(SYSTEM011_ACTIONS.user.selectListByPage, body);
}

/** 角色分页查询 */
export function selectRoleListByPage(body: object = {}): Promise<PageResult011<JulyRoleVo011>> {
  return api.post<PageResult011<JulyRoleVo011>>(SYSTEM011_ACTIONS.role.selectListByPage, body);
}

/** 组织分页查询（真实后端返回 PageResult011，rows 内为组织树） */
export function selectOrganizationListByPage(body: object = {}): Promise<PageResult011<JulyOrganizationVo011>> {
  return api.post<PageResult011<JulyOrganizationVo011>>('/julyOrganization/v1/selectListByPage', body);
}
