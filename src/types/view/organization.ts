/** 组织 / 组织树 UI 类型 */
import type { JulyOrganizationVo011 } from '../system011';

/** 组织树节点视图（穿梭框 / 选择器用；id 为后端 UUID 字符串） */
export interface OrgTreeNode {
  id: string;
  name: string;
  type: string;
  children?: OrgTreeNode[];
}

/** 组织树节点视图（julyOrganization 页面用，id 为 UUID 字符串） */
export interface OrgDeptNode {
  id: string;
  name: string;
  code: string;
  leader: string;
  leaderId: string;
  count: number;
  level: number;
  sortOrder: number;
  children?: OrgDeptNode[];
}

/** 组织 store 状态 */
export interface OrgState {
  tree: JulyOrganizationVo011[];
  /** 组织 id → 名称（用户「所属组织」列解析用） */
  orgNameById: Map<string, string>;
  loading: boolean;
}
