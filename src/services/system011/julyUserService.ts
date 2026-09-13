/**
 * 用户服务（julyUser/v1/*）
 * 注意（运行态区分，来自 Swagger 标注）：
 *  - login          账号密码登录，任何环境可用（生产/开发通用）
 *  - loginByUserName 免密登录，仅 debug / development 运行态（生产拒用）
 *  - logout         登出（客户端清除 token）
 */
import { api } from '@/api/request';
import { SYSTEM011_ACTIONS } from './actions';
import { julyUserStore } from '@/stores/system011/julyUserStore';
import type {
  JulyUserLoginVo011,
  JulyUserLoginByNameVo011,
  JulyUserSessionVo011,
  JulyUserVo011,
  JulyUserQueryVo011,
  JulyUserInsertVo011,
  JulyUserUpdateVo011,
  JulyUserAssignRolesVo011,
  SaveUserParams,
  PageResult011,
  IdVo011,
} from '@/types/system011';

export type { SaveUserParams };

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

/** 新增 / 修改用户 + 分配角色，成功后刷新列表（返回用户 id） */
export async function saveUser(params: SaveUserParams): Promise<string> {
  const { id, userAccount, userName, password, mobile, email, pkOrg, roleIds = [] } = params;
  const { id: savedId } = id
    ? await api.post<IdVo011>(SYSTEM011_ACTIONS.user.update, { id, userName, mobile, email, pkOrg } as JulyUserUpdateVo011)
    : await api.post<IdVo011>(SYSTEM011_ACTIONS.user.insert, {
        userAccount,
        userName,
        password: password || '',
        mobile,
        email,
        pkOrg,
      } as JulyUserInsertVo011);

  if (roleIds.length > 0) {
    await api.post<IdVo011>(SYSTEM011_ACTIONS.user.assignRoles, { id: savedId, pkRoles: roleIds } as JulyUserAssignRolesVo011);
  }
  const q = julyUserStore.getSnapshot().query;
  await fetchUserPage({ ...q, pageIndex: id ? q.pageIndex : 1 });
  return savedId;
}
