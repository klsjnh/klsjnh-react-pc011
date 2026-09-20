/**
 * 用户审计服务（julyUserAudit/v1/*）
 * ⚠️ 2026-09-20 后端换版（192.168.3.160:11160）：userAudit 迁到 iam 模块，
 * 统一传 baseOverride = IAM_BASE（'/klsjnh/iam'）。
 */
import { api } from '@/api/request';
import { IAM_BASE, SYSTEM011_ACTIONS } from '@/services/system011/actions';
import type {
  JulyUserAuditVo011,
  JulyUserAuditQueryVo011,
  PageResult011,
} from '@/types/system011';

/** 审计日志分页查询（julyUser 事件流水） */
export function selectUserAuditListByPage(body: object = {}): Promise<PageResult011<JulyUserAuditVo011>> {
  return api.post<PageResult011<JulyUserAuditVo011>>(
    SYSTEM011_ACTIONS.userAudit.selectListByPage,
    body as JulyUserAuditQueryVo011,
    IAM_BASE,
  );
}
