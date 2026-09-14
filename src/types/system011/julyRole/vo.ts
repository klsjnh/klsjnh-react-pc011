/** julyRole 模块 - 后端契约类型（DTO/VO，与 swagger 一一对应） */
import type { BaseVo011 } from '@/types/common';

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
