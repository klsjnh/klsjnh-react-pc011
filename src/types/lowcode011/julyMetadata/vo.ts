/**
 * lowcode011 / julyMetadata 模块 - 后端契约类型（DTO/VO）
 * 真实字段来自后端 /klsjnh/lowcode011/julyMetadata/v1/*（Swagger 已建模 JulyMetadata*Vo011）。
 *
 * 模型要点（与字典不同）：**一主三子整体编辑**
 *  - 主表 JulyMetadataVo011：getById 一次返回主表 + fields + displays + services
 *  - 保存（insert/update）入参 JulyMetadataSaveVo011：一主三子整体提交，三子为「整体替换」语义
 *    （只回传改动的那一子，另两子会被后端清空 —— 前端须始终回传全部三子）
 *  - objectName 唯一且不可变（修改时不传 / 忽略）
 */
import type { BaseVo011 } from '@/types/common';

/** 字段定义（JulyMetadataFieldVo011） */
export interface JulyMetadataFieldVo011 {
  /** 主键（新增不传，修改回传） */
  id?: string;
  /** 字段编码（同一对象内唯一，新增可编辑、老行只读） */
  fieldCode: string;
  /** 字段名称 */
  fieldName: string;
  /** 字段类型（FieldType011：string / int / id / create_time / update_time / ...） */
  fieldType: string;
  /** 长度 */
  fieldLength?: number | null;
  /** 是否必填 */
  requiredField?: boolean;
  /** 默认值 */
  defaultValue?: string | null;
  /** 排序（越小越靠前） */
  sortOrder: number;
}

/** 显示列（JulyMetadataDisplayVo011） */
export interface JulyMetadataDisplayVo011 {
  id?: string;
  /** 列编码（绑定字段，新增可编辑、老行只读） */
  displayCode: string;
  /** 列名称 */
  displayName: string;
  /** 对齐（left / center / right） */
  align?: string;
  /** 列宽 px */
  width?: number | null;
  /** 组件类型 */
  componentType?: string;
  /** 显示类型（DisplayType011） */
  displayType?: string;
  /** 扩展参数 */
  param011?: string | null;
  /** 排序（越小越靠前） */
  sortOrder: number;
}

/** 服务（JulyMetadataServiceVo011） */
export interface JulyMetadataServiceVo011 {
  id?: string;
  /** 服务编码（新增可编辑、老行只读） */
  serviceCode: string;
  /** 服务名称 */
  serviceName: string;
  /** 服务描述 */
  serviceDescription?: string | null;
  /** 服务对象类型（ServiceObjectType011） */
  objectType?: string;
  /** 参数类型（ServiceParamType011） */
  paramType?: string;
  /** SQL / 脚本内容 */
  serviceContent?: string | null;
  /** 是否启用 */
  enabled?: boolean;
  /** 排序（越小越靠前） */
  sortOrder: number;
}

/** 主表（JulyMetadataVo011）—— getById 返回 主 + 三子 */
export interface JulyMetadataVo011 extends BaseVo011 {
  /** 对象名（唯一，不可变；修改时不传） */
  objectName: string;
  /** 排序（越小越靠前） */
  sortOrder: number;
  /** 对象类型（ObjectType011：type011 / type013 / type_tree / type_tree011 / type021） */
  objectType: string;
  /** 对象描述 */
  description?: string | null;
  /** 业务字段清单 */
  businessField?: string | null;
  /** 目标包名 */
  packageName?: string | null;
  /** 前端路由 */
  routerPath?: string | null;
  /** 备注 */
  remark?: string | null;
  /** 状态：0 停用 / 1 启用 */
  status: string;
  /** 字段定义列表 */
  fields?: JulyMetadataFieldVo011[];
  /** 显示列列表 */
  displays?: JulyMetadataDisplayVo011[];
  /** 服务列表 */
  services?: JulyMetadataServiceVo011[];
}

/** 分页查询入参（JulyMetadataQueryVo011） */
export interface JulyMetadataQueryVo011 {
  pageIndex: number;
  pageSize: number;
  /** 对象名关键字（模糊） */
  keyword?: string;
  /** 对象类型过滤 */
  objectType?: string;
  /** 状态过滤（0 停用 / 1 启用） */
  status?: string;
}

