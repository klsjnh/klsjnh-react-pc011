/** julyUserAudit 模块 - 后端契约类型（DTO/VO，与 swagger 一一对应） */
import type { BaseVo011 } from '@/types/common';

// ==================== 契约（/julyUserAudit/v1/*） ====================

/** 审计事件类型 */
export type JulyUserAuditType011 =
  | 'LOGIN'
  | 'LOGIN_FAILED'
  | 'LOGOUT'
  | 'CHANGE_PASSWORD'
  | 'EXPORT'
  | (string & {});

/** 审计日志（julyUser 事件流水） */
export interface JulyUserAuditVo011 extends BaseVo011 {
  pkMt: string | null;
  userAccount: string;
  auditType: JulyUserAuditType011;
  objectCode: string;
  auditContent: string;
  auditIp: string;
  createTime: string;
}

/** 审计查询参数 */
export interface JulyUserAuditQueryVo011 {
  pageIndex: number;
  pageSize: number;
  userAccount?: string;
  auditType?: string;
  beginTime?: string;
  endTime?: string;
}
