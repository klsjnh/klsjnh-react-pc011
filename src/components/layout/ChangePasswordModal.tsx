/**
 * 修改密码弹窗（layout · Top 头像菜单）—— 从 Top.tsx 拆出（2026-09-22）
 * 契合金标准弹窗模式：Modal 与 Form 同组件、onOk/okText 内建 footer、confirmLoading 防重复提交。
 * 打开方式：`<ChangePasswordModal open userAccount onClose />`，关闭即重置（preserve=false + 条件挂载）。
 */
import { useState } from 'react';
import { Form, Input, Modal } from 'antd';
import { changePassword } from '@/services/system011';
import { toast } from '@/utils/toast';

export interface ChangePasswordModalProps {
  open: boolean;
  /** 当前登录账号（提交时透传） */
  userAccount?: string;
  onClose: () => void;
}

const ChangePasswordModal = ({ open, userAccount = '', onClose }: ChangePasswordModalProps) => {
  const [form] = Form.useForm();
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    const v = await form.validateFields();
    if (v.newPwd !== v.confirmPwd) {
      toast.error('两次输入的新密码不一致');
      return;
    }
    try {
      setSaving(true);
      await changePassword({
        userAccount,
        oldPassword: v.oldPwd,
        newPassword: v.newPwd,
      });
      onClose();
      toast.success('密码修改成功');
    } catch (e) {
      toast.error((e as Error)?.message || '密码修改失败');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      title="修改密码"
      open={open}
      onCancel={onClose}
      onOk={handleSave}
      okText="保存"
      cancelText="取消"
      confirmLoading={saving}
      destroyOnHidden
    >
      <Form form={form} layout="vertical" preserve={false}>
        <Form.Item name="oldPwd" label="原密码" rules={[{ required: true, message: '请输入原密码' }]}>
          <Input.Password placeholder="请输入原密码" />
        </Form.Item>
        <Form.Item name="newPwd" label="新密码" rules={[{ required: true, message: '请输入新密码' }]}>
          <Input.Password placeholder="请输入新密码" />
        </Form.Item>
        <Form.Item name="confirmPwd" label="确认新密码" rules={[{ required: true, message: '请再次输入新密码' }]}>
          <Input.Password placeholder="请再次输入新密码" />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default ChangePasswordModal;
