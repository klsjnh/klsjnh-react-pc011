/** 数据导出服务（/export/v1） */
import { api } from '@/api/request';
import { SYSTEM011_ACTIONS } from '@/services/system011/actions';
import type { ExportRequestVo011 } from '@/types/system011';

/** 数据导出（json / csv，返回文件内容字符串） */
export function exportData(req: ExportRequestVo011): Promise<string> {
  return api.post<string>(SYSTEM011_ACTIONS.exportData, req);
}
