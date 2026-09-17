/**
 * 存储桶新建弹窗（对接 storage011/bucket/insert）
 * 桶名即主键，故只支持新增（不支持改名）；storageCode 决定桶归属哪个存储实例。
 * 提交成功后 service 已刷新桶分页，父页无需额外回调。
 */
import { useEffect, useMemo } from 'react';
import { Form, Input, Modal, Select, Tag, Space } from 'antd';
import type { JulyStorage } from '@/types/storage011';
import { insertBucket } from '@/services/storage011/storageBucketService';
import { toast } from '@/utils/toast';

interface Props {
  open: boolean;
  /** 可选存储实例（来源于 storage/selectList） */
  storages: JulyStorage[];
  /** 当前选中的存储实例编码（来自主表选中行，不可更改） */
  storageCode: string;
  onClose: () => void;
}

const PROVIDER_META: Record<string, { label: string; color: string }> = {
  local011: { label: '本地磁盘', color: 'green' },
  minio011: { label: 'MinIO', color: 'blue' },
  cos011: { label: '腾讯云 COS', color: 'cyan' },
  tos011: { label: '火山 TOS', color: 'purple' },
  oss011: { label: '阿里云 OSS', color: 'orange' },
  s3011: { label: '通用 S3', color: 'geekblue' },
};

export const BucketFormModal = ({ open, storages, storageCode, onClose }: Props) => {
  const [form] = Form.useForm();
  const selected = useMemo(() => storages.find((s) => s.storageCode === storageCode), [storages, storageCode]);

  useEffect(() => {
    if (!open) return;
    form.resetFields();
    form.setFieldsValue({ storageCode, region: '' });
  }, [open, storageCode, form]);

  const handleOk = async () => {
    const { storageCode, bucketName, region } = await form.validateFields();
    try {
      await insertBucket(storageCode, bucketName.trim(), region?.trim() || undefined);
      toast.success('新增桶成功');
      onClose();
    } catch (e) {
      toast.error((e as Error)?.message || '新增桶失败');
    }
  };

  return (
    <Modal title="新建存储桶" open={open} onOk={handleOk} onCancel={onClose} destroyOnHidden width={560}>
      <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
        <Form.Item name="storageCode" label="存储实例" rules={[{ required: true, message: '请选择存储实例' }]}>
          <Select
            placeholder="请选择"
            disabled
            options={storages.map((s) => ({ value: s.storageCode, label: `${s.storageName} (${s.storageCode})` }))}
          />
        </Form.Item>

        {selected && (
          <div style={{ marginBottom: 16, padding: '8px 12px', background: '#fafafa', border: '1px solid #f0f0f0', borderRadius: 6 }}>
            <Space size="middle">
              <span>实例信息：</span>
              <Tag color={PROVIDER_META[selected.provider || '']?.color || 'default'}>{PROVIDER_META[selected.provider || '']?.label || selected.provider || '-'}</Tag>
              <span className="text-muted text-xs">接入点：{selected.endpoint || selected.basePath || '-'}</span>
              <Tag color={selected.status === '1' ? 'green' : 'red'}>{selected.status === '1' ? '启用' : '停用'}</Tag>
            </Space>
          </div>
        )}

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
