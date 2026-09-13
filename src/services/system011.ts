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
  IdVo011,
  JulyUserInsertVo011,
  JulyUserUpdateVo011,
  JulyUserResetPasswordVo011,
  JulyUserChangePasswordVo011,
  JulyUserAssignRolesVo011,
  JulyUserAuditVo011,
  JulyUserAuditQueryVo011,
  BatchDeleteResultVo011,
  JulyOrganizationInsertVo011,
  JulyOrganizationUpdateVo011,
} from '../types/system011';

/** 统一 action 路径常量（禁止在 store 里再写分散的 /menu、/role 等旧路径） */
export const SYSTEM011_ACTIONS = {
  user: {
    login: '/julyUser/v1/login',
    loginByUserName: '/julyUser/v1/loginByUserName',
    logout: '/julyUser/v1/logout',
    selectListByPage: '/julyUser/v1/selectListByPage',
    getById: '/julyUser/v1/getById',
    insert: '/julyUser/v1/insert',
    update: '/julyUser/v1/update',
    logicDelete: '/julyUser/v1/logicDelete',
    resetPassword: '/julyUser/v1/resetPassword',
    changePassword: '/julyUser/v1/changePassword',
    assignRoles: '/julyUser/v1/assignRoles',
  },
  userAudit: {
    selectListByPage: '/julyUserAudit/v1/selectListByPage',
  },
  menu: {
    selectUserMenuTree: '/julyMenu/v1/selectUserMenuTree',
    selectTree: '/julyMenu/v1/selectTree',
    selectListByPage: '/julyMenu/v1/selectListByPage',
  },
  role: {
    selectListByPage: '/julyRole/v1/selectListByPage',
  },
  organization: {
    selectListByPage: '/julyOrganization/v1/selectListByPage',
    selectTree: '/julyOrganization/v1/selectTree',
    getById: '/julyOrganization/v1/getById',
    insert: '/julyOrganization/v1/insert',
    update: '/julyOrganization/v1/update',
    logicDelete: '/julyOrganization/v1/logicDelete',
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

/** 用户详情（主键查询） */
export function getUserById(id: string): Promise<JulyUserVo011> {
  return api.post<JulyUserVo011>(SYSTEM011_ACTIONS.user.getById, { id } as IdVo011);
}

/** 新增用户（返回新用户 id） */
export function insertUser(data: JulyUserInsertVo011): Promise<IdVo011> {
  return api.post<IdVo011>(SYSTEM011_ACTIONS.user.insert, data);
}

/** 修改用户资料（不含账号与密码；返回 id） */
export function updateUser(data: JulyUserUpdateVo011): Promise<IdVo011> {
  return api.post<IdVo011>(SYSTEM011_ACTIONS.user.update, data);
}

/** 批量逻辑删除用户（body 直接是 id 数组；返回批量结果） */
export function logicDeleteUsers(ids: string[]): Promise<BatchDeleteResultVo011> {
  return api.post<BatchDeleteResultVo011>(SYSTEM011_ACTIONS.user.logicDelete, ids);
}

/** 重置密码（管理员动作） */
export function resetUserPassword(id: string, password: string): Promise<IdVo011> {
  return api.post<IdVo011>(SYSTEM011_ACTIONS.user.resetPassword, { id, password } as JulyUserResetPasswordVo011);
}

/** 本人修改密码（验旧密） */
export function changePassword(data: JulyUserChangePasswordVo011): Promise<IdVo011> {
  return api.post<IdVo011>(SYSTEM011_ACTIONS.user.changePassword, data);
}

/** 分配角色（整存替换） */
export function assignUserRoles(id: string, pkRoles: string[]): Promise<IdVo011> {
  return api.post<IdVo011>(SYSTEM011_ACTIONS.user.assignRoles, { id, pkRoles } as JulyUserAssignRolesVo011);
}

/** 审计日志分页查询（julyUser 事件流水） */
export function selectUserAuditListByPage(body: object = {}): Promise<PageResult011<JulyUserAuditVo011>> {
  return api.post<PageResult011<JulyUserAuditVo011>>(SYSTEM011_ACTIONS.userAudit.selectListByPage, body as JulyUserAuditQueryVo011);
}

/** 角色分页查询 */
export function selectRoleListByPage(body: object = {}): Promise<PageResult011<JulyRoleVo011>> {
  return api.post<PageResult011<JulyRoleVo011>>(SYSTEM011_ACTIONS.role.selectListByPage, body);
}

/** 组织分页查询（真实后端返回 PageResult011，rows 内为组织树） */
export function selectOrganizationListByPage(body: object = {}): Promise<PageResult011<JulyOrganizationVo011>> {
  return api.post<PageResult011<JulyOrganizationVo011>>(SYSTEM011_ACTIONS.organization.selectListByPage, body);
}

/** 组织树（含人数角标；返回数组，非分页） */
export function selectOrganizationTree(): Promise<JulyOrganizationVo011[]> {
  return api.post<JulyOrganizationVo011[]>(SYSTEM011_ACTIONS.organization.selectTree, {});
}

/** 组织详情（主键查询） */
export function getOrganizationById(id: string): Promise<JulyOrganizationVo011> {
  return api.post<JulyOrganizationVo011>(SYSTEM011_ACTIONS.organization.getById, { id } as IdVo011);
}

/** 新增组织（层级由上级推导；返回新组织 id） */
export function insertOrganization(data: JulyOrganizationInsertVo011): Promise<IdVo011> {
  return api.post<IdVo011>(SYSTEM011_ACTIONS.organization.insert, data);
}

/** 修改组织（编码不可改，可移动上级；返回 id） */
export function updateOrganization(data: JulyOrganizationUpdateVo011): Promise<IdVo011> {
  return api.post<IdVo011>(SYSTEM011_ACTIONS.organization.update, data);
}

/** 逻辑删除组织（有子组织或挂有用户会被后端拒绝；body 为 {id}） */
export function deleteOrganization(id: string): Promise<IdVo011> {
  return api.post<IdVo011>(SYSTEM011_ACTIONS.organization.logicDelete, { id } as IdVo011);
}
