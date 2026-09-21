/** 定时任务服务（julyScheduler/v1/*） */
import { api } from '@/api/request';
import { SYSTEM011_ACTIONS } from '@/services/system011/actions';
import { julySchedulerStore } from '@/stores/system011/julySchedulerStore';
import type {
  JulySchedulerVo011, JulySchedulerQueryVo011, JulySchedulerInsertVo011, JulySchedulerUpdateVo011,
  SaveSchedulerParams, PageResult011, IdVo011, IdsVo011, BatchDeleteResultVo011,
} from '@/types/system011';

export function selectSchedulerListByPage(body: object = {}): Promise<PageResult011<JulySchedulerVo011>> {
  return api.post<PageResult011<JulySchedulerVo011>>(SYSTEM011_ACTIONS.scheduler.selectListByPage, body);
}

/** 拉取定时任务分页并写入 store */
export async function fetchSchedulerPage(patch: Partial<JulySchedulerQueryVo011> = {}): Promise<void> {
  const query = { ...julySchedulerStore.getSnapshot().query, ...patch } as JulySchedulerQueryVo011;
  julySchedulerStore.setState({ loading: true, query });
  try {
    const res = await selectSchedulerListByPage(query);
    julySchedulerStore.setState({ list: res.rows || [], total: res.total || 0, totalPages: res.totalPages || 1, loading: false });
  } catch {
    julySchedulerStore.setState({ list: [], total: 0, totalPages: 1, loading: false });
  }
}

/** 新增 / 修改定时任务（有 id = 编辑） */
export async function saveScheduler(params: SaveSchedulerParams): Promise<string> {
  const { id, schedulerCode, schedulerName, schedulerHandler, schedulerCron, status, remark } = params;
  const { id: savedId } = id
    ? await api.post<IdVo011>(SYSTEM011_ACTIONS.scheduler.update, {
        id, schedulerName, schedulerHandler, schedulerCron, status: status || '0', remark,
      } as JulySchedulerUpdateVo011)
    : await api.post<IdVo011>(SYSTEM011_ACTIONS.scheduler.insert, {
        schedulerCode, schedulerName, schedulerHandler, schedulerCron, status: status || '0', remark,
      } as JulySchedulerInsertVo011);
  const q = julySchedulerStore.getSnapshot().query;
  await fetchSchedulerPage({ ...q, pageIndex: id ? q.pageIndex : 1 });
  return savedId;
}

/** 启动 / 停止 / 立即执行 后刷新 */
export async function startScheduler(id: string): Promise<void> {
  await api.post<void>(SYSTEM011_ACTIONS.scheduler.start, { id } as IdVo011);
  await fetchSchedulerPage(julySchedulerStore.getSnapshot().query);
}
export async function stopScheduler(id: string): Promise<void> {
  await api.post<void>(SYSTEM011_ACTIONS.scheduler.stop, { id } as IdVo011);
  await fetchSchedulerPage(julySchedulerStore.getSnapshot().query);
}
export async function runSchedulerOnce(id: string): Promise<void> {
  await api.post<void>(SYSTEM011_ACTIONS.scheduler.runOnce, { id } as IdVo011);
}
/** 逻辑删除单个定时任务（POST /logicDelete，body 为 IdVo011 —— 契约禁裸数组） */
export async function removeScheduler(id: string): Promise<void> {
  await api.post<IdVo011>(SYSTEM011_ACTIONS.scheduler.logicDelete, { id } as IdVo011);
  await fetchSchedulerPage(julySchedulerStore.getSnapshot().query);
}

/** 批量逻辑删除（POST /logicDeleteBatch，body 为 { ids: [...] }），返回删除汇总 */
export async function removeSchedulerBatch(ids: string[]): Promise<BatchDeleteResultVo011> {
  const res = await api.post<BatchDeleteResultVo011>(SYSTEM011_ACTIONS.scheduler.logicDeleteBatch, { ids } as IdsVo011);
  await fetchSchedulerPage(julySchedulerStore.getSnapshot().query);
  return res;
}
