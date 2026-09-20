/**
 * 出站发送弹窗：channelCode 必填；「模板 + params」与「直接内容（title/content）」二选一。
 * toast 展示 SendResult（success / channelMessageId / error）。
 */
import React, { useEffect, useState } from 'react';
import { Form, Input, Modal, Select } from 'antd';
import { sendOutboundMessage } from '@/services/messageCenter/julyOutboundMessageService';
import { toast } from '@/utils/toast';

export interface SendMessageModalProps {
  open: boolean;
  channelOptions: { value: string; label: string }[];
  templateOptions: { value: string; label: string }[];
  onCancel: () => void;
  onSent: () => void;
}

export const SendMessageModal = ({ open, channelOptions, templateOptions, onCancel, onSent }: SendMessageModalProps) => {
  const [form] = Form.useForm();
  const [sending, setSending] = useState(false);
  const [mode, setMode] = useState<'template' | 'direct'>('direct');

  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect -- 开弹窗重置表单与模式，属 intentional reset */
    if (open) {
      form.resetFields();
      setMode('direct');
    }
  }, [open, form]);

  const handleOk = async () => {
    const values = await form.validateFields();
    setSending(true);
    try {
      const res = await sendOutboundMessage({
        channelCode: values.channelCode,
        to: values.to || undefined,
        messageType: values.messageType || undefined,
        templateCode: mode === 'template' ? values.templateCode || undefined : undefined,
        params: mode === 'template' ? values.params || undefined : undefined,
        title: mode === 'direct' ? values.title || undefined : undefined,
        content: mode === 'direct' ? values.content || undefined : undefined,
        remark: values.remark || undefined,
      });
      if (res.success) {
        toast.success(`发送成功${res.channelMessageId ? `（渠道单号 ${res.channelMessageId}）` : ''}`);
        onSent();
        onCancel();
      } else {
        toast.error(res.error || '发送失败');
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : '发送请求失败');
    } finally {
      setSending(false);
    }
  };

  return (
    <Modal
      title="发送出站消息"
      open={open}
      onOk={handleOk}
      confirmLoading={sending}
      onCancel={onCancel}
      destroyOnHidden
      width={560}
    >
      <Form form={form} layout="vertical" autoComplete="off" initialValues={{ channelCode: channelOptions[0]?.value }}>
        <Form.Item name="channelCode" label="发送通道" rules={[{ required: true, message: '请选择发送通道' }]}>
          <Select options={channelOptions} placeholder="选择通道" />
        </Form.Item>
        <Form.Item name="to" label="接收方（to）">
          <Input placeholder="邮箱 / 手机号 / URL，按通道类型填写" maxLength={255} />
        </Form.Item>
        <Form.Item name="messageType" label="消息类型">
          <Input placeholder="如 text / markdown / html" maxLength={64} />
        </Form.Item>
        <Form.Item label="内容模式">
          <Select
            value={mode}
            onChange={setMode}
            options={[
              { value: 'direct', label: '直接内容' },
              { value: 'template', label: '模板渲染' },
            ]}
          />
        </Form.Item>
        {mode === 'template' ? (
          <>
            <Form.Item name="templateCode" label="模板" rules={[{ required: true, message: '请选择模板' }]}>
              <Select options={templateOptions} placeholder="选择模板" />
            </Form.Item>
            <Form.Item name="params" label="模板参数（JSON）">
              <Input.TextArea rows={3} placeholder='如 {"code":"123456"}' />
            </Form.Item>
          </>
        ) : (
          <>
            <Form.Item name="title" label="标题">
              <Input maxLength={128} />
            </Form.Item>
            <Form.Item name="content" label="内容" rules={[{ required: true, message: '请输入消息内容' }]}>
              <Input.TextArea rows={4} />
            </Form.Item>
          </>
        )}
        <Form.Item name="remark" label="备注">
          <Input maxLength={255} />
        </Form.Item>
      </Form>
    </Modal>
  );
};
