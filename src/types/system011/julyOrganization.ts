/** julyOrganization 模块契约类型（/julyOrganization/v1/*） */

/** 组织（julyOrganization 树/列表） */
export interface JulyOrganizationVo011 {
  id: string; // UUID 字符串
  parentId: string; // 上级组织 id（根为空串）
  orgCode: string; // 组织编码（唯一）
  orgName: string; // 组织名称
  pkUser: string | null; // 负责人（pk_user，可空）
  orgLevel: number; // 组织层级（根为 1）
  sortOrder: number; // 排序（同级内）
  status: string; // 组织状态（0 停用 / 1 启用）
  memberCount: number | null; // 组织人数（可空）
  children?: JulyOrganizationVo011[];
  createBy?: string;
  updateBy?: string;
  createTime?: string;
  updateTime?: string;
}

/** 新增组织（julyOrganization/v1/insert，层级由上级推导） */
export interface JulyOrganizationInsertVo011 {
  orgCode: string; // 组织编码（唯一）
  orgName: string; // 组织名称
  pkUser?: string; // 负责人（用户 id）
  parentId?: string; // 上级组织 id（无可空/空串 = 顶级）
  sortOrder?: number; // 同级排序
}

/** 修改组织（julyOrganization/v1/update，编码不可改，可移动上级并重排层级） */
export interface JulyOrganizationUpdateVo011 {
  id: string;
  orgName: string;
  pkUser?: string;
  parentId?: string;
  sortOrder?: number;
}

/** 组织查询参数（julyOrganization/v1/selectListByPage） */
export interface JulyOrganizationQueryVo011 {
  pageIndex: number;
  pageSize: number;
  keyword?: string;
}
