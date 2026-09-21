/**
 * AI 提示词服务（aicenter · julyAiDomain/v1/* 明细端点）
 * 2026-09-21 对齐线上新契约：提示词 = 业务域的明细子表（pkMt 挂域），
 * 端点走 /julyAiDomain/v1/*Detail* 与 render/getContent；旧 julyAiPrompt 前缀废弃。
 * 分层：page → service → store；store 不调用 service。
 */
import { api } from '@/api/request';
import { AICENTER_BASE } from '@/services/aiCenter/julyAiModelProviderService';
import { julyAiPromptStore } from '@/stores/aiCenter/julyAiPromptStore';
import type {
  JulyAiDomainPromptVo011,
  JulyAiDomainPromptQueryVo011,
  JulyAiDomainPromptSaveVo011,
  JulyAiDomainPromptRenderVo011,
} from '@/types/aiCenter/aiPrompt/vo';
import type { PageResult011, IdVo011 } from '@/types/common';

/** 动作路径（相对路径，请求 URL = AICENTER_BASE + action） */
const AI_PROMPT_ACTIONS = {
  selectDetailListByPage: '/julyAiDomain/v1/selectDetailListByPage',
  getDetailById: '/julyAiDomain/v1/getDetailById',
  getDetailByCode: '/julyAiDomain/v1/getDetailByCode',
  getContent: '/julyAiDomain/v1/getContent',
  insertDetail: '/julyAiDomain/v1/insertDetail',
  updateDetail: '/julyAiDomain/v1/updateDetail',
  logicDeleteDetail: '/julyAiDomain/v1/logicDeleteDetail',
  render: '/julyAiDomain/v1/render',
} as const;

/** 提示词分页查询（明细端点；pkMt 过滤 = 查某域下的提示词） */
export function selectPromptListByPage(body: object = {}): Promise<PageResult011<JulyAiDomainPromptVo011>> {
  return api.post<PageResult011<JulyAiDomainPromptVo011>>(AI_PROMPT_ACTIONS.selectDetailListByPage, body, AICENTER_BASE);
}

/** 拉取提示词分页并写入 store */
export async function fetchPromptPage(patch: Partial<JulyAiDomainPromptQueryVo011> = {}): Promise<void> {
  const query = { ...julyAiPromptStore.getSnapshot().query, ...patch } as JulyAiDomainPromptQueryVo011;
  julyAiPromptStore.setState({ loading: true, query });
  try {
    const res = await selectPromptListByPage(query);
    julyAiPromptStore.setState({ list: res.rows || [], total: res.total || 0, totalPages: res.totalPages || 1, loading: false });
  } catch {
    julyAiPromptStore.setState({ list: [], total: 0, totalPages: 1, loading: false });
  }
}

/**
 * 拉取选中业务域下的提示词并写入 store（右栏列表数据源）。
 * pkMt 必传 —— 新契约按域直查，一次拉取替代旧 N+1 聚合。
 */
export async function fetchPromptsByDomain(pkMt: string): Promise<void> {
  julyAiPromptStore.setState({ loading: true });
  try {
    const res = await selectPromptListByPage({ pageIndex: 1, pageSize: 200, pkMt });
    julyAiPromptStore.setState({ list: res.rows || [], total: res.total || 0, totalPages: 1, loading: false });
  } catch {
    julyAiPromptStore.setState({ list: [], total: 0, totalPages: 1, loading: false });
  }
}

/** 提示词主键查询（明细点查端点，替代旧「拉列表反查」） */
export function getPromptById(id: string): Promise<JulyAiDomainPromptVo011> {
  return api.get<JulyAiDomainPromptVo011>(AI_PROMPT_ACTIONS.getDetailById, { id }, AICENTER_BASE);
}

/** 提示词编码查询 */
export function getPromptByCode(code: string): Promise<JulyAiDomainPromptVo011> {
  return api.get<JulyAiDomainPromptVo011>(AI_PROMPT_ACTIONS.getDetailByCode, { code }, AICENTER_BASE);
}

/** 正文读取（storage 模式经后端从对象存储取回；inline 模式同样可用） */
export function getPromptContent(id: string): Promise<string> {
  return api.get<string>(AI_PROMPT_ACTIONS.getContent, { id }, AICENTER_BASE);
}

/**
 * 新增 / 修改提示词（insertDetail 带 pkMt；updateDetail 带 id，promptCode 不可变）。
 * 成功后按当前 store 里的 pkMt 过滤条件重拉右栏列表。
 */
export async function savePrompt(params: JulyAiDomainPromptSaveVo011): Promise<string> {
  const { id, pkMt, promptCode, ...rest } = params;
  const { id: savedId } = id
    ? await api.post<IdVo011>(AI_PROMPT_ACTIONS.updateDetail, { id, ...rest } as JulyAiDomainPromptSaveVo011, AICENTER_BASE)
    : await api.post<IdVo011>(AI_PROMPT_ACTIONS.insertDetail, { pkMt, promptCode, ...rest } as JulyAiDomainPromptSaveVo011, AICENTER_BASE);
  const pk = julyAiPromptStore.getSnapshot().query.pkMt;
  if (pk) await fetchPromptsByDomain(pk);
  return savedId;
}

/** 提示词逻辑删除 */
export async function removePrompt(id: string): Promise<void> {
  await api.post<IdVo011>(AI_PROMPT_ACTIONS.logicDeleteDetail, { id } as IdVo011, AICENTER_BASE);
  const pk = julyAiPromptStore.getSnapshot().query.pkMt;
  if (pk) await fetchPromptsByDomain(pk);
}

/** 渲染提示词（${var} 替换；promptCode 全局唯一，无需域上下文） */
export function renderPrompt(vo: JulyAiDomainPromptRenderVo011): Promise<string> {
  return api.post<string>(AI_PROMPT_ACTIONS.render, vo, AICENTER_BASE);
}
