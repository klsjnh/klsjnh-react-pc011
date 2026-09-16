/**
 * 配置新建 / 编辑弹窗（antd Form + Modal）
 * 字段对齐后端：code（唯一，创建后不可变）/ data。
 * 提交逻辑收敛在组件内，页面只需控制 open / node 与关闭回调。
 */
import React, { useState } from 'react';
import { Form, Input, Modal } from 'antd';
import { saveConfig } from '@/services/system011';
import { toast } from '@/utils/toast';
import type { JulyConfigVo011 } from '@/types/system011/julyConfig';

export interface ConfigFormModalProps {
  /** 是否展示弹窗 */
  open: boolean;
  /** 编辑对象（null 为新建） */
  node: JulyConfigVo011 | null;
  /** 关闭回调（取消 / 保存成功后） */
  onClose: () => void;
  /** 保存成功回调（页面刷新列表等） */
  onSaved: () => void;
}

export const ConfigFormModal = ({ open, node, onClose, onSaved }: ConfigFormModalProps) => {
  const [form] = Form.useForm();
  const [saving, setSaving] = useState(false);

  // 表单初始值：编辑回填无需 setFieldsValue 副作用（用 key 重挂载，每次打开都是干净初始值）
  const formInitialValues = {
    code: node?.code || '',
    data: node?.data || '',
  };

  const handleSave = async () => {
    try {
      const v = await form.validateFields();
      setSaving(true);
      const savedId = await saveConfig({ id: node?.id, code: v.code, data: v.data });
      toast.success(node?.id ? `update ${node.id} success ...` : `insert ${savedId} success ...`);
      onSaved();
      onClose();
    } catch (e) {
      toast.error((e as Error)?.message || '保存失败，请检查输入');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      title={node ? '编辑配置' : '新建配置'}
      key={node?.id ?? 'new'}
      open={open}
      onCancel={onClose}
      onOk={handleSave}
      okText="保存"
      cancelText="取消"
      confirmLoading={saving}
      destroyOnClose
    >
      <Form form={form} layout="vertical" preserve={false} initialValues={formInitialValues}>
        <Form.Item name="code" label="配置键" rules={[{ required: true, message: '请输入配置键' }]}>
          <Input disabled={!!node} placeholder="如 site.name" />
        </Form.Item>
        <Form.Item name="data" label="配置值" rules={[{ required: true, message: '请输入配置值' }]}>
          <Input placeholder="请输入配置值" />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default ConfigFormModal;