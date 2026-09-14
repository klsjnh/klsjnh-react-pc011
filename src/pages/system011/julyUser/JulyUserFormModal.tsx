/**
 * 用户新增 / 编辑弹窗（antd Form + Modal，两列布局）
 * 字段对齐后端：userAccount / userName / email / mobile / pkOrg / status；角色用 roleIds。
 * 提交走 julyUserService.saveUser。
 *
 * 注：依赖 destroyOnClose + initialValues 在每次打开时重新挂载 Form，
 * 因此用 initialValues 填充初始值（而非 useEffect + initialized 守卫，后者易漏填/重复填）。
 * 角色数据可能在弹窗打开后才加载完，用额外 effect 在不覆盖用户手改的前提下补填 roleIds。
 */
import React, { useEffect, useMemo } from 'react';
import { Col, Form, Input, Modal, Row, Select } from 'antd';
import { saveUser } from '@/services/system011';
import { toast } from '@/utils/toast';
import type { JulyOrganizationVo011 } from '@/types/system011/julyOrganization';
import type { JulyRoleVo011 } from '@/types/system011/julyRole/vo';
import type { JulyUserFormModalProps } from '@/types/system011/julyUser';

/** 组织树 → 带缩进的 Select 选项 */
function toOrgOptions(tree: JulyOrganizationVo011[], depth = 0): { label: string; value: string }[] {
  const out: { label: string; value: string }[] = [];
  tree.forEach((o) => {
    out.push({ label: `${'　'.repeat(depth)}${o.orgName}`, value: o.id });
    if (o.children?.length) out.push(...toOrgOptions(o.children, depth + 1));
  });
  return out;
}

/** 角色编码 → 角色 id（仅当角色数据已加载时有效） */
function toRoleIds(roleCodes: string[] | undefined, roles: JulyRoleVo011[]): string[] {
  if (!roleCodes?.length) return [];
  return roleCodes
    .map((code) => roles.find((r) => r.roleCode === code)?.id)
    .filter((id): id is string => !!id);
}

export const JulyUserFormModal: React.FC<JulyUserFormModalProps> = ({
  open, user, roles, orgTree, onClose, onSaved,
}) => {
  const [form] = Form.useForm();
  const isEdit = !!user;

  // 打开时根据当前 user 计算初始值；destroyOnClose 每次打开重新挂载 Form，initialValues 重新生效
  const initialValues = useMemo(() => {
    if (!user) return { status: '1' };
    return {
      userAccount: user.userAccount,
      userName: user.userName,
      email: user.email ?? undefined,
      mobile: user.mobile ?? undefined,
      pkOrg: user.pkOrg ?? undefined,
      roleIds: toRoleIds(user.roles, roles),
      status: user.status || '1',
    };
  }, [user, roles]);

  // 角色数据晚于弹窗打开时到达：在不覆盖用户已手动修改字段的前提下补填 roleIds
  useEffect(() => {
    if (!open || !user) return;
    if (form.isFieldsTouched()) return;
    form.setFieldsValue({ roleIds: toRoleIds(user.roles, roles) });
  }, [open, user, roles, form]);

  const handleOk = async () => {
    const v = await form.validateFields();
    const id = await saveUser({ ...v, id: user?.id });
    toast.success(isEdit ? '更新成功' : '新增成功');
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
      width={640}
      destroyOnClose
    >
      <Form form={form} layout="vertical" preserve={false} initialValues={initialValues}>
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="userAccount"
              label="用户名"
              rules={isEdit ? [] : [{ required: true, message: '请输入用户名' }]}
            >
              <Input placeholder="请输入用户名" disabled={isEdit} />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="userName" label="姓名" rules={[{ required: true, message: '请输入姓名' }]}>
              <Input placeholder="请输入姓名" />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="email"
              label="邮箱"
              rules={[{ type: 'email', message: '邮箱格式不正确' }]}
            >
              <Input placeholder="请输入邮箱" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="mobile"
              label="手机号"
              rules={[{ pattern: /^1[3-9]\d{9}$/, message: '手机号格式不正确' }]}
            >
              <Input placeholder="请输入手机号" />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="pkOrg"
              label="组织"
              rules={isEdit ? [] : [{ required: true, message: '请选择组织' }]}
            >
              <Select placeholder="请选择组织" options={toOrgOptions(orgTree)} showSearch optionFilterProp="label" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="roleIds" label="角色" rules={[{ required: true, message: '请至少选择一个角色' }]}>
              <Select
                mode="multiple"
                placeholder="请选择角色（可多选）"
                options={roles.map((r) => ({ label: r.roleName, value: r.id }))}
                optionFilterProp="label"
              />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          {!isEdit && (
            <Col span={12}>
              <Form.Item name="password" label="密码" rules={[{ required: true, message: '请输入密码' }, { min: 6, message: '密码至少 6 位' }]}>
                <Input.Password placeholder="至少 6 位" />
              </Form.Item>
            </Col>
          )}
          <Col span={12}>
            <Form.Item name="status" label="状态">
              <Select options={[{ value: '1', label: '启用' }, { value: '0', label: '停用' }]} />
            </Form.Item>
          </Col>
        </Row>
      </Form>
    </Modal>
  );
};
