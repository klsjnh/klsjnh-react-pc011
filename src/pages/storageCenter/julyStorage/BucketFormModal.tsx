/**
 * 存储桶新建弹窗（对接 /klsjnh/storagecenter/julyStorage/v1/insertBucket）
 * 入参 StorageBucketInsertVo011：**bucketCode / bucketName 必填**，storageCode / isDefault / region 可选
 * （2026-09-24 契约起桶以 bucketCode 为唯一键）；桶名即主键，故只支持新增。
 * storageCode 由主表选中行锁定（disabled），提交成功后 service 已刷新桶分页，父页无需额外回调。
 */
import { useEffect, useMemo } from 'react';
import { Form, Input, Modal, Select, Switch, Tag, Space } from 'antd';
import type { JulyStorage } from '@/types/storageCenter';
import { insertBucket } from '@/services/storageCenter/storageBucketService';
import { KlsjnhStatusTag011 } from '@/components/klsjnh011';
import { toast } from '@/utils/toast';

interface Props {
  open: boolean;
  /** 可选存储实例（来源于 storage/selectList） */
  storages: JulyStorage[];
  /** 当前选中的存储实例编码（来自主表选中行，不可更改） */
  storageCode: string;
  onClose: () => void;
  /** 新建成功后回调（父页可据此刷新） */
  onSaved?: () => void;
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
    form.setFieldsValue({ storageCode, bucketCode: '', bucketName: '', isDefault: false, region: '' });
  }, [open, storageCode, form]);

  const handleOk = async () => {
    const { storageCode, bucketCode, bucketName, isDefault, region } = await form.validateFields();
    try {
      await insertBucket({
        storageCode,
        bucketCode: bucketCode.trim(),
        bucketName: bucketName.trim(),
        isDefault: !!isDefault,
        region: region?.trim() || undefined,
      });
      toast.success('新增桶成功');
      onClose();
    } catch (e) {
      toast.error((e as Error)?.message || '新增桶失败');
    }
  };

  return (
    <Modal title="新建存储桶" open={open} onOk={handleOk} onCancel={onClose} okText="保存" cancelText="取消" destroyOnHidden width={560}>
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
              <KlsjnhStatusTag011 value={selected.status} />
            </Space>
          </div>
        )}

        <Form.Item name="bucketCode" label="桶编码" rules={[{ required: true, message: '请输入桶编码（同实例内唯一，创建后不可改）' }]}>
          <Input placeholder="如 bkt_reports（同实例内唯一）" />
        </Form.Item>
        <Form.Item name="bucketName" label="桶名" rules={[{ required: true, message: '请输入桶名' }]}>
          <Input placeholder="如 klsjnh" />
        </Form.Item>
        <Form.Item name="isDefault" label="设为默认桶" valuePropName="checked" initialValue={false}>
          <Switch />
        </Form.Item>
        <Form.Item name="region" label="区域(可选)">
          <Input placeholder="如 us-east-1" />
        </Form.Item>
      </Form>
    </Modal>
  );
};
