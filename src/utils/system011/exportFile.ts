/**
 * system011 导出出参（`ExportResult011` = metaInfo + rows）→ 文件 的公共处理。
 *
 * 为什么抽出来：`julyUserService.exportUsers` 与 `julyConfigService.exportConfig`
 * 各自手写了一遍完全相同的「列定义 → 表头 / 逐行取值 → csv 或 json → 触发下载」，
 * 只有兜底 objectCode 不同（julyUser / julyConfig）。
 *
 * 定位：**纯函数**（不调接口）。调用方负责 `api.post` 拿 res，这里只做序列化 + 存盘。
 *   service:  const res = await api.post<ExportResult011>(action, {});
 *             return downloadExportResult(res, format, 'julyUser');
 *
 * 回传 /export/v1（直接返回**文件内容字符串**）的入口不走这里，用 `@/utils/download` 的 downloadText。
 */
import { downloadText, exportFileName } from '@/utils/download';
import type { ExportResult011 } from '@/types/system011';

/** 支持的导出格式 */
export type ExportFormat011 = 'json' | 'csv';

/** csv 单元格：逗号替换为中文逗号，避免破坏列结构 */
const toCsvCell = (v: unknown) => `${(v ?? '') as string}`.replace(/,/g, '，');

/** 导出结果摘要（各 service 统一回传该结构给页面做提示） */
export interface ExportOutcome011 {
  objectCode: string;
  rowCount: number;
}

/**
 * 把导出出参序列化成**文件内容字符串**。
 * - json：含 metaInfo 的完整结构（metaInfo 缺失时退化为 `{ rows }`）
 * - csv ：首行表头（取 columns[].name，保证列序）+ 逐行取值（按 columns[].code）
 */
export function stringifyExportResult(res: ExportResult011 | undefined, format: ExportFormat011): string {
  const meta = res?.metaInfo;
  const rows = res?.rows || [];
  const cols = meta?.columns || [];

  if (format === 'json') {
    return JSON.stringify(meta ? { metaInfo: meta, rows } : { rows }, null, 2);
  }

  const header = cols.map((c) => c.name).join(',');
  const body = rows.map((r) => cols.map((c) => toCsvCell(r[c.code])).join(',')).join('\n');
  // BOM（\uFEFF）：Excel 直接双击打开 csv 不乱码
  return '\uFEFF' + `${header}\n${body}`;
}

/**
 * 序列化并触发下载，返回 `{ objectCode, rowCount }` 供页面提示。
 * @param res                 接口返回的导出出参
 * @param format              json / csv
 * @param fallbackObjectCode  metaInfo.objectCode 缺失时的兜底对象名
 */
export function downloadExportResult(
  res: ExportResult011 | undefined,
  format: ExportFormat011 = 'csv',
  fallbackObjectCode = 'export',
): ExportOutcome011 {
  const meta = res?.metaInfo;
  const rows = res?.rows || [];
  const cols = meta?.columns || [];
  const objectCode = meta?.objectCode || fallbackObjectCode;

  // 无列定义 = 无数据可导，不产生空文件（保持原有行为）
  if (!cols.length) return { objectCode, rowCount: 0 };

  downloadText(stringifyExportResult(res, format), exportFileName(objectCode, format), format);
  return { objectCode, rowCount: rows.length };
}
