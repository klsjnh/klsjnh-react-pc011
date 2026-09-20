/** 出站模板服务（julyOutboundTemplate/v1/*）—— 标准 CRUD + 批量删 */
import { api } from '@/api/request';
import { MESSAGE_CENTER_BASE } from '@/services/messageCenter/base';
import type {
  JulyOutboundTemplateVo011, JulyOutboundTemplateQueryVo011,
  JulyOutboundTemplateInsertVo011, JulyOutboundTemplateUpdateVo011,
} from '@/types/messageCenter';
import type { PageResult011, IdVo011 } from '@/types/common';

const ACTIONS = {
  selectListByPage: '/julyOutboundTemplate/v1/selectListByPage',
  getById: '/julyOutboundTemplate/v1/getById',
  insert: '/julyOutboundTemplate/v1/insert',
  update: '/julyOutboundTemplate/v1/update',
  logicDelete: '/julyOutboundTemplate/v1/logicDelete',
  logicDeleteBatch: '/julyOutboundTemplate/v1/logicDeleteBatch',
} as const;

export function selectOutboundTemplateListByPage(body: JulyOutboundTemplateQueryVo011): Promise<PageResult011<JulyOutboundTemplateVo011>> {
  return api.post<PageResult011<JulyOutboundTemplateVo011>>(ACTIONS.selectListByPage, body, MESSAGE_CENTER_BASE);
}

export function getOutboundTemplateById(id: string): Promise<JulyOutboundTemplateVo011> {
  return api.get<JulyOutboundTemplateVo011>(ACTIONS.getById, { id }, MESSAGE_CENTER_BASE);
}

export async function saveOutboundTemplate(params: JulyOutboundTemplateInsertVo011 & { id?: string }): Promise<string> {
  const { id, ...rest } = params;
  const { id: savedId } = id
    ? await api.post<IdVo011>(ACTIONS.update, { id, ...rest } as JulyOutboundTemplateUpdateVo011, MESSAGE_CENTER_BASE)
    : await api.post<IdVo011>(ACTIONS.insert, rest as JulyOutboundTemplateInsertVo011, MESSAGE_CENTER_BASE);
  return savedId;
}

export async function removeOutboundTemplate(id: string): Promise<void> {
  await api.post<IdVo011>(ACTIONS.logicDelete, { id }, MESSAGE_CENTER_BASE);
}

export async function removeOutboundTemplateBatch(ids: string[]): Promise<void> {
  await api.post<IdVo011>(ACTIONS.logicDeleteBatch, { ids }, MESSAGE_CENTER_BASE);
}
