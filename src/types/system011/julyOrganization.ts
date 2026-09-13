/** julyOrganization 模块类型（契约 + 视图，合并单文件） */
import type { BaseVo011 } from '@/types/common';
import type { JulyUserView } from './julyUser';

// ==================== 契约（/julyOrganization/v1/*） ====================

/** 组织（树/列表） */
export interface JulyOrganizationVo011 extends BaseVo011 {
  parentId: string;
  orgCode: string;
  orgName: string;
  pkUser: string | null;
  orgLevel: number;
  sortOrder: number;
  status: string;
  memberCount: number | null;
  children?: JulyOrganizationVo011[];
}

export interface JulyOrganizationInsertVo011 {
  orgCode: string;
  orgName: string;
  pkUser?: string;
  parentId?: string;
  sortOrder?: number;
}

export interface JulyOrganizationUpdateVo011 {
  id: string;
  orgName: string;
  pkUser?: string;
  parentId?: string;
  sortOrder?: number;
}

export interface JulyOrganizationQueryVo011 {
  pageIndex: number;
  pageSize: number;
  keyword?: string;
}

/** 组织保存入参（service 编排用：有 id = 编辑） */
export interface SaveOrganizationParams {
  id?: string;
  orgCode?: string;
  orgName: string;
  pkUser?: string;
  parentId?: string;
  sortOrder?: number;
}

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
