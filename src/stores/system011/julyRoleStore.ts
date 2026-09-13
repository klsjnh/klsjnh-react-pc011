/**
 * 角色 store（system011 · julyRole）
 * 权限管理页数据源：角色 → 关联用户 + 权限项目；组织树取自 julyOrganizationStore
 * 角色-权限 / 角色-用户 关系由前端 mockRelations 投影
 * （真实后端经 julyRole/v1/updatePermission、julyRoleUser/v1/insert 维护）
 */
import { useMemo } from 'react';
import { isMockMode } from '@/config/appConfig';
import { fireApi } from '@/api/request';
import { selectRoleListByPage, selectUserListByPage, fetchOrganizationTree } from '@/services/system011';
import { julyOrganizationStore } from './julyOrganizationStore';
import { createStore, useStoreState } from '../createStore';
import { mockRelations } from '@/mock/system011';
import type { JulyRoleVo011, JulyUserVo011, JulyOrganizationVo011 } from '@/types/system011';

import type { RoleDetail, UserInfo, RoleState } from '@/types/view/julyRole';
import type { OrgTreeNode } from '@/types/view/organization';

export type { RoleDetail, UserInfo, OrgTreeNode, RoleState };

const orgLevelToType: Record<string, string> = { '1': 'group', '2': 'company', '3': 'department' };

function projectRole(r: JulyRoleVo011, userAccountToId: Map<string, string>): RoleDetail {
  const roleCode = r.roleCode;
  const userAccounts = mockRelations.roleUserAccounts(roleCode);
  return {
    id: r.id,
    name: r.roleCode,
    label: r.roleName,
    description: r.remark || '',
    status: r.status === '1' ? 'active' : 'inactive',
    isBuiltin: r.isBuiltin === '1',
    permissions: mockRelations.rolePermissions(roleCode),
    userIds: userAccounts.map((acct) => userAccountToId.get(acct)).filter((x): x is string => x != null),
  };
}

function projectUser(u: JulyUserVo011, orgNameById: Map<string, string>): UserInfo {
  return {
    id: u.id,
    username: u.userAccount,
    realName: u.userName || u.userAccount,
    department: u.pkOrg ? (orgNameById.get(u.pkOrg) || '') : '',
    departmentId: u.pkOrg || '',
  };
}

function projectOrg(o: JulyOrganizationVo011): OrgTreeNode {
  return {
    id: o.id,
    name: o.orgName,
    type: orgLevelToType[String(o.orgLevel)] || 'team',
    children: o.children?.map(projectOrg),
  };
}

const base = createStore<RoleState>({
  roles: [], users: [], orgTree: [], loaded: false, loading: false,
});

