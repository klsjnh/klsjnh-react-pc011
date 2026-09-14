/** 角色新增 / 编辑弹窗（julyPermission 模块组件，antd Form） */
import React from 'react';
import { Modal, Form, Input } from 'antd';
import { updateRole, addRole } from '@/services/system011';
import type { RoleFormModalProps } from '@/types/system011/julyRole';

export const RoleFormModal: React.FC<RoleFormModalProps> = ({ open, role, onClose }) => {
  const [form] = Form.useForm();
  const isEdit = !!role;

  const handleSave = async () => {
    const v = await form.validateFields();
    if (role) {
      updateRole(role.id, { roleName: v.roleName, remark: v.remark });
    } else {
      addRole({ roleCode: v.roleCode, roleName: v.roleName, remark: v.remark });
    }
    onClose();
  };

  return (
    <Modal
      title={isEdit ? '编辑角色' : '新建角色'}
      open={open}
      onCancel={onClose}
      onOk={handleSave}
      okText="保存"
      cancelText="取消"
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
