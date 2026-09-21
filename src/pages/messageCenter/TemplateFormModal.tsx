/**
 * 消息模板表单弹窗（出站/入站共用：direction 决定字段集合与调用）。
 * 编码类字段（templateCode）新增后不可变 —— 编辑态禁用。
 */
import React, { useEffect, useState } from 'react';
import { Form, Input, Modal, Select } from 'antd';
import type { Direction as MessageDirection } from '@/pages/messageCenter/paneTypes';

export interface TemplateFormValue {
  id?: string;
  templateCode: string;
  templateName: string;
  channelCode: string;
  title?: string;
  content: string;
  sortOrder?: number;
  remark?: string;
}

export interface TemplateFormModalProps {
  open: boolean;
  direction: MessageDirection;
  editing: TemplateFormValue | null;
  channelOptions: { value: string; label: string }[];
  onCancel: () => void;
  onSubmit: (value: TemplateFormValue) => Promise<void>;
}

export const TemplateFormModal = ({
  open, direction, editing, channelOptions, onCancel, onSubmit,
}: TemplateFormModalProps) => {
  const [form] = Form.useForm();
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      form.setFieldsValue(editing ?? { sortOrder: 1, channelCode: channelOptions[0]?.value });
    }
  }, [open, editing, form, channelOptions]);

  const handleOk = async () => {
    const values = (await form.validateFields()) as TemplateFormValue;
    setSaving(true);
    try {
      await onSubmit(values);
      onCancel();
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      title={`${editing ? '编辑' : '新增'}${direction === 'outbound' ? '出站' : '入站'}模板`}
      open={open}
      onOk={handleOk}
      confirmLoading={saving}
      onCancel={onCancel}
      destroyOnHidden
      width={560}
    >
      <Form form={form} layout="vertical" autoComplete="off">
        <Form.Item name="templateCode" label="模板编码" rules={[{ required: true, message: '请输入模板编码' }]}>
          <Input placeholder="唯一编码，新增后不可变" disabled={!!editing} maxLength={64} />
        </Form.Item>
        <Form.Item name="templateName" label="模板名称" rules={[{ required: true, message: '请输入模板名称' }]}>
          <Input maxLength={64} />
        </Form.Item>
        <Form.Item name="channelCode" label="所属通道" rules={[{ required: true, message: '请选择所属通道' }]}>
          <Select options={channelOptions} placeholder="选择通道" />
        </Form.Item>
        <Form.Item name="title" label="标题">
          <Input maxLength={128} />
        </Form.Item>
        <Form.Item name="content" label="内容" rules={[{ required: true, message: '请输入模板内容' }]}>
          <Input.TextArea rows={5} placeholder="支持占位符变量（由发送/接收时解析）" />
        </Form.Item>
        <Form.Item name="sortOrder" label="排序">
          <Input type="number" min={0} />
        </Form.Item>
        <Form.Item name="remark" label="备注">
          <Input.TextArea rows={2} maxLength={255} />
        </Form.Item>
      </Form>
    </Modal>
  );
};
