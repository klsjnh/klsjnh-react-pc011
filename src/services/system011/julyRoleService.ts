/**
 * 角色服务（julyRole/v1/*）
 * 所有业务操作（含 CRUD 编排）在此；可写 store 状态。
 * 分层：page → service → store；store 不调用 service。
 */
import { isMockMode } from '@/config/appConfig';
import { api, fireApi } from '@/api/request';
import { SYSTEM011_ACTIONS } from '@/services/system011/actions';
import { roleStore } from '@/stores/system011/julyRoleStore';
import { julyOrganizationStore } from '@/stores/system011/julyOrganizationStore';
import { selectUserListByPage } from '@/services/system011/julyUserService';
import { fetchOrganizationTree } from '@/services/system011/julyOrganizationService';
import { selectMenuTree } from '@/services/system011/julyMenuService';
import { mockRelations } from '@/mock/system011';
import type { JulyRoleVo011 } from '@/types/system011/julyRole/vo';
import type { JulyMenuVo011 } from '@/types/system011/julyMenu';
import type { JulyUserVo011, JulyUserView } from '@/types/system011/julyUser';
import type { RoleDetail } from '@/types/system011/julyRole/view';
import type { PageResult011 } from '@/types/system011';

/** 角色分页查询 */
export function selectRoleListByPage(body: object = {}): Promise<PageResult011<JulyRoleVo011>> {
  return api.post<PageResult011<JulyRoleVo011>>(SYSTEM011_ACTIONS.role.selectListByPage, body);
}

// ==================== 投影层 ====================

/** 菜单树拍平（用于建立 permissionCode → 菜单 id 映射） */
function flattenMenus(nodes: JulyMenuVo011[]): JulyMenuVo011[] {
  return nodes.flatMap((n) => [n, ...(n.children?.length ? flattenMenus(n.children) : [])]);
}

/**
 * 角色投影：把 mock 关系表里的 permissionCode 翻译成菜单 id。
 * 后端 /julyRole/v1/assignMenus 的 pkMenus 收的是「菜单 id 全量列表」，
 * 权限树勾选与下发必须同为 id，否则保存会把权限编码当主键写进去。
 */
function projectRole(
  r: JulyRoleVo011,
  userAccountToId: Map<string, string>,
  menuIdByCode: Map<string, string>,
): RoleDetail {
  const accounts = mockRelations.roleUserAccounts(r.roleCode);
  const menuIds = mockRelations
    .rolePermissions(r.roleCode)
    .map((code) => menuIdByCode.get(code))
    .filter((x): x is string => x != null);
  return {
    ...r,
    permissions: menuIds,
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
    // 菜单树单独取：失败不应连累角色列表加载（菜单仅用于权限勾选回显）
    let menuTree: JulyMenuVo011[] = [];
    try {
      menuTree = await selectMenuTree();
    } catch {
      menuTree = [];
    }
    const menuIdByCode = new Map<string, string>(
      flattenMenus(menuTree)
        .filter((m) => m.permissionCode)
        .map((m) => [m.permissionCode as string, m.id] as [string, string]),
    );
    roleStore.setState({
      roles: rolePage.rows.map((r) => projectRole(r, userAccountToId, menuIdByCode)),
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
  if (!isMockMode()) fireApi(SYSTEM011_ACTIONS.role.insert, { roleCode: data.roleCode, roleName: data.roleName, remark: data.remark });
}

/** 更新角色 */
export function updateRole(id: string, data: Partial<Pick<RoleDetail, 'roleName' | 'remark' | 'status'>>): void {
  const s = roleStore.getSnapshot();
  roleStore.setState({ roles: s.roles.map((r) => (r.id === id ? { ...r, ...data } : r)) });
  if (!isMockMode()) fireApi(SYSTEM011_ACTIONS.role.update, { id, ...data });
}

/** 删除角色 */
export function removeRole(id: string): void {
  const s = roleStore.getSnapshot();
  roleStore.setState({ roles: s.roles.filter((r) => r.id !== id) });
  if (!isMockMode()) fireApi(SYSTEM011_ACTIONS.role.logicDelete, { id });
}

/**
 * 分配菜单权限：POST /julyRole/v1/assignMenus，body = { id, pkMenus }（整存替换）。
 * pkMenus 必须是「菜单 id 全量列表」（后端 JulyRoleAssignMenusVo011 定义），
 * 不能传 permissionCode。
 */
export async function assignPermissions(roleId: string, menuIds: string[]): Promise<void> {
  const s = roleStore.getSnapshot();
  roleStore.setState({ roles: s.roles.map((r) => (r.id === roleId ? { ...r, permissions: menuIds } : r)) });
  if (isMockMode()) return; // mock 未实现该端点，本地投影即数据源
  await api.post(SYSTEM011_ACTIONS.role.assignMenus, { id: roleId, pkMenus: menuIds });
}

/**
 * 批量保存角色关联用户（与当前关联做 diff，仅下发增/删）。
 *
 * 后端约束（已核 java17-web011 源码，2026-09-14）：
 * - **不存在 julyRoleUser 资源**：无 JulyRoleUserController、无 july_role_user 表，
 *   故原先调用的 /julyRoleUser/v1/insert|logicDelete 是 404；
 * - 唯一可用的是 POST /julyUser/v1/assignRoles（**用户 → 角色**，整存替换，
 *   body = { id: 用户 id, pkRoles: 角色 id 全量列表 }）。
 * 因此这里按用户维度反向下发：新增用户追加本角色、移除用户剔除本角色。
 *
 * ⚠️ 已知缺口：后端 JulyUserVo011 **不返回角色**，且没有「查询用户角色」端点，
 * 本地 users[].roles 目前来自 mock 投影，API 模式下并非真实角色集合，
 * 整存替换存在覆盖风险。后端补出 selectRolesByUser（或 JulyUserVo011 增加 pkRoles）后，
 * 本函数应改为先查真实角色集合再合并下发。
 */
export async function assignUsersToRole(roleId: string, userIds: string[]): Promise<void> {
  const s = roleStore.getSnapshot();
  const role = s.roles.find((r) => r.id === roleId);
  const current = role?.userIds ?? [];
  const added = userIds.filter((id) => !current.includes(id));
  const removed = current.filter((id) => !userIds.includes(id));
  roleStore.setState({ roles: s.roles.map((r) => (r.id === roleId ? { ...r, userIds } : r)) });
  if (isMockMode()) return;
  // 本地 users[].roles 存的是 roleCode，后端要角色 id，需先翻译
  const roleIdByCode = new Map(s.roles.map((r) => [r.roleCode, r.id] as [string, string]));
  const roleIdsOf = (userId: string) =>
    (s.users.find((u) => u.id === userId)?.roles ?? [])
      .map((code) => roleIdByCode.get(code))
      .filter((x): x is string => x != null);
  for (const userId of added) {
    const next = Array.from(new Set([...roleIdsOf(userId), roleId]));
    await api.post(SYSTEM011_ACTIONS.user.assignRoles, { id: userId, pkRoles: next });
  }
  for (const userId of removed) {
    const next = roleIdsOf(userId).filter((rid) => rid !== roleId);
    await api.post(SYSTEM011_ACTIONS.user.assignRoles, { id: userId, pkRoles: next });
  }
}
