/**
 * AI 提示词 新建 / 编辑弹窗（antd Form + Modal）—— 主表设置（不含正文）
 * 2026-09-21 新契约：新建 = insertDetail(pkMt=当前选中域)；编辑 = updateDetail（promptCode 不可变）。
 * 正文不在此编辑（超长，走整页编辑器 PromptDetailEditorPage）。
 *
 * ?? 回填时序坑（同 ProviderFormModal）：表单体拆成 PromptFormBody，
 * 父层按 node.id 挂 key，每次打开都是全新 form 实例 + initialValues 定型。
 */
import { useState } from 'react';
import { Button, Col, Form, Input, Modal, Row, Select } from 'antd';
import { savePrompt } from '@/services/aiCenter';
import { toast } from '@/utils/toast';
import { AI_SCENE_OPTIONS, STATUS_OPTIONS } from '@/config/constants';
import type { JulyAiDomainPromptVo011 } from '@/types/aiCenter/aiPrompt/vo';

export interface PromptFormModalProps {
  open: boolean;
  /** 编辑对象（null = 新建） */
  node: JulyAiDomainPromptVo011 | null;
  /** 新建时所属业务域 id（从主页选中域带入；编辑态忽略） */
  pkMt?: string;
  onClose: () => void;
}

/** 新建态默认值 */
const NEW_DEFAULTS = { contentMode: 'inline', status: '1', sortOrder: 1 };

const PromptFormBody = ({ node, pkMt, onClose }: Omit<PromptFormModalProps, 'open'>) => {
  const [form] = Form.useForm();
  const [saving, setSaving] = useState(false);
  const isEdit = !!node?.id;

  const handleSave = async () => {
    try {
      const v = await form.validateFields();
      setSaving(true);
      const savedId = await savePrompt({
        id: node?.id,
        pkMt: isEdit ? node?.pkMt : pkMt,
        promptCode: isEdit ? node?.promptCode : String(v.promptCode).trim(),
        promptName: String(v.promptName).trim(),
        scene: v.scene,
        sortOrder: v.sortOrder,
        remark: v.remark,
        status: v.status,
      });
      toast.success(isEdit ? `update ${node?.id} success ...` : `insert ${savedId} success ...`);
      onClose();
    } catch (e) {
      if (e && typeof e === 'object' && 'errorFields' in e) return;
      toast.error((e as Error)?.message || '保存失败，请检查输入');
    } finally { setSaving(false); }
  };

  const initialValues = node
    ? {
      promptCode: node.promptCode,
      promptName: node.promptName,
      scene: node.scene,
      sortOrder: node.sortOrder ?? 1,
      status: node.status || '1',
      remark: node.remark || '',
    }
    : { ...NEW_DEFAULTS, promptCode: '', promptName: '' };

  return (
    <>
      <Form form={form} layout="vertical" preserve={false} initialValues={initialValues}>
        <Row gutter={16}>
          <Col span={8}>
            <Form.Item name="promptCode" label="提示词编码" rules={[{ required: true, message: '请输入提示词编码' }]}
              extra="全局唯一；创建后不可修改">
              <Input placeholder="如 chat.sql.assistant" disabled={isEdit} />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item name="promptName" label="提示词名称" rules={[{ required: true, message: '请输入提示词名称' }]}>
              <Input placeholder="如 SQL 助手" maxLength={100} />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item name="scene" label="适用能力" extra="仅分类标注">
              <Select allowClear placeholder="未指定" options={AI_SCENE_OPTIONS} />
            </Form.Item>
          </Col>
        </Row>
        <Row gutter={16}>
          <Col span={8}>
            <Form.Item name="sortOrder" label="排序" rules={[{ required: true, message: '请输入排序' }]}>
              <Input type="number" placeholder="越小越靠前" />
            </Form.Item>
          </Col>
        </Row>

        {/* 备注、状态各自独占一行，备注在前（016 §9.1 表单布局铁律） */}
        <Form.Item name="remark" label="备注">
          <Input.TextArea rows={2} maxLength={300} showCount />
        </Form.Item>

        <Form.Item name="status" label="状态" rules={[{ required: true }]}>
          <Select options={STATUS_OPTIONS} />
        </Form.Item>
      </Form>
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 16 }}>
        <Button onClick={onClose}>取消</Button>
        <Button type="primary" loading={saving} onClick={handleSave}>保存</Button>
      </div>
    </>
  );
};

export const PromptFormModal = ({ open, node, pkMt, onClose }: PromptFormModalProps) => (
  <Modal
    title={node ? '编辑提示词' : '新建提示词'}
    open={open}
    onCancel={onClose}
    footer={null}
    width={640}
    destroyOnHidden
  >
    {open && (
      <PromptFormBody
        key={node?.id ?? `new-${pkMt ?? 'no-domain'}`}
        node={node}
        pkMt={pkMt}
        onClose={onClose}
      />
    )}
  </Modal>
);

export default PromptFormModal;
