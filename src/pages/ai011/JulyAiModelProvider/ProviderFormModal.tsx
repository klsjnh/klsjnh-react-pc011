/**
 * AI 模型供应商 新建 / 编辑弹窗（antd Form + Modal）
 * 主表：providerCode/providerName/baseUrl/models/sortOrder/status/remark
 * 内置「测试连接」(TestFeedbackAlert 展示)
 * 子表：API 密钥管理（selectApiListByProvider 拉取，新增/编辑/删除/测试连接）
 * 提交 / 测试逻辑收敛在组件内，页面只用控制 open / node 与刷新。
 */
import React, { useEffect, useMemo, useState } from 'react';
import { ApiOutlined, KeyOutlined, PlusOutlined } from '@ant-design/icons';
import { Button, Col, Form, Input, Modal, Row, Select, Space, Table, Tag, Popconfirm } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
  saveProvider, testProviderConnection, removeProviderApi,
  testProviderApiConnection, saveProviderApi, selectApiListByProvider,
} from '@/services/ai011';
import { toast } from '@/utils/toast';
import { TestFeedbackAlert, type TestFeedback } from '@/components/system011/TestFeedbackAlert';
import type {
  AiModelProviderItem, AiModelProviderApiItem,
  AiModelProviderTestVo011, AiModelProviderTestResultVo011,
} from '@/types/ai011/aiModelProvider/vo';
import { STATUS_LABEL, STATUS_OPTIONS } from '@/config/constants';

