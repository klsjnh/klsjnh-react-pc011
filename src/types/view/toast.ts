/** 全局 Toast 类型 */
export type ToastKind = 'success' | 'error' | 'info' | 'warning';

export interface ToastItem {
  id: number;
  kind: ToastKind;
  content: string;
  /** 开始时间戳（用于进度条动画） */
  createdAt: number;
  duration: number;
}
