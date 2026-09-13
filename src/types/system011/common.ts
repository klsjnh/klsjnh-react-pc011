/**
 * system011 公共契约类型
 * 路径固定：POST /klsjnh/system011/{julyXxx}/v1/{动作}；响应信封 Response011<T>
 */

/**
 * 分页结果（后端 PageResult011<T>）
 * 注意：后端字段是 rows / total / pageIndex / pageSize / totalPages
 * （不是 records / current），查询参数也用 pageIndex / pageSize
 */
export interface PageResult011<T> {
  pageIndex: number;
  pageSize: number;
  total: number;
  totalPages: number;
  rows: T[];
}

/** 主键入参（getById 等） */
export interface IdVo011 {
  id: string;
}

/** 逻辑删除入参：主键数组（直接作为 body 发送，非对象包裹） */
export type IdsVo011 = string[];

/** 批量逻辑删除结果（julyUser/v1/logicDelete 返回 data） */
export interface BatchDeleteResultVo011 {
  total: number;
  success: number;
  failed: number;
  errors: { id: string; message: string }[];
}
