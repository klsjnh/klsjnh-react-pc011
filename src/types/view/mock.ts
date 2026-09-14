/** Mock 响应信封与 handler 类型（前端演示数据，非后端契约） */

/** 六字段响应信封（与后端 Response011<T> 一致） */
export interface MockEnvelope<T> {
  statusCode: number;
  message: string;
  errorMessage: string;
  timestamp: number;
  traceId: string;
  data: T;
}

/** Mock handler 函数签名 */
export type MockHandler = (body: any) => Promise<MockEnvelope<any>>;
