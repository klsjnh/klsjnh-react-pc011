/**
 * AI 推理服务（aicenter · julyAiInference/v1/*）
 * 对齐后端 AiChatRequestVo011：chat（非流式，信封）+ chat/stream（SSE 流式）。
 *
 * ⚠️ SSE 不走 request.ts 的信封链路：text/event-stream 不是 JSON 信封，
 * 必须用原生 fetch 读响应流（本项目唯一合理的特例，与 013 契约「信封解析收口一处」
 * 不冲突——流式响应本就无信封可解）。token 从 authStore 取，与 request.ts 同一份会话。
 *
 * 供应商/模型下拉数据源复用 julyAiModelProvider 管理接口（后端未提供独立
 * selectProviders 端点）：启用的供应商 + models 字段（逗号分隔或 JSON）。
 *
 * 分层：page → service → store；store 不调用 service。
 */
import { api } from '@/api/request';
import { isMockMode } from '@/config/appConfig';
import { authStore } from '@/stores/authStore';
import { mockStreamChat } from '@/mock/aiCenter/aiInference';
import { AICENTER_BASE, selectProviderListByPage } from '@/services/aiCenter/julyAiModelProviderService';
import type { AiChatRequestVo011, AiChatResponseVo011 } from '@/types/aiCenter';
import type { AiModelProviderItem } from '@/types/aiCenter';

const INFERENCE_ACTIONS = {
  chat: '/julyAiInference/v1/chat',
  chatStream: '/julyAiInference/v1/chat/stream',
} as const;

/** 非流式聊天（信封模式）：直接拿完整回复 */
export function chat(req: AiChatRequestVo011): Promise<AiChatResponseVo011> {
  return api.post<AiChatResponseVo011>(INFERENCE_ACTIONS.chat, req, AICENTER_BASE);
}

/**
 * 聊天可用的供应商列表（复用 julyAiModelProvider 管理接口，默认只要启用的）。
 * 后端无独立 selectProviders 端点——模型/密钥都登记在供应商主表 / api 子表里。
 */
export async function selectChatProviders(): Promise<AiModelProviderItem[]> {
  const res = await selectProviderListByPage({ pageIndex: 1, pageSize: 200, status: '1' });
  return res.rows || [];
}

/**
 * 解析供应商的 models 字段为模型名列表。
 * 后端登记形态有两种（注释口径「逗号分隔或 JSON 字符串」），这里双兼容，
 * 解析失败返回空数组（页面退化为手动输入模型名）。
 */
export function parseProviderModels(models?: string): string[] {
  if (!models || !models.trim()) return [];
  const text = models.trim();
  if (text.startsWith('[')) {
    try {
      const list = JSON.parse(text) as Array<{ modelCode?: string; modelName?: string } | string>;
      return list
        .map((m) => (typeof m === 'string' ? m : m.modelCode || m.modelName || ''))
        .filter(Boolean);
    } catch {
      return [];
    }
  }
  return text.split(',').map((s) => s.trim()).filter(Boolean);
}

/** SSE 流式回调集：onDelta 增量文本 / onReasoning 思考开始 / onDone 正常结束 / onError 失败 */
export interface StreamChatHandlers {
  onDelta: (text: string) => void;
  onDone: () => void;
  onError: (err: string) => void;
  onReasoning?: () => void;
}

/**
 * SSE 流式聊天。**双协议兼容**（实测本后端 11160 两种都不保证，按行判别）：
 *   1. 纯文本增量（后端实际形态）：`data:Hello\n\n` —— 直接 onDelta
 *      （保留冒号后原字符不 trim，实测后端把词间空格放在前导，trim 会丢空格）
 *   2. OpenAI 风格 JSON（老项目口径 / 未来兼容）：`data: {"choices":[{"delta":{"content":"..."}}]}`
 *      —— 取 choices[0].delta.content；reasoning_content（无正文时）触发 onReasoning
 *   3. `data: [DONE]` → onDone 结束
 * mock 模式下走内置 mock 流式（不发起网络请求）。
 */
export async function streamChat(req: AiChatRequestVo011, handlers: StreamChatHandlers): Promise<void> {
  const { onDelta, onDone, onError, onReasoning } = handlers;

  if (isMockMode()) {
    try {
      await mockStreamChat(req, onDelta, onReasoning);
      onDone();
    } catch (e) {
      onError(e instanceof Error ? e.message : 'Mock 聊天失败');
    }
    return;
  }

  const token = authStore.getSnapshot().token;
  const base = AICENTER_BASE.replace(/\/$/, '');
  try {
    const res = await fetch(`${base}${INFERENCE_ACTIONS.chatStream}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(req),
    });
    if (!res.ok) {
      onError(`请求失败(${res.status})`);
      return;
    }
    const reader = res.body?.getReader();
    if (!reader) {
      onError('无响应流');
      return;
    }
    const decoder = new TextDecoder();
    let buffer = '';
    for (; ;) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() ?? '';
      for (const line of lines) {
        if (!line.startsWith('data:')) continue;
        const data = line.slice(5).replace(/\r$/, '');
        const trimmed = data.trim();
        if (!trimmed) continue;
        if (trimmed === '[DONE]') { onDone(); return; }
        if (trimmed.startsWith('{')) {
          try {
            const parsed = JSON.parse(trimmed) as {
              choices?: Array<{ delta?: { content?: string; reasoning_content?: string }; text?: string }>;
            };
            const delta = parsed?.choices?.[0]?.delta;
            if (delta?.reasoning_content && !delta?.content) onReasoning?.();
            const text = delta?.content || parsed?.choices?.[0]?.text || '';
            if (text) onDelta(text);
          } catch {
            /* 忽略单行解析失败（半包/心跳行） */
          }
        } else {
          // 纯文本增量：本后端 chat/stream 的实际协议
          onDelta(data);
        }
      }
    }
    onDone();
  } catch (e) {
    onError(e instanceof Error ? e.message : '请求失败');
  }
}
