/**
 * 角色状态管理（主子表：角色 → 关联用户 + 权限项目）
 */
import { useSyncExternalStore, useMemo } from 'react';
import { allPermissionKeys } from '../mock/permissionData';

export interface RoleDetail {
  id: number;
  name: string;
  label: string;
  description: string;
  status: 'active' | 'inactive';
  permissions: string[];
  userIds: number[];
}

interface UserInfo {
  id: number;
  username: string;
  realName: string;
  department: string;
}

export interface RoleState {
  roles: RoleDetail[];
  users: UserInfo[];
  loaded: boolean;
}

// ==================== 初始数据 ====================

const initialRoles: RoleDetail[] = [
  { id: 1, name: 'admin', label: '超级管理员', description: '拥有系统全部权限', status: 'active',
    permissions: allPermissionKeys, userIds: [1, 2] },
  { id: 2, name: 'manager', label: '部门经理', description: '管理部门内用户', status: 'active',
    permissions: ['dashboard:view', 'dashboard:export', 'system:user:list', 'system:user:create', 'system:user:update', 'organization:view'], userIds: [3, 4] },
  { id: 3, name: 'editor', label: '编辑人员', description: '负责内容编辑与发布', status: 'active',
    permissions: ['dashboard:view', 'system:user:list'], userIds: [5, 6, 7] },
  { id: 4, name: 'viewer', label: '只读用户', description: '仅可查看数据', status: 'active',
    permissions: ['dashboard:view'], userIds: [8, 9, 10, 11] },
  { id: 5, name: 'auditor', label: '审计员', description: '查看审计日志', status: 'active',
    permissions: ['dashboard:view', 'audit:login:view', 'audit:operation:view', 'audit:export'], userIds: [] },
];

const initialUsers: UserInfo[] = [
  { id: 1, username: 'admin', realName: '张三', department: '技术中心' },
  { id: 2, username: 'admin02', realName: '李四', department: '技术中心' },
  { id: 3, username: 'manager01', realName: '王五', department: '产品部' },
  { id: 4, username: 'manager02', realName: '赵六', department: '运营部' },
  { id: 5, username: 'editor01', realName: '孙七', department: '技术中心' },
  { id: 6, username: 'editor02', realName: '周八', department: '市场部' },
  { id: 7, username: 'editor03', realName: '吴九', department: '产品部' },
  { id: 8, username: 'viewer01', realName: '郑十', department: '财务部' },
  { id: 9, username: 'viewer02', realName: '钱十一', department: '人力资源部' },
  { id: 10, username: 'viewer03', realName: '陈十二', department: '市场部' },
  { id: 11, username: 'viewer04', realName: '林十三', department: '运营部' },
];

// ==================== Store ====================

let state: RoleState = {
  roles: JSON.parse(JSON.stringify(initialRoles)),
  users: [...initialUsers],
  loaded: false,
};

const listeners = new Set<() => void>();

function getSnapshot(): RoleState { return state; }
function subscribe(l: () => void) { listeners.add(l); return () => listeners.delete(l); }
function emit() { state = { ...state }; listeners.forEach((l) => l()); }

export const roleStore = {
  getSnapshot,
  subscribe,

  /** 初始化 */
  load: () => { if (!state.loaded) { state = { ...state, loaded: true }; emit(); } },

  /** 角色列表 */
  getRoles: () => state.roles,

  /** 根据 ID 获取角色详情 */
  getRole: (id: number) => state.roles.find(r => r.id === id),

  /** 获取角色关联的用户信息 */
  getRoleUsers: (roleId: number): UserInfo[] => {
    const role = state.roles.find(r => r.id === roleId);
    if (!role) return [];
    return role.userIds.map(id => state.users.find(u => u.id === id)!).filter(Boolean);
  },

  /** 获取未关联该角色的用户 */
  getUnassignedUsers: (roleId: number): UserInfo[] => {
    const role = state.roles.find(r => r.id === roleId);
    if (!role) return [];
    return state.users.filter(u => !role.userIds.includes(u.id));
  },

  /** 添加角色 */
  addRole: (data: Omit<RoleDetail, 'id' | 'userIds'>) => {
    const maxId = Math.max(0, ...state.roles.map(r => r.id));
    state.roles.push({ ...data, id: maxId + 1, userIds: [] });
    emit();
  },

  /** 更新角色 */
  updateRole: (id: number, data: Partial<RoleDetail>) => {
    state.roles = state.roles.map(r => r.id === id ? { ...r, ...data } : r);
    emit();
  },

  /** 删除角色 */
  removeRole: (id: number) => {
    state.roles = state.roles.filter(r => r.id !== id);
    emit();
  },

  /** 分配权限 */
  assignPermissions: (roleId: number, keys: string[]) => {
    state.roles = state.roles.map(r => r.id === roleId ? { ...r, permissions: keys } : r);
    emit();
  },

  /** 添加用户到角色 */
  addUserToRole: (roleId: number, userId: number) => {
    state.roles = state.roles.map(r => {
      if (r.id !== roleId) return r;
      if (r.userIds.includes(userId)) return r;
      return { ...r, userIds: [...r.userIds, userId] };
    });
    emit();
  },

  /** 从角色移除用户 */
  removeUserFromRole: (roleId: number, userId: number) => {
    state.roles = state.roles.map(r => {
      if (r.id !== roleId) return r;
      return { ...r, userIds: r.userIds.filter(id => id !== userId) };
    });
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
