/** 出站通道服务（julyOutboundChannel/v1/*）—— 标准 CRUD + 批量删 */
import { api } from '@/api/request';
import { MESSAGE_CENTER_BASE } from '@/services/messageCenter/base';
import type {
  JulyOutboundChannelVo011, JulyOutboundChannelQueryVo011,
  JulyOutboundChannelInsertVo011, JulyOutboundChannelUpdateVo011,
} from '@/types/messageCenter';
import type { PageResult011, IdVo011 } from '@/types/common';

const ACTIONS = {
  selectListByPage: '/julyOutboundChannel/v1/selectListByPage',
  getById: '/julyOutboundChannel/v1/getById',
  insert: '/julyOutboundChannel/v1/insert',
  update: '/julyOutboundChannel/v1/update',
  logicDelete: '/julyOutboundChannel/v1/logicDelete',
  logicDeleteBatch: '/julyOutboundChannel/v1/logicDeleteBatch',
} as const;

export function selectOutboundChannelListByPage(body: JulyOutboundChannelQueryVo011): Promise<PageResult011<JulyOutboundChannelVo011>> {
  return api.post<PageResult011<JulyOutboundChannelVo011>>(ACTIONS.selectListByPage, body, MESSAGE_CENTER_BASE);
}

export function getOutboundChannelById(id: string): Promise<JulyOutboundChannelVo011> {
  return api.get<JulyOutboundChannelVo011>(ACTIONS.getById, { id }, MESSAGE_CENTER_BASE);
}

export async function saveOutboundChannel(params: JulyOutboundChannelInsertVo011 & { id?: string }): Promise<string> {
  const { id, ...rest } = params;
  const { id: savedId } = id
    ? await api.post<IdVo011>(ACTIONS.update, { id, ...rest } as JulyOutboundChannelUpdateVo011, MESSAGE_CENTER_BASE)
    : await api.post<IdVo011>(ACTIONS.insert, rest as JulyOutboundChannelInsertVo011, MESSAGE_CENTER_BASE);
  return savedId;
}

export async function removeOutboundChannel(id: string): Promise<void> {
  await api.post<IdVo011>(ACTIONS.logicDelete, { id }, MESSAGE_CENTER_BASE);
}

export async function removeOutboundChannelBatch(ids: string[]): Promise<void> {
  await api.post<IdVo011>(ACTIONS.logicDeleteBatch, { ids }, MESSAGE_CENTER_BASE);
}
