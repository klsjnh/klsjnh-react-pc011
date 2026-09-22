/** FieldType011 —— 后端 `domain.lowcode011.enums.FieldType011`（12 值，与元数据模块同源） */
export const FIELD_TYPE_011_OPTIONS = [
  { value: 'id', label: 'id 主键' },
  { value: 'status', label: 'status 状态' },
  { value: 'create_by', label: 'create_by 创建人' },
  { value: 'update_by', label: 'update_by 修改人' },
  { value: 'create_time', label: 'create_time 创建时间' },
  { value: 'update_time', label: 'update_time 修改时间' },
  { value: 'string', label: 'string 字符串' },
  { value: 'int', label: 'int 整数' },
  { value: 'float', label: 'float 小数' },
  { value: 'date', label: 'date 日期时间' },
  { value: 'boolean', label: 'boolean 布尔' },
  { value: 'text', label: 'text 长文本' },
] as const;

/** ObjectType011 —— 后端 `domain.lowcode011.enums.ObjectType011` */
export const OBJECT_TYPE_011_OPTIONS = [
  { value: 'type011', label: 'type011（普通对象）' },
  { value: 'type013', label: 'type013' },
  { value: 'type_tree', label: 'type_tree（树形）' },
  { value: 'type_tree011', label: 'type_tree011' },
  { value: 'type021', label: 'type021' },
] as const;

/**
 * 字段定义（后端 `JulyBusinessModelingFieldVo011`）。
 * 公共列（id/status/审计四列）由后端按 base-entity-columns.sql 自动补齐，顺序固定、排在最前。
 */
export interface JulyBusinessModelingFieldVo011 {
  /** 字段编码（snake_case） */
  code: string;
  /** 字段名称（中文） */
  name: string;
  /** 字段类型（FieldType011 的 code） */
  fieldType: string;
  /** 长度（非长度类型为 0） */
  length?: number;
  /** 是否必填 */
  notNull?: boolean;
  /** 默认值 */
  defaultValue?: string;
}

/** 产物 metaData（后端 `JulyBusinessModelingMetaVo011`） */
export interface JulyBusinessModelingMetaVo011 {
  /** 低代码对象名（表名，全局唯一、不可变） */
  objectName?: string;
  /** 对象描述 */
  description?: string;
  /** 对象类型（ObjectType011） */
  objectType?: string;
  /** 目标包名 */
  packageName?: string;
  /** 参与导入导出的业务字段清单（逗号分隔） */
  importField?: string;
  /** 前端路由 */
  url?: string;
  /** 字段定义列表 */
  fieldData?: JulyBusinessModelingFieldVo011[];
}

/**
 * 建模出参（后端 `JulyBusinessModelingVo011`）。
 * `getById` / `getByCode` / `getModelData` / `selectListByPage` 的 rows 都是这个形状。
 */
export interface JulyBusinessModelingVo011 {
  id: string;
  /** 建模编码（唯一，不可变） */
  modelCode: string;
  /** 建模名称 */
  modelName: string;
  /** 低代码对象名 */
  objectName: string;
  /** 数据源编码 */
  dataSourceCode?: string | null;
  /** 取数 SQL（回显供管理面编辑） */
  sqlContent?: string | null;
  /** 备注 */
  remark?: string | null;
  /** 状态：0 停用 / 1 启用 */
  status: string;
  createBy?: string | null;
  updateBy?: string | null;
  createTime?: string | null;
  updateTime?: string | null;
  /** 产物（metaData + fieldData 两段） */
  metaData?: JulyBusinessModelingMetaVo011 | null;
}

/** 分页查询入参 */
export interface JulyBusinessModelingQueryVo011 {
  pageIndex: number;
  pageSize: number;
  keyword?: string;
  status?: string;
  dataSourceCode?: string;
}

/** 新增入参（后端 `JulyBusinessModelingInsertVo011`；modelCode / modelName / dataSourceCode / objectName 必填） */
export interface JulyBusinessModelingInsertVo011 {
  modelCode: string;
  modelName: string;
  dataSourceCode: string;
  objectName: string;
  sqlContent?: string;
  objectType?: string;
  objectDescription?: string;
  packageName?: string;
  businessField?: string;
  routerPath?: string;
  remark?: string;
  fieldData?: JulyBusinessModelingFieldVo011[];
}

/** 修改入参（后端 `JulyBusinessModelingUpdateVo011`；modelName / dataSourceCode 亦为必填，modelCode 与 objectName 不可变） */
export interface JulyBusinessModelingUpdateVo011 {
  id: string;
  modelName: string;
  dataSourceCode: string;
  sqlContent?: string;
  objectType?: string;
  objectDescription?: string;
  packageName?: string;
  businessField?: string;
  routerPath?: string;
  remark?: string;
  fieldData?: JulyBusinessModelingFieldVo011[];
}

/** 保存入参（有 id = 编辑；页面统一收口，service 再按 insert/update 分流） */
export interface SaveBusinessModelingParams {
  id?: string;
  modelCode: string;
  modelName: string;
  objectName: string;
  dataSourceCode: string;
  sqlContent?: string;
  objectType?: string;
  objectDescription?: string;
  packageName?: string;
  businessField?: string;
  routerPath?: string;
  remark?: string;
  status?: string;
  fieldData?: JulyBusinessModelingFieldVo011[];
}

/** SQL 探测入参（后端 `JulyBusinessModelingProbeVo011`；objectName 仅记录） */
export interface JulyBusinessModelingProbeVo011 {
  dataSourceCode: string;
  sqlContent: string;
  objectName?: string;
}

/**
 * 探测结果（后端 `JulyBusinessModelingProbeResultVo011`）。
 * ★ 后端 `probe` 走的是 `probeAndInfer` —— **直接返回推断好的字段定义**（含自动补齐的公共列），
 *   前端拿到后可直接灌进字段子表，不需要自己从列名猜类型。
 */
export interface JulyBusinessModelingProbeResultVo011 {
  success?: boolean;
  message?: string;
  /** 推断出的字段定义 */
  fieldData?: JulyBusinessModelingFieldVo011[];
}

/** 执行 SQL 入参（后端 `JulyBusinessModelingExecuteVo011`；SQL 源三选一、数据源二选一） */
export interface JulyBusinessModelingExecuteVo011 {
  dataSourceId?: string;
  dataSourceCode?: string;
  modelId?: string;
  modelCode?: string;
  sqlContent?: string;
}

/** 分页执行 SQL 入参（后端 `JulyBusinessModelingPageExecuteVo011`；pageSize 后端 clamp 到 [10,500]） */
export interface JulyBusinessModelingPageExecuteVo011 extends JulyBusinessModelingExecuteVo011 {
  pageIndex?: number;
  pageSize?: number;
}

/** 执行 SQL 结果（后端 `JulyBusinessModelingResultVo011`；仅 executeSql 返回 columns） */
export interface JulyBusinessModelingResultVo011 {
  columns?: string[];
  rows?: Record<string, unknown>[];
}

export type { PageResult011, IdVo011 } from '@/types/common';
