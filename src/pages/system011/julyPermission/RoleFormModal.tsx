/** 角色新增 / 编辑弹窗（julyPermission 模块组件，antd Form） */
import React, { useState } from 'react';
import { Modal, Form, Input } from 'antd';
import { updateRole, addRole } from '@/services/system011';
import { toast } from '@/utils/toast';
import type { RoleFormModalProps } from '@/types/system011/julyRole';

export const RoleFormModal = ({ open, role, onClose }: RoleFormModalProps) => {
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);
  const isEdit = !!role;

  const handleSave = async () => {
    let v: { roleCode?: string; roleName: string; remark?: string };
    try {
      v = await form.validateFields();
    } catch {
      return; // 校验失败：保持弹窗打开，由 Form 展示字段级错误
    }
    setSubmitting(true);
    try {
      if (role) {
        updateRole(role.id, { roleName: v.roleName, remark: v.remark });
      } else {
        addRole({ roleCode: v.roleCode as string, roleName: v.roleName, remark: v.remark });
      }
      toast.success(role ? '角色已更新' : '角色已创建');
      onClose();
    } catch (e) {
      toast.error((e as Error)?.message || '保存失败');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      title={isEdit ? '编辑角色' : '新建角色'}
      open={open}
      onCancel={onClose}
      onOk={handleSave}
      okText="保存"
      cancelText="取消"
      confirmLoading={submitting}
      width={420}
      destroyOnClose
    >
      <Form
        key={role?.id ?? 'new'}
        form={form}
        layout="vertical"
        preserve={false}
        initialValues={{
          roleCode: role?.roleCode || '',
          roleName: role?.roleName || '',
          remark: role?.remark || '',
        }}
      >
        <Form.Item name="roleCode" label="角色标识" rules={isEdit ? [] : [{ required: true, message: '请输入角色标识' }]}>
          <Input placeholder="如 manager" disabled={isEdit} />
        </Form.Item>
        <Form.Item name="roleName" label="角色名称" rules={[{ required: true, message: '请输入角色名称' }]}>
          <Input placeholder="如 部门经理" />
        </Form.Item>
        <Form.Item name="remark" label="描述">
          <Input.TextArea rows={3} placeholder="备注 / 描述" />
        </Form.Item>
      </Form>
    </Modal>
  );
};
