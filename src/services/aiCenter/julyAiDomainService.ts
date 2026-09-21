/**
 * AI 业务域服务（aicenter · julyAiDomain/v1/*）
 * 2026-09-21 对齐线上新契约（bundle 模型，实测 17 端点）：
 *   域主表树（selectTree/getWithChildren）+ 提示词明细（pkMt 挂域）+ saveWhole 整存。
 * 分层：page → service → store；store 不调用 service。
 */
import { api } from '@/api/request';
import { AICENTER_BASE } from '@/services/aiCenter/julyAiModelProviderService';
import { julyAiDomainStore } from '@/stores/aiCenter/julyAiDomainStore';
import type {
  JulyAiDomainItem,
  JulyAiDomainInsertVo011,
  JulyAiDomainUpdateVo011,
  SaveJulyAiDomainParams,
} from '@/types/aiCenter/aiDomain/vo';
import type { IdVo011 } from '@/types/common';

/** 动作路径（相对路径，请求 URL = AICENTER_BASE + action；未接线的端点见 021 文档） */
const AI_DOMAIN_ACTIONS = {
  selectTree: '/julyAiDomain/v1/selectTree',
  insert: '/julyAiDomain/v1/insert',
  update: '/julyAiDomain/v1/update',
  logicDelete: '/julyAiDomain/v1/logicDelete',
} as const;

/** 业务域树查询（selectTree：parentId/children 成品树） */
function selectDomainTree(): Promise<JulyAiDomainItem[]> {
  return api.get<JulyAiDomainItem[]>(AI_DOMAIN_ACTIONS.selectTree, undefined, AICENTER_BASE);
}

/** 拉取业务域树并写入 store（左栏树面板数据源） */
export async function fetchDomainTree(): Promise<void> {
  julyAiDomainStore.setState({ loading: true });
  try {
    const tree = await selectDomainTree();
    julyAiDomainStore.setState({ tree: tree || [], loading: false });
  } catch {
    julyAiDomainStore.setState({ tree: [], loading: false });
  }
}

/** 新增 / 修改业务域（有 id = 修改；parentId 空串=顶级；update 收 parentId 可移动挂载点） */
export async function saveDomain(params: SaveJulyAiDomainParams): Promise<string> {
  const { id, domainCode, domainName, parentId, sortOrder, status, remark } = params;
  const { id: savedId } = id
    ? await api.post<IdVo011>(AI_DOMAIN_ACTIONS.update, {
      id, domainName, parentId: parentId ?? '', sortOrder, status, remark,
    } as JulyAiDomainUpdateVo011, AICENTER_BASE)
    : await api.post<IdVo011>(AI_DOMAIN_ACTIONS.insert, {
      domainCode, domainName, parentId: parentId ?? '', sortOrder, remark,
    } as JulyAiDomainInsertVo011, AICENTER_BASE);
  await fetchDomainTree();
  return savedId;
}

/**
 * 删除业务域（后端逻辑删除；子域/明细级联以后端口径为准）。
 * 前端不再逐条级联明细 —— 明细 pkMt 挂域 id，后端按外键处理。
 */
export async function removeDomain(id: string): Promise<void> {
  await api.post<IdVo011>(AI_DOMAIN_ACTIONS.logicDelete, { id } as IdVo011, AICENTER_BASE);
  await fetchDomainTree();
}