export const roleStore = {
  getSnapshot: base.getSnapshot,
  subscribe: base.subscribe,

  /** 初始化加载（mock / api 共用 services 层，统一经 request.ts 路由） */
  load: async () => {
    const s = base.getSnapshot();
    if (s.loading || s.loaded) return;
    base.setState({ loading: true });
    try {
      const [rolePage, userPage] = await Promise.all([
        selectRoleListByPage({ pageIndex: 1, pageSize: 100 }),
        selectUserListByPage({ pageIndex: 1, pageSize: 100 }),
      ]);
      // 组织树取自组织服务（单一数据源），组织名映射用于用户「所属组织」
      await fetchOrganizationTree();
      const orgSnapshot = julyOrganizationStore.getSnapshot();
      const orgNameById = orgSnapshot.orgNameById;
      const userAccountToId = new Map<string, string>(
        userPage.rows.map((u) => [u.userAccount, u.id] as [string, string]),
      );
      base.setState({
        roles: rolePage.rows.map((r) => projectRole(r, userAccountToId)),
        users: userPage.rows.map((u) => projectUser(u, orgNameById)),
        orgTree: orgSnapshot.tree.map(projectOrg),
        loaded: true,
        loading: false,
      });
    } catch {
      // 加载失败：保留空数据，loaded 仍为 false，登录后可 reload 重试
      base.setState({ loading: false });
    }
  },

  /** 清空缓存重新加载（切换数据模式后调用） */
  reload: async () => {
    base.replace({ roles: [], users: [], orgTree: [], loaded: false, loading: false });
    await fetchOrganizationTree();
    await roleStore.load();
  },

  /** 角色列表 */
  getRoles: () => base.getSnapshot().roles,

  /** 根据 ID 获取角色详情 */
  getRole: (id: string) => base.getSnapshot().roles.find((r) => r.id === id),

  /** 获取角色关联的用户信息 */
  getRoleUsers: (roleId: string): UserInfo[] => {
    const s = base.getSnapshot();
    const role = s.roles.find((r) => r.id === roleId);
    if (!role) return [];
    return role.userIds.map((id) => s.users.find((u) => u.id === id)!).filter(Boolean);
  },

  /** 获取未关联该角色的用户 */
  getUnassignedUsers: (roleId: string): UserInfo[] => {
    const s = base.getSnapshot();
    const role = s.roles.find((r) => r.id === roleId);
    if (!role) return [];
    return s.users.filter((u) => !role.userIds.includes(u.id));
  },

  /** 添加角色（投影层）；api 模式静默写回真实后端 */
  addRole: (data: Omit<RoleDetail, 'id' | 'userIds'>) => {
    const s = base.getSnapshot();
    const created: RoleDetail = { ...data, id: `tmp-role-${Date.now()}`, userIds: [] };
    base.setState({ roles: [...s.roles, created] });
    if (!isMockMode()) fireApi('/julyRole/v1/insert', { roleCode: data.name, roleName: data.label, remark: data.description });
  },

  /** 更新角色 */
  updateRole: (id: string, data: Partial<RoleDetail>) => {
    const s = base.getSnapshot();
    base.setState({ roles: s.roles.map((r) => (r.id === id ? { ...r, ...data } : r)) });
    if (!isMockMode()) fireApi('/julyRole/v1/update', { id, ...data });
  },

  /** 删除角色 */
  removeRole: (id: string) => {
    const s = base.getSnapshot();
    base.setState({ roles: s.roles.filter((r) => r.id !== id) });
    if (!isMockMode()) fireApi('/julyRole/v1/logicDelete', { id });
  },

  /** 分配权限 */
  assignPermissions: (roleId: string, keys: string[]) => {
    const s = base.getSnapshot();
    base.setState({ roles: s.roles.map((r) => (r.id === roleId ? { ...r, permissions: keys } : r)) });
    if (!isMockMode()) fireApi('/julyRole/v1/updatePermission', { id: roleId, permissions: keys });
  },

  /** 添加用户到角色 */
  addUserToRole: (roleId: string, userId: string) => {
    const s = base.getSnapshot();
    base.setState({
      roles: s.roles.map((r) => {
        if (r.id !== roleId) return r;
        if (r.userIds.includes(userId)) return r;
        return { ...r, userIds: [...r.userIds, userId] };
      }),
    });
    if (!isMockMode()) fireApi('/julyRoleUser/v1/insert', { roleId, userId });
  },

  /** 从角色移除用户 */
  removeUserFromRole: (roleId: string, userId: string) => {
    const s = base.getSnapshot();
    base.setState({
      roles: s.roles.map((r) => (r.id !== roleId ? r : { ...r, userIds: r.userIds.filter((id) => id !== userId) })),
    });
    if (!isMockMode()) fireApi('/julyRoleUser/v1/logicDelete', { roleId, userId });
  },
};

// ==================== Hooks ====================

export function useRoleState(): RoleState {
  return useStoreState(base);
}

export function useRoles(): RoleDetail[] {
  const { roles } = useRoleState();
  return useMemo(() => roles, [roles]);
}
