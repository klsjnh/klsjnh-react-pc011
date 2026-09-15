/**
 * 跨模块公共契约类型
 *  - 分页 / 主键 / 批量结果：全模块通用
 *  - BaseVo011：各 JulyXxxVo011 的公共字段基类
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

/** 批量逻辑删除入参（body 为对象包裹：{ ids: [...] }，勿传裸集合） */
export interface IdsVo011 {
  ids: string[];
}

/** 批量逻辑删除结果（julyUser/v1/logicDelete 返回 data） */
export interface BatchDeleteResultVo011 {
  total: number;
  success: number;
  failed: number;
  errors: { id: string; message: string }[];
}

/**
 * 实体基础字段（各 JulyXxxVo011 共有，后端 BaseVo011）
 * 各模块 VO 继承本类，避免重复声明审计字段。
 */
export interface BaseVo011 {
  /** UUID 字符串主键 */
  id: string;
  /** 状态：0 停用 / 1 启用（部分模块无此字段） */
  status?: string;
  createBy?: string | null;
  updateBy?: string | null;
  createTime?: string | null;
  updateTime?: string | null;
}
