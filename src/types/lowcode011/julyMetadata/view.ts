/**
 * lowcode011 / julyMetadata 模块 - 前端视图类型（store 状态、草稿行）。
 */
import type { JulyMetadataVo011, JulyMetadataQueryVo011 } from '@/types/lowcode011/julyMetadata/vo';

/** 元数据 store 状态（列表页） */
export interface MetadataState {
  list: JulyMetadataVo011[];
  total: number;
  totalPages: number;
  loading: boolean;
  query: JulyMetadataQueryVo011;
  /** 列表行多选（批量删除） */
  selectedRowKeys: string[];
}

/**
 * 子表行草稿元数据（行编辑模型，对齐 DictionaryItemTable 约定）：
 *  - `_isNew`    未落库的新行（「取消」= 直接丢弃；老行「取消」= 还原服务端原值）
 *  - `_editing`  该行处于编辑态（同一时刻全局只允许一行）
 *  - `_dirty`    有未保存改动（行底色标记 + 顶部「有 N 处改动未保存」）
 *  - `_deleted`  已标记删除，随「保存」一起提交（未提交前可「撤销删除」）
 */
export interface DraftMeta {
  _key: string;
  _isNew?: boolean;
  _editing?: boolean;
  _dirty?: boolean;
  _deleted?: boolean;
}

/** 任意子表行的草稿形态 = 原始行 & DraftMeta */
export type DraftRow<T> = T & DraftMeta;
