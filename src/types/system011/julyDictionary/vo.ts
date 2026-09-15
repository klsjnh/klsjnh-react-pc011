/** julyDictionary 模块 - 后端契约类型（DTO/VO，与 035.topic-dictionary 设计方案一一对应） */
import type { BaseVo011 } from '@/types/common';

// ==================== 契约（/julyDictionary/v1/*） ====================

/** 字典明细项 */
export interface JulyDictionaryItemVo011 extends BaseVo011 {
  /** 所属字典编码（insertItem 用它定位主表） */
  dictionaryCode: string;
  /** 明细项编码（同一字典内唯一，不可变） */
  itemCode: string;
  /** 明细项标签 */
  itemLabel: string;
  /** 排序，升序；同值按 id 稳定次序 */
  sortOrder: number;
  /** 备注 */
  remark?: string;
  status: string;
}

/** 字典主表 */
export interface JulyDictionaryVo011 extends BaseVo011 {
  /** 字典编码（唯一，不可变） */
  dictionaryCode: string;
  /** 字典名称 */
  dictionaryName: string;
  /** 排序，升序 */
  sortOrder: number;
  /** 备注 */
  remark?: string;
  status: string;
  /** 明细列表（getById 返回时带出，按 sortOrder 升序） */
  items?: JulyDictionaryItemVo011[];
}

/** 字典主表分页查询入参 */
export interface JulyDictionaryQueryVo011 {
  pageIndex: number;
  pageSize: number;
  /** 编码 / 名称 关键字（模糊） */
  keyword?: string;
  /** 状态过滤：0 停用 / 1 启用；留空为全部 */
  status?: string;
}

/** 字典主表新增入参 */
export interface JulyDictionaryInsertVo011 {
  dictionaryCode: string;
  dictionaryName: string;
  sortOrder: number;
  remark?: string;
}

/** 字典主表修改入参（dictionaryCode 不可变） */
export interface JulyDictionaryUpdateVo011 {
  id: string;
  dictionaryName: string;
  sortOrder: number;
  status: string;
  remark?: string;
}

/** 字典明细新增入参（用 dictionaryCode 定位主表） */
export interface JulyDictionaryItemInsertVo011 {
  dictionaryCode: string;
  itemCode: string;
  itemLabel: string;
  sortOrder: number;
  remark?: string;
}

/** 字典明细修改入参（itemCode 不可变） */
export interface JulyDictionaryItemUpdateVo011 {
  id: string;
  itemLabel: string;
  sortOrder: number;
  status: string;
  remark?: string;
}

/** 字典明细列表查询入参 */
export interface JulyDictionaryItemQueryVo011 {
  dictionaryCode: string;
  status?: string;
  keyword?: string;
}

/** 字典明细列表出参（selectItemListByType 返回 data：JulyDictionaryItemVo011[]） */
export type JulyDictionaryItemListVo011 = JulyDictionaryItemVo011[];