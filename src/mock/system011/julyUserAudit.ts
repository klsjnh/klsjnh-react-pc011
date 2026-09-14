/** Mock：用户审计（julyUserAudit） */
import { ok, delay, pageResult, type Handler } from '@/mock/system011/common';
import type { JulyUserAuditVo011 } from '@/types/system011';

/** 与真实后端同形：auditType 取 LOGIN / LOGIN_FAILED / LOGOUT / CHANGE_PASSWORD / EXPORT */
export const mockAudits: JulyUserAuditVo011[] = [
  { id: 'aud0000000000000000000000000001', pkMt: '19a2c9b330ab46078079e557e732d1ab', userAccount: 'klsjnh', auditType: 'LOGIN', objectCode: 'july_user', auditContent: 'passwordless login', auditIp: '192.168.3.30', createTime: '2026-09-13T15:43:16' },
  { id: 'aud0000000000000000000000000002', pkMt: null, userAccount: 'klsjnh', auditType: 'LOGIN_FAILED', objectCode: 'july_user', auditContent: 'wrong account or password', auditIp: '192.168.3.30', createTime: '2026-09-13T15:42:48' },
  { id: 'aud0000000000000000000000000003', pkMt: '19a2c9b330ab46078079e557e732d1ab', userAccount: 'klsjnh', auditType: 'LOGOUT', objectCode: 'july_user', auditContent: 'logout', auditIp: '192.168.3.30', createTime: '2026-09-13T15:30:49' },
  { id: 'aud0000000000000000000000000004', pkMt: '8070b9deec124a4bb0913e2ea56023c2', userAccount: 'zhangsan', auditType: 'LOGIN', objectCode: 'july_user', auditContent: 'password login', auditIp: '192.168.3.31', createTime: '2026-09-13T07:14:29' },
  { id: 'aud0000000000000000000000000005', pkMt: '8070b9deec124a4bb0913e2ea56023c2', userAccount: 'zhangsan', auditType: 'CHANGE_PASSWORD', objectCode: 'july_user', auditContent: 'change password', auditIp: '192.168.3.31', createTime: '2026-09-13T07:10:02' },
  { id: 'aud0000000000000000000000000006', pkMt: '8070b9deec124a4bb0913e2ea56023c2', userAccount: 'zhangsan', auditType: 'EXPORT', objectCode: 'julyUser', auditContent: 'export user list', auditIp: '192.168.3.31', createTime: '2026-09-12T22:29:43' },
];

export const handlers: Record<string, Handler> = {
  // ===== 审计日志分页（账号模糊 / 类型精确 / 时间段） =====
  '/julyUserAudit/v1/selectListByPage': async (body) => {
    await delay(350);
    let rows = [...mockAudits];
    const acct = (body?.userAccount || '').trim().toLowerCase();
    if (acct) rows = rows.filter((a) => a.userAccount.toLowerCase().includes(acct));
    if (body?.auditType) rows = rows.filter((a) => a.auditType === body.auditType);
    if (body?.beginTime) rows = rows.filter((a) => a.createTime >= body.beginTime);
    if (body?.endTime) rows = rows.filter((a) => a.createTime <= body.endTime);
    rows.sort((a, b) => (a.createTime < b.createTime ? 1 : -1));
    return ok(pageResult(rows, body?.pageIndex || 1, body?.pageSize || 10));
  },
};
