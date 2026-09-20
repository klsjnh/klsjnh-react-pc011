/** aicenter · julyAiInference 模块 - 前端契约类型（对齐后端 AiChatRequestVo011 等，见 docs/contracts/2026-09-20-openapi.json） */

/** 聊天消息（AiChatMessageVo011）：role = system / user / assistant */
export interface AiChatMessageVo011 {
  role: string;
  content: string;
}

/**
 * 聊天请求（AiChatRequestVo011）—— chat 与 chat/stream 共用同一入参。
 * provider：模型提供方（id 或 providerCode，如 longcat）；
 * api：密钥（id 或 apiCode，留空用默认启用密钥）；
 * model：模型名（**后端必传**）。
 */
export interface AiChatRequestVo011 {
  provider?: string;
  api?: string;
  model: string;
  messages: AiChatMessageVo011[];
  temperature?: number;
  maxTokens?: number;
}

/** 非流式聊天响应（AiChatResponseVo011） */
export interface AiChatResponseVo011 {
  providerCode?: string;
  apiCode?: string;
  model?: string;
  content: string;
  finishReason?: string;
  promptTokens?: number;
  completionTokens?: number;
  totalTokens?: number;
}
