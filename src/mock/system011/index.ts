/**
 * 统一 Mock 后端出口（system011）
 * 各模块 handler 见同目录 julyUser / julyRole / julyOrganization / julyUserAudit / julyMenu / notification。
 * 按真实 action 路径分发；无对应 handler 时返回 null（调用方回退到真实请求）。
 */
import type { MockEnvelope, Handler } from '@/mock/system011/common';
import { handlers as julyUserHandlers } from '@/mock/system011/julyUser';
import { handlers as julyRoleHandlers } from '@/mock/system011/julyRole';
import { handlers as julyOrganizationHandlers } from '@/mock/system011/julyOrganization';
import { handlers as julyUserAuditHandlers } from '@/mock/system011/julyUserAudit';
import { handlers as julyMenuHandlers } from '@/mock/system011/julyMenu';
import { handlers as julyConfigHandlers } from '@/mock/system011/julyConfig';
import { handlers as julySchedulerHandlers } from '@/mock/system011/julyScheduler';
import { handlers as exportHandlers } from '@/mock/system011/exportData';
import { handlers as notificationHandlers } from '@/mock/system011/notification';

export type { MockEnvelope } from '@/mock/system011/common';
export { mockRelations } from '@/mock/system011/relations';

const handlers: Record<string, Handler> = {
  ...julyUserHandlers,
  ...julyRoleHandlers,
  ...julyOrganizationHandlers,
  ...julyUserAuditHandlers,
  ...julyMenuHandlers,
  ...julyConfigHandlers,
  ...julySchedulerHandlers,
  ...exportHandlers,
  ...notificationHandlers,
};

export function getMockResponse(action: string, body?: any): Promise<MockEnvelope<any>> | null {
  const handler = handlers[action];
  if (!handler) return null;
  return handler(body);
}
