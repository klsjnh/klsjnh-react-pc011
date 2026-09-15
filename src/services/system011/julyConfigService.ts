/** 配置服务（julyConfig/v1/*） */
import { api } from '@/api/request';
import { SYSTEM011_ACTIONS } from '@/services/system011/actions';
import { julyConfigStore } from '@/stores/system011/julyConfigStore';
import type {
  JulyConfigVo011, JulyConfigQueryVo011, JulyConfigUpdateVo011, JulyConfigUpsertVo,
  ExportResult011, BackupResult011,
  PageResult011, IdVo011, BatchDeleteResultVo011,
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

/**
 * 导出全部配置（POST /julyConfig/v1/export）并按 json/csv 触发浏览器下载。
 * 下载/拆包细节收敛在 service 层，页面只需调用并反馈结果。
 */
export async function exportConfig(format: 'json' | 'csv' = 'csv'): Promise<{ objectCode: string; rowCount: number }> {
  const res = await api.post<ExportResult011>(SYSTEM011_ACTIONS.config.export, {});
  const meta = res?.metaInfo;
  const rows = res?.rows || [];
  const cols = meta?.columns || [];
  const objectCode = meta?.objectCode || 'julyConfig';
  if (!cols.length) return { objectCode, rowCount: 0 };

  let blob: Blob;
  if (format === 'json') {
    blob = new Blob([JSON.stringify(meta ? { metaInfo: meta, rows } : { rows }, null, 2)], { type: 'application/json' });
  } else {
    const header = cols.map((c) => c.name).join(',');
    const body = rows
      .map((r) => cols.map((c) => `${(r[c.code] ?? '') as string}`.replace(/,/g, '，')).join(','))
      .join('\n');
    blob = new Blob(['\uFEFF' + `${header}\n${body}`], { type: 'text/csv' });
  }
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${objectCode}.${format}`;
  a.click();
  URL.revokeObjectURL(url);
  return { objectCode, rowCount: rows.length };
}

/**
 * 批量逻辑删除（后端仅提供单删 /julyConfig/v1/logicDelete，前端循环调用）。
 * 删除成功后内部刷新当前分页列表，返回删除汇总。
 */
export async function removeConfigs(ids: string[]): Promise<BatchDeleteResultVo011> {
  const errors: { id: string; message: string }[] = [];
  let success = 0;
  for (const id of ids) {
    try {
      await api.post<IdVo011>(SYSTEM011_ACTIONS.config.logicDelete, { id } as IdVo011);
      success++;
    } catch (e) {
      errors.push({ id, message: (e as Error)?.message || '删除失败' });
    }
  }
  await fetchConfigPage(julyConfigStore.getSnapshot().query);
  return { total: ids.length, success, failed: errors.length, errors };
}

/** 备份全部配置到存储中心（POST /julyConfig/v1/backup011，无 body，返回 object key） */
export function backupConfig011(): Promise<BackupResult011> {
  return api.post<BackupResult011>(SYSTEM011_ACTIONS.config.backup011, {});
}
