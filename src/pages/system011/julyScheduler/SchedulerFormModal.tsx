/**
 * 定时任务新建 / 编辑弹窗（antd Form + Modal）
 * 字段对齐后端：schedulerCode（唯一，创建后不可变）/ schedulerName / schedulerHandler / schedulerCron / status。
 * ?? status / remark 为前端先行字段（2026-09-21 线上 Insert/Update VO 均无 remark、Insert 无 status），用户将补后端；
 * 前端先行下发，mock 已同步支持。布局铁律：各字段独占一行（对齐 016 §9.1 与字典弹窗定稿）。
 * 提交逻辑收敛在组件内（saveScheduler 内部已刷新列表），页面只需控制 open / node 与关闭回调。
 */
import React, { useState } from 'react';
import { Form, Input, Modal, Select } from 'antd';
import { saveScheduler } from '@/services/system011';
import { toast } from '@/utils/toast';
import type { JulySchedulerVo011 } from '@/types/system011';

/** 定时任务状态选项（与表格 Tag 文案一致：运行中 / 已停止） */
const SCHEDULER_STATUS_OPTIONS = [
  { value: '1', label: '运行中' },
  { value: '0', label: '已停止' },
];

export interface SchedulerFormModalProps {
  /** 是否展示弹窗 */
  open: boolean;
  /** 编辑对象（null 为新建） */
  node: JulySchedulerVo011 | null;
  /** 关闭回调（取消 / 保存成功后） */
  onClose: () => void;
}

export const SchedulerFormModal = ({ open, node, onClose }: SchedulerFormModalProps) => {
  const [form] = Form.useForm();
  const [saving, setSaving] = useState(false);

  // 初始值：靠 key 重挂载 + destroyOnHidden，每次打开都是干净值，无需 setFieldsValue 副作用
  const initialValues = {
    schedulerCode: node?.schedulerCode || '',
    schedulerName: node?.schedulerName || '',
    schedulerHandler: node?.schedulerHandler || '',
    schedulerCron: node?.schedulerCron || '',
    status: node?.status || '0',
    remark: node?.remark || '',
  };

  const handleSave = async () => {
    try {
      const v = await form.validateFields();
      setSaving(true);
      const savedId = await saveScheduler({
        id: node?.id, schedulerCode: v.schedulerCode, schedulerName: v.schedulerName,
        schedulerHandler: v.schedulerHandler, schedulerCron: v.schedulerCron,
        status: v.status, remark: v.remark,
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
      title={node ? '编辑任务' : '新建任务'}
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
        {/* 布局铁律（016 §9.1 / 字典弹窗定稿同款）：各字段独占一行，状态必填，备注整行 */}
        <Form.Item name="schedulerCode" label="任务编码" rules={[{ required: true, message: '请输入任务编码' }]}>
          <Input disabled={!!node} placeholder="唯一，创建后不可修改，如 dataBackup" />
        </Form.Item>
        <Form.Item name="schedulerName" label="任务名称" rules={[{ required: true, message: '请输入任务名称' }]}>
          <Input placeholder="请输入任务名称" />
        </Form.Item>
        <Form.Item name="schedulerHandler" label="处理器" rules={[{ required: true, message: '请输入处理器' }]}>
          <Input placeholder="后端 bean/方法名" />
        </Form.Item>
        <Form.Item name="schedulerCron" label="Cron 表达式" rules={[{ required: true, message: '请输入 Cron' }]}>
          <Input placeholder="如 0 2 * * *" />
        </Form.Item>
        <Form.Item name="remark" label="备注"><Input.TextArea rows={2} placeholder="备注说明" /></Form.Item>
        <Form.Item name="status" label="状态" rules={[{ required: true, message: '请选择状态' }]}>
          <Select options={SCHEDULER_STATUS_OPTIONS} />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default SchedulerFormModal;
