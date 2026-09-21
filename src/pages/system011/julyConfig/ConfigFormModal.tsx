/**
 * 配置新建 / 编辑弹窗（antd Form + Modal）
 * 字段对齐后端：code（唯一，创建后不可变）/ data / status / remark（最长 300，2026-09-21 线上核实）。
 * 布局（用户定稿）：配置键一行；**配置值多行**（TextArea）；**备注多行在前**；状态在后（新建 / 编辑同序）。
 * 提交逻辑收敛在组件内（saveConfig 内部已刷新列表），页面只需控制 open / node 与关闭回调。
 */
import React, { useState } from 'react';
import { Form, Input, Modal, Select } from 'antd';
import { saveConfig } from '@/services/system011';
import { toast } from '@/utils/toast';
import type { JulyConfigVo011 } from '@/types/system011/julyConfig';
import { STATUS_OPTIONS } from '@/config/constants';

export interface ConfigFormModalProps {
  /** 是否展示弹窗 */
  open: boolean;
  /** 编辑对象（null 为新建） */
  node: JulyConfigVo011 | null;
  /** 关闭回调（取消 / 保存成功后） */
  onClose: () => void;
}

export const ConfigFormModal = ({ open, node, onClose }: ConfigFormModalProps) => {
  const [form] = Form.useForm();
  const [saving, setSaving] = useState(false);

  // 表单初始值：编辑回填无需 setFieldsValue 副作用（用 key 重挂载，每次打开都是干净初始值）
  const formInitialValues = {
    code: node?.code || '',
    data: node?.data || '',
    status: node?.status || '1',
    remark: node?.remark || '',
  };

  const handleSave = async () => {
    try {
      const v = await form.validateFields();
      setSaving(true);
      const savedId = await saveConfig({ id: node?.id, code: v.code, data: v.data, status: v.status, remark: v.remark });
      toast.success(node?.id ? `update ${node.id} success ...` : `insert ${savedId} success ...`);
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
      destroyOnHidden
    >
      <Form form={form} layout="vertical" preserve={false} initialValues={formInitialValues}>
        {/* 布局铁律（016 §9.1 / 用户定稿）：各字段独占一行；配置值与备注为多行编辑 */}
        <Form.Item name="code" label="配置键" rules={[{ required: true, message: '请输入配置键' }]}>
          <Input disabled={!!node} placeholder="如 site.name" />
        </Form.Item>
        <Form.Item name="data" label="配置值" rules={[{ required: true, message: '请输入配置值' }]}>
          <Input.TextArea rows={3} placeholder="请输入配置值" />
        </Form.Item>
        <Form.Item name="remark" label="备注" extra="最长 300 字">
          <Input.TextArea rows={2} placeholder="备注说明" maxLength={300} showCount />
        </Form.Item>
        <Form.Item name="status" label="状态" rules={[{ required: true, message: '请选择状态' }]}>
          <Select options={STATUS_OPTIONS} />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default ConfigFormModal;
