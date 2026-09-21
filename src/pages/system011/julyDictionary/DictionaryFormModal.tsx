/**
 * 字典新建 / 编辑弹窗（antd Form + Modal）
 * 字段对齐后端：dictionaryCode（唯一，创建后不可变）/ dictionaryName / sortOrder / remark。
 * 提交逻辑收敛在组件内（`saveDictionary` 内部已刷新主表并重选首条），
 * 页面只需控制 `open` / `node` 与关闭回调 —— 与 ConfigFormModal / JulyUserFormModal 同构。
 */
import React, { useState } from 'react';
import { Form, Input, InputNumber, Modal, Select } from 'antd';
import { STATUS_OPTIONS } from '@/config/constants';
import { saveDictionary } from '@/services/system011';
import { toast } from '@/utils/toast';
import type { JulyDictionaryVo011 } from '@/types/system011';

export interface DictionaryFormModalProps {
  /** 是否展示弹窗 */
  open: boolean;
  /** 编辑对象（null 为新建） */
  node: JulyDictionaryVo011 | null;
  /** 关闭回调（取消 / 保存成功后） */
  onClose: () => void;
}

export const DictionaryFormModal = ({ open, node, onClose }: DictionaryFormModalProps) => {
  const [form] = Form.useForm();
  const [saving, setSaving] = useState(false);

  // 初始值：靠 key 重挂载 + destroyOnHidden，每次打开都是干净值，无需 setFieldsValue 副作用
  const initialValues = {
    dictionaryCode: node?.dictionaryCode || '',
    dictionaryName: node?.dictionaryName || '',
    sortOrder: node?.sortOrder ?? 0,
    status: node?.status || '1',
    remark: node?.remark || '',
  };

  const handleSave = async () => {
    try {
      const v = await form.validateFields();
      setSaving(true);
      const savedId = await saveDictionary({
        id: node?.id, dictionaryCode: v.dictionaryCode, dictionaryName: v.dictionaryName,
        sortOrder: v.sortOrder ?? 0, remark: v.remark, status: v.status,
      });
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
      title={node ? '编辑字典' : '新建字典'}
      key={node?.id ?? 'new'}
      open={open}
      onCancel={onClose}
      onOk={handleSave}
      okText="保存"
      cancelText="取消"
      confirmLoading={saving}
      destroyOnHidden
    >
      <Form form={form} layout="vertical" preserve={false} initialValues={initialValues}>
        {/* 布局铁律（016 §9.1 / 用户定稿）：编码 / 名称 / 排序各占一行，状态必填独占一行，备注独占一行 */}
        <Form.Item name="dictionaryCode" label="字典编码" rules={[{ required: true, message: '请输入字典编码' }]}>
          <Input disabled={!!node} placeholder="唯一，创建后不可修改，如 SYS_USER_STATUS" />
        </Form.Item>
        <Form.Item name="dictionaryName" label="字典名称" rules={[{ required: true, message: '请输入字典名称' }]}>
          <Input placeholder="请输入字典名称" />
        </Form.Item>
        <Form.Item name="sortOrder" label="排序"><InputNumber style={{ width: '100%' }} min={0} /></Form.Item>
        <Form.Item name="status" label="状态" rules={[{ required: true, message: '请选择状态' }]}>
          <Select options={STATUS_OPTIONS} />
        </Form.Item>
        <Form.Item name="remark" label="备注"><Input.TextArea rows={2} placeholder="备注说明" /></Form.Item>
      </Form>
    </Modal>
  );
};

export default DictionaryFormModal;
