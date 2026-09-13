/**
 * 用户服务（julyUser/v1/*）
 * 注意（运行态区分，来自 Swagger 标注）：
 *  - login          账号密码登录，任何环境可用（生产/开发通用）
 *  - loginByUserName 免密登录，仅 debug / development 运行态（生产拒用）
 *  - logout         登出（客户端清除 token）
 */
import { api } from '../../api/request';
import { SYSTEM011_ACTIONS } from './actions';
import { julyUserStore } from '../../stores/system011/julyUserStore';
import type {
  JulyUserLoginVo011,
  JulyUserLoginByNameVo011,
  JulyUserSessionVo011,
  JulyUserVo011,
  JulyUserQueryVo011,
  JulyUserInsertVo011,
  JulyUserUpdateVo011,
  JulyUserResetPasswordVo011,
  JulyUserChangePasswordVo011,
  JulyUserAssignRolesVo011,
  PageResult011,
  IdVo011,
  BatchDeleteResultVo011,
} from '../../types/system011';

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

// ==================== 业务编排（写 store 状态） ====================

/** 拉取用户分页并写入 store（patch 与当前查询合并） */
export async function fetchUserPage(patch: Partial<JulyUserQueryVo011> = {}): Promise<void> {
  const query = { ...julyUserStore.getSnapshot().query, ...patch } as JulyUserQueryVo011;
  julyUserStore.setState({ loading: true, query });
  try {
    const res = await selectUserListByPage(query);
    julyUserStore.setState({
      list: res.rows || [],
      total: res.total || 0,
      totalPages: res.totalPages || 1,
      loading: false,
    });
  } catch {
    julyUserStore.setState({ list: [], total: 0, totalPages: 1, loading: false });
  }
}

/** 用户保存入参（有 id = 编辑，无 id = 新增；字段命名为表单语义） */
export interface SaveUserParams {
  id?: string;
  userAccount?: string;
  userName: string;
  password?: string;
  mobile?: string;
  email?: string;
  pkOrg?: string;
}

/** 新增 / 修改用户 + 分配角色，成功后刷新列表（返回用户 id） */
export async function saveUser(params: SaveUserParams, roleIds: string[]): Promise<string> {
  const { id, userAccount, userName, password, mobile, email, pkOrg } = params;
  let savedId: string;
  if (id) {
    ({ id: savedId } = await updateUser({ id, userName, mobile, email, pkOrg }));
  } else {
    ({ id: savedId } = await insertUser({
      userAccount: userAccount || '',
      userName,
      password: password || '',
      mobile,
      email,
      pkOrg,
    }));
  }
  if (roleIds.length > 0) await assignUserRoles(savedId, roleIds);
  const q = julyUserStore.getSnapshot().query;
  await fetchUserPage({ ...q, pageIndex: id ? q.pageIndex : 1 });
  return savedId;
}

/** 批量逻辑删除 + 刷新列表 */
export async function removeUsers(ids: string[]): Promise<void> {
  await logicDeleteUsers(ids);
  await fetchUserPage(julyUserStore.getSnapshot().query);
}
