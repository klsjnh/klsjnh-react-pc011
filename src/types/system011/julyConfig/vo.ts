/** julyConfig 模块 - 后端契约类型（DTO/VO，与 swagger 一一对应） */
import type { BaseVo011 } from '@/types/common';

// ==================== 契约（/julyConfig/v1/*） ====================

/** 配置项 */
export interface JulyConfigVo011 extends BaseVo011 {
  code: string;
  data: string;
  status: string;
}

export interface JulyConfigQueryVo011 {
  pageIndex: number;
  pageSize: number;
  keyword?: string;
}

/** 修改配置值（code 不可变）；status 后端 VO 待补（2026-09-20 前端先行） */
export interface JulyConfigUpdateVo011 {
  id: string;
  data: string;
  status?: string;
}

/** 新增/更新配置（code 唯一）；status 后端 VO 待补（2026-09-20 前端先行） */
export interface JulyConfigUpsertVo {
  code: string;
  data: string;
  status?: string;
}

// ==================== 平台能力：导出 / 备份（platform011） ====================

/** 导出列定义（code = 行 map 的 key，name = 表头） */
export interface ExportColumn011 {
  code: string;
  name: string;
}

/** 导出元信息 */
export interface ExportMetaInfo011 {
  objectCode: string;
  /** 导出时间（ISO 字符串，如 2026-09-15T10:00:00） */
  exportTime?: string;
  rowCount: number;
  columns: ExportColumn011[];
}

/** 导出出参（Response011 data）：
 * rows 为列-key 有序 map，key 与 columns[].code 对应 */
export interface ExportResult011 {
  metaInfo: ExportMetaInfo011;
  rows: Record<string, unknown>[];
}

/** 备份出参（Response011 data）：存储中心 object key */
export type BackupResult011 = string;
