/**
 * 统一权限数据（所有角色/权限相关页面共用）
 * 键格式统一: colon 格式（system:user:list）
 */
import type { PermissionItem, PermissionModule } from '@/types/view/mock';

export type { PermissionItem, PermissionModule };

export const permissionModules: PermissionModule[] = [
  {
    module: '仪表盘', icon: '📊',
    items: [
      { key: 'dashboard:view', label: '查看仪表盘' },
      { key: 'dashboard:export', label: '导出报表' },
    ],
  },
  {
    module: '用户管理', icon: '👥',
    items: [
      { key: 'system:user:list', label: '查看列表' },
      { key: 'system:user:create', label: '创建用户' },
      { key: 'system:user:update', label: '编辑用户' },
      { key: 'system:user:delete', label: '删除用户' },
    ],
  },
  {
    module: '角色管理', icon: '🛡',
    items: [
      { key: 'system:role:list', label: '查看列表' },
      { key: 'system:role:create', label: '创建角色' },
      { key: 'system:role:update', label: '编辑角色' },
      { key: 'system:role:delete', label: '删除角色' },
    ],
  },
  {
    module: '菜单管理', icon: '📋',
    items: [
      { key: 'system:menu:list', label: '查看菜单' },
      { key: 'system:menu:manage', label: '管理菜单' },
    ],
  },
  {
    module: '审计日志', icon: '📝',
    items: [
      { key: 'audit:login:view', label: '登录日志' },
      { key: 'audit:operation:view', label: '操作日志' },
      { key: 'audit:export', label: '导出日志' },
    ],
  },
  {
    module: '组织管理', icon: '🏢',
    items: [
      { key: 'organization:view', label: '查看组织' },
      { key: 'organization:manage', label: '管理组织' },
    ],
  },
];

/** 所有权限 key 展开列表 */
export const allPermissionKeys = permissionModules.flatMap(m => m.items.map(i => i.key));

/** key → label 映射 */
export const permissionLabelMap: Record<string, string> = Object.fromEntries(
  permissionModules.flatMap(m => m.items.map(i => [i.key, i.label]))
);
