/** julyConfig 模块 - 后端契约类型（DTO/VO，与 swagger 一一对应） */
import type { BaseVo011 } from '@/types/common';

// ==================== 契约（/julyConfig/v1/*） ====================

/** 配置项 */
export interface JulyConfigVo011 extends BaseVo011 {
  code: string;
  data: string;
  status: string;
}

export interface JulyConfigQueryVo011 {
  pageIndex: number;
  pageSize: number;
  keyword?: string;
}

/** 修改配置值（code 不可变） */
export interface JulyConfigUpdateVo011 {
  id: string;
  data: string;
}

/** 新增/更新配置（code 唯一） */
export interface JulyConfigUpsertVo {
  code: string;
  data: string;
}
