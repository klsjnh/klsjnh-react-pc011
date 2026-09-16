/**
 * 元数据（低代码）编辑/新增页面（lowcode011 · JulyMetadata/new 或 /JulyMetadata/:id）
 * 由列表页「新建元数据」或「编辑」按钮路由跳转而来，保存成功后返回列表页。
 *
 * 包含：主表字段表单 + 三个子表 Tabs（字段定义 / 显示列 / 服务）整体编辑。
 * 注：保留 MetadataEditorDrawer 用于其他地方的行内编辑场景（若有）。
 */
import React, { useEffect, useRef, useState } from 'react';
import { Button, Card, Form, Input, InputNumber, Select, Space, Tabs } from 'antd';
import { ArrowLeftOutlined, SaveOutlined } from '@ant-design/icons';
import { FieldTable, type SubTableHandle } from './FieldTable';
import { DisplayTable } from './DisplayTable';
import { ServiceTable } from './ServiceTable';
import { saveMetadata, getMetadataById } from '@/services/lowcode011';
import { toast } from '@/utils/toast';
import { LOWCODE011_ROUTES } from '@/config/routes';
import type { PageNavProps } from '@/types/view/page';
import type { JulyMetadataVo011, JulyMetadataSaveVo011 } from '@/types/lowcode011';

const OBJECT_TYPE_OPTIONS = [
  { value: 'type011', label: 'type011（普通对象）' },
  { value: 'type013', label: 'type013' },
  { value: 'type_tree', label: 'type_tree（树形）' },
  { value: 'type_tree011', label: 'type_tree011' },
  { value: 'type021', label: 'type021' },
];

interface Props extends PageNavProps {
  /** 编辑时传入 id；新增为 null */
  id?: string;
}

