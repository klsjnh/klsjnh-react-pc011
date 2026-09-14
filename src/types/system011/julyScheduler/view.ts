/** julyScheduler 模块 - 前端视图类型（表格行、store 状态、表单值等） */
import type { JulySchedulerVo011, JulySchedulerQueryVo011 } from './vo';

// ==================== 视图 ====================

/** 定时任务 store 状态 */
export interface SchedulerState {
  list: JulySchedulerVo011[];
  total: number;
  totalPages: number;
  loading: boolean;
  query: JulySchedulerQueryVo011;
}

/** 保存入参（有 id = 编辑） */
export interface SaveSchedulerParams {
  id?: string;
  schedulerCode?: string;
  schedulerName: string;
  schedulerHandler: string;
  schedulerCron: string;
  status?: string;
}
