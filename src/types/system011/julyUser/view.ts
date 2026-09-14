/** julyUser 模块 - 前端视图类型（表格行、store 状态、表单值等） */
import type { JulyRoleVo011 } from '@/types/system011/julyRole/vo';
import type { JulyOrganizationVo011 } from '@/types/system011/julyOrganization/vo';
import type { JulyUserVo011, JulyUserQueryVo011 } from '@/types/system011/julyUser/vo';

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
