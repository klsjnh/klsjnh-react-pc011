/** 字典管理模块视图类型 */

/** 字典类型（主表） */
export interface DictTypeVo011 {
  id: string;
  typeCode: string;
  typeName: string;
  description?: string;
  status: string;
  sort: number;
  createdAt?: string;
  updatedAt?: string;
}

/** 字典项（子表） */
export interface DictItemVo011 {
  id: string;
  dictTypeId: string;
  itemValue: string;
  itemLabel: string;
  description?: string;
  sort: number;
  status: string;
  createdAt?: string;
  updatedAt?: string;
}

/** 字典类型查询参数 */
export interface DictTypeQueryVo011 {
  pageIndex: number;
  pageSize: number;
  keyword?: string;
}

/** 字典项查询参数 */
export interface DictItemQueryVo011 {
  pageIndex: number;
  pageSize: number;
  dictTypeId: string;
  keyword?: string;
}
