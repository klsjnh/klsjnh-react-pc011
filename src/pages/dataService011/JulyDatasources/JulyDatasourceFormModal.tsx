/**
 * 数据源新增 / 编辑弹窗（antd Form + Modal）
 * 字段对齐后端：name / type / host / database / status。
 */
import React, { useMemo } from 'react';
import { Col, Form, Input, Modal, Row, Select } from 'antd';
import type { DataSourceItem } from '@/types/dataservice011';

/** 弹窗属性 */
export interface JulyDatasourceFormModalProps {
  open: boolean;
  datasource: DataSourceItem | null;
  onClose: () => void;
  onSaved: () => void;
}

/** 数据源类型选项 */
const TYPE_OPTIONS = [
  { value: 'MySQL', label: 'MySQL' },
  { value: 'PostgreSQL', label: 'PostgreSQL' },
  { value: 'Redis', label: 'Redis' },
  { value: 'MongoDB', label: 'MongoDB' },
];

/** 状态选项 */
const STATUS_OPTIONS = [
  { value: 'connected', label: '已连接' },
  { value: 'disconnected', label: '未连接' },
];

export const JulyDatasourceFormModal = ({
  open, datasource, onClose, onSaved,
}: JulyDatasourceFormModalProps) => {
  const [form] = Form.useForm();
  const isEdit = !!datasource;

  const initialValues = useMemo(() => {
    if (!datasource) return { status: 'connected', type: 'MySQL' };
    return {
      name: datasource.name,
      type: datasource.type,
      host: datasource.host,
      database: datasource.database,
      status: datasource.status,
    };
  }, [datasource]);

  const handleOk = async () => {
    await form.validateFields();
    // TODO: 调用 service 保存
    onSaved();
    onClose();
  };

  return (
    <Modal
      title={isEdit ? '编辑数据源' : '新建数据源'}
      open={open}
      onCancel={onClose}
      onOk={handleOk}
      okText="保存"
      cancelText="取消"
      width={640}
      destroyOnClose
    >
      <Form form={form} layout="vertical" preserve={false} initialValues={initialValues}>
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item name="name" label="数据源名称" rules={[{ required: true, message: '请输入数据源名称' }]}>
              <Input placeholder="请输入数据源名称" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="type" label="数据源类型" rules={[{ required: true, message: '请选择数据源类型' }]}>
              <Select placeholder="请选择数据源类型" options={TYPE_OPTIONS} />
            </Form.Item>
          </Col>
        </Row>
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item name="host" label="主机地址" rules={[{ required: true, message: '请输入主机地址' }]}>
              <Input placeholder="例如：192.168.1.10:3306" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="database" label="数据库名" rules={[{ required: true, message: '请输入数据库名' }]}>
              <Input placeholder="请输入数据库名" />
            </Form.Item>
          </Col>
        </Row>
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item name="status" label="状态">
              <Select options={STATUS_OPTIONS} />
            </Form.Item>
          </Col>
        </Row>
      </Form>
    </Modal>
  );
};
