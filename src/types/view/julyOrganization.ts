/** 组织管理页 UI 视图类型（前端展示用，非后端契约） */

/** 组织树节点视图（由 JulyOrganizationVo011 投影） */
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
