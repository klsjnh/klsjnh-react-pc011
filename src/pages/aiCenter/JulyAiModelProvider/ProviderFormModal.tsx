/**
 * AI 模型供应商 新建 / 编辑弹窗（antd Form + Modal）
 * 主表：providerCode/providerName/baseUrl/models/sortOrder/status/remark
 * 内置「测试连接」(TestFeedbackAlert 展示)
 * 2026-09-20 主子表改造：API 密钥子表已拆为页面级独立表格，
 * 本弹窗只负责主表字段；子表增改弹窗见同目录 ApiFormModal.tsx。
 */
import { useEffect, useState } from 'react';
import { ApiOutlined } from '@ant-design/icons';
import { Button, Col, Form, Input, Modal, Row, Select } from 'antd';
import { saveProvider, testProviderConnection } from '@/services/aiCenter';
import { toast } from '@/utils/toast';
import { TestFeedbackAlert, type TestFeedback } from '@/components/system011/TestFeedbackAlert';
import type {
  AiModelProviderItem,
  AiModelProviderTestVo011,
  AiModelProviderTestResultVo011,
} from '@/types/aiCenter/aiModelProvider/vo';
import { STATUS_OPTIONS } from '@/config/constants';

/** 组装测试反馈 */
function buildFeedback(res: AiModelProviderTestResultVo011, startedAt?: number): TestFeedback {
  const elapsedMs = startedAt != null ? Date.now() - startedAt : undefined;
  return {
    ok: !!res.success,
    message: res.message || (res.success ? '连接成功' : '连接失败'),
    elapsedMs,
  };
}
function failureFeedback(e: unknown, startedAt?: number): TestFeedback {
  const elapsedMs = startedAt != null ? Date.now() - startedAt : undefined;
  return { ok: false, message: (e as Error)?.message || '连接测试请求失败', elapsedMs };
}

export interface ProviderFormModalProps {
  open: boolean;
  node: AiModelProviderItem | null;
  onClose: () => void;
  onSaved: () => void;
}

export const ProviderFormModal = ({ open, node, onClose, onSaved }: ProviderFormModalProps) => {
  const [form] = Form.useForm();
  const [saving, setSaving] = useState(false);
  const [modalTesting, setModalTesting] = useState(false);
  const [modalTest, setModalTest] = useState<TestFeedback | null>(null);

  // intentional reset of test feedback when opening the modal / switching rows
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (open) {
      setModalTest(null);
      form.setFieldsValue({
        providerCode: node?.providerCode || '',
        providerName: node?.providerName || '',
        baseUrl: node?.baseUrl || '',
        models: node?.models || '',
        sortOrder: node?.sortOrder ?? 1,
        status: node?.status || '1',
        remark: node?.remark || '',
      });
    }
  }, [open, node, form]);

  const handleModalTest = async () => {
    let v: { providerCode: string; baseUrl: string };
    try { v = await form.validateFields(); } catch { toast.warning('请先完善编码与基础地址后再测试'); return; }
    setModalTesting(true);
    setModalTest(null);
    const startedAt = Date.now();
    const payload: AiModelProviderTestVo011 = { providerCode: node?.providerCode || v.providerCode };
    try {
      const res = await testProviderConnection(payload);
      setModalTest(buildFeedback(res, startedAt));
    } catch (e) { setModalTest(failureFeedback(e, startedAt)); }
    finally { setModalTesting(false); }
  };

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
    <Modal
      title={node ? '编辑 AI 模型供应商' : '新建 AI 模型供应商'}
      key={node?.id ?? 'new'}
      open={open}
      onCancel={onClose}
      footer={[
        <Button key="test" icon={<ApiOutlined />} loading={modalTesting} onClick={handleModalTest}>测试连接</Button>,
        <Button key="cancel" onClick={onClose}>取消</Button>,
        <Button key="ok" type="primary" loading={saving} onClick={handleSave}>保存</Button>,
      ]}
      width={600}
      destroyOnHidden
    >
      <Form form={form} layout="vertical" preserve={false} initialValues={{ status: '1', sortOrder: 1 }}>
        {modalTest && <TestFeedbackAlert data={modalTest} />}
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item name="providerCode" label="供应商编码" rules={[{ required: true, message: '请输入供应商编码' }]}>
              <Input disabled={!!node} placeholder="唯一，创建后不可修改，如 openai" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="providerName" label="供应商名称" rules={[{ required: true, message: '请输入供应商名称' }]}>
              <Input placeholder="如 OpenAI" />
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
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item name="sortOrder" label="排序" rules={[{ required: true, message: '请输入排序' }]}>
              <Input type="number" placeholder="数字越小越靠前" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="status" label="状态" rules={[{ required: true }]}>
              <Select options={STATUS_OPTIONS} />
            </Form.Item>
          </Col>
        </Row>
        <Form.Item name="remark" label="备注">
          <Input.TextArea rows={2} placeholder="备注说明" />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default ProviderFormModal;
