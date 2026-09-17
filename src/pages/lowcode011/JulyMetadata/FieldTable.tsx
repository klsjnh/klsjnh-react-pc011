/**
 * 元数据「字段定义」子表（行编辑草稿模型）。
 * 通过 forwardRef 暴露 getSaveData() / isDirty() 供编辑抽屉统一保存。
 */
import React, { forwardRef, useImperativeHandle } from 'react';
import { Button, Input, InputNumber, Select, Switch, Table, Tag } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { useDraftRows } from '@/pages/lowcode011/JulyMetadata/useDraftRows';
import type { JulyMetadataFieldVo011, DraftRow } from '@/types/lowcode011/julyMetadata/vo';

/** 子表对外暴露的保存接口（三个子表共用） */
export interface SubTableHandle<T> {
  getSaveData: () => T[];
  isDirty: () => boolean;
}

const FIELD_TYPE_OPTIONS = [
  { value: 'string', label: 'string' },
  { value: 'int', label: 'int' },
  { value: 'id', label: 'id' },
  { value: 'create_time', label: 'create_time' },
  { value: 'update_time', label: 'update_time' },
  { value: 'text', label: 'text' },
  { value: 'decimal', label: 'decimal' },
  { value: 'boolean', label: 'boolean' },
];

const hdrCenter = (): React.HTMLAttributes<HTMLElement> => ({ style: { textAlign: 'center' } });
const leftCell = { align: 'left' as const, onHeaderCell: hdrCenter };

export interface FieldTableProps {
  initial: JulyMetadataFieldVo011[];
  saving?: boolean;
}

export const FieldTable = forwardRef<SubTableHandle<JulyMetadataFieldVo011>, FieldTableProps>(({ initial, saving }, ref) => {
  const { rows, add, patch, enterEdit, cancelEdit, remove, undoRemove, dirtyCount, deletedCount } = useDraftRows<JulyMetadataFieldVo011>(
    initial,
    { getId: (r) => r.id, newRow: () => ({ fieldCode: '', fieldName: '', fieldType: 'string', fieldLength: null, requiredField: false, defaultValue: '', sortOrder: 0 }) },
  );

  useImperativeHandle(ref, () => ({
    getSaveData: () => rows.filter((r) => !r._deleted).map(({ _key, _isNew, _editing, _dirty, _deleted, ...rest }) => {
      const o: Record<string, unknown> = { ...rest };
      if (_isNew) delete o.id;
      return o as JulyMetadataFieldVo011;
    }),
    isDirty: () => dirtyCount > 0 || deletedCount > 0,
  }), [rows]);

  const columns: ColumnsType<DraftRow<JulyMetadataFieldVo011>> = [
    {
      title: '字段编码', dataIndex: 'fieldCode', width: 180, ...leftCell,
      render: (v, r) => (r._editing && r._isNew
        ? <Input size="small" value={v} placeholder="同一对象内唯一" onChange={(e) => patch(r._key, { fieldCode: e.target.value })} />
        : <code>{v || '-'}</code>),
    },
    {
      title: '字段名称', dataIndex: 'fieldName', ...leftCell,
      render: (v, r) => (r._editing ? <Input size="small" value={v} onChange={(e) => patch(r._key, { fieldName: e.target.value })} /> : v),
    },
    {
      title: '类型', dataIndex: 'fieldType', width: 130,
      render: (v, r) => (r._editing
        ? <Select size="small" value={v} style={{ width: '100%' }} options={FIELD_TYPE_OPTIONS} onChange={(nv) => patch(r._key, { fieldType: nv })} />
        : <Tag color="blue">{v}</Tag>),
    },
    {
      title: '长度', dataIndex: 'fieldLength', width: 90, align: 'center', onHeaderCell: hdrCenter,
      render: (v, r) => (r._editing
        ? <InputNumber size="small" min={0} value={v ?? undefined} style={{ width: 70 }} onChange={(nv) => patch(r._key, { fieldLength: nv == null ? null : Number(nv) })} />
        : (v ?? '-')),
    },
    {
      title: '必填', dataIndex: 'requiredField', width: 70, align: 'center', onHeaderCell: hdrCenter,
      render: (v, r) => (r._editing
        ? <Switch size="small" checked={!!v} onChange={(c) => patch(r._key, { requiredField: c })} />
        : (v ? '是' : '否')),
    },
    {
      title: '默认值', dataIndex: 'defaultValue', width: 120, ...leftCell,
      render: (v, r) => (r._editing ? <Input size="small" value={v ?? ''} onChange={(e) => patch(r._key, { defaultValue: e.target.value || null })} /> : (v || '-')),
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
      <Table<DraftRow<JulyMetadataFieldVo011>>
        rowKey="_key"
        columns={columns}
        dataSource={rows}
        pagination={false}
        scroll={{ x: 900 }}
        loading={saving}
        rowClassName={(r) => (r._deleted ? 'draft-row-deleted' : r._dirty ? 'draft-row-dirty' : '')}
        locale={{ emptyText: '暂无字段，点「新增一行」开始录入' }}
      />
    </>
  );
});
FieldTable.displayName = 'FieldTable';
