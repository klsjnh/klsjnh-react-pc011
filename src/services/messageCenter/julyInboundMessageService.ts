/** 入站消息服务（julyInboundMessage/v1/*）—— 列表查询 + 模拟接收 + 删除 */
import { api } from '@/api/request';
import { MESSAGE_CENTER_BASE } from '@/services/messageCenter/base';
import type {
  JulyInboundMessageVo011, JulyInboundMessageQueryVo011,
  JulyInboundReceiveVo011, JulyInboundReceiveResultVo011,
} from '@/types/messageCenter';
import type { PageResult011, IdVo011 } from '@/types/common';

const ACTIONS = {
  receive: '/julyInboundMessage/v1/receive',
  selectListByPage: '/julyInboundMessage/v1/selectListByPage',
  logicDelete: '/julyInboundMessage/v1/logicDelete',
  logicDeleteBatch: '/julyInboundMessage/v1/logicDeleteBatch',
} as const;

/**
 * 模拟第三方回调（rawBody 为回调原文 JSON 字符串）。
 * 生产环境该端点是第三方 webhook 打进来的；本入口供前后端联调手动推送。
 * duplicate=true 表示重复投递（后端幂等命中已存在消息）。
 */
export function receiveInboundMessage(body: JulyInboundReceiveVo011): Promise<JulyInboundReceiveResultVo011> {
  return api.post<JulyInboundReceiveResultVo011>(ACTIONS.receive, body, MESSAGE_CENTER_BASE);
}

export function selectInboundMessageListByPage(body: JulyInboundMessageQueryVo011): Promise<PageResult011<JulyInboundMessageVo011>> {
  return api.post<PageResult011<JulyInboundMessageVo011>>(ACTIONS.selectListByPage, body, MESSAGE_CENTER_BASE);
}

export async function removeInboundMessage(id: string): Promise<void> {
  await api.post<IdVo011>(ACTIONS.logicDelete, { id }, MESSAGE_CENTER_BASE);
}

export async function removeInboundMessageBatch(ids: string[]): Promise<void> {
  await api.post<IdVo011>(ACTIONS.logicDeleteBatch, { ids }, MESSAGE_CENTER_BASE);
}
