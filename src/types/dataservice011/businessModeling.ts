/**
 * 业务建模（低代码）UI types（dataservice011 · julyBusinessModeling）
 * 主表：modelCode/modelName/objectName/dataSourceCode/remark/status + 子表 fieldData
 * 子表字段（JulyBusinessModelingFieldVo011）：fieldCode/fieldName/columnName/dataType/length/主键/可空/必填/默认值/备注
 * SQL 探测 / 执行：probe / executeSql / executeSqlByPage / getModelData
 * 后端 response 在 Swagger 未建模（仅 */*），前端对执行结果做兼容解析。
 */

/** 状态：0 停用 / 1 启用 */
export type ModelingStatus = '0' | '1';

/** 业务建模字段子表条目 */
export interface JulyBusinessModelingFieldVo011 {
  id?: string;
  /** 字段编码（逻辑名） */
  fieldCode: string;
  /** 字段名称（中文） */
  fieldName: string;
  /** 物理列名 */
  columnName: string;
  /** 数据类型：varchar/int/bigint/decimal/datetime/text/... */
  dataType: string;
  /** 长度 / 精度 */
  length?: number | string;
  /** 是否主键 0/1 */
  isPrimaryKey?: string;
  /** 是否可空 0/1 */
  isNullable?: string;
  /** 是否必填 0/1 */
  isRequired?: string;
  /** 默认值 */
  defaultValue?: string;
  /** 备注 */
  remark?: string;
  /** 排序 */
  sortOrder?: number;
}

/** 业务建模条目（对应后端 JulyBusinessModelingVo011） */
export interface JulyBusinessModelingItem {
  id: string;
  /** 模型编码（唯一，不可变） */
  modelCode: string;
  /** 模型名称 */
  modelName: string;
  /** 业务对象名（对应库表，insert 必填） */
  objectName: string;
  /** 关联数据源编码 */
  dataSourceCode?: string;
  /** 状态：0 停用 / 1 启用 */
  status: string;
  /** 备注 */
  remark?: string;
  /** 字段子表 */
  fieldData?: JulyBusinessModelingFieldVo011[];
  createTime?: string | null;
  updateTime?: string | null;
}

/** 分页查询入参 */
export interface JulyBusinessModelingQueryVo011 {
  pageIndex: number;
  pageSize: number;
  keyword?: string;
  status?: string;
  dataSourceCode?: string;
}

/** 新增入参（modelCode / objectName 必填） */
export interface JulyBusinessModelingInsertVo011 {
  modelCode: string;
  modelName: string;
  objectName: string;
  dataSourceCode?: string;
  remark?: string;
  fieldData?: JulyBusinessModelingFieldVo011[];
}

/** 修改入参（modelCode / objectName 不可变） */
export interface JulyBusinessModelingUpdateVo011 {
  id: string;
  modelName?: string;
  dataSourceCode?: string;
  remark?: string;
  status?: string;
  fieldData?: JulyBusinessModelingFieldVo011[];
}

/** 保存入参（有 id = 编辑） */
export interface SaveBusinessModelingParams {
  id?: string;
  modelCode: string;
  modelName: string;
  objectName: string;
  dataSourceCode?: string;
  remark?: string;
  status?: string;
  fieldData?: JulyBusinessModelingFieldVo011[];
}

/** SQL 探测 / 执行入参（dataSourceCode + sqlContent 必填） */
export interface JulyBusinessModelingSqlVo011 {
  dataSourceCode: string;
  sqlContent: string;
  pageIndex?: number;
  pageSize?: number;
}

/** 探测结果（列结构） */
export interface JulyBusinessModelingProbeResultVo011 {
  success?: boolean;
  message?: string;
  /** 列元数据：{ name, type } */
  columns?: { name: string; type: string }[];
}

/** SQL 执行结果（通用） */
export interface JulyBusinessModelingSqlResultVo011 {
  success?: boolean;
  message?: string;
  /** 列名 */
  columns?: string[];
  /** 数据行 */
  rows?: Record<string, unknown>[];
  /** 执行耗时（ms） */
  elapsedMs?: number;
}

export type { PageResult011, IdVo011 } from '@/types/common';
