/** 统一 API 请求类型 */
/** 统一响应信封（六字段固定） */
export interface Response011<T> {
  statusCode: number;
  message: string;
  errorMessage: string;
  timestamp: number;
  traceId: string;
  data: T;
}
