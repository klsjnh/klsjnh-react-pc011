/** julyDictionary 模块 - 前端视图类型（表格行、store 状态、表单值等） */
import type {
  JulyDictionaryVo011, JulyDictionaryItemVo011, JulyDictionaryQueryVo011,
} from '@/types/system011/julyDictionary/vo';

// ==================== 视图 ====================

/** 字典 store 状态 */
export interface DictionaryState {
  list: JulyDictionaryVo011[];
  total: number;
  totalPages: number;
  loading: boolean;
  query: JulyDictionaryQueryVo011;
  /** 当前选中字典（用于展示其明细） */
  active: JulyDictionaryVo011 | null;
  /** 当前字典的明细列表 */
  items: JulyDictionaryItemVo011[];
  itemsLoading: boolean;
}

/**
 * 明细行草稿（子表行编辑模型，见 components/DictionaryItemTable）
 *  - `_isNew`   未落库的新行（「取消」= 直接丢弃该行，已落库行「取消」= 还原服务端原值）
 *  - `_editing` 该行处于编辑态（同一时刻全局只允许一行）
 *  - `_dirty`   有未保存改动（行底色标记 + 顶部「有 N 处改动未保存」）
 *  - `_deleted` 已标记删除，随「保存」一起提交（未提交前可「撤销删除」）
 */
export type DictionaryItemDraft = JulyDictionaryItemVo011 & {
  _key: string;
  _isNew?: boolean;
  _editing?: boolean;
  _dirty?: boolean;
  _deleted?: boolean;
};