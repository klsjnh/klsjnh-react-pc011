/**
 * AI 聊天 / 推理页（aiCenter · julyAiInference）
 * 供应商 + 模型选择 → SSE 流式对话；历史与偏好持久化（store 层负责）。
 *
 * 分层：page（本文件）→ service（julyAiInferenceService）→ store（aiChatStore）。
 * markdown 渲染用 ReactMarkdown + 项目统一样式类 klsjnh-markdown011-body
 * （KlsjnhMarkdown011 是编辑器形态，聊天气泡只用其渲染与样式，不引编辑器）。
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Button, Input, Select, Space } from 'antd';
import { ClearOutlined, SendOutlined } from '@ant-design/icons';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { aiChatStore, useAiChatState } from '@/stores/aiCenter/aiChatStore';
import { parseProviderModels, selectChatProviders, streamChat } from '@/services/aiCenter/julyAiInferenceService';
import { toast } from '@/utils/toast';
import type { AiModelProviderItem } from '@/types/aiCenter';
import '@/components/system011/KlsjnhMarkdown011.css';

export const JulyAiChat = () => {
  const { messages, streaming, reasoning, pref } = useAiChatState();
  const [providers, setProviders] = useState<AiModelProviderItem[]>([]);
  const [input, setInput] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);
  /** 流式内容累加器：避免每次 setState 都读整条历史 */
  const contentRef = useRef('');

  // 供应商列表：默认选中偏好项，否则第一个
  useEffect(() => {
    let alive = true;
    selectChatProviders()
      .then((list) => {
        if (!alive) return;
        setProviders(list || []);
        const cur = aiChatStore.getSnapshot().pref;
        const hit = list?.find((p) => p.providerCode === cur.providerCode);
        const target = hit ?? list?.[0];
        if (target) {
          aiChatStore.setPref({
            providerCode: target.providerCode,
            model: cur.model || parseProviderModels(target.models)[0] || '',
          });
        }
      })
      .catch((e) => toast.error(e instanceof Error ? e.message : '加载供应商失败'));
    return () => { alive = false; };
  }, []);

  // 消息变化即滚动到底
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const modelOptions = useMemo(() => {
    const p = providers.find((x) => x.providerCode === pref.providerCode);
    return parseProviderModels(p?.models).map((m) => ({ value: m, label: m }));
  }, [providers, pref.providerCode]);

  const handleSend = useCallback(async () => {
    const text = input.trim();
    if (!text || !pref.providerCode || !pref.model || streaming) return;
    setInput('');
    // 用户消息 + 空壳 assistant 占位（流式增量往里填）
    const history = aiChatStore.getSnapshot().messages;
    aiChatStore.appendMessage({ role: 'user', content: text });
    aiChatStore.appendMessage({ role: 'assistant', content: '' });
    contentRef.current = '';
    aiChatStore.setStreaming(true);
    aiChatStore.setReasoning(false);

    await streamChat(
      {
        provider: pref.providerCode,
        model: pref.model,
        messages: [
          { role: 'system', content: '你是一个智能助手，请用专业的态度回答问题。' },
          ...history.filter((m) => m.role !== 'system' && m.content),
          { role: 'user', content: text },
        ],
      },
      {
        onDelta: (delta) => {
          aiChatStore.setReasoning(false);
          contentRef.current += delta;
          aiChatStore.appendDelta(delta);
        },
        onReasoning: () => aiChatStore.setReasoning(true),
        onDone: () => { aiChatStore.setStreaming(false); aiChatStore.setReasoning(false); },
        onError: (err) => { toast.error(err); aiChatStore.setStreaming(false); aiChatStore.setReasoning(false); },
      },
    );
  }, [input, pref, streaming]);

  return (
    <div className="page-fill" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <Space wrap>
        <Select
          style={{ width: 200 }}
          placeholder="选择供应商"
          value={pref.providerCode || undefined}
          onChange={(v) => {
            const p = providers.find((x) => x.providerCode === v);
            aiChatStore.setPref({
              providerCode: v,
              model: parseProviderModels(p?.models)[0] || '',
            });
          }}
          options={providers.map((p) => ({ value: p.providerCode, label: p.providerName }))}
        />
        {modelOptions.length > 0 ? (
          <Select
            style={{ width: 240 }}
            placeholder="选择模型"
            value={pref.model || undefined}
            onChange={(v) => aiChatStore.setPref({ model: v })}
            options={modelOptions}
          />
        ) : (
          <Input
            style={{ width: 240 }}
            placeholder="模型名称（供应商未登记 models 时手动输入）"
            value={pref.model}
            onChange={(e) => aiChatStore.setPref({ model: e.target.value })}
          />
        )}
        <Button icon={<ClearOutlined />} onClick={() => aiChatStore.clearMessages()} disabled={streaming}>
          清空对话
        </Button>
      </Space>

      <div
        style={{
          flex: 1,
          overflow: 'auto',
          border: '1px solid #d9d9d9',
          borderRadius: 6,
          padding: 16,
        }}
      >
        {messages.map((msg, i) => (
          <div key={i} style={{ marginBottom: 12, textAlign: msg.role === 'user' ? 'right' : 'left' }}>
            <span style={{ color: msg.role === 'user' ? undefined : '#00000073', marginRight: 8 }}>
              {msg.role === 'user' ? '你' : 'AI'}
            </span>
            <div
              style={{
                display: 'inline-block',
                maxWidth: '80%',
                padding: msg.role === 'assistant' ? '4px 10px' : '8px 14px',
                borderRadius: 8,
                background: msg.role === 'user' ? '#2d5a87' : 'transparent',
                color: msg.role === 'user' ? '#fff' : '#000',
                marginTop: 4,
                textAlign: 'left',
                verticalAlign: 'top',
              }}
            >
              {msg.role === 'user' ? (
                msg.content
              ) : msg.content ? (
                <div className="klsjnh-markdown011-body">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.content}</ReactMarkdown>
                </div>
              ) : i === messages.length - 1 && reasoning ? (
                '思考中...'
              ) : i === messages.length - 1 && streaming ? (
                '...'
              ) : (
                ''
              )}
            </div>
          </div>
        ))}
        <div ref={chatEndRef} />
      </div>

      <Space.Compact style={{ width: '100%' }}>
        <Input.TextArea
          rows={3}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onPressEnter={(e) => {
            if (!e.shiftKey) {
              e.preventDefault();
              void handleSend();
            }
          }}
          placeholder="输入消息...（Enter 发送，Shift+Enter 换行）"
          disabled={streaming}
        />
        <Button
          type="primary"
          icon={<SendOutlined />}
          onClick={() => void handleSend()}
          loading={streaming}
          disabled={!pref.providerCode || !pref.model}
          style={{ height: 74 }}
        >
          发送
        </Button>
      </Space.Compact>
    </div>
  );
};

export default JulyAiChat;
