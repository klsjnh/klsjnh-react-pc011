/**
 * AI 模型供应商 新建 / 编辑弹窗（antd Form + Modal）
 * 主表：providerCode/providerName/baseUrl/models/sortOrder/status/remark
 * 2026-09-20 主子表改造：API 密钥子表已拆为页面级独立表格，
 * 本弹窗只负责主表字段；子表增改弹窗见同目录 ApiFormModal.tsx。
 * 测试连接仅子表（API 密钥）提供——主表无测试入口（2026-09-20 用户指示）。
 *
 * ⚠️ 回填时序坑（2026-09-20 实测）：antd6 Modal + destroyOnHidden 下，弹窗内容
 * （Form.Item）的挂载**晚于**父组件 effect —— 在 effect 里 setFieldsValue 会写进
 * 「字段尚未注册」的 store，字段后来注册时读不到，编辑态全空。故表单体拆成
 * ProviderFormBody（按 node.id 挂 key，每次打开都是**全新 form 实例**），
 * 用 initialValues 在挂载时定型，彻底不依赖 effect 时序。
 */
import { useState } from 'react';
import { Button, Col, Form, Input, Modal, Row, Select } from 'antd';
import { saveProvider } from '@/services/aiCenter';
import { toast } from '@/utils/toast';
import type { AiModelProviderItem } from '@/types/aiCenter/aiModelProvider/vo';
import { STATUS_OPTIONS } from '@/config/constants';

export interface ProviderFormModalProps {
  open: boolean;
  node: AiModelProviderItem | null;
  onClose: () => void;
  onSaved: () => void;
}

/** 新建态的默认值（编辑态由 node 全量回填，见 initialValues） */
const NEW_DEFAULTS = { status: '1', sortOrder: 1 };

/**
 * 表单体：每次打开都是新实例（父层按 node.id 挂 key），initialValues 挂载即定型。
 * 操作按钮渲染在表单下方（不再走 Modal footer——footer 在 Form 之外，拿不到表单态）。
 */
const ProviderFormBody = ({ node, onClose, onSaved }: Omit<ProviderFormModalProps, 'open'>) => {
  const [form] = Form.useForm();
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    try {
      const v = await form.validateFields();
      setSaving(true);
      const savedId = await saveProvider({ id: node?.id, ...v });
      toast.success(node?.id ? `update ${node.id} success ...` : `insert ${savedId} success ...`);
      onSaved();
      onClose();
    } catch (e) {
      if (e && typeof e === 'object' && 'errorFields' in e) return;
      toast.error((e as Error)?.message || '保存失败，请检查输入');
    } finally { setSaving(false); }
  };

  return (
    <>
      <Form
        form={form}
        layout="vertical"
        preserve={false}
        initialValues={node
          ? {
            providerCode: node.providerCode,
            providerName: node.providerName,
            baseUrl: node.baseUrl,
            models: node.models || '',
            sortOrder: node.sortOrder ?? 1,
            status: node.status || '1',
            remark: node.remark || '',
          }
          : NEW_DEFAULTS}
      >
        <Row gutter={16}>
          <Col span={8}>
            <Form.Item name="providerCode" label="供应商编码" rules={[{ required: true, message: '请输入供应商编码' }]}>
              <Input disabled={!!node} placeholder="唯一，创建后不可修改，如 openai" />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item name="providerName" label="供应商名称" rules={[{ required: true, message: '请输入供应商名称' }]}>
              <Input placeholder="如 OpenAI" />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item name="sortOrder" label="排序" rules={[{ required: true, message: '请输入排序' }]}>
              <Input type="number" placeholder="数字越小越靠前" />
            </Form.Item>
          </Col>
        </Row>
        <Form.Item name="baseUrl" label="基础地址" rules={[
          { required: true, message: '请输入基础地址' },
          { pattern: /^https?:\/\//, message: '基础地址须以 http(s):// 开头' },
        ]}>
          <Input placeholder="如 https://api.openai.com/v1" />
        </Form.Item>
        <Form.Item name="models" label="模型列表" extra="多个模型用逗号分隔，如 gpt-4o,gpt-4o-mini">
          <Input.TextArea rows={2} placeholder="gpt-4o,gpt-4o-mini" />
        </Form.Item>
        <Form.Item name="remark" label="备注">
          <Input.TextArea rows={2} placeholder="备注说明" />
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

export const ProviderFormModal = ({ open, node, onClose, onSaved }: ProviderFormModalProps) => (
  <Modal
    title={node ? '编辑 AI 模型供应商' : '新建 AI 模型供应商'}
    open={open}
    onCancel={onClose}
    footer={null}
    width={600}
    destroyOnHidden
  >
    {/* open 时才挂表单体；key 随 node.id 变 → 每次打开/切行都是全新实例 + initialValues 定型 */}
    {open && <ProviderFormBody key={node?.id ?? 'new'} node={node} onClose={onClose} onSaved={onSaved} />}
  </Modal>
);

export default ProviderFormModal;
