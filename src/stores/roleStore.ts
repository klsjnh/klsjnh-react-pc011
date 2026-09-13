/**
 * 角色状态管理（主子表：角色 → 关联用户 + 权限项目）
 *
 * 数据源：统一 mock 后端（真实 JulyRoleVo011 / JulyUserVo011 / JulyOrganizationVo011 形状）
 * 经 src/services/system011.ts 拉取；角色-权限 / 角色-用户 关系由前端 mockRelations 投影
 * （真实后端经 julyRole/v1/updatePermission、julyRoleUser/v1/insert 维护）。
 * mock / api 两种模式拿到的结构一致，仅来源不同。
 */
import { useSyncExternalStore, useMemo } from 'react';
import { isMockMode } from '../config/appConfig';
import { api, fireApi } from '../api/request';
import {
  selectRoleListByPage, selectUserListByPage, selectOrganizationListByPage,
} from '../services/system011';
import { mockRelations } from '../mock/system011';
import type {
  JulyRoleVo011, JulyUserVo011, JulyOrganizationVo011,
} from '../types/system011';

/** UI 投影：角色（id 为后端 UUID 字符串，禁止数字化） */
export interface RoleDetail {
  id: string;
  name: string;            // roleCode
  label: string;           // roleName
  description: string;     // remark
  status: 'active' | 'inactive';
  isBuiltin: boolean;
  permissions: string[];
  userIds: string[];
}

/** UI 投影：用户（username/realName/department 来自 JulyUserVo011；id 为 UUID 字符串） */
export interface UserInfo {
  id: string;
  username: string;        // userAccount
  realName: string;        // userName
  department: string;      // 组织名称（orgName(pkOrg)）
  departmentId: string;    // 组织 id（pkOrg，UUID 字符串）
}

/** UI 投影：组织树（供用户穿梭框；id 为 UUID 字符串） */
export interface OrgTreeNode {
  id: string;
  name: string;
  type: string;
  children?: OrgTreeNode[];
}

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

export interface RoleState {
  roles: RoleDetail[];
  users: UserInfo[];
  orgTree: OrgTreeNode[];
  loaded: boolean;
  loading: boolean;
}

// ==================== Store 实现 ====================

let state: RoleState = {
  roles: [], users: [], orgTree: [], loaded: false, loading: false,
};

const listeners = new Set<() => void>();

function getSnapshot(): RoleState { return state; }
function subscribe(l: () => void) { listeners.add(l); return () => listeners.delete(l); }
function emit() { state = { ...state }; listeners.forEach((l) => l()); }

export const roleStore = {
  getSnapshot,
  subscribe,

  /** 初始化加载（mock / api 共用 services 层，统一经 request.ts 路由） */
  load: async () => {
    if (state.loading || state.loaded) return;
    state = { ...state, loading: true };
    try {
      const [rolePage, userPage, orgPage] = await Promise.all([
        selectRoleListByPage({ pageIndex: 1, pageSize: 100 }),
        selectUserListByPage({ pageIndex: 1, pageSize: 100 }),
        selectOrganizationListByPage({ pageIndex: 1, pageSize: 100 }),
      ]);
      const userAccountToId = new Map<string, string>(
        userPage.rows.map((u) => [u.userAccount, u.id] as [string, string]),
      );
      // 组织 id → 名称（由真实组织树构建，用户「所属组织」列据此解析）
      const orgNameById = new Map<string, string>();
      (function walkOrgs(list: JulyOrganizationVo011[]) {
        for (const o of list) {
          orgNameById.set(o.id, o.orgName);
          if (o.children) walkOrgs(o.children);
        }
      })(orgPage.rows);
      state = {
        roles: rolePage.rows.map((r) => projectRole(r, userAccountToId)),
        users: userPage.rows.map((u) => projectUser(u, orgNameById)),
        orgTree: orgPage.rows.map(projectOrg),
        loaded: true,
        loading: false,
      };
    } catch {
      // 加载失败：保留空数据，loaded 仍为 false，登录后可 reload 重试
      state = { ...state, loading: false };
    } finally {
      emit();
    }
  },

  /** 清空缓存重新加载（切换数据模式后调用） */
  reload: async () => {
    state = { roles: [], users: [], orgTree: [], loaded: false, loading: false };
    await roleStore.load();
  },

  /** 角色列表 */
  getRoles: () => state.roles,

  /** 根据 ID 获取角色详情 */
  getRole: (id: string) => state.roles.find((r) => r.id === id),

  /** 获取角色关联的用户信息 */
  getRoleUsers: (roleId: string): UserInfo[] => {
    const role = state.roles.find((r) => r.id === roleId);
    if (!role) return [];
    return role.userIds.map((id) => state.users.find((u) => u.id === id)!).filter(Boolean);
  },

  /** 获取未关联该角色的用户 */
  getUnassignedUsers: (roleId: string): UserInfo[] => {
    const role = state.roles.find((r) => r.id === roleId);
    if (!role) return [];
    return state.users.filter((u) => !role.userIds.includes(u.id));
  },

  /** 添加角色（投影层）；api 模式静默写回真实后端 */
  addRole: (data: Omit<RoleDetail, 'id' | 'userIds'>) => {
    const created: RoleDetail = { ...data, id: `tmp-role-${Date.now()}`, userIds: [] };
    state = { ...state, roles: [...state.roles, created] };
    if (!isMockMode()) fireApi('/julyRole/v1/insert', { roleCode: data.name, roleName: data.label, remark: data.description });
    emit();
  },

  /** 更新角色 */
  updateRole: (id: string, data: Partial<RoleDetail>) => {
    state = { ...state, roles: state.roles.map((r) => (r.id === id ? { ...r, ...data } : r)) };
    if (!isMockMode()) fireApi('/julyRole/v1/update', { id, ...data });
    emit();
  },

  /** 删除角色 */
  removeRole: (id: string) => {
    state = { ...state, roles: state.roles.filter((r) => r.id !== id) };
    if (!isMockMode()) fireApi('/julyRole/v1/logicDelete', { id });
    emit();
  },

  /** 分配权限 */
  assignPermissions: (roleId: string, keys: string[]) => {
    state = { ...state, roles: state.roles.map((r) => (r.id === roleId ? { ...r, permissions: keys } : r)) };
    if (!isMockMode()) fireApi('/julyRole/v1/updatePermission', { id: roleId, permissions: keys });
    emit();
  },

  /** 添加用户到角色 */
  addUserToRole: (roleId: string, userId: string) => {
    state = {
      ...state,
      roles: state.roles.map((r) => {
        if (r.id !== roleId) return r;
        if (r.userIds.includes(userId)) return r;
        return { ...r, userIds: [...r.userIds, userId] };
      }),
    };
    if (!isMockMode()) fireApi('/julyRoleUser/v1/insert', { roleId, userId });
    emit();
  },

  /** 从角色移除用户 */
  removeUserFromRole: (roleId: string, userId: string) => {
    state = {
      ...state,
      roles: state.roles.map((r) => {
        if (r.id !== roleId) return r;
        return { ...r, userIds: r.userIds.filter((id) => id !== userId) };
      }),
    };
    if (!isMockMode()) fireApi('/julyRoleUser/v1/logicDelete', { roleId, userId });
    emit();
  },
};

// ==================== Hooks ====================

export function useRoleState(): RoleState {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}

export function useRoles(): RoleDetail[] {
  const { roles } = useRoleState();
  return useMemo(() => roles, [roles]);
}
