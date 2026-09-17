/**
 * 存储桶新建弹窗（对接 storage011/bucket/insert）
 * 桶名即主键，故只支持新增（不支持改名）；storageCode 决定桶归属哪个存储实例。
 */
import { useEffect } from 'react';
import { Form, Input, Modal, Select } from 'antd';
import type { JulyStorage } from '@/types/storage011';
import { insertBucket } from '@/services/storage011/storageBucketService';
import { toast } from '@/utils/toast';

interface Props {
  open: boolean;
  /** 可选存储实例（来源于 storage/selectList） */
  storages: JulyStorage[];
  /** 默认选中的存储实例（来自桶页当前筛选） */
  defaultStorageCode?: string;
  onClose: () => void;
  onSaved: () => void;
}

export const BucketFormModal = ({ open, storages, defaultStorageCode, onClose, onSaved }: Props) => {
  const [form] = Form.useForm();

  useEffect(() => {
    if (!open) return;
    form.resetFields();
    form.setFieldsValue({ storageCode: defaultStorageCode, region: '' });
  }, [open, defaultStorageCode, form]);

  const handleOk = async () => {
    const { storageCode, bucketName, region } = await form.validateFields();
    try {
      await insertBucket(storageCode, bucketName.trim(), region?.trim() || undefined);
      toast.success('新增桶成功');
      onSaved();
      onClose();
    } catch (e) {
      toast.error((e as Error)?.message || '新增桶失败');
    }
  };

  return (
    <Modal title="新建存储桶" open={open} onOk={handleOk} onCancel={onClose} destroyOnHidden width={520}>
      <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
        <Form.Item name="storageCode" label="存储实例" rules={[{ required: true, message: '请选择存储实例' }]}>
          <Select
            placeholder="请选择"
            options={storages.map((s) => ({ value: s.storageCode, label: `${s.storageName} (${s.storageCode})` }))}
          />
        </Form.Item>
        <Form.Item name="bucketName" label="桶名" rules={[{ required: true, message: '请输入桶名' }]}>
          <Input placeholder="如 klsjnh" />
        </Form.Item>
        <Form.Item name="region" label="区域(可选)">
          <Input placeholder="如 us-east-1" />
        </Form.Item>
      </Form>
    </Modal>
  );
};
