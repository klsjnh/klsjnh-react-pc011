/**
 * 消息通道表单弹窗（出站/入站共用）。
 * channelCode 新增后不可变；config 为 JSON 字符串（endpoint / 密钥等，按 providerType 解释）。
 */
import React, { useEffect, useState } from 'react';
import { Form, Input, Modal } from 'antd';
import type { Direction as MessageDirection } from '@/pages/messageCenter/paneTypes';

export interface ChannelFormValue {
  id?: string;
  channelCode: string;
  channelName: string;
  providerType: string;
  config?: string;
  sortOrder?: number;
  remark?: string;
}

export interface ChannelFormModalProps {
  open: boolean;
  direction: MessageDirection;
  editing: ChannelFormValue | null;
  onCancel: () => void;
  onSubmit: (value: ChannelFormValue) => Promise<void>;
}

export const ChannelFormModal = ({
  open, direction, editing, onCancel, onSubmit,
}: ChannelFormModalProps) => {
  const [form] = Form.useForm();
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) form.setFieldsValue(editing ?? { sortOrder: 1 });
  }, [open, editing, form]);

  const handleOk = async () => {
    const values = (await form.validateFields()) as ChannelFormValue;
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
      title={`${editing ? '编辑' : '新增'}${direction === 'outbound' ? '出站' : '入站'}通道`}
      open={open}
      onOk={handleOk}
      confirmLoading={saving}
      onCancel={onCancel}
      destroyOnHidden
      width={560}
    >
      <Form form={form} layout="vertical" autoComplete="off">
        <Form.Item name="channelCode" label="通道编码" rules={[{ required: true, message: '请输入通道编码' }]}>
          <Input placeholder="唯一编码（如 email001 / sms001），新增后不可变" disabled={!!editing} maxLength={64} />
        </Form.Item>
        <Form.Item name="channelName" label="通道名称" rules={[{ required: true, message: '请输入通道名称' }]}>
          <Input maxLength={64} />
        </Form.Item>
        <Form.Item name="providerType" label="供应商类型" rules={[{ required: true, message: '请输入供应商类型' }]}>
          <Input placeholder="如 email / sms / webhook" maxLength={64} />
        </Form.Item>
        <Form.Item name="config" label="配置（JSON）">
          <Input.TextArea rows={4} placeholder='如 {"endpoint":"smtp://...","from":"noreply@xxx"}' />
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
