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