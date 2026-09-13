/**
 * 统一 Mock 后端出口（system011）
 * 各模块 handler 见同目录 julyUser / julyRole / julyOrganization / julyUserAudit / julyMenu / notification。
 * 按真实 action 路径分发；无对应 handler 时返回 null（调用方回退到真实请求）。
 */
import type { MockEnvelope, Handler } from './common';
import { handlers as julyUserHandlers } from './julyUser';
import { handlers as julyRoleHandlers } from './julyRole';
import { handlers as julyOrganizationHandlers } from './julyOrganization';
import { handlers as julyUserAuditHandlers } from './julyUserAudit';
import { handlers as julyMenuHandlers } from './julyMenu';
import { handlers as notificationHandlers } from './notification';

export type { MockEnvelope } from './common';
export { mockRelations } from './relations';

const handlers: Record<string, Handler> = {
  ...julyUserHandlers,
  ...julyRoleHandlers,
  ...julyOrganizationHandlers,
  ...julyUserAuditHandlers,
  ...julyMenuHandlers,
  ...notificationHandlers,
};

export function getMockResponse(action: string, body?: any): Promise<MockEnvelope<any>> | null {
  const handler = handlers[action];
  if (!handler) return null;
  return handler(body);
}
