/** 字典服务（julyDictionary/v1/*） - 主表 + 明细逐条管理 */
import { api } from '@/api/request';
import { SYSTEM011_ACTIONS } from '@/services/system011/actions';
import { julyDictionaryStore } from '@/stores/system011/julyDictionaryStore';
import type {
  JulyDictionaryVo011, JulyDictionaryQueryVo011, JulyDictionaryInsertVo011, JulyDictionaryUpdateVo011,
  JulyDictionaryItemVo011, JulyDictionaryItemInsertVo011, JulyDictionaryItemUpdateVo011,
  JulyDictionaryItemQueryVo011,
} from '@/types/system011';
import type { PageResult011, IdVo011 } from '@/types/common';

/* ==================== 主表 ==================== */

/** 分页查询字典主表 */
export function selectDictionaryListByPage(body: object = {}): Promise<PageResult011<JulyDictionaryVo011>> {
  return api.post<PageResult011<JulyDictionaryVo011>>(SYSTEM011_ACTIONS.dictionary.selectListByPage, body);
}

/** 主键查询（返回字典 + 明细，明细按 sortOrder 升序） */
export function getDictionaryById(id: string): Promise<JulyDictionaryVo011> {
  return api.get<JulyDictionaryVo011>(SYSTEM011_ACTIONS.dictionary.getById, { id });
}

/** 拉取字典分页并写入 store、默认选中第一项并加载其明细 */
export async function fetchDictionaryPage(patch: Partial<JulyDictionaryQueryVo011> = {}): Promise<void> {
  const query = { ...julyDictionaryStore.getSnapshot().query, ...patch } as JulyDictionaryQueryVo011;
  julyDictionaryStore.setState({ loading: true, query });
  try {
    const res = await selectDictionaryListByPage(query);
    const rows = res.rows || [];
    julyDictionaryStore.setState({
      list: rows, total: res.total || 0, totalPages: res.totalPages || 1, loading: false,
      active: rows[0] ?? null,
    });
    if (rows[0]) await fetchDictionaryItems(rows[0].dictionaryCode);
    else julyDictionaryStore.setState({ items: [], itemsLoading: false });
  } catch {
    julyDictionaryStore.setState({ list: [], total: 0, totalPages: 1, loading: false, active: null, items: [], itemsLoading: false });
  }
}

/** 新增 / 修改字典主表（有 id = 修改；dictionaryCode 不可变） */
export async function saveDictionary(params: {
  id?: string; dictionaryCode: string; dictionaryName: string; sortOrder: number; remark?: string; status?: string;
}): Promise<string> {
  const { id, dictionaryCode, dictionaryName, sortOrder, remark, status } = params;
  const { id: savedId } = id
    ? await api.post<IdVo011>(SYSTEM011_ACTIONS.dictionary.update, {
        id, dictionaryName, sortOrder, status, remark,
      } as JulyDictionaryUpdateVo011)
    : await api.post<IdVo011>(SYSTEM011_ACTIONS.dictionary.insert, {
        dictionaryCode, dictionaryName, sortOrder, remark,
      } as JulyDictionaryInsertVo011);
  const q = julyDictionaryStore.getSnapshot().query;
  await fetchDictionaryPage({ ...q, pageIndex: id ? q.pageIndex : 1 });
  return savedId;
}

/** 逻辑删除字典主表 + 刷新 */
export async function removeDictionary(id: string): Promise<void> {
  await api.post<IdVo011>(SYSTEM011_ACTIONS.dictionary.logicDelete, { id });
  await fetchDictionaryPage(julyDictionaryStore.getSnapshot().query);
}

/* ==================== 明细（按 dictionaryCode 定位主表） ==================== */

/** 查询某字典的明细列表（字典 + status + keyword => List<JulyDictionaryItemVo011>） */
export function selectDictionaryItems(body: JulyDictionaryItemQueryVo011 = {} as JulyDictionaryItemQueryVo011): Promise<JulyDictionaryItemVo011[]> {
  return api.post<JulyDictionaryItemVo011[]>(SYSTEM011_ACTIONS.dictionary.selectItemListByType, body);
}

/** 拉取指定字典的明细并写入 store */
export async function fetchDictionaryItems(
  dictionaryCode: string,
  status?: string,
  keyword?: string,
): Promise<void> {
  julyDictionaryStore.setState({ itemsLoading: true });
  try {
    const items = await selectDictionaryItems({ dictionaryCode, status, keyword });
    julyDictionaryStore.setState({ items: items || [], itemsLoading: false });
  } catch {
    julyDictionaryStore.setState({ items: [], itemsLoading: false });
  }
}

/** 新增明细（用 dictionaryCode 定位主表） */
export async function saveDictionaryItem(params: {
  id?: string; dictionaryCode: string; itemCode: string; itemLabel: string; sortOrder: number; remark?: string; status?: string;
}): Promise<string> {
  const { id, dictionaryCode, itemCode, itemLabel, sortOrder, remark, status } = params;
  const { id: savedId } = id
    ? await api.post<IdVo011>(SYSTEM011_ACTIONS.dictionary.updateItem, {
        id, itemLabel, sortOrder, status, remark,
      } as JulyDictionaryItemUpdateVo011)
    : await api.post<IdVo011>(SYSTEM011_ACTIONS.dictionary.insertItem, {
        dictionaryCode, itemCode, itemLabel, sortOrder, remark,
      } as JulyDictionaryItemInsertVo011);
  return savedId;
}

/** 逻辑删除明细 */
export async function removeDictionaryItem(id: string): Promise<void> {
  await api.post<IdVo011>(SYSTEM011_ACTIONS.dictionary.logicDeleteItem, { id });
}