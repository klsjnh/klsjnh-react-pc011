/**
 * 数据源新建 / 编辑弹窗（antd Form + Modal，双列表单）
 * 字段对齐后端：dsCode / dsName / dbType / jdbcUrl / schemaName / username / password / driverClass / remark。
 * 弹窗内提供「测试连接」，结果以 TestFeedbackAlert 展示在表单顶部。
 * 提交/测试逻辑收敛在组件内，页面只需控制 open / node 与结果刷新。
 */
import React, { useState } from 'react';
import { ApiOutlined } from '@ant-design/icons';
import { Button, Col, Form, Input, Modal, Row, Select } from 'antd';
import { saveDatasource, testDatasourceConnection } from '@/services/dataservice011';
import { toast } from '@/utils/toast';
import { TestFeedbackAlert, type TestFeedback } from '@/components/system011/TestFeedbackAlert';
import type { DataSourceItem, JulyDatasourceTestVo011, JulyDatasourceTestResultVo011 } from '@/types/dataservice011/datasource';
import { DB_TYPE_OPTIONS } from '@/types/dataservice011/datasource';

/** 组装测试反馈（供 TestFeedbackAlert 消费） */
function buildFeedback(res: JulyDatasourceTestResultVo011, startedAt?: number): TestFeedback {
  const elapsedMs = startedAt != null ? Date.now() - startedAt : undefined;
  return {
    ok: res.success,
    message: res.message || (res.success ? '连接成功' : '连接失败'),
    elapsedMs,
    databaseProduct: res.databaseProduct,
    databaseVersion: res.databaseVersion,
  };
}

/** 请求异常（如 HTTP 500）时的失败反馈 -> 用 Alert 展示，而非 toast */
function failureFeedback(e: unknown, startedAt?: number): TestFeedback {
  const elapsedMs = startedAt != null ? Date.now() - startedAt : undefined;
  const msg = (e as Error)?.message || '连接测试请求失败';
  return { ok: false, message: msg, elapsedMs };
}

export interface DatasourceFormModalProps {
  /** 是否展示弹窗 */
  open: boolean;
  /** 编辑对象（null 为新建） */
  node: DataSourceItem | null;
  /** 关闭回调（取消 / 保存成功后） */
  onClose: () => void;
  /** 保存成功回调（页面刷新列表等） */
  onSaved: () => void;
}

export const DatasourceFormModal = ({ open, node, onClose, onSaved }: DatasourceFormModalProps) => {
  const [form] = Form.useForm();
  const [saving, setSaving] = useState(false);
  const [modalTesting, setModalTesting] = useState(false);
  const [modalTest, setModalTest] = useState<TestFeedback | null>(null);

  // 表单初始值：编辑回填用 key 重挂载，避免 setFieldsValue 副作用
  const formInitialValues = {
    dsCode: node?.dsCode || '',
    dsName: node?.dsName || '',
    dbType: node?.dbType || 'mysql',
    jdbcUrl: node?.jdbcUrl || '',
    schemaName: node?.schemaName || '',
    username: node?.username || '',
    driverClass: node?.driverClass || '',
    remark: node?.remark || '',
  };

  /** 弹窗内测试连接（新建草稿态 / 编辑重测），结果展示在弹窗内 Alert */
  const handleModalTest = async () => {
    // 表单校验失败 → toast 提示补全信息（属于校验，不占用 Alert）
    let v: { dsCode: string; dbType: string; jdbcUrl: string; username: string; driverClass?: string; password?: string };
    try {
      v = await form.validateFields();
    } catch {
      toast.warning('请先完善连接信息（编码/名称/类型/JDBC URL/用户名）后再测试');
      return;
    }
    setModalTesting(true);
    setModalTest(null);
    const startedAt = Date.now();
    const payload: JulyDatasourceTestVo011 = {
      id: node?.id,
      dsCode: node?.dsCode || v.dsCode,
      dbType: v.dbType,
      jdbcUrl: v.jdbcUrl,
      username: v.username,
      driverClass: v.driverClass,
      password: v.password || undefined,
    };
    try {
      const res = await testDatasourceConnection(payload);
      setModalTest(buildFeedback(res, startedAt));
    } catch (e) {
      // 请求失败（如 HTTP 500）→ 在 Alert 里明确提示失败
      setModalTest(failureFeedback(e, startedAt));
    } finally {
      setModalTesting(false);
    }
  };

  const handleSave = async () => {
    try {
      const v = await form.validateFields();
      setSaving(true);
      const savedId = await saveDatasource({ id: node?.id, ...v });
      toast.success(node?.id ? `update ${node.id} success ...` : `insert ${savedId} success ...`);
      onSaved();
      onClose();
    } catch (e) {
      toast.error((e as Error)?.message || '保存失败，请检查输入');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      title={node ? '编辑数据源' : '新建数据源'}
      key={node?.id ?? 'new'}
      open={open}
      onCancel={onClose}
      footer={[
        <Button key="test" icon={<ApiOutlined />} loading={modalTesting} onClick={handleModalTest}>测试连接</Button>,
        <Button key="cancel" onClick={onClose}>取消</Button>,
        <Button key="ok" type="primary" loading={saving} onClick={handleSave}>保存</Button>,
      ]}
      width={720}
      destroyOnHidden
    >
      <Form form={form} layout="vertical" preserve={false} initialValues={formInitialValues}>
        {modalTest && <TestFeedbackAlert data={modalTest} />}
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item name="dsCode" label="数据源编码" rules={[{ required: true, message: '请输入数据源编码' }]}>
              <Input disabled={!!node} placeholder="唯一，创建后不可修改，如 ds_main" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="dsName" label="数据源名称" rules={[{ required: true, message: '请输入数据源名称' }]}>
              <Input placeholder="请输入数据源名称" />
            </Form.Item>
          </Col>
        </Row>
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item name="dbType" label="数据库类型" rules={[{ required: true, message: '请选择数据库类型' }]}>
              <Select placeholder="请选择数据库类型" options={DB_TYPE_OPTIONS} />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="schemaName" label="库名 / Schema">
              <Input placeholder="请输入库名或 Schema" />
            </Form.Item>
          </Col>
        </Row>
        <Form.Item name="jdbcUrl" label="JDBC URL" rules={[
          { required: true, message: '请输入 JDBC URL' },
          { pattern: /^jdbc:/, message: 'JDBC URL 须以 jdbc: 开头' },
        ]}>
          <Input placeholder="如 jdbc:mysql://192.168.1.10:3306/xxx" />
        </Form.Item>
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item name="username" label="用户名">
              <Input placeholder="请输入用户名" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="password" label="密码" extra={node ? '留空表示保持原密码' : undefined}>
              <Input.Password placeholder="请输入密码" autoComplete="new-password" />
            </Form.Item>
          </Col>
        </Row>
        <Form.Item name="driverClass" label="驱动类名" extra="留空按数据库类型取默认驱动">
          <Input placeholder="如 com.mysql.cj.jdbc.Driver" />
        </Form.Item>
        <Form.Item name="remark" label="备注">
          <Input.TextArea rows={3} placeholder="备注说明" />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default DatasourceFormModal;