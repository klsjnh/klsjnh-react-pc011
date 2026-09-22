/**
 * AI 提示词 · 渲染预览弹窗
 * 2026-09-21 新契约：render(promptCode, params) —— promptCode 全局唯一，
 * 不再需要业务域上下文（旧 domainCode 选项移除）；变量值动态键值对录入。
 */
import { useState } from 'react';
import { MinusCircleOutlined, PlusOutlined } from '@ant-design/icons';
import { Button, Form, Input, Modal } from 'antd';
import { renderPrompt } from '@/services/aiCenter';
import { toast } from '@/utils/toast';
import type { JulyAiDomainPromptVo011 } from '@/types/aiCenter/aiPrompt/vo';

export interface RenderPreviewModalProps {
  open: boolean;
  /** 待渲染的提示词（页面选中态） */
  prompt: JulyAiDomainPromptVo011 | null;
  onClose: () => void;
}

/** 空 params 行 */
const EMPTY_PARAM = { key: '', value: '' };

export const RenderPreviewModal = ({ open, prompt, onClose }: RenderPreviewModalProps) => {
  const [form] = Form.useForm();
  const [rendering, setRendering] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  const handleRender = async () => {
    if (!prompt) return;
    try {
      const v = await form.validateFields();
      const params: Record<string, string> = {};
      for (const row of v.params || []) {
        if (row?.key) params[row.key] = row.value ?? '';
      }
      setRendering(true);
      setResult(null);
      const text = await renderPrompt({ promptCode: prompt.promptCode, params });
      setResult(text);
    } catch (e) {
      if (e && typeof e === 'object' && 'errorFields' in e) return;
      toast.error((e as Error)?.message || '渲染失败');
    } finally { setRendering(false); }
  };

  return (
    <Modal
      title={prompt ? `渲染预览 · ${prompt.promptName}（${prompt.promptCode}）` : '渲染预览'}
      open={open}
      onCancel={onClose}
      footer={null}
      width={680}
      destroyOnHidden
    >
      <Form form={form} layout="vertical" preserve={false} initialValues={{ params: [] }}>
        <Form.List name="params">
          {(fields, { add, remove }) => (
            <div>
              <div className="prompt-detail-editor-head">
                <span>变量值（${'${var}'} 替换；变量声明见提示词 variables 字段）</span>
                <Button size="small" icon={<PlusOutlined />} onClick={() => add({ ...EMPTY_PARAM })}>添加变量</Button>
              </div>
              {fields.map(({ key, name, ...restField }) => (
                <div key={key} className="render-param-row">
                  <Form.Item {...restField} name={[name, 'key']} style={{ flex: 1, marginBottom: 8 }}>
                    <Input placeholder="变量名" />
                  </Form.Item>
                  <Form.Item {...restField} name={[name, 'value']} style={{ flex: 2, marginBottom: 8 }}>
                    <Input placeholder="变量值" />
                  </Form.Item>
                  <Button type="text" danger size="small" icon={<MinusCircleOutlined />} onClick={() => remove(name)} />
                </div>
              ))}
            </div>
          )}
        </Form.List>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <Button type="primary" loading={rendering} onClick={handleRender}>渲染</Button>
        </div>
      </Form>
      {result !== null && (
        <div className="render-result">
          <div className="render-result-head">渲染结果</div>
          <pre>{result}</pre>
        </div>
      )}
    </Modal>
  );
};

export default RenderPreviewModal;
