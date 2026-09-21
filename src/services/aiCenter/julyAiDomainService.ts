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
  JulyAiDomainBundleVo011,
  JulyAiDomainSaveWholeVo011,
  JulyAiDomainQueryVo011,
  JulyAiDomainInsertVo011,
  JulyAiDomainUpdateVo011,
  SaveJulyAiDomainParams,
} from '@/types/aiCenter/aiDomain/vo';
import type { PageResult011, IdVo011 } from '@/types/common';

/** 动作路径（相对路径，请求 URL = AICENTER_BASE + action） */
export const AI_DOMAIN_ACTIONS = {
  selectListByPage: '/julyAiDomain/v1/selectListByPage',
  selectTree: '/julyAiDomain/v1/selectTree',
  getWithChildren: '/julyAiDomain/v1/getWithChildren',
  getById: '/julyAiDomain/v1/getById',
  getByCode: '/julyAiDomain/v1/getByCode',
  insert: '/julyAiDomain/v1/insert',
  update: '/julyAiDomain/v1/update',
  logicDelete: '/julyAiDomain/v1/logicDelete',
  saveWhole: '/julyAiDomain/v1/saveWhole',
} as const;

/** 业务域分页查询（平铺） */
export function selectDomainListByPage(body: object = {}): Promise<PageResult011<JulyAiDomainItem>> {
  return api.post<PageResult011<JulyAiDomainItem>>(AI_DOMAIN_ACTIONS.selectListByPage, body, AICENTER_BASE);
}

/** 业务域树查询（selectTree：parentId/children 成品树） */
export function selectDomainTree(): Promise<JulyAiDomainItem[]> {
  return api.get<JulyAiDomainItem[]>(AI_DOMAIN_ACTIONS.selectTree, undefined, AICENTER_BASE);
}

/** 域 + 该域下提示词打包查询（getWithChildren） */
export function getDomainWithChildren(id: string): Promise<JulyAiDomainBundleVo011> {
  return api.get<JulyAiDomainBundleVo011>(AI_DOMAIN_ACTIONS.getWithChildren, { id }, AICENTER_BASE);
}

/** 拉取业务域树并写入 store（左栏树面板数据源） */
export async function fetchDomainTree(): Promise<void> {
  julyAiDomainStore.setState({ loading: true });
  try {
    const tree = await selectDomainTree();
    julyAiDomainStore.setState({ tree: tree || [], list: flattenDomainTree(tree || []), loading: false });
  } catch {
    julyAiDomainStore.setState({ tree: [], list: [], loading: false });
  }
}

/** 树 → 平铺（深度优先，供 id→node 反查 / 明细 pkMt 校验等） */
export function flattenDomainTree(nodes: JulyAiDomainItem[], out: JulyAiDomainItem[] = []): JulyAiDomainItem[] {
  for (const n of nodes) {
    out.push(n);
    if (n.children?.length) flattenDomainTree(n.children, out);
  }
  return out;
}

/** 拉取业务域分页并写入 store（平铺形态，保留给需要分页的场景） */
export async function fetchDomainPage(patch: Partial<JulyAiDomainQueryVo011> = {}): Promise<void> {
  const query = { ...julyAiDomainStore.getSnapshot().query, ...patch } as JulyAiDomainQueryVo011;
  julyAiDomainStore.setState({ loading: true, query });
  try {
    const res = await selectDomainListByPage(query);
    julyAiDomainStore.setState({ list: res.rows || [], total: res.total || 0, loading: false });
  } catch {
    julyAiDomainStore.setState({ list: [], total: 0, loading: false });
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

/**
 * 域 + 提示词整存（saveWhole：prompts 整存替换 —— 旧子表逻辑删 + 新列表插入）。
 * 供批量编辑场景使用；常规单条编辑走 prompt service 的 savePrompt（insert/updateDetail）。
 */
export async function saveDomainWhole(vo: JulyAiDomainSaveWholeVo011): Promise<string> {
  const { id: savedId } = await api.post<IdVo011>(AI_DOMAIN_ACTIONS.saveWhole, vo, AICENTER_BASE);
  await fetchDomainTree();
  return savedId;
}

/** 域主键查询 */
export function getDomainById(id: string): Promise<JulyAiDomainItem> {
  return api.get<JulyAiDomainItem>(AI_DOMAIN_ACTIONS.getById, { id }, AICENTER_BASE);
}

/** 域编码查询 */
export function getDomainByCode(code: string): Promise<JulyAiDomainItem> {
  return api.get<JulyAiDomainItem>(AI_DOMAIN_ACTIONS.getByCode, { code }, AICENTER_BASE);
}
