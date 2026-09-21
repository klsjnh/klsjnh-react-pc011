/** julyScheduler 模块 - 后端契约类型（DTO/VO，与 swagger 一一对应） */
import type { BaseVo011 } from '@/types/common';

// ==================== 契约（/julyScheduler/v1/*） ====================

/** 定时任务 */
export interface JulySchedulerVo011 extends BaseVo011 {
  schedulerCode: string;
  schedulerName: string;
  schedulerHandler: string;
  schedulerCron: string;
  executeTimes: number;
  status: string;
  /** 前端先行字段：线上实体暂无 remark（2026-09-21 查证），后端补齐后生效 */
  remark?: string;
}

export interface JulySchedulerQueryVo011 {
  pageIndex: number;
  pageSize: number;
  schedulerCode?: string;
  schedulerName?: string;
  /** 前端先行字段：线上 QueryVo 暂无 status（2026-09-21 查证），后端补齐后生效；留空为全部 */
  status?: string;
}

/** 新增定时任务（默认停止态；status / remark 为前端先行字段，后端补齐后生效） */
export interface JulySchedulerInsertVo011 {
  schedulerCode: string;
  schedulerName: string;
  schedulerHandler: string;
  schedulerCron: string;
  status?: string;
  remark?: string;
}

/** 修改定时任务（含启停状态；remark 为前端先行字段，后端补齐后生效） */
export interface JulySchedulerUpdateVo011 {
  id: string;
  schedulerName: string;
  schedulerHandler: string;
  schedulerCron: string;
  status: string;
  remark?: string;
}
