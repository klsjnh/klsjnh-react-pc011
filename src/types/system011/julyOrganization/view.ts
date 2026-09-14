/** julyOrganization 模块 - 前端视图类型（表格行、store 状态、表单值等） */
import type { JulyUserView } from '@/types/system011/julyUser/view';
import type { JulyOrganizationVo011 } from '@/types/system011/julyOrganization/vo';

// ==================== 视图 ====================

export interface OrgState {
  tree: JulyOrganizationVo011[];
  /** 组织 id → 名称（用户「所属组织」列解析用） */
  orgNameById: Map<string, string>;
  loading: boolean;
}

export interface OrganizationFormModalProps {
  open: boolean;
  mode: 'create' | 'edit';
  node: JulyOrganizationVo011 | null;
  departments: JulyOrganizationVo011[];
  users: JulyUserView[];
  initialParentId: string;
  onClose: () => void;
  onSaved: () => void;
}
