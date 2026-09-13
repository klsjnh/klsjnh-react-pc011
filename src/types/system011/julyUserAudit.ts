/** julyUserAudit 模块契约类型（/julyUserAudit/v1/*） */

/** 审计事件类型（julyUserAudit.auditType；取自真实后端实测枚举） */
export type JulyUserAuditType011 =
  | 'LOGIN'
  | 'LOGIN_FAILED'
  | 'LOGOUT'
  | 'CHANGE_PASSWORD'
  | 'EXPORT'
  | (string & {});

/** 审计日志（julyUser 事件流水，julyUserAudit/v1/selectListByPage） */
export interface JulyUserAuditVo011 {
  id: string;
  pkMt: string | null; // 操作者 id（登录失败可空）
  userAccount: string; // 操作者账号（冗余）
  auditType: JulyUserAuditType011; // 事件类型
  objectCode: string; // 对象编码（如 july_user）
  auditContent: string; // 事件描述
  auditIp: string; // 客户端 IP
  createTime: string; // 事件时间
}

/** 审计查询参数（julyUserAudit/v1/selectListByPage） */
export interface JulyUserAuditQueryVo011 {
  pageIndex: number;
  pageSize: number;
  userAccount?: string; // 操作者账号（模糊）
  auditType?: string; // 事件类型（精确）
  beginTime?: string; // 事件时间下界（含）
  endTime?: string; // 事件时间上界（含）
}
