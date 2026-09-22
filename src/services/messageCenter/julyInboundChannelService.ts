/** 入站通道服务（julyInboundChannel/v1/*）—— 标准 CRUD + 批量删（结构与出站对称） */
import { api } from '@/api/request';
import { MESSAGE_CENTER_BASE } from '@/services/messageCenter/base';
import type {
  JulyInboundChannelVo011, JulyInboundChannelQueryVo011,
  JulyInboundChannelInsertVo011, JulyInboundChannelUpdateVo011,
} from '@/types/messageCenter';
import type { PageResult011, IdVo011 } from '@/types/common';

const ACTIONS = {
  selectListByPage: '/julyInboundChannel/v1/selectListByPage',
  getById: '/julyInboundChannel/v1/getById',
  insert: '/julyInboundChannel/v1/insert',
  update: '/julyInboundChannel/v1/update',
  logicDelete: '/julyInboundChannel/v1/logicDelete',
  logicDeleteBatch: '/julyInboundChannel/v1/logicDeleteBatch',
} as const;

export function selectInboundChannelListByPage(body: JulyInboundChannelQueryVo011): Promise<PageResult011<JulyInboundChannelVo011>> {
  return api.post<PageResult011<JulyInboundChannelVo011>>(ACTIONS.selectListByPage, body, MESSAGE_CENTER_BASE);
}

export async function saveInboundChannel(params: JulyInboundChannelInsertVo011 & { id?: string }): Promise<string> {
  const { id, ...rest } = params;
  const { id: savedId } = id
    ? await api.post<IdVo011>(ACTIONS.update, { id, ...rest } as JulyInboundChannelUpdateVo011, MESSAGE_CENTER_BASE)
    : await api.post<IdVo011>(ACTIONS.insert, rest as JulyInboundChannelInsertVo011, MESSAGE_CENTER_BASE);
  return savedId;
}

export async function removeInboundChannel(id: string): Promise<void> {
  await api.post<IdVo011>(ACTIONS.logicDelete, { id }, MESSAGE_CENTER_BASE);
}

export async function removeInboundChannelBatch(ids: string[]): Promise<void> {
  await api.post<IdVo011>(ACTIONS.logicDeleteBatch, { ids }, MESSAGE_CENTER_BASE);
}
