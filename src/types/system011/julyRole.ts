/** julyRole 模块类型（契约 + 视图，合并单文件） */
import type { BaseVo011 } from '@/types/common';
import type { JulyUserView } from './julyUser';
import type { JulyOrganizationVo011 } from './julyOrganization';

// ==================== 契约（/julyRole/v1/*） ====================

/** 角色（列表/详情） */
export interface JulyRoleVo011 extends BaseVo011 {
  roleCode: string;
  roleName: string;
  isBuiltin: string;
  remark: string | null;
  status: string;
}

export interface JulyRoleQueryVo011 {
  pageIndex: number;
  pageSize: number;
  keyword?: string;
}

export interface JulyRoleAssignMenusVo011 {
  id: string;
  pkMenus: string[];
}

// ==================== 视图 ====================

/** 角色视图：后端字段 + 关联权限编码 / 关联用户 id */
export interface RoleDetail extends JulyRoleVo011 {
  permissions: string[];
  userIds: string[];
}

export interface RoleState {
  roles: RoleDetail[];
  users: JulyUserView[];
  orgTree: JulyOrganizationVo011[];
  loaded: boolean;
  loading: boolean;
}

export interface RoleFormModalProps {
  open: boolean;
  role: RoleDetail | null;
  onClose: () => void;
}
