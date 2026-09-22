/** 入站模板服务（julyInboundTemplate/v1/*）—— 标准 CRUD + 批量删（结构与出站对称） */
import { api } from '@/api/request';
import { MESSAGE_CENTER_BASE } from '@/services/messageCenter/base';
import type {
  JulyInboundTemplateVo011, JulyInboundTemplateQueryVo011,
  JulyInboundTemplateInsertVo011, JulyInboundTemplateUpdateVo011,
} from '@/types/messageCenter';
import type { PageResult011, IdVo011 } from '@/types/common';

const ACTIONS = {
  selectListByPage: '/julyInboundTemplate/v1/selectListByPage',
  getById: '/julyInboundTemplate/v1/getById',
  insert: '/julyInboundTemplate/v1/insert',
  update: '/julyInboundTemplate/v1/update',
  logicDelete: '/julyInboundTemplate/v1/logicDelete',
  logicDeleteBatch: '/julyInboundTemplate/v1/logicDeleteBatch',
} as const;

export function selectInboundTemplateListByPage(body: JulyInboundTemplateQueryVo011): Promise<PageResult011<JulyInboundTemplateVo011>> {
  return api.post<PageResult011<JulyInboundTemplateVo011>>(ACTIONS.selectListByPage, body, MESSAGE_CENTER_BASE);
}

export async function saveInboundTemplate(params: JulyInboundTemplateInsertVo011 & { id?: string }): Promise<string> {
  const { id, ...rest } = params;
  const { id: savedId } = id
    ? await api.post<IdVo011>(ACTIONS.update, { id, ...rest } as JulyInboundTemplateUpdateVo011, MESSAGE_CENTER_BASE)
    : await api.post<IdVo011>(ACTIONS.insert, rest as JulyInboundTemplateInsertVo011, MESSAGE_CENTER_BASE);
  return savedId;
}

export async function removeInboundTemplate(id: string): Promise<void> {
  await api.post<IdVo011>(ACTIONS.logicDelete, { id }, MESSAGE_CENTER_BASE);
}

export async function removeInboundTemplateBatch(ids: string[]): Promise<void> {
  await api.post<IdVo011>(ACTIONS.logicDeleteBatch, { ids }, MESSAGE_CENTER_BASE);
}
