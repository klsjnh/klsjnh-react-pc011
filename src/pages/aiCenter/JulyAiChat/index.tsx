/**
 * AI 聊天 / 推理页（aiCenter · julyAiInference）
 * 选择器（左侧）：KlsjnhSelect031 联动双选 = 供应商(一级) → API 密钥(二级，按供应商拉取)；
 * 模型 Select 跟随**供应商**（取其 models 字段逗号分割），不与密钥联动。
 * 供应商 / 密钥 / 模型三者齐备才放行发送；历史与偏好持久化（store 层负责）。
 *
 * 分层：page（本文件）→ service（julyAiInferenceService）→ store（aiChatStore）。
 * markdown 渲染用 ReactMarkdown + 项目统一样式类 klsjnh-markdown011-body
 * （KlsjnhMarkdown011 是编辑器形态，聊天气泡只用其渲染与样式，不引编辑器）。
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Button, Input, Select } from 'antd';
import { ClearOutlined, SendOutlined } from '@ant-design/icons';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { aiChatStore, useAiChatState } from '@/stores/aiCenter/aiChatStore';
import { parseProviderModels, selectChatApies, selectChatProviders, streamChat } from '@/services/aiCenter/julyAiInferenceService';
import { toast } from '@/utils/toast';
import { KlsjnhSelect031 } from '@/components/klsjnh011/KlsjnhSelect031';
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
          // ⚠️ 偏好供应商失效（被删/停用）时，apiCode 必须一起清——残留的是旧供应商的密钥，
          // 发送门禁只看非空会放行，打过去必然键非所属（2026-09-20 store bug 修复）
          aiChatStore.setPref(hit
            ? { providerCode: target.providerCode, model: cur.model || parseProviderModels(target.models)[0] || '' }
            : { providerCode: target.providerCode, apiCode: '', model: parseProviderModels(target.models)[0] || '' });
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
    if (!text || !pref.providerCode || !pref.apiCode || !pref.model || streaming) return;
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
        api: pref.apiCode,
        model: pref.model,
        messages: [
          // 系统提示词：明确表格诉求的输出契约——实测模型默认会拿列表糊弄「表格」要求（2026-09-20）
          { role: 'system', content: '你是一个智能助手，请用专业的态度回答问题。当用户要求表格时，必须输出 Markdown 表格（含表头行与分隔行），不得用列表、纯文本或竖线分隔的文本替代。' },
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
    <div className="page-fill ai-chat-page">
      {/* 选择器区：左侧 供应商→密钥联动双选 + 模型（跟随供应商的 models 字段）；右侧 清空对话 */}
      <div className="page-toolbar ai-chat-toolbar">
        <div className="toolbar-left">
          <KlsjnhSelect031
            parentOptions={providers.map((p) => ({ value: p.providerCode, label: p.providerName }))}
            parentValue={pref.providerCode || undefined}
            onParentChange={(v) => {
              // 切换供应商：密钥清空（组件也会回调 onChildChange(undefined)）、模型重置为该供应商首个
              const p = providers.find((x) => x.providerCode === v);
              aiChatStore.setPref({
                providerCode: v || '',
                apiCode: '',
                model: parseProviderModels(p?.models)[0] || '',
              });
            }}
            loadChildren={(providerCode) =>
              selectChatApies(providerCode).then((list) =>
                list.map((a) => ({ value: a.apiCode, label: `${a.apiName}（${a.apiCode}）` }))
              )
            }
            childValue={pref.apiCode || undefined}
            onChildChange={(v) => aiChatStore.setPref({ apiCode: v || '' })}
            parentPlaceholder="选择供应商"
            childPlaceholder={pref.providerCode ? '选择密钥' : '请先选供应商'}
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
        </div>
        <div className="toolbar-right" />
      </div>

      {/* 消息面板：卡片化（.ai-chat-panel），内部滚动 */}
      <div className="ai-chat-panel">
        {messages.map((msg, i) => (
          <div key={i} className={`ai-chat-msg${msg.role === 'user' ? ' ai-chat-msg-user' : ''}`}>
            <span className="ai-chat-role">{msg.role === 'user' ? '你' : 'AI'}</span>
            <div className={`ai-chat-bubble${msg.role !== 'user' && !msg.content ? ' is-placeholder' : ''}`}>
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

      {/* 输入区：左右结构——左文本框吃满，右列纵向排列 清空对话 / 发送 */}
      <div className="ai-chat-inputbar">
        <Input.TextArea
          className="ai-chat-textarea"
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
        <div className="ai-chat-actions">
          <Button icon={<ClearOutlined />} onClick={() => aiChatStore.clearMessages()} disabled={streaming}>
            清空对话
          </Button>
          <Button
            type="primary"
            icon={<SendOutlined />}
            onClick={() => void handleSend()}
            loading={streaming}
            disabled={!pref.providerCode || !pref.apiCode || !pref.model}
          >
            发送
          </Button>
        </div>
      </div>
    </div>
  );
};

export default JulyAiChat;
