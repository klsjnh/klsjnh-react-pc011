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

/**
 * Mock handler 函数签名。
 * `body` 保留 `any`：handler 按 action 字符串分发，请求体结构随接口异构，
 * 边界处不做强类型约束，由各 handler 内部自行收窄；真契约以运行时 OpenAPI 为准（见 013.api-contract）。
 */
export type MockHandler = (body: any) => Promise<MockEnvelope<unknown>>;
