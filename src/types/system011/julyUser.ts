/** julyUser 模块类型（契约 + 视图，合并单文件） */
import type { BaseVo011 } from '@/types/common';
import type { JulyRoleVo011 } from './julyRole';
import type { JulyOrganizationVo011 } from './julyOrganization';

// ==================== 契约（/julyUser/v1/*） ====================

export interface JulyUserLoginVo011 {
  userAccount: string;
  password: string;
}

export interface JulyUserLoginByNameVo011 {
  userAccount: string;
}

export interface JulyUserSessionVo011 {
  token: string;
  userAccount: string;
  userName: string;
  roles: string[];
}

/** 用户（列表/详情） */
export interface JulyUserVo011 extends BaseVo011 {
  userAccount: string;
  userName: string;
  mobile: string | null;
  email: string | null;
  avatar: string | null;
  pkOrg: string | null;
  lastLoginTime: string | null;
  status: string;
}

export interface JulyUserQueryVo011 {
  pageIndex: number;
  pageSize: number;
  userAccount?: string;
  userName?: string;
}

export interface JulyUserInsertVo011 {
  userAccount: string;
  userName: string;
  password: string;
  mobile?: string;
  email?: string;
  avatar?: string;
  pkOrg?: string;
}

export interface JulyUserUpdateVo011 {
  id: string;
  userName: string;
  mobile?: string;
  email?: string;
  avatar?: string;
  pkOrg?: string;
}

export interface JulyUserAssignRolesVo011 {
  id: string;
  pkRoles: string[];
}

/** 用户保存入参（service 编排用：有 id = 编辑；roleIds 一并传入） */
export interface SaveUserParams {
  id?: string;
  userAccount: string;
  userName: string;
  password?: string;
  mobile?: string;
  email?: string;
  pkOrg?: string;
  roleIds?: string[];
}

// ==================== 视图 ====================

/** 用户列表行视图：后端字段 + 关联解析（组织名 / 角色编码） */
export interface JulyUserView extends JulyUserVo011 {
  department: string;
  roles: string[];
}

export interface UserState {
  list: JulyUserVo011[];
  total: number;
  totalPages: number;
  loading: boolean;
  query: JulyUserQueryVo011;
}

export interface JulyUserFormModalProps {
  open: boolean;
  user: JulyUserView | null;
  roles: JulyRoleVo011[];
  orgTree: JulyOrganizationVo011[];
  onClose: () => void;
  onSaved: () => void;
}
