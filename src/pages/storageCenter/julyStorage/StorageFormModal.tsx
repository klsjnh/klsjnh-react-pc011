/**
 * 存储实例新增/编辑弹窗（对接 storage011/storage insert|update）
 * 字段严格对齐后端 JulyStorageSaveVo011（核对于 Java 源码）：
 *   - 必填：storageCode / storageName / provider
 *   - provider 取值：local011 / minio011 / cos011 / tos011 / oss011 / s3011
 *   - secure 是 boolean（不是 '0'/'1'）
 *   - secretKey 出参不回显：编辑态留空 = 保持原值
 *   - 编辑态必须回带 storageCode（它有 @NotBlank 校验，且业务上不可变）
 */
import { useEffect, useState } from 'react';
import { Button, Form, Input, InputNumber, Modal, Row, Col, Select, Switch } from 'antd';
import { ApiOutlined } from '@ant-design/icons';
import type { JulyStorage, JulyStorageConnect, StorageTestResult } from '@/types/storage011';
import { saveStorage, testStorageConnection } from '@/services/storage011/julyStorageService';
import { toast } from '@/utils/toast';

interface Props {
  open: boolean;
  node: JulyStorage | null;
  onClose: () => void;
  onSaved: () => void;
}

/** provider 下拉项（与后端枚举一一对应） */
const PROVIDER_OPTIONS = [
  { value: 'local011', label: '本地磁盘 local011' },
  { value: 'minio011', label: 'MinIO minio011' },
  { value: 'cos011', label: '腾讯云 COS cos011' },
  { value: 'tos011', label: '火山引擎 TOS tos011' },
  { value: 'oss011', label: '阿里云 OSS oss011' },
  { value: 's3011', label: '通用 S3 s3011' },
];

export const StorageFormModal = ({ open, node, onClose, onSaved }: Props) => {
  const [form] = Form.useForm();
  const [testing, setTesting] = useState(false);
  const provider = Form.useWatch('provider', form);

  useEffect(() => {
    if (!open) return;
    if (node) {
      form.setFieldsValue({ ...node, secretKey: undefined });
    } else {
      form.resetFields();
      form.setFieldsValue({ provider: 'local011', status: '1', secure: false, sortOrder: 99, presignExpirySeconds: 3600 });
    }
  }, [open, node, form]);

  const handleOk = async () => {
    const values = await form.validateFields();
    try {
      if (node) {
        // storageCode 编辑态不在表单里（不可变），必须显式回带，否则后端缺必填字段
        await saveStorage({ ...values, storageCode: node.storageCode, id: node.id });
        toast.success('修改成功');
      } else {
        await saveStorage(values);
        toast.success('新增成功');
      }
      onSaved();
      onClose();
    } catch (e) {
      toast.error((e as Error)?.message || '操作失败');
    }
  };

  const handleTest = async () => {
    setTesting(true);
    try {
      const values = form.getFieldsValue() as Partial<JulyStorage>;
      // 已保存实例只传 id（后端用库里配置测）；草稿才按 JulyStorageConnectVo011 传字段
      const payload: JulyStorageConnect = node ? { id: node.id } : {
        provider: values.provider,
        basePath: values.basePath,
        endpoint: values.endpoint,
        accessKey: values.accessKey,
        secretKey: values.secretKey,
        secure: values.secure,
        defaultBucket: values.defaultBucket,
        presignExpirySeconds: values.presignExpirySeconds,
      };
      const res: StorageTestResult = await testStorageConnection(payload);
      if (res?.success) toast.success(`连接成功${res.message ? '：' + res.message : ''}`);
      else toast.error(`连接失败：${res?.message || '未知原因'}`);
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
      width={720}
      footer={[
        <Button key="test" icon={<ApiOutlined />} loading={testing} onClick={handleTest}>测试连接</Button>,
        <Button key="cancel" onClick={onClose}>取消</Button>,
        <Button key="ok" type="primary" onClick={handleOk}>确定</Button>,
      ]}
    >
      <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
        <Row gutter={16}>
          <Col span={8}>
            <Form.Item name="storageCode" label="编码" rules={[{ required: true, message: '请输入唯一编码' }]}>
              <Input placeholder="唯一编码，如 st_minio" disabled={!!node} />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item name="storageName" label="名称" rules={[{ required: true, message: '请输入名称' }]}>
              <Input placeholder="显示名称" />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item name="provider" label="类型" rules={[{ required: true, message: '请选择类型' }]}>
              <Select options={PROVIDER_OPTIONS} />
            </Form.Item>
          </Col>
        </Row>
        {provider === 'local011' ? (
          <Form.Item name="basePath" label="本地根路径" rules={[{ required: true, message: '请输入本地根路径' }]}>
            <Input placeholder="D:/Klsjnh/upload" />
          </Form.Item>
        ) : (
          <>
            <Form.Item name="endpoint" label="Endpoint" rules={[{ required: true, message: '请输入 Endpoint' }]}>
              <Input placeholder="http://192.168.1.88:12300" />
            </Form.Item>
            <Row gutter={16}>
              <Col span={8}>
                <Form.Item name="accessKey" label="Access Key" rules={[{ required: true, message: '请输入 Access Key' }]}>
                  <Input />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item name="secretKey" label="Secret Key" rules={node ? [] : [{ required: true, message: '请输入 Secret Key' }]}>
                  <Input.Password placeholder={node ? '留空保持原值' : ''} />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item name="defaultBucket" label="默认桶">
                  <Input />
                </Form.Item>
              </Col>
            </Row>
          </>
        )}
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item name="presignExpirySeconds" label="预签名有效期（秒）" initialValue={3600}>
              <InputNumber min={60} max={604800} style={{ width: '100%' }} />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="sortOrder" label="排序" initialValue={99}>
              <InputNumber min={0} max={9999} style={{ width: '100%' }} />
            </Form.Item>
          </Col>
        </Row>
        <Form.Item name="status" label="状态" initialValue="1">
          <Select options={[{ value: '1', label: '启用' }, { value: '0', label: '禁用' }]} />
        </Form.Item>
        <Form.Item name="remark" label="备注">
          <Input.TextArea rows={2} />
        </Form.Item>
      </Form>
    </Modal>
  );
};
