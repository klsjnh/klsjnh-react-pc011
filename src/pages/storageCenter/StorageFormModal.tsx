/**
 * 存储实例新增/编辑弹窗（对接 storage011/storage insert|update）
 * 字段对齐 JulyStorage：编码/名称/类型/本地路径/Endpoint/密钥/默认桶/状态/备注。
 * 编辑态编码不参与提交（后端 coding 不可变）；secretKey 留空表示保持原值。
 * 提交后 service 已刷新实例分页，故父级只需处理「选中项清理」这类自身状态。
 */
import { useEffect, useState } from 'react';
import { Button, Form, Input, Modal, Select } from 'antd';
import { ApiOutlined } from '@ant-design/icons';
import type { JulyStorage, StorageTestResult } from '@/types/storage011';
import { saveStorage, testStorageConnection } from '@/services/storage011/julyStorageService';
import { toast } from '@/utils/toast';

interface Props {
  open: boolean;
  /** null = 新建 */
  node: JulyStorage | null;
  onClose: () => void;
  /** 保存成功后回调（父级用它清理行选中这类局部状态） */
  onSaved?: () => void;
}

export const StorageFormModal = ({ open, node, onClose, onSaved }: Props) => {
  const [form] = Form.useForm();
  const [testing, setTesting] = useState(false);

  useEffect(() => {
    if (!open) return;
    if (node) {
      form.setFieldsValue({ ...node, secretKey: undefined });
    } else {
      form.resetFields();
      form.setFieldsValue({ provider: 'S3', status: '1', secure: '0', presignExpirySeconds: 3600 });
    }
  }, [open, node, form]);

  const handleOk = async () => {
    const values = await form.validateFields();
    try {
      if (node) {
        await saveStorage({ ...values, id: node.id });
        toast.success('修改成功');
      } else {
        await saveStorage(values);
        toast.success('新增成功');
      }
      onSaved?.();
      onClose();
    } catch (e) {
      toast.error((e as Error)?.message || '操作失败');
    }
  };

  const handleTest = async () => {
    setTesting(true);
    try {
      const payload = node ? { ...form.getFieldsValue(), id: node.id } : form.getFieldsValue();
      const res: StorageTestResult = await testStorageConnection(payload);
      if (res.success) toast.success(`连接成功${res.message ? '：' + res.message : ''}`);
      else toast.error(`连接失败：${res.message || '未知原因'}`);
    } catch (e) {
      toast.error((e as Error)?.message || '测试失败');
    } finally {
      setTesting(false);
    }
  };

  return (
    <Modal
      title={node ? '编辑存储实例' : '新增存储实例'}
      open={open}
      onOk={handleOk}
      onCancel={onClose}
      destroyOnHidden
      width={640}
      footer={[
        <Button key="test" icon={<ApiOutlined />} loading={testing} onClick={handleTest}>测试连接</Button>,
        <Button key="cancel" onClick={onClose}>取消</Button>,
        <Button key="ok" type="primary" onClick={handleOk}>确定</Button>,
      ]}
    >
      <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
        {!node && (
          <Form.Item name="storageCode" label="编码" rules={[{ required: true }]}>
            <Input placeholder="唯一编码，如 st_minio" />
          </Form.Item>
        )}
        <Form.Item name="storageName" label="名称" rules={[{ required: true }]}>
          <Input placeholder="显示名称" />
        </Form.Item>
        <Form.Item name="provider" label="类型">
          <Select options={[
            { value: 'S3', label: 'S3 (MinIO)' },
            { value: 'LOCAL', label: 'LOCAL 本地磁盘' },
          ]} />
        </Form.Item>
        <Form.Item name="basePath" label="本地根路径 (LOCAL)">
          <Input placeholder="D:/Klsjnh/upload" />
        </Form.Item>
        <Form.Item name="endpoint" label="Endpoint (S3)">
          <Input placeholder="http://192.168.1.88:12300" />
        </Form.Item>
        <Form.Item name="accessKey" label="Access Key">
          <Input />
        </Form.Item>
        <Form.Item name="secretKey" label="Secret Key">
          <Input.Password placeholder={node ? '留空保持原值' : ''} />
        </Form.Item>
        <Form.Item name="defaultBucket" label="默认桶">
          <Input />
        </Form.Item>
        <Form.Item name="presignExpirySeconds" label="预签名有效期(秒)">
          <Input type="number" />
        </Form.Item>
        <Form.Item name="status" label="状态">
          <Select options={[{ value: '1', label: '启用' }, { value: '0', label: '禁用' }]} />
        </Form.Item>
        <Form.Item name="remark" label="备注">
          <Input.TextArea rows={2} />
        </Form.Item>
      </Form>
    </Modal>
  );
};
