/**
 * 入站接收模拟弹窗：rawBody 为第三方回调原文（JSON 字符串）。
 * 生产环境该端点是第三方 webhook 打入；此弹窗供联调手动推送。
 * 结果区分「新入库」与「重复投递（duplicate）」。
 */
import React, { useEffect, useState } from 'react';
import { Form, Input, Modal } from 'antd';
import { receiveInboundMessage } from '@/services/messageCenter/julyInboundMessageService';
import { toast } from '@/utils/toast';

export interface ReceiveMessageModalProps {
  open: boolean;
  channelOptions: { value: string; label: string }[];
  onCancel: () => void;
  onReceived: () => void;
}

const SAMPLE = '{\n  "fromId": "user-001",\n  "messageType": "text",\n  "content": "这是一条模拟回调"\n}';

export const ReceiveMessageModal = ({ open, onCancel, onReceived }: ReceiveMessageModalProps) => {
  const [form] = Form.useForm();
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) form.setFieldsValue({ rawBody: SAMPLE });
  }, [open, form]);

  const handleOk = async () => {
    const values = await form.validateFields();
    setSaving(true);
    try {
      const res = await receiveInboundMessage({ rawBody: values.rawBody });
      if (res.duplicate) {
        toast.warning('重复投递（后端幂等命中，未新增记录）');
      } else {
        toast.success(`接收成功${res.messageId ? `（消息 ID ${res.messageId}）` : ''}`);
      }
      onReceived();
      onCancel();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : '接收请求失败');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      title="模拟入站回调"
      open={open}
      onOk={handleOk}
      confirmLoading={saving}
      onCancel={onCancel}
      destroyOnHidden
      width={560}
    >
      <Form form={form} layout="vertical" autoComplete="off">
        <Form.Item name="rawBody" label="回调原文（rawBody，JSON 字符串）" rules={[{ required: true, message: '请输入回调原文' }]}>
          <Input.TextArea rows={8} />
        </Form.Item>
      </Form>
    </Modal>
  );
};
