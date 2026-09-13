/** 应用配置类型 */
export type DataMode = 'mock' | 'api';
/** 运行态：development 可用免密登录；production 后端拒绝免密登录 */
export type RunState = 'development' | 'production';

export interface AppConfigState {
  dataMode: DataMode;
  runState: RunState;
  apiBaseUrl: string;
  /** 最近一次 API 请求错误（模式切换下拉里展示） */
  lastApiError: string | null;
}
