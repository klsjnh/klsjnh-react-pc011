/**
 * AI 提示词服务（aicenter · julyAiPrompt/v1/*）
 * 对齐后端 AiPromptController（2026-09-20 线上 11160 实测 11 端点）：
 *   主表：selectListByPage / getById / getByCode / insert / update / logicDelete
 *   明细：insertDetail / updateDetail / logicDeleteDetail / getContent
 *   渲染：render（${var} 替换）
 * ⚠️ 后端暂无「按提示词查明细列表」端点（use case details(pkMt) 已存在待暴露），
 *   selectDetailListByPrompt 按后端命名惯例（对照 selectApiListByProvider）先行约定，
 *   mock 已实现；API 模式待用户补后端后自动生效。
 *
 * 分层：page → service → store；store 不调用 service。
 */
import { api } from '@/api/request';
import { AICENTER_BASE } from '@/services/aiCenter/julyAiModelProviderService';
import { julyAiPromptStore } from '@/stores/aiCenter/julyAiPromptStore';
import type {
  JulyAiPromptItem,
  JulyAiPromptDetailItem,
  JulyAiPromptQueryVo011,
  JulyAiPromptInsertVo011,
  JulyAiPromptUpdateVo011,
  JulyAiPromptDetailSaveVo011,
  JulyAiPromptRenderVo011,
  SaveJulyAiPromptParams,
} from '@/types/aiCenter/aiPrompt/vo';
import type { PageResult011, IdVo011 } from '@/types/common';

/** 动作路径（相对路径，请求 URL = AICENTER_BASE + action） */
const AI_PROMPT_ACTIONS = {
  selectListByPage: '/julyAiPrompt/v1/selectListByPage',
  getById: '/julyAiPrompt/v1/getById',
  getByCode: '/julyAiPrompt/v1/getByCode',
  insert: '/julyAiPrompt/v1/insert',
  update: '/julyAiPrompt/v1/update',
  logicDelete: '/julyAiPrompt/v1/logicDelete',
  insertDetail: '/julyAiPrompt/v1/insertDetail',
  updateDetail: '/julyAiPrompt/v1/updateDetail',
  logicDeleteDetail: '/julyAiPrompt/v1/logicDeleteDetail',
  /** ⚠️ 后端待补（use case 已有 details(pkMt)，差 HTTP 暴露） */
  selectDetailListByPrompt: '/julyAiPrompt/v1/selectDetailListByPrompt',
  render: '/julyAiPrompt/v1/render',
} as const;

/** 提示词分页查询 */
export function selectPromptListByPage(body: object = {}): Promise<PageResult011<JulyAiPromptItem>> {
  return api.post<PageResult011<JulyAiPromptItem>>(AI_PROMPT_ACTIONS.selectListByPage, body, AICENTER_BASE);
}

/** 拉取提示词分页并写入 store */
export async function fetchPromptPage(patch: Partial<JulyAiPromptQueryVo011> = {}): Promise<void> {
  const query = { ...julyAiPromptStore.getSnapshot().query, ...patch } as JulyAiPromptQueryVo011;
  julyAiPromptStore.setState({ loading: true, query });
  try {
    const res = await selectPromptListByPage(query);
    julyAiPromptStore.setState({ list: res.rows || [], total: res.total || 0, totalPages: res.totalPages || 1, loading: false });
  } catch {
    julyAiPromptStore.setState({ list: [], total: 0, totalPages: 1, loading: false });
  }
}

/**
 * 拉取全部提示词并写入 store（业务域聚合用：域主表必须拿到全量提示词的明细才能聚合）。
 * 刻意不走 fetchPromptPage——不修改 store 的 query / 分页偏好（本页不再分页）。
 * pageSize 200 覆盖常规管理规模；超出部分 total 仍如实回写，页面可据此提示。
 */
export async function fetchAllPrompts(): Promise<void> {
  julyAiPromptStore.setState({ loading: true });
  try {
    const res = await selectPromptListByPage({ pageIndex: 1, pageSize: 200 });
    julyAiPromptStore.setState({ list: res.rows || [], total: res.total || 0, totalPages: 1, loading: false });
  } catch {
    julyAiPromptStore.setState({ list: [], total: 0, totalPages: 1, loading: false });
  }
}

/** 提示词主键查询 */
export function getPromptById(id: string): Promise<JulyAiPromptItem> {
  return api.get<JulyAiPromptItem>(AI_PROMPT_ACTIONS.getById, { id }, AICENTER_BASE);
}

/**
 * 新增 / 修改提示词。
 * 新增：insert 含 details（业务域明细随主表单次下发）；
 * 修改：update 只收主表字段（promptCode 不可变；后端 update 不含明细）。
 */
export async function savePrompt(params: SaveJulyAiPromptParams): Promise<string> {
  const { id, promptCode, promptName, scene, sortOrder, remark, details, status } = params;
  const { id: savedId } = id
    ? await api.post<IdVo011>(AI_PROMPT_ACTIONS.update, {
      id, promptName, scene, sortOrder, remark, status,
    } as JulyAiPromptUpdateVo011, AICENTER_BASE)
    : await api.post<IdVo011>(AI_PROMPT_ACTIONS.insert, {
      promptCode, promptName, scene, sortOrder, remark, details: details || [],
    } as JulyAiPromptInsertVo011, AICENTER_BASE);
  const q = julyAiPromptStore.getSnapshot().query;
  await fetchPromptPage({ ...q, pageIndex: id ? q.pageIndex : 1 });
  return savedId;
}

/** 提示词逻辑删除（后端级联清理业务域明细） */
export async function removePrompt(id: string): Promise<void> {
  await api.post<IdVo011>(AI_PROMPT_ACTIONS.logicDelete, { id } as IdVo011, AICENTER_BASE);
  await fetchPromptPage(julyAiPromptStore.getSnapshot().query);
}

/** 按提示词查业务域明细（⚠️ 后端端点待补，mock 已实现） */
export async function selectDetailListByPrompt(promptId: string): Promise<JulyAiPromptDetailItem[]> {
  const rows = await api.post<JulyAiPromptDetailItem[]>(AI_PROMPT_ACTIONS.selectDetailListByPrompt, { promptId }, AICENTER_BASE);
  return rows || [];
}

/** 新增 / 修改业务域明细（有 id = 修改；storage 模式后端重写对象） */
export async function savePromptDetail(params: JulyAiPromptDetailSaveVo011): Promise<string> {
  const { id, promptId, ...rest } = params;
  const { id: savedId } = id
    ? await api.post<IdVo011>(AI_PROMPT_ACTIONS.updateDetail, { id, ...rest } as JulyAiPromptDetailSaveVo011, AICENTER_BASE)
    : await api.post<IdVo011>(AI_PROMPT_ACTIONS.insertDetail, { promptId, ...rest } as JulyAiPromptDetailSaveVo011, AICENTER_BASE);
  return savedId;
}

/** 业务域明细逻辑删除 */
export async function removePromptDetail(id: string): Promise<void> {
  await api.post<IdVo011>(AI_PROMPT_ACTIONS.logicDeleteDetail, { id } as IdVo011, AICENTER_BASE);
}

/** 渲染提示词（${var} 替换；domainCode 留空用默认域） */
export function renderPrompt(vo: JulyAiPromptRenderVo011): Promise<string> {
  return api.post<string>(AI_PROMPT_ACTIONS.render, vo, AICENTER_BASE);
}