/** 保存入参（JulyMetadataSaveVo011）—— 一主三子整体替换 */
export interface JulyMetadataSaveVo011 {
  /** 主键（新增不传，修改必传） */
  id?: string;
  /** 对象名（唯一，不可变） */
  objectName: string;
  sortOrder: number;
  objectType: string;
  description?: string | null;
  businessField?: string | null;
  packageName?: string | null;
  routerPath?: string | null;
  remark?: string | null;
  status: string;
  /** 字段列表（整体替换） */
  fields: JulyMetadataFieldVo011[];
  /** 显示列列表（整体替换） */
  displays: JulyMetadataDisplayVo011[];
  /** 服务列表（整体替换） */
  services: JulyMetadataServiceVo011[];
}

/* ==================== 设计器 MetaDTO 契约（039 一期，2026-09-17 新增） ==================== */

/**
 * 设计器 MetaDTO —— 与上面「一主三子」是**两套口径**，勿混用：
 *  - 一主三子（JulyMetadataVo011 / JulyMetadataSaveVo011）：038 的 CRUD 口径，子表键名是 `fieldCode/fieldName/...`
 *  - MetaDTO（本组类型）：对齐老项目，**三子在顶层**（不嵌 metaData），键名是短名 `code/name/...`
 *
 * 来源：`JulyMetadataDesignerController`（listModels / load / save / previewDdl），
 * 映射实现见后端 `JulyMetadataDesignerUseCase#toMetaDto`。
 * 例：`GET /klsjnh/lowcode011/julyMetadata/v1/load?objectName=xxx`
 *
 * ⚠️ `metaData.publishStatus` / `metaData.version` 当前由后端**硬编码**为 `'draft'` / `''`
 * （发布态列已建但 UseCase 未读取），**不可当作真实发布状态**。
 */

/** MetaDTO 字段行（fieldData[]） */
export interface JulyMetadataMetaField011 {
  /** 字段编码 */
  code: string;
  /** 字段名称 */
  name: string;
  /** 字段类型（FieldType011） */
  fieldType: string;
  /** 长度（后端落 0 表示未指定） */
  length?: number;
  /** 是否必填 */
  notNull?: boolean;
  /** 默认值 */
  defaultValue?: string | null;
  /** 排序 */
  sort?: number;
}

/** MetaDTO 显示列行（displayData[]） */
export interface JulyMetadataMetaDisplay011 {
  code: string;
  name: string;
  /** left / center / right（后端为空时回落 left） */
  align?: string;
  width?: number | null;
  /** 组件类型（后端为空时回落 input） */
  componentType?: string;
  /** 显示类型（DisplayType011，后端为空时回落 all） */
  displayType?: string;
  /** 扩展参数 */
  param011?: string | null;
  sort?: number;
}

/** MetaDTO 服务行（serviceData[]） */
export interface JulyMetadataMetaService011 {
  code: string;
  name: string;
  description?: string | null;
  /** ServiceObjectType011 */
  objectType?: string;
  /** ServiceParamType011 */
  paramType?: string;
  /** SQL / 脚本内容 */
  serviceContent?: string | null;
  /** 是否启用 */
  enabled?: boolean;
  sort?: number;
}

/** MetaDTO 头（metaData） */
export interface JulyMetadataMetaHeader011 {
  /** 对象名（唯一且不可变；save 时必传） */
  objectName: string;
  objectType?: string;
  description?: string | null;
  /** 业务字段（MetaDTO 口径的 businessField） */
  businessField?: string | null;
  packageName?: string | null;
  routerPath?: string | null;
  remark?: string | null;
  sortOrder?: number | null;
  /** ⚠️ 后端硬编码 'draft'，非真实发布态 */
  publishStatus?: string;
  /** ⚠️ 后端硬编码 ''，非真实版本 */
  version?: string;
}

/** 设计器 MetaDTO（load / save 的载体） */
export interface JulyMetadataMetaDto011 {
  metaData: JulyMetadataMetaHeader011;
  fieldData: JulyMetadataMetaField011[];
  displayData: JulyMetadataMetaDisplay011[];
  serviceData: JulyMetadataMetaService011[];
}

/** 模型列表行（listModels） */
export interface JulyMetadataModelRow011 {
  objectName: string;
  description?: string | null;
  objectType?: string | null;
  /** ⚠️ 后端硬编码 'draft' */
  publishStatus?: string;
  /** ⚠️ 后端硬编码 '' */
  version?: string;
}