/** 组装测试反馈 */
function buildFeedback(res: AiModelProviderTestResultVo011, startedAt?: number): TestFeedback {
  const elapsedMs = startedAt != null ? Date.now() - startedAt : undefined;
  return {
    ok: res.success,
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

/** API 子表 新增 / 编辑 弹窗 */
const ApiFormModal: React.FC<{
  open: boolean;
  provider: AiModelProviderItem | null;
  node: AiModelProviderApiItem | null;
  onClose: () => void;
  onSaved: () => void;
}> = ({ open, provider, node, onClose, onSaved }) => {
  const [form] = Form.useForm();
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [test, setTest] = useState<TestFeedback | null>(null);

  useEffect(() => {
    if (open) {
      setTest(null);
      form.setFieldsValue({
        apiCode: node?.apiCode || '',
        apiName: node?.apiName || '',
        apiKey: node?.apiKey || '',
        sortOrder: node?.sortOrder ?? 1,
        status: node?.status || '1',
        remark: node?.remark || '',
      });
    }
  }, [open, node, form]);

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
    if (!provider) { toast.warning('请先保存供应商'); return; }
    try {
      const v = await form.validateFields();
      setSaving(true);
      await saveProviderApi({ id: node?.id, providerCode: provider.providerCode, ...v });
      toast.success(node?.id ? `update api ${node.id} success ...` : `insert api success ...`);
      onSaved();
      onClose();
    } catch (e) {
      if ((e as any)?.errorFields) return;
      toast.error((e as Error)?.message || '保存失败');
    } finally { setSaving(false); }
  };

  return (
    <Modal
      title={node ? '编辑 API 密钥' : '新增 API 密钥'}
      key={node?.id ?? 'new-api'}
      open={open}
      onCancel={onClose}
      footer={[
        <Button key="test" icon={<ApiOutlined />} loading={testing} onClick={handleTest}>测试连接</Button>,
        <Button key="cancel" onClick={onClose}>取消</Button>,
        <Button key="ok" type="primary" loading={saving} onClick={handleSave}>保存</Button>,
      ]}
      width={600}
      destroyOnClose
    >
      <Form form={form} layout="vertical" preserve={false}>
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
        <Form.Item name="apiKey" label="API Key" rules={[{ required: true, message: '请输入 API Key' }]}>
          <Input.Password placeholder="sk-..." autoComplete="new-password" />
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

export const ProviderFormModal = ({ open, node, onClose, onSaved }: ProviderFormModalProps) => {
  const [form] = Form.useForm();
  const [saving, setSaving] = useState(false);
  const [modalTesting, setModalTesting] = useState(false);
  const [modalTest, setModalTest] = useState<TestFeedback | null>(null);

  // API 子表
  const [apis, setApis] = useState<AiModelProviderApiItem[]>([]);
  const [apiModal, setApiModal] = useState<{ open: boolean; node: AiModelProviderApiItem | null }>({ open: false, node: null });
  const [apiLoadingId, setApiLoadingId] = useState<string | null>(null);
  const [apiTest, setApiTest] = useState<TestFeedback | null>(null);

  // 编辑态回填 + 加载 API 子表
  useEffect(() => {
    if (open) {
      setModalTest(null);
      setApiTest(null);
      form.setFieldsValue({
        providerCode: node?.providerCode || '',
        providerName: node?.providerName || '',
        baseUrl: node?.baseUrl || '',
        models: node?.models || '',
        sortOrder: node?.sortOrder ?? 1,
        status: node?.status || '1',
        remark: node?.remark || '',
      });
      if (node?.providerCode) {
        selectApiListByProvider({ providerCode: node.providerCode })
          .then(setApis)
          .catch(() => setApis([]));
      } else {
        setApis([]);
      }
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
      if ((e as any)?.errorFields) return;
      toast.error((e as Error)?.message || '保存失败，请检查输入');
    } finally { setSaving(false); }
  };

  const handleRemoveApi = async (id: string) => {
    try { await removeProviderApi(id); setApis((list) => list.filter((a) => a.id !== id)); toast.success(`delete api ${id} success ...`); }
    catch (e) { toast.error((e as Error)?.message || '删除失败'); }
  };

  const handleApiTest = async (row: AiModelProviderApiItem) => {
    setApiLoadingId(row.id);
    setApiTest(null);
    const startedAt = Date.now();
    try { const res = await testProviderApiConnection(row.id); setApiTest(buildFeedback(res, startedAt)); }
    catch (e) { setApiTest(failureFeedback(e, startedAt)); }
    finally { setApiLoadingId(null); }
  };

  const apiColumns: ColumnsType<AiModelProviderApiItem> = useMemo(() => [
    { title: 'API 编码', dataIndex: 'apiCode', width: 130, render: (v) => <code>{v}</code> },
    { title: '名称', dataIndex: 'apiName', width: 130 },
    { title: 'Key', dataIndex: 'apiKey', ellipsis: true, render: (v) => <code>{v}</code> },
    { title: '状态', dataIndex: 'status', width: 80, render: (s) => <Tag color={s === '1' ? 'green' : 'red'}>{STATUS_LABEL[s] || s}</Tag> },
    {
      title: '操作', key: 'action', width: 200,
      render: (_, r) => (
        <Space size="small" wrap>
          <Button type="link" size="small" icon={<ApiOutlined />} loading={apiLoadingId === r.id} onClick={() => handleApiTest(r)}>测试</Button>
          <Button type="link" size="small" onClick={() => setApiModal({ open: true, node: r })}>编辑</Button>
          <Popconfirm title="确定删除该 API 吗？" okText="删除" cancelText="取消" okButtonProps={{ danger: true }} onConfirm={() => handleRemoveApi(r.id)}>
            <Button type="link" size="small" danger>删除</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ], [apiLoadingId]);

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
      width={760}
      destroyOnClose
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

        <div className="sub-table-title">
          <KeyOutlined /> <span>API 密钥子表</span>
          <Button type="primary" size="small" icon={<PlusOutlined />} style={{ marginLeft: 'auto' }}
            disabled={!node} onClick={() => setApiModal({ open: true, node: null })}>新增 API</Button>
        </div>
        {!node && <div className="sub-table-hint">保存供应商后可在此管理 API 密钥子表。</div>}
        {apiTest && <TestFeedbackAlert data={apiTest} />}
        <Table<AiModelProviderApiItem>
          rowKey="id"
          size="small"
          columns={apiColumns}
          dataSource={apis}
          pagination={false}
          locale={{ emptyText: node ? '暂无 API 密钥' : '请先保存供应商' }}
        />
      </Form>

      <ApiFormModal
        open={apiModal.open}
        provider={node}
        node={apiModal.node}
        onClose={() => setApiModal({ open: false, node: null })}
        onSaved={async () => {
          if (node?.providerCode) setApis(await selectApiListByProvider({ providerCode: node.providerCode }));
        }}
      />
    </Modal>
  );
};

export default ProviderFormModal;
