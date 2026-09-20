/**
 * AI 聊天 store（aiCenter · julyAiInference）
 * 消息列表 + 供应商/模型偏好 + 流式态；localStorage 持久化（刷新/切页回来不丢）。
 * 只负责状态，不发请求——流式拉取编排在 services/aiCenter/julyAiInferenceService。
 */
import { createStore, useStoreState } from '@/stores/createStore';
import type { AiChatMessageVo011 } from '@/types/aiCenter';

const CHAT_KEY = 'pc011-ai-chat-history';
const PREF_KEY = 'pc011-ai-chat-pref';

/** 没有历史记录时的欢迎语（assistant 首条） */
export const CHAT_WELCOME = '你好！我是 AI 助手，请选择供应商和模型后开始对话。';

export interface AiChatPref {
  providerCode: string;
  model: string;
}

export interface AiChatState {
  /** 消息列表（含 user / assistant；流式中的 assistant  content 持续增长） */
  messages: AiChatMessageVo011[];
  /** 流式进行中（禁发送 + loading） */
  streaming: boolean;
  /** 思考中（reasoning 阶段，尚无正文增量） */
  reasoning: boolean;
  /** 供应商/模型偏好（持久化） */
  pref: AiChatPref;
}

function loadMessages(): AiChatMessageVo011[] {
  try {
    const raw = localStorage.getItem(CHAT_KEY);
    if (!raw) return [{ role: 'assistant', content: CHAT_WELCOME }];
    const list = JSON.parse(raw) as AiChatMessageVo011[];
    return Array.isArray(list) && list.length > 0 ? list : [{ role: 'assistant', content: CHAT_WELCOME }];
  } catch {
    return [{ role: 'assistant', content: CHAT_WELCOME }];
  }
}

function loadPref(): AiChatPref {
  try {
    const raw = localStorage.getItem(PREF_KEY);
    if (raw) return JSON.parse(raw) as AiChatPref;
  } catch { /* ignore */ }
  return { providerCode: '', model: '' };
}

/** 仅欢迎语时不落盘（避免一进页面就写一条无意义记录） */
function isOnlyWelcome(list: AiChatMessageVo011[]): boolean {
  return list.length === 1 && list[0].role === 'assistant' && list[0].content === CHAT_WELCOME;
}

function persistMessages(list: AiChatMessageVo011[]): void {
  try {
    if (!isOnlyWelcome(list)) localStorage.setItem(CHAT_KEY, JSON.stringify(list));
  } catch { /* ignore */ }
}

function persistPref(pref: AiChatPref): void {
  try { localStorage.setItem(PREF_KEY, JSON.stringify(pref)); } catch { /* ignore */ }
}

const base = createStore<AiChatState>({
  messages: loadMessages(),
  streaming: false,
  reasoning: false,
  pref: loadPref(),
});

export const aiChatStore = {
  getSnapshot: base.getSnapshot,
  subscribe: base.subscribe,
  /** 追加消息（用户消息 / 空壳 assistant 占位） */
  appendMessage: (msg: AiChatMessageVo011) => {
    const messages = [...base.getSnapshot().messages, msg];
    persistMessages(messages);
    base.setState({ messages });
  },
  /** 流式增量：把 text 追加到最后一条 assistant 消息 */
  appendDelta: (text: string) => {
    const list = [...base.getSnapshot().messages];
    const last = list[list.length - 1];
    if (last && last.role === 'assistant') {
      list[list.length - 1] = { ...last, content: last.content + text };
      persistMessages(list);
      base.setState({ messages: list });
    }
  },
  setStreaming: (streaming: boolean) => base.setState({ streaming }),
  setReasoning: (reasoning: boolean) => base.setState({ reasoning }),
  setPref: (patch: Partial<AiChatPref>) => {
    const pref = { ...base.getSnapshot().pref, ...patch };
    persistPref(pref);
    base.setState({ pref });
  },
  /** 清空对话（保留欢迎语） */
  clearMessages: () => {
    const messages: AiChatMessageVo011[] = [{ role: 'assistant', content: CHAT_WELCOME }];
    try { localStorage.removeItem(CHAT_KEY); } catch { /* ignore */ }
    base.setState({ messages });
  },
};

export function useAiChatState(): AiChatState {
  return useStoreState(base);
}
