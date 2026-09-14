/** 数据导出模块 - 后端契约类型（/klsjnh/system011/export/v1） */

/** 导出请求（json / csv） */
export interface ExportRequestVo {
  objectCode: string;
  format: string;
}
