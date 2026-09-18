/**
 * 元数据「服务」子表（行编辑草稿模型）。
 * 通过 forwardRef 暴露 getSaveData() / isDirty() 供编辑抽屉统一保存。
 */
import React, { forwardRef, useImperativeHandle } from 'react';
import { Button, Input, InputNumber, Select, Switch, Table } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { useDraftRows } from '@/pages/lowcode011/JulyMetadata/useDraftRows';
import type { SubTableHandle } from '@/pages/lowcode011/JulyMetadata/FieldTable';
import type { JulyMetadataServiceVo011, DraftRow } from '@/types/lowcode011';

const OBJECT_TYPE_OPTIONS = [
  { value: 'query', label: 'query' },
  { value: 'save', label: 'save' },
  { value: 'delete', label: 'delete' },
  { value: 'update', label: 'update' },
  { value: 'proc', label: 'proc' },
];

const hdrCenter = (): React.HTMLAttributes<HTMLElement> => ({ style: { textAlign: 'center' } });
const leftCell = { align: 'left' as const, onHeaderCell: hdrCenter };

export interface ServiceTableProps {
  initial: JulyMetadataServiceVo011[];
  saving?: boolean;
}

export const ServiceTable = forwardRef<SubTableHandle<JulyMetadataServiceVo011>, ServiceTableProps>(({ initial, saving }, ref) => {
  const { rows, add, patch, enterEdit, cancelEdit, remove, undoRemove, dirtyCount, deletedCount } = useDraftRows<JulyMetadataServiceVo011>(
    initial,
    { getId: (r) => r.id, newRow: () => ({ serviceCode: '', serviceName: '', serviceDescription: '', objectType: 'query', paramType: '', serviceContent: '', enabled: true, sortOrder: 0 }) },
  );

  useImperativeHandle(ref, () => ({
    getSaveData: () => rows.filter((r) => !r._deleted).map(({ _key, _isNew, _editing, _dirty, _deleted, ...rest }) => {
      const o: Record<string, unknown> = { ...rest };
      if (_isNew) delete o.id;
      return o as unknown as JulyMetadataServiceVo011;
    }),
    isDirty: () => dirtyCount > 0 || deletedCount > 0,
  }), [rows, dirtyCount, deletedCount]);

  const columns: ColumnsType<DraftRow<JulyMetadataServiceVo011>> = [
    {
      title: '服务编码', dataIndex: 'serviceCode', width: 160, ...leftCell,
      render: (v, r) => (r._editing && r._isNew
        ? <Input size="small" value={v} placeholder="同一对象内唯一" onChange={(e) => patch(r._key, { serviceCode: e.target.value })} />
        : <code>{v || '-'}</code>),
    },
    {
      title: '服务名称', dataIndex: 'serviceName', ...leftCell,
      render: (v, r) => (r._editing ? <Input size="small" value={v} onChange={(e) => patch(r._key, { serviceName: e.target.value })} /> : v),
    },
    {
      title: '对象类型', dataIndex: 'objectType', width: 130,
      render: (v, r) => (r._editing
        ? <Select size="small" value={v || 'query'} style={{ width: '100%' }} options={OBJECT_TYPE_OPTIONS} onChange={(nv) => patch(r._key, { objectType: nv })} />
        : <code>{v || '-'}</code>),
    },
    {
      title: '参数类型', dataIndex: 'paramType', width: 110, ...leftCell,
      render: (v, r) => (r._editing ? <Input size="small" value={v ?? ''} onChange={(e) => patch(r._key, { paramType: e.target.value })} /> : (v || '-')),
    },
    {
      title: 'SQL / 脚本', dataIndex: 'serviceContent', ...leftCell,
      render: (v, r) => (r._editing
        ? <Input.TextArea size="small" autoSize={{ minRows: 1, maxRows: 3 }} value={v ?? ''} onChange={(e) => patch(r._key, { serviceContent: e.target.value || null })} />
        : <code style={{ whiteSpace: 'pre-wrap' }}>{v || '-'}</code>),
    },
    {
      title: '启用', dataIndex: 'enabled', width: 70, align: 'center', onHeaderCell: hdrCenter,
      render: (v, r) => (r._editing
        ? <Switch size="small" checked={!!v} onChange={(c) => patch(r._key, { enabled: c })} />
        : (v ? '是' : '否')),
    },
    {
      title: '排序', dataIndex: 'sortOrder', width: 70, align: 'center', onHeaderCell: hdrCenter,
      render: (v, r) => (r._editing
        ? <InputNumber size="small" min={0} value={v} style={{ width: 64 }} onChange={(nv) => patch(r._key, { sortOrder: Number(nv) || 0 })} />
        : v),
    },
    {
      title: '操作', key: 'action', width: 130, align: 'center', onHeaderCell: hdrCenter,
      render: (_, r) => {
        if (r._deleted) return <Button type="link" size="small" onClick={() => undoRemove(r._key)}>撤销删除</Button>;
        if (r._editing) return <Button type="link" size="small" onClick={() => cancelEdit(r._key)}>取消</Button>;
        return (
          <React.Fragment>
            <Button type="link" size="small" onClick={() => enterEdit(r._key)}>编辑</Button>
            <Button type="link" size="small" danger onClick={() => remove(r)}>删除</Button>
          </React.Fragment>
        );
      },
    },
  ];

  return (
    <>
      <div className="detail-actions">
        <Button icon={<PlusOutlined />} color="primary" variant="filled" onClick={add}>新增一行</Button>
        {dirtyCount > 0 && (
          <span className="detail-dirty">
            有 {dirtyCount} 处改动未保存{deletedCount > 0 ? `（含 ${deletedCount} 行待删除）` : ''}
          </span>
        )}
      </div>
      <Table<DraftRow<JulyMetadataServiceVo011>>
        rowKey="_key"
        columns={columns}
        dataSource={rows}
        pagination={false}
        scroll={{ x: 1000 }}
        loading={saving}
        rowClassName={(r) => (r._deleted ? 'draft-row-deleted' : r._dirty ? 'draft-row-dirty' : '')}
        locale={{ emptyText: '暂无服务，点「新增一行」开始录入' }}
      />
    </>
  );
});
ServiceTable.displayName = 'ServiceTable';
