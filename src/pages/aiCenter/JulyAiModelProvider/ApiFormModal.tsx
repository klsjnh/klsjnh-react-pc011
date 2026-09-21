/**
 * AI 模型供应商 · API 密钥子表 新增 / 编辑弹窗（antd Form + Modal）
 * 2026-09-20 主子表改造：从供应商弹窗抽出，挂页面级。
 * provider 由页面选中态注入；编辑时 apiCode 不可变。
 *
 * ⚠️ 回填时序坑（同 ProviderFormModal）：antd6 Modal + destroyOnHidden 下表单内容
 * 挂载晚于父组件 effect，effect 里 setFieldsValue 会落空。故表单体拆成
 * ApiFormBody（按 node.id 挂 key，每次打开新 form 实例），initialValues 挂载即定型。
 */
import { useState } from 'react';
import { ApiOutlined } from '@ant-design/icons';
import { Button, Col, Form, Input, Modal, Row, Select } from 'antd';
import { saveProviderApi, testProviderApiConnection } from '@/services/aiCenter';
import { toast } from '@/utils/toast';
import { TestFeedbackAlert, type TestFeedback } from '@/components/system011/TestFeedbackAlert';
import type { AiModelProviderItem, AiModelProviderApiItem } from '@/types/aiCenter/aiModelProvider/vo';
import { STATUS_OPTIONS } from '@/config/constants';

/** 组装测试反馈 */
function buildFeedback(res: { success?: boolean; message?: string }, startedAt?: number): TestFeedback {
  const elapsedMs = startedAt != null ? Date.now() - startedAt : undefined;
  return { ok: !!res.success, message: res.message || (res.success ? '连接成功' : '连接失败'), elapsedMs };
}
function failureFeedback(e: unknown, startedAt?: number): TestFeedback {
  const elapsedMs = startedAt != null ? Date.now() - startedAt : undefined;
  return { ok: false, message: (e as Error)?.message || '连接测试请求失败', elapsedMs };
}

export interface ApiFormModalProps {
  open: boolean;
  /** 所属供应商（页面选中态；新建 API 必须已选中供应商） */
  provider: AiModelProviderItem | null;
  /** null = 新增；非空 = 编辑 */
  node: AiModelProviderApiItem | null;
  onClose: () => void;
  /** 保存成功后刷新子表（页面负责重拉 selectApiListByProvider） */
  onSaved: () => void;
}

/** 新建态的默认值 */
const NEW_DEFAULTS = { status: '1', sortOrder: 1 };

/**
 * 表单体：每次打开都是新实例（父层按 node.id 挂 key），initialValues 挂载即定型。
 */
const ApiFormBody = ({ provider, node, onClose, onSaved }: Omit<ApiFormModalProps, 'open'>) => {
  const [form] = Form.useForm();
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [test, setTest] = useState<TestFeedback | null>(null);

  const handleTest = async () => {
    if (!node?.id) { toast.warning('请先保存该 API 后再测试连接'); return; }
    setTesting(true);
    setTest(null);
    const startedAt = Date.now();
    try {
      const res = await testProviderApiConnection(node.id);
      setTest(buildFeedback(res, startedAt));
    } catch (e) { setTest(failureFeedback(e, startedAt)); }
    finally { setTesting(false); }
  };

  const handleSave = async () => {
    if (!provider) { toast.warning('请先选择供应商'); return; }
    try {
      const v = await form.validateFields();
      setSaving(true);
      // 编辑态密钥留空 = 不修改（后端 selectApiListByProvider 不回传 apiKey，
      // 若强制必填会导致「不改密钥就无法保存其他字段」——2026-09-20 修）
      await saveProviderApi({
        id: node?.id,
        providerCode: provider.providerCode,
        ...v,
        apiKey: v.apiKey || undefined,
      });
      toast.success(node?.id ? `update api ${node.id} success ...` : 'insert api success ...');
      onSaved();
      onClose();
    } catch (e) {
      if (e && typeof e === 'object' && 'errorFields' in e) return;
      toast.error((e as Error)?.message || '保存失败');
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
              apiCode: node.apiCode,
              apiName: node.apiName,
              apiKey: node.apiKey,
              sortOrder: node.sortOrder ?? 1,
              status: node.status || '1',
              remark: node.remark || '',
            }
          : NEW_DEFAULTS}
      >
        {test && <TestFeedbackAlert data={test} />}
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item name="apiCode" label="API 编码" rules={[{ required: true, message: '请输入 API 编码' }]}>
              <Input disabled={!!node} placeholder="唯一，如 key-prod" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="apiName" label="API 名称" rules={[{ required: true, message: '请输入 API 名称' }]}>
              <Input placeholder="如 生产密钥" />
            </Form.Item>
          </Col>
        </Row>
        <Form.Item
          name="apiKey"
          label="API Key"
          rules={node ? [] : [{ required: true, message: '请输入 API Key' }]}
          extra={node ? '留空则不修改密钥（后端不回传已保存的密钥）' : undefined}
        >
          <Input.Password placeholder={node ? '留空则不修改' : 'sk-...'} autoComplete="new-password" />
        </Form.Item>
        <Form.Item name="sortOrder" label="排序" rules={[{ required: true, message: '请输入排序' }]}>
          <Input type="number" placeholder="数字越小越靠前" />
        </Form.Item>
        <Form.Item name="remark" label="备注">
          <Input.TextArea rows={2} placeholder="备注说明" />
        </Form.Item>
        <Form.Item name="status" label="状态" rules={[{ required: true }]}>
          <Select options={STATUS_OPTIONS} />
        </Form.Item>
      </Form>
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 16 }}>
        <Button icon={<ApiOutlined />} loading={testing} onClick={handleTest}>测试连接</Button>
        <Button onClick={onClose}>取消</Button>
        <Button type="primary" loading={saving} onClick={handleSave}>保存</Button>
      </div>
    </>
  );
};

export const ApiFormModal = ({ open, provider, node, onClose, onSaved }: ApiFormModalProps) => (
  <Modal
    title={node ? '编辑 API 密钥' : '新增 API 密钥'}
    open={open}
    onCancel={onClose}
    footer={null}
    width={600}
    destroyOnHidden
  >
    {open && <ApiFormBody key={node?.id ?? 'new-api'} provider={provider} node={node} onClose={onClose} onSaved={onSaved} />}
  </Modal>
);

export default ApiFormModal;
