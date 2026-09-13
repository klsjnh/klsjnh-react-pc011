/**
 * 组织新增 / 编辑弹窗（antd Form + Modal）
 * 字段对齐后端：orgName / orgCode / pkUser / parentId / sortOrder。
 * 提交走 julyOrganizationService.saveOrganization。
 */
import React, { useEffect } from 'react';
import { Modal, Form, Input, InputNumber, Select } from 'antd';
import { saveOrganization } from '@/services/system011';
import { toast } from '@/utils/toast';
import type { JulyOrganizationVo011, OrganizationFormModalProps } from '@/types/system011/julyOrganization';

function containsId(node: JulyOrganizationVo011, id: string): boolean {
  return node.id === id || (node.children || []).some((c) => containsId(c, id));
}

/** 组织树 → 带缩进的下拉选项；编辑时排除自己及下级 */
function toParentOptions(
  tree: JulyOrganizationVo011[],
  exclude: JulyOrganizationVo011 | null,
  depth = 0,
): { label: string; value: string; disabled: boolean }[] {
  const out: { label: string; value: string; disabled: boolean }[] = [];
  tree.forEach((o) => {
    out.push({
      label: `${'　'.repeat(depth)}${o.orgName}`,
      value: o.id,
      disabled: !!exclude && containsId(exclude, o.id),
    });
    if (o.children?.length) out.push(...toParentOptions(o.children, exclude, depth + 1));
  });
  return out;
}

export const OrganizationFormModal: React.FC<OrganizationFormModalProps> = ({
  open, mode, node, departments, users, initialParentId, onClose, onSaved,
}) => {
  const [form] = Form.useForm();

  useEffect(() => {
    if (!open) return;
    form.setFieldsValue({
      parentId: initialParentId || undefined,
      orgName: node?.orgName || '',
      orgCode: node?.orgCode || '',
      pkUser: node?.pkUser || undefined,
      sortOrder: node?.sortOrder ?? 0,
    });
  }, [open, node, initialParentId, form]);

  const handleOk = async () => {
    const v = await form.validateFields();
    const id = await saveOrganization({
      id: node?.id,
      orgCode: v.orgCode,
      orgName: v.orgName,
      pkUser: v.pkUser || undefined,
      parentId: v.parentId || undefined,
      sortOrder: v.sortOrder,
    });
    toast.success(`${mode === 'edit' ? 'update' : 'insert'} ${id} success ...`);
    onSaved();
    onClose();
  };

  return (
    <Modal
      title={mode === 'edit' ? '编辑组织' : '新建组织'}
      open={open}
      onCancel={onClose}
      onOk={handleOk}
      okText="保存"
      cancelText="取消"
      width={480}
      destroyOnClose
    >
      <Form form={form} layout="vertical" preserve={false}>
        <Form.Item name="parentId" label="上级组织">
          <Select
            allowClear
            placeholder="（顶级组织）"
            options={toParentOptions(departments, mode === 'edit' ? node : null)}
            showSearch
            optionFilterProp="label"
          />
        </Form.Item>
        <Form.Item name="orgName" label="名称" rules={[{ required: true, message: '请输入组织名称' }]}>
          <Input placeholder="请输入组织名称" />
        </Form.Item>
        <Form.Item
          name="orgCode"
          label="编码"
          rules={mode === 'create' ? [{ required: true, message: '请输入组织编码' }] : []}
        >
          <Input placeholder="请输入组织编码" disabled={mode === 'edit'} />
        </Form.Item>
        <Form.Item name="pkUser" label="负责人">
          <Select
            allowClear
            placeholder="（未指定）"
            options={users.map((u) => ({ label: `${u.userName}（${u.userAccount}）`, value: u.id }))}
            showSearch
            optionFilterProp="label"
          />
        </Form.Item>
        <Form.Item name="sortOrder" label="排序">
          <InputNumber min={0} style={{ width: '100%' }} />
        </Form.Item>
      </Form>
    </Modal>
  );
};
