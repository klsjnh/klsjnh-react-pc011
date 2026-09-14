/**
 * 角色服务（julyRole/v1/*）
 * 所有业务操作（含 CRUD 编排）在此；可写 store 状态。
 * 分层：page → service → store；store 不调用 service。
 */
import { isMockMode } from '@/config/appConfig';
import { fireApi } from '@/api/request';
import { api } from '@/api/request';
import { SYSTEM011_ACTIONS } from './actions';
import { roleStore } from '@/stores/system011/julyRoleStore';
import { julyOrganizationStore } from '@/stores/system011/julyOrganizationStore';
import { selectUserListByPage } from './julyUserService';
import { fetchOrganizationTree } from './julyOrganizationService';
import { mockRelations } from '@/mock/system011';
import type { JulyRoleVo011 } from '@/types/system011/julyRole/vo';
import type { JulyUserVo011, JulyUserView } from '@/types/system011/julyUser';
import type { RoleDetail, RoleState } from '@/types/system011/julyRole/view';
import type { PageResult011 } from '@/types/system011';

/** 角色分页查询 */
export function selectRoleListByPage(body: object = {}): Promise<PageResult011<JulyRoleVo011>> {
  return api.post<PageResult011<JulyRoleVo011>>(SYSTEM011_ACTIONS.role.selectListByPage, body);
}

// ==================== 投影层 ====================

function projectRole(r: JulyRoleVo011, userAccountToId: Map<string, string>): RoleDetail {
  const accounts = mockRelations.roleUserAccounts(r.roleCode);
  return {
    ...r,
    permissions: mockRelations.rolePermissions(r.roleCode),
    userIds: accounts.map((a) => userAccountToId.get(a)).filter((x): x is string => x != null),
  };
}

function projectUser(u: JulyUserVo011, orgNameById: Map<string, string>): JulyUserView {
  return {
    ...u,
    department: u.pkOrg ? (orgNameById.get(u.pkOrg) || '') : '',
    roles: mockRelations.userRoles(u.userAccount),
  };
}

// ==================== 业务编排（写 store 状态） ====================

/** 初始化加载（mock / api 共用 services 层，统一经 request.ts 路由） */
export async function loadRoles(): Promise<void> {
  const s = roleStore.getSnapshot();
  if (s.loading || s.loaded) return;
  roleStore.setState({ loading: true });
  try {
    const [rolePage, userPage] = await Promise.all([
      selectRoleListByPage({ pageIndex: 1, pageSize: 100 }),
      selectUserListByPage({ pageIndex: 1, pageSize: 100 }),
    ]);
    // 组织树取自组织服务（单一数据源），组织名映射用于用户「所属组织」
    await fetchOrganizationTree();
    const orgSnapshot = julyOrganizationStore.getSnapshot();
    const userAccountToId = new Map<string, string>(
      userPage.rows.map((u) => [u.userAccount, u.id] as [string, string]),
    );
    roleStore.setState({
      roles: rolePage.rows.map((r) => projectRole(r, userAccountToId)),
      users: userPage.rows.map((u) => projectUser(u, orgSnapshot.orgNameById)),
      orgTree: orgSnapshot.tree,
      loaded: true,
      loading: false,
    });
  } catch {
    roleStore.setState({ loading: false });
  }
}

/** 清空缓存重新加载（切换数据模式后调用） */
export async function reloadRoles(): Promise<void> {
  roleStore.replace({ roles: [], users: [], orgTree: [], loaded: false, loading: false });
  await fetchOrganizationTree();
  await loadRoles();
}

/** 添加角色（投影层）；api 模式静默写回真实后端 */
export function addRole(data: { roleCode: string; roleName: string; remark?: string }): void {
  const s = roleStore.getSnapshot();
  const now = new Date().toISOString().slice(0, 19);
  const created: RoleDetail = {
    id: `tmp-role-${Date.now()}`,
    roleCode: data.roleCode,
    roleName: data.roleName,
    isBuiltin: '0',
    remark: data.remark || null,
    status: '1',
    createTime: now,
    updateTime: now,
    permissions: [],
    userIds: [],
  };
  roleStore.setState({ roles: [...s.roles, created] });
  if (!isMockMode()) fireApi('/julyRole/v1/insert', { roleCode: data.roleCode, roleName: data.roleName, remark: data.remark });
}

/** 更新角色 */
export function updateRole(id: string, data: Partial<Pick<RoleDetail, 'roleName' | 'remark' | 'status'>>): void {
  const s = roleStore.getSnapshot();
  roleStore.setState({ roles: s.roles.map((r) => (r.id === id ? { ...r, ...data } : r)) });
  if (!isMockMode()) fireApi('/julyRole/v1/update', { id, ...data });
}

/** 删除角色 */
export function removeRole(id: string): void {
  const s = roleStore.getSnapshot();
  roleStore.setState({ roles: s.roles.filter((r) => r.id !== id) });
  if (!isMockMode()) fireApi('/julyRole/v1/logicDelete', { id });
}

/** 分配权限 */
export function assignPermissions(roleId: string, keys: string[]): void {
  const s = roleStore.getSnapshot();
  roleStore.setState({ roles: s.roles.map((r) => (r.id === roleId ? { ...r, permissions: keys } : r)) });
  if (!isMockMode()) fireApi('/julyRole/v1/updatePermission', { id: roleId, permissions: keys });
}

/** 添加用户到角色 */
export function addUserToRole(roleId: string, userId: string): void {
  const s = roleStore.getSnapshot();
  roleStore.setState({
    roles: s.roles.map((r) => {
      if (r.id !== roleId) return r;
      if (r.userIds.includes(userId)) return r;
      return { ...r, userIds: [...r.userIds, userId] };
    }),
  });
  if (!isMockMode()) fireApi('/julyRoleUser/v1/insert', { roleId, userId });
}

/** 从角色移除用户 */
export function removeUserFromRole(roleId: string, userId: string): void {
  const s = roleStore.getSnapshot();
  roleStore.setState({
    roles: s.roles.map((r) => (r.id !== roleId ? r : { ...r, userIds: r.userIds.filter((id) => id !== userId) })),
  });
  if (!isMockMode()) fireApi('/julyRoleUser/v1/logicDelete', { roleId, userId });
}
