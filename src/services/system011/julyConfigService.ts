/** 配置服务（julyConfig/v1/*） */
import { api } from '@/api/request';
import { SYSTEM011_ACTIONS } from './actions';
import { julyConfigStore } from '@/stores/system011/julyConfigStore';
import type {
  JulyConfigVo011, JulyConfigQueryVo011, JulyConfigUpdateVo011, JulyConfigUpsertVo,
  PageResult011, IdVo011,
} from '@/types/system011';

export function selectConfigListByPage(body: object = {}): Promise<PageResult011<JulyConfigVo011>> {
  return api.post<PageResult011<JulyConfigVo011>>(SYSTEM011_ACTIONS.config.selectListByPage, body);
}

/** 拉取配置分页并写入 store */
export async function fetchConfigPage(patch: Partial<JulyConfigQueryVo011> = {}): Promise<void> {
  const query = { ...julyConfigStore.getSnapshot().query, ...patch } as JulyConfigQueryVo011;
  julyConfigStore.setState({ loading: true, query });
  try {
    const res = await selectConfigListByPage(query);
    julyConfigStore.setState({ list: res.rows || [], total: res.total || 0, totalPages: res.totalPages || 1, loading: false });
  } catch {
    julyConfigStore.setState({ list: [], total: 0, totalPages: 1, loading: false });
  }
}

/** 新增 / 修改配置（有 id = 修改 data） */
export async function saveConfig(params: { id?: string; code: string; data: string }): Promise<string> {
  const { id, code, data } = params;
  const { id: savedId } = id
    ? await api.post<IdVo011>(SYSTEM011_ACTIONS.config.update, { id, data } as JulyConfigUpdateVo011)
    : await api.post<IdVo011>(SYSTEM011_ACTIONS.config.insert, { code, data } as JulyConfigUpsertVo);
  const q = julyConfigStore.getSnapshot().query;
  await fetchConfigPage({ ...q, pageIndex: id ? q.pageIndex : 1 });
  return savedId;
}

/** 逻辑删除 + 刷新 */
export async function removeConfig(id: string): Promise<void> {
  await api.post<IdVo011>(SYSTEM011_ACTIONS.config.logicDelete, { id } as IdVo011);
  await fetchConfigPage(julyConfigStore.getSnapshot().query);
}
