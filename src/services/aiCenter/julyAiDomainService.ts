/**
 * AI 业务域服务（aicenter · julyAiDomain/v1/*）
 * 2026-09-20 前端先行：后端域实体端点未上线（swagger 已核实），按约定路径封装，
 * mock 已实现；后端补齐（controller 暴露域 CRUD）后零改动生效。
 *
 * 级联口径：删域 / 改域名时，同步处理提示词明细的 domainCode（明细无独立域外键，
 * domainCode 即关联）——删域级联 logicDeleteDetail，改名级联 updateDetail。
 *
 * 分层：page → service → store；store 不调用 service。
 */
import { api } from '@/api/request';
import { AICENTER_BASE } from '@/services/aiCenter/julyAiModelProviderService';
import { julyAiDomainStore } from '@/stores/aiCenter/julyAiDomainStore';
import {
  selectDetailListByPrompt, savePromptDetail, removePromptDetail,
} from '@/services/aiCenter/julyAiPromptService';
import type {
  JulyAiDomainItem,
  JulyAiDomainDetailRef,
  JulyAiDomainQueryVo011,
  JulyAiDomainInsertVo011,
  JulyAiDomainUpdateVo011,
  SaveJulyAiDomainParams,
} from '@/types/aiCenter/aiDomain/vo';
import type { PageResult011, IdVo011 } from '@/types/common';

/** 动作路径（相对路径，请求 URL = AICENTER_BASE + action） */
const AI_DOMAIN_ACTIONS = {
  selectListByPage: '/julyAiDomain/v1/selectListByPage',
  insert: '/julyAiDomain/v1/insert',
  update: '/julyAiDomain/v1/update',
  logicDelete: '/julyAiDomain/v1/logicDelete',
} as const;

/** 业务域分页查询 */
export function selectDomainListByPage(body: object = {}): Promise<PageResult011<JulyAiDomainItem>> {
  return api.post<PageResult011<JulyAiDomainItem>>(AI_DOMAIN_ACTIONS.selectListByPage, body, AICENTER_BASE);
}

/** 拉取业务域分页并写入 store */
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

/** 新增 / 修改业务域（有 id = 修改） */
export async function saveDomain(params: SaveJulyAiDomainParams): Promise<string> {
  const { id, domainCode, domainName, sortOrder, status, remark } = params;
  const { id: savedId } = id
    ? await api.post<IdVo011>(AI_DOMAIN_ACTIONS.update, {
        id, domainCode, domainName, sortOrder, status, remark,
      } as JulyAiDomainUpdateVo011, AICENTER_BASE)
    : await api.post<IdVo011>(AI_DOMAIN_ACTIONS.insert, {
        domainCode, domainName, sortOrder, status, remark,
      } as JulyAiDomainInsertVo011, AICENTER_BASE);
  await fetchDomainPage(julyAiDomainStore.getSnapshot().query);
  return savedId;
}

/**
 * 删除业务域（级联清理提示词明细的该域内容）。
 * detailRefs 由页面传入（promptId + 该域明细行的聚合结果）——域与明细的关联只有
 * domainCode 字符串，级联必须逐条 logicDeleteDetail。
 */
export async function removeDomain(id: string, detailRefs: JulyAiDomainDetailRef[] = []): Promise<void> {
  await api.post<IdVo011>(AI_DOMAIN_ACTIONS.logicDelete, { id } as IdVo011, AICENTER_BASE);
  for (const ref of detailRefs) {
    try { await removePromptDetail(ref.detailId); } catch { /* 单条失败不阻塞删域 */ }
  }
  await fetchDomainPage(julyAiDomainStore.getSnapshot().query);
}

/**
 * 修改业务域编码（改名）：域实体更新 + 逐条同步明细的 domainCode。
 * 页面在 domainCode 变化时调用；不变时走普通 saveDomain。
 */
export async function renameDomain(id: string, oldCode: string, newCode: string, detailRefs: JulyAiDomainDetailRef[]): Promise<void> {
  for (const ref of detailRefs) {
    try {
      const rows = await selectDetailListByPrompt(ref.promptId);
      const detail = rows.find((d) => d.id === ref.detailId);
      if (!detail) continue;
      await savePromptDetail({
        id: detail.id,
        promptId: ref.promptId,
        domainCode: newCode,
        contentMode: detail.contentMode,
        content: detail.content,
        storageCode: detail.storageCode,
        bucket: detail.bucket,
        variables: detail.variables,
        sortOrder: detail.sortOrder,
        remark: detail.remark,
        status: detail.status,
      });
    } catch { /* 单条失败不阻塞改名 */ }
  }
  await api.post<IdVo011>(AI_DOMAIN_ACTIONS.update, { id, domainCode: newCode } as Partial<JulyAiDomainUpdateVo011>, AICENTER_BASE);
  await fetchDomainPage(julyAiDomainStore.getSnapshot().query);
}
