/** 出站消息服务（julyOutboundMessage/v1/*）—— 列表查询 + 发送 / 重发 + 删除 */
import { api } from '@/api/request';
import { MESSAGE_CENTER_BASE } from '@/services/messageCenter/base';
import type {
  JulyOutboundMessageVo011, JulyOutboundMessageQueryVo011,
  JulyOutboundMessageSendVo011, JulyOutboundMessageSendResultVo011,
} from '@/types/messageCenter';
import type { PageResult011, IdVo011 } from '@/types/common';

const ACTIONS = {
  send: '/julyOutboundMessage/v1/send',
  resend: '/julyOutboundMessage/v1/resend',
  selectListByPage: '/julyOutboundMessage/v1/selectListByPage',
  logicDelete: '/julyOutboundMessage/v1/logicDelete',
  logicDeleteBatch: '/julyOutboundMessage/v1/logicDeleteBatch',
} as const;

/** 发送消息（templateCode + params 或直接 title/content，二选一） */
export function sendOutboundMessage(body: JulyOutboundMessageSendVo011): Promise<JulyOutboundMessageSendResultVo011> {
  return api.post<JulyOutboundMessageSendResultVo011>(ACTIONS.send, body, MESSAGE_CENTER_BASE);
}

/** 重发历史消息（按 id；走原通道与内容） */
export function resendOutboundMessage(id: string): Promise<JulyOutboundMessageSendResultVo011> {
  return api.post<JulyOutboundMessageSendResultVo011>(ACTIONS.resend, { id }, MESSAGE_CENTER_BASE);
}

export function selectOutboundMessageListByPage(body: JulyOutboundMessageQueryVo011): Promise<PageResult011<JulyOutboundMessageVo011>> {
  return api.post<PageResult011<JulyOutboundMessageVo011>>(ACTIONS.selectListByPage, body, MESSAGE_CENTER_BASE);
}

export async function removeOutboundMessage(id: string): Promise<void> {
  await api.post<IdVo011>(ACTIONS.logicDelete, { id }, MESSAGE_CENTER_BASE);
}

export async function removeOutboundMessageBatch(ids: string[]): Promise<void> {
  await api.post<IdVo011>(ACTIONS.logicDeleteBatch, { ids }, MESSAGE_CENTER_BASE);
}
