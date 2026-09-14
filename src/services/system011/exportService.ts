/** 数据导出服务（/export/v1） */
import { api } from '@/api/request';
import { SYSTEM011_ACTIONS } from './actions';
import type { ExportRequestVo } from '@/types/system011';

/** 数据导出（json / csv，返回文件内容字符串） */
export function exportData(req: ExportRequestVo): Promise<string> {
  return api.post<string>(SYSTEM011_ACTIONS.exportData, req);
}
