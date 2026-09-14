/** julyRole 模块 - 前端视图类型（表格行、store 状态、表单值等） */
import type { JulyUserView } from '../julyUser/view';
import type { JulyOrganizationVo011 } from '../julyOrganization/vo';
import type { JulyRoleVo011 } from './vo';

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
