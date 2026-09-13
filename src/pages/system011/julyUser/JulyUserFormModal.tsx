/**
 * 用户新增 / 编辑弹窗（antd Form + Modal）
 * 组织/角色用 antd Select 直接选择；提交走 julyUserService.saveUser。
 */
import React, { useEffect } from 'react';
import { Modal, Form, Input, Select } from 'antd';
import { saveUser } from '@/services/system011';
import { toast } from '@/utils/toast';
import type { RoleDetail, OrgTreeNode } from '@/stores/system011/julyRoleStore';
import type { JulyUserView } from '@/types/view';

interface JulyUserFormModalProps {
  open: boolean;
  /** null = 新增，非空 = 编辑 */
  user: JulyUserView | null;
  roles: RoleDetail[];
  orgTree: OrgTreeNode[];
  onClose: () => void;
  /** 保存成功后回调（由页面刷新角色关联等） */
  onSaved: () => void;
}

/** 组织树 → 带缩进的 Select 选项 */
function toOrgOptions(tree: OrgTreeNode[], depth = 0): { label: string; value: string }[] {
  const out: { label: string; value: string }[] = [];
  tree.forEach((n) => {
    out.push({ label: `${'　'.repeat(depth)}${n.name}`, value: n.id });
    if (n.children?.length) out.push(...toOrgOptions(n.children, depth + 1));
  });
  return out;
}

export const JulyUserFormModal: React.FC<JulyUserFormModalProps> = ({
  open, user, roles, orgTree, onClose, onSaved,
}) => {
  const [form] = Form.useForm();
  const isEdit = !!user;

  useEffect(() => {
    if (!open) return;
    if (user) {
      const roleIds = user.roles
        .map((name) => roles.find((r) => r.name === name)?.id)
        .filter((id): id is string => id != null);
      form.setFieldsValue({
        username: user.username,
        realName: user.realName,
        email: user.email,
        phone: user.phone,
        pkOrg: user.departmentId || undefined,
        roleIds,
      });
    } else {
      form.resetFields();
    }
  }, [open, user, roles, form]);

  const handleOk = async () => {
    const v = await form.validateFields();
    const id = await saveUser({
      id: user?.id,
      userAccount: v.username,
      userName: v.realName,
      password: v.password,
      mobile: v.phone,
      email: v.email,
      pkOrg: v.pkOrg || undefined,
    }, v.roleIds || []);
    toast.success(`${isEdit ? 'update' : 'insert'} ${id} success ...`);
    onSaved();
    onClose();
  };

  return (
    <Modal
      title={isEdit ? '编辑用户' : '新建用户'}
      open={open}
      onCancel={onClose}
      onOk={handleOk}
      okText="保存"
      cancelText="取消"
      width={520}
      destroyOnClose
    >
      <Form form={form} layout="vertical" preserve={false}>
        <Form.Item
          name="username"
          label="用户名"
          rules={isEdit ? [] : [{ required: true, message: '请输入用户名' }]}
        >
          <Input placeholder="请输入用户名" disabled={isEdit} />
        </Form.Item>
        <Form.Item name="realName" label="姓名" rules={[{ required: true, message: '请输入姓名' }]}>
          <Input placeholder="请输入姓名" />
        </Form.Item>
        <Form.Item
          name="email"
          label="邮箱"
          rules={[{ required: true, message: '请输入邮箱' }, { type: 'email', message: '邮箱格式不正确' }]}
        >
          <Input placeholder="请输入邮箱" />
        </Form.Item>
        <Form.Item
          name="phone"
          label="手机号"
          rules={[{ required: true, message: '请输入手机号' }, { pattern: /^1[3-9]\d{9}$/, message: '手机号格式不正确' }]}
        >
          <Input placeholder="请输入手机号" />
        </Form.Item>
        <Form.Item name="pkOrg" label="组织" rules={[{ required: true, message: '请选择组织' }]}>
          <Select placeholder="请选择组织" options={toOrgOptions(orgTree)} showSearch optionFilterProp="label" />
        </Form.Item>
        <Form.Item name="roleIds" label="角色" rules={[{ required: true, message: '请至少选择一个角色' }]}>
          <Select
            mode="multiple"
            placeholder="请选择角色（可多选）"
            options={roles.map((r) => ({ label: r.label, value: r.id }))}
            optionFilterProp="label"
          />
        </Form.Item>
        {!isEdit && (
          <Form.Item
            name="password"
            label="密码"
            rules={[{ required: true, message: '请输入密码' }, { min: 6, message: '密码至少 6 位' }]}
          >
            <Input.Password placeholder="至少 6 位" />
          </Form.Item>
        )}
      </Form>
    </Modal>
  );
};
