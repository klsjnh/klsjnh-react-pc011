/** julyConfig 模块 - 前端视图类型（表格行、store 状态、表单值等） */
import type { JulyConfigVo011, JulyConfigQueryVo011 } from './vo';

// ==================== 视图 ====================

/** 配置 store 状态 */
export interface ConfigState {
  list: JulyConfigVo011[];
  total: number;
  totalPages: number;
  loading: boolean;
  query: JulyConfigQueryVo011;
}
