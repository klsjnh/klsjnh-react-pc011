/** julyOrganization 模块 - 后端契约类型（DTO/VO，与 swagger 一一对应） */
import type { BaseVo011 } from '@/types/common';

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
