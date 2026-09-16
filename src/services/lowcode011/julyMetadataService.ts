/**
 * 元数据服务（lowcode011 / julyMetadata/v1/*）—— 一主三子整体管理。
 * 分层：page → service → store；service 编排业务并写 store，不直接被 store 调用。
 */
import { api } from '@/api/request';
import { LOWCODE011_ACTIONS } from '@/services/lowcode011/actions';
import { julyMetadataStore } from '@/stores/lowcode011/julyMetadataStore';
import type {
  JulyMetadataVo011, JulyMetadataQueryVo011, JulyMetadataSaveVo011,
} from '@/types/lowcode011';
import type { PageResult011, IdVo011 } from '@/types/common';

/** lowcode011 模块 base（api 模式请求前缀） */
const BASE = '/klsjnh/lowcode011';

/* ==================== 主表 + 三子 ==================== */

/** 分页查询元数据主表（含三子计数由前端按需 getById 拉全量） */
export function selectMetadataListByPage(body: JulyMetadataQueryVo011): Promise<PageResult011<JulyMetadataVo011>> {
  return api.post<PageResult011<JulyMetadataVo011>>(LOWCODE011_ACTIONS.metadata.selectListByPage, body, BASE);
}

/** 主键查询（GET）：返回主表 + fields + displays + services 全量 */
export function getMetadataById(id: string): Promise<JulyMetadataVo011> {
  return api.get<JulyMetadataVo011>(LOWCODE011_ACTIONS.metadata.getById, { id }, BASE);
}

/** 按对象名点查（GET） */
export function getMetadataByObjectName(objectName: string): Promise<JulyMetadataVo011> {
  return api.get<JulyMetadataVo011>(LOWCODE011_ACTIONS.metadata.getByObjectName, { objectName }, BASE);
}

/** 拉取分页并写入 store（默认选中无，编辑在抽屉里按需 getById） */
export async function fetchMetadataPage(patch: Partial<JulyMetadataQueryVo011> = {}): Promise<void> {
  const query = { ...julyMetadataStore.getSnapshot().query, ...patch } as JulyMetadataQueryVo011;
  julyMetadataStore.setState({ loading: true, query });
  try {
    const res = await selectMetadataListByPage(query);
    julyMetadataStore.setState({
      list: res.rows || [], total: res.total || 0, totalPages: res.totalPages || 1, loading: false,
    });
  } catch {
    julyMetadataStore.setState({ list: [], total: 0, totalPages: 1, loading: false });
  }
}

/**
 * 新增 / 修改（一主三子整体提交）。
 * 注意：三子为「整体替换」语义，调用方必须回传全部三子，否则未回传的子会被后端清空。
 * @param params 含 id = 修改；无 id = 新增
 */
export async function saveMetadata(params: JulyMetadataSaveVo011): Promise<string> {
  const { id } = params.id
    ? await api.post<IdVo011>(LOWCODE011_ACTIONS.metadata.update, params, BASE)
    : await api.post<IdVo011>(LOWCODE011_ACTIONS.metadata.insert, params, BASE);
  const q = julyMetadataStore.getSnapshot().query;
  // 新增后回第一页；修改留在当前页
  await fetchMetadataPage({ ...q, pageIndex: params.id ? q.pageIndex : 1 });
  return params.id || (id && id.id) || 'new';
}

/** 逻辑删除单个（级联删三子） */
export async function removeMetadata(id: string): Promise<void> {
  await api.post<IdVo011>(LOWCODE011_ACTIONS.metadata.logicDelete, { id }, BASE);
  await fetchMetadataPage(julyMetadataStore.getSnapshot().query);
}

/** 批量逻辑删除（级联删三子） */
export async function removeMetadataBatch(ids: string[]): Promise<void> {
  await api.post<IdVo011>(LOWCODE011_ACTIONS.metadata.logicDeleteBatch, { ids }, BASE);
  await fetchMetadataPage(julyMetadataStore.getSnapshot().query);
}
