/** 用户审计服务（julyUserAudit/v1/*） */
import { api } from '@/api/request';
import { SYSTEM011_ACTIONS } from './actions';
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
  );
}
