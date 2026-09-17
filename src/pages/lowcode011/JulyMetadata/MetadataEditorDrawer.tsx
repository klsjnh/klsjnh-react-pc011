/**
 * 元数据编辑抽屉（一主三子整体编辑）。
 *  - 主表字段用 antd Form（objectName 修改时只读：后端不可变）
 *  - 三个子表（字段 / 显示列 / 服务）为行编辑草稿，通过 ref 暴露 getSaveData() 统一保存
 *  - 保存时组装 JulyMetadataSaveVo011（一主三子整体提交；三子为「整体替换」语义，必须全量回传）
 */
import React, { useEffect, useRef, useState } from 'react';
import { Button, Drawer, Form, Input, InputNumber, Select, Space, Tabs } from 'antd';
import { SaveOutlined } from '@ant-design/icons';
import { FieldTable, type SubTableHandle } from '@/pages/lowcode011/JulyMetadata/FieldTable';
import { DisplayTable } from '@/pages/lowcode011/JulyMetadata/DisplayTable';
import { ServiceTable } from '@/pages/lowcode011/JulyMetadata/ServiceTable';
import { saveMetadata } from '@/services/lowcode011';
import { toast } from '@/utils/toast';
import type { JulyMetadataVo011, JulyMetadataSaveVo011 } from '@/types/lowcode011';

const OBJECT_TYPE_OPTIONS = [
  { value: 'type011', label: 'type011（普通对象）' },
  { value: 'type013', label: 'type013' },
  { value: 'type_tree', label: 'type_tree（树形）' },
  { value: 'type_tree011', label: 'type_tree011' },
  { value: 'type021', label: 'type021' },
];

interface DrawerProps {
  open: boolean;
  /** 编辑时传入 getById 全量（含三子）；新增为 null */
  node: JulyMetadataVo011 | null;
  onClose: () => void;
}

/** 抽屉内体（用 key 强制重挂，保证每次打开草稿干净） */
const EditorBody = ({ node, onClose }: { node: JulyMetadataVo011 | null; onClose: () => void }) => {
  const [form] = Form.useForm();
  const [saving, setSaving] = useState(false);
  const fieldRef = useRef<SubTableHandle<JulyMetadataFieldVo011>>(null);
  const displayRef = useRef<SubTableHandle<JulyMetadataDisplayVo011>>(null);
  const serviceRef = useRef<SubTableHandle<JulyMetadataServiceVo011>>(null);

  useEffect(() => {
    if (node) {
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
    } else {
      form.resetFields();
    }
  }, [node, form]);

  const handleSave = async () => {
    let v: Record<string, any>;
    try {
      v = await form.validateFields();
    } catch (e) {
      if (e && typeof e === 'object' && 'errorFields' in e) return; // 表单校验未过，antd 已高亮，不打 toast
      return;
    }
    const fields = fieldRef.current?.getSaveData() || [];
    const displays = displayRef.current?.getSaveData() || [];
    const services = serviceRef.current?.getSaveData() || [];

    // 前端轻校验：三子编码各自唯一（同对象内）
    const fCodes = fields.map((f) => (f.fieldCode || '').trim()).filter(Boolean);
    if (new Set(fCodes).size !== fCodes.length) return toast.warning('字段编码在同一对象内不能重复');
    const dCodes = displays.map((d) => (d.displayCode || '').trim()).filter(Boolean);
    if (new Set(dCodes).size !== dCodes.length) return toast.warning('显示列编码在同一对象内不能重复');
    const sCodes = services.map((s) => (s.serviceCode || '').trim()).filter(Boolean);
    if (new Set(sCodes).size !== sCodes.length) return toast.warning('服务编码在同一对象内不能重复');

    const payload: JulyMetadataSaveVo011 = {
      id: node?.id,
      objectName: (v.objectName || '').trim(),
      sortOrder: Number(v.sortOrder) || 9999,
      objectType: v.objectType,
      description: v.description || null,
      businessField: v.businessField || null,
      packageName: v.packageName || null,
      routerPath: v.routerPath || null,
      remark: v.remark || null,
      status: v.status || '1',
      // 三子整体替换：始终回传全部（未改动项原样带回，避免后端清空）
      fields,
      displays,
      services,
    };

    setSaving(true);
    try {
      await saveMetadata(payload);
      toast.success(`${node ? 'update' : 'insert'} success ...`);
      onClose();
    } catch (e) {
      toast.error((e as Error)?.message || '保存失败，请重试');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <Form form={form} layout="vertical" requiredMark>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
          <Form.Item label="对象名（objectName）" name="objectName" rules={[{ required: true, message: '请输入对象名' }]}>
            <Input placeholder="唯一且不可变，如 sys_user" disabled={!!node} />
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
          <Form.Item label="排序" name="sortOrder" rules={[{ required: true, message: '请输入排序' }]}>
            <InputNumber style={{ width: '100%' }} min={0} placeholder="越小越靠前" />
          </Form.Item>
          <Form.Item label="状态" name="status" rules={[{ required: true, message: '请选择状态' }]}>
            <Select
              options={[
                { value: '1', label: '启用' },
                { value: '0', label: '停用' },
              ]}
            />
          </Form.Item>
          <Form.Item label="备注" name="remark" style={{ gridColumn: '1 / -1' }}>
            <Input.TextArea rows={2} placeholder="可选" />
          </Form.Item>
        </div>
      </Form>

      <Tabs
        className="detail-tabs"
        defaultActiveKey="fields"
        items={[
          { key: 'fields', label: `字段定义（${node?.fields?.length ?? 0}）`, children: <FieldTable initial={node?.fields || []} saving={saving} ref={fieldRef} /> },
          { key: 'displays', label: `显示列（${node?.displays?.length ?? 0}）`, children: <DisplayTable initial={node?.displays || []} saving={saving} ref={displayRef} /> },
          { key: 'services', label: `服务（${node?.services?.length ?? 0}）`, children: <ServiceTable initial={node?.services || []} saving={saving} ref={serviceRef} /> },
        ]}
      />

      <div className="detail-actions" style={{ marginTop: 16 }}>
        <Space>
          <Button onClick={onClose} disabled={saving}>取消</Button>
          <Button type="primary" icon={<SaveOutlined />} loading={saving} onClick={handleSave}>保存</Button>
        </Space>
      </div>
    </div>
  );
};

export const MetadataEditorDrawer = ({ open, node, onClose }: DrawerProps) => (
  <Drawer
    open={open}
    onClose={onClose}
    width={980}
    title={node ? '编辑元数据' : '新建元数据'}
    maskClosable={false}
    destroyOnHidden
  >
    {/* key 强制重挂：每次打开草稿干净（新增=new / 编辑=id） */}
    <EditorBody key={node?.id || 'new'} node={node} onClose={onClose} />
  </Drawer>
);

export default MetadataEditorDrawer;