export const MetadataFormPage = ({ id, onNavigate }: Props) => {
  const [form] = Form.useForm();
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(!!id);
  const fieldRef = useRef<SubTableHandle<JulyMetadataFieldVo011>>(null);
  const displayRef = useRef<SubTableHandle<JulyMetadataDisplayVo011>>(null);
  const serviceRef = useRef<SubTableHandle<JulyMetadataServiceVo011>>(null);
  const nodeRef = useRef<JulyMetadataVo011 | null>(null);

  useEffect(() => {
    if (id) {
      setLoading(true);
      getMetadataById(id)
        .then((node) => {
          nodeRef.current = node;
          form.setFieldsValue({
            objectName: node.objectName,
            objectType: node.objectType,
            description: node.description || '',
            businessField: node.businessField || '',
            packageName: node.packageName || '',
            routerPath: node.routerPath || '',
            sortOrder: node.sortOrder,
            status: node.status || '1',
            remark: node.remark || '',
          });
          // key 强制重挂子表，确保初始数据正确
          setNodeKey(node.id);
        })
        .catch((e) => toast.error((e as Error)?.message || '加载详情失败'))
        .finally(() => setLoading(false));
    } else {
      form.resetFields();
      form.setFieldsValue({ status: '1', sortOrder: 9999 });
      nodeRef.current = null;
      setNodeKey('new');
    }
  }, [id, form]);

  // 用于强制重挂子表 key（编辑 / 新增场景切换时干净重置）
  const [nodeKey, setNodeKey] = useState<string>(id || 'new');

  const handleSave = async () => {
    let v: Record<string, any>;
    try {
      v = await form.validateFields();
    } catch (e: any) {
      if (e && e.errorFields) return;
      return;
    }
    const fields = fieldRef.current?.getSaveData() || [];
    const displays = displayRef.current?.getSaveData() || [];
    const services = serviceRef.current?.getSaveData() || [];

    // 前端轻校验：三子编码各自唯一
    const fCodes = fields.map((f) => (f.fieldCode || '').trim()).filter(Boolean);
    if (new Set(fCodes).size !== fCodes.length) return toast.warning('字段编码在同一对象内不能重复');
    const dCodes = displays.map((d) => (d.displayCode || '').trim()).filter(Boolean);
    if (new Set(dCodes).size !== dCodes.length) return toast.warning('显示列编码在同一对象内不能重复');
    const sCodes = services.map((s) => (s.serviceCode || '').trim()).filter(Boolean);
    if (new Set(sCodes).size !== sCodes.length) return toast.warning('服务编码在同一对象内不能重复');

    const payload: JulyMetadataSaveVo011 = {
      id: id || undefined,
      objectName: (v.objectName || '').trim(),
      sortOrder: Number(v.sortOrder) || 9999,
      objectType: v.objectType,
      description: v.description || null,
      businessField: v.businessField || null,
      packageName: v.packageName || null,
      routerPath: v.routerPath || null,
      remark: v.remark || null,
      status: v.status || '1',
      fields,
      displays,
      services,
    };

    setSaving(true);
    try {
      await saveMetadata(payload);
      toast.success(`${id ? 'update' : 'insert'} success ...`);
      onNavigate?.(LOWCODE011_ROUTES.julyMetadata);
    } catch (e) {
      toast.error((e as Error)?.message || '保存失败，请重试');
    } finally {
      setSaving(false);
    }
  };

  const node = nodeRef.current;

  return (
    <div className="page-fill">
      <div className="page-header">
        <Space>
          <Button icon={<ArrowLeftOutlined />} onClick={() => onNavigate?.(LOWCODE011_ROUTES.julyMetadata)}>返回列表</Button>
          <h2 style={{ margin: 0 }}>{id ? '编辑元数据' : '新建元数据'}</h2>
        </Space>
        <p>{id ? `接口 /julyMetadata/v1/update（id=${id}）` : '接口 /julyMetadata/v1/insert'}</p>
      </div>

      <Card loading={loading}>
        <Form form={form} layout="vertical" requiredMark>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0 16px' }}>
            <Form.Item label="对象名（objectName）" name="objectName" rules={[{ required: true, message: '请输入对象名' }]}>
              <Input placeholder="唯一且不可变，如 sys_user" disabled={!!id} />
            </Form.Item>
            <Form.Item label="对象类型" name="objectType" rules={[{ required: true, message: '请选择对象类型' }]}>
              <Select options={OBJECT_TYPE_OPTIONS} placeholder="请选择" />
            </Form.Item>
            <Form.Item label="对象描述" name="description" rules={[{ required: true, message: '请输入对象描述' }]}>
              <Input placeholder="如 系统用户" />
            </Form.Item>
            <Form.Item label="业务字段清单" name="businessField">
              <Input placeholder="如 id,username,status" />
            </Form.Item>
            <Form.Item label="目标包名" name="packageName">
              <Input placeholder="如 com.klsjnh.sys" />
            </Form.Item>
            <Form.Item label="前端路由" name="routerPath">
              <Input placeholder="如 /system011/julyUser" />
            </Form.Item>
            <Form.Item label="备注" name="remark" style={{ gridColumn: '1 / -1' }}>
              <Input.TextArea rows={2} placeholder="可选" />
            </Form.Item>
            <Form.Item label="状态" name="status" rules={[{ required: true, message: '请选择状态' }]} style={{ gridColumn: '1 / -1' }}>
              <Select options={[{ value: '1', label: '启用' }, { value: '0', label: '停用' }]} />
            </Form.Item>
          </div>
        </Form>

        <Tabs
          className="detail-tabs"
          defaultActiveKey="fields"
          items={[
            { key: 'fields', label: `字段定义（${node?.fields?.length ?? 0}）`, children: <FieldTable key={`f-${nodeKey}`} initial={node?.fields || []} saving={saving} ref={fieldRef} /> },
            { key: 'displays', label: `显示列（${node?.displays?.length ?? 0}）`, children: <DisplayTable key={`d-${nodeKey}`} initial={node?.displays || []} saving={saving} ref={displayRef} /> },
            { key: 'services', label: `服务（${node?.services?.length ?? 0}）`, children: <ServiceTable key={`s-${nodeKey}`} initial={node?.services || []} saving={saving} ref={serviceRef} /> },
          ]}
        />

        <div className="detail-actions" style={{ marginTop: 16, textAlign: 'right' }}>
          <Space>
            <Button onClick={() => onNavigate?.(LOWCODE011_ROUTES.julyMetadata)} disabled={saving}>取消</Button>
            <Button type="primary" icon={<SaveOutlined />} loading={saving} onClick={handleSave}>保存</Button>
          </Space>
        </div>
      </Card>
    </div>
  );
};

export default MetadataFormPage;
