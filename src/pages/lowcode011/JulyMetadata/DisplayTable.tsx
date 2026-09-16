/**
 * 元数据「显示列」子表（行编辑草稿模型）。
 * 通过 forwardRef 暴露 getSaveData() / isDirty() 供编辑抽屉统一保存。
 */
import React, { forwardRef, useImperativeHandle } from 'react';
import { Button, Input, InputNumber, Select, Table } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { useDraftRows } from './useDraftRows';
import type { SubTableHandle } from './FieldTable';
import type { JulyMetadataDisplayVo011, DraftRow } from '@/types/lowcode011';

const ALIGN_OPTIONS = [
  { value: 'left', label: 'left' },
  { value: 'center', label: 'center' },
  { value: 'right', label: 'right' },
];

const hdrCenter = (): React.HTMLAttributes<HTMLElement> => ({ style: { textAlign: 'center' } });
const leftCell = { align: 'left' as const, onHeaderCell: hdrCenter };

export interface DisplayTableProps {
  initial: JulyMetadataDisplayVo011[];
  saving?: boolean;
}

export const DisplayTable = forwardRef<SubTableHandle<JulyMetadataDisplayVo011>, DisplayTableProps>(({ initial, saving }, ref) => {
  const { rows, add, patch, enterEdit, cancelEdit, remove, undoRemove, dirtyCount, deletedCount } = useDraftRows<JulyMetadataDisplayVo011>(
    initial,
    { getId: (r) => r.id, newRow: () => ({ displayCode: '', displayName: '', align: 'left', width: null, componentType: '', displayType: '', param011: '', sortOrder: 0 }) },
  );

  useImperativeHandle(ref, () => ({
    getSaveData: () => rows.filter((r) => !r._deleted).map(({ _key, _isNew, _editing, _dirty, _deleted, ...rest }) => {
      const o: Record<string, unknown> = { ...rest };
      if (_isNew) delete o.id;
      return o as JulyMetadataDisplayVo011;
    }),
    isDirty: () => dirtyCount > 0 || deletedCount > 0,
  }), [rows]);

  const columns: ColumnsType<DraftRow<JulyMetadataDisplayVo011>> = [
    {
      title: '列编码', dataIndex: 'displayCode', width: 160, ...leftCell,
      render: (v, r) => (r._editing && r._isNew
        ? <Input size="small" value={v} placeholder="绑定字段" onChange={(e) => patch(r._key, { displayCode: e.target.value })} />
        : <code>{v || '-'}</code>),
    },
    {
      title: '列名称', dataIndex: 'displayName', ...leftCell,
      render: (v, r) => (r._editing ? <Input size="small" value={v} onChange={(e) => patch(r._key, { displayName: e.target.value })} /> : v),
    },
    {
      title: '对齐', dataIndex: 'align', width: 110,
      render: (v, r) => (r._editing
        ? <Select size="small" value={v || 'left'} style={{ width: '100%' }} options={ALIGN_OPTIONS} onChange={(nv) => patch(r._key, { align: nv })} />
        : <code>{v || 'left'}</code>),
    },
    {
      title: '列宽', dataIndex: 'width', width: 90, align: 'center', onHeaderCell: hdrCenter,
      render: (v, r) => (r._editing
        ? <InputNumber size="small" min={0} value={v ?? undefined} style={{ width: 70 }} onChange={(nv) => patch(r._key, { width: nv == null ? null : Number(nv) })} />
        : (v ?? '-')),
    },
    {
      title: '组件类型', dataIndex: 'componentType', width: 130, ...leftCell,
      render: (v, r) => (r._editing ? <Input size="small" value={v ?? ''} onChange={(e) => patch(r._key, { componentType: e.target.value })} /> : (v || '-')),
    },
    {
      title: '显示类型', dataIndex: 'displayType', width: 130, ...leftCell,
      render: (v, r) => (r._editing ? <Input size="small" value={v ?? ''} onChange={(e) => patch(r._key, { displayType: e.target.value })} /> : (v || '-')),
    },
    {
      title: '扩展参数', dataIndex: 'param011', width: 160, ...leftCell,
      render: (v, r) => (r._editing ? <Input size="small" value={v ?? ''} onChange={(e) => patch(r._key, { param011: e.target.value || null })} /> : (v || '-')),
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
      <Table<DraftRow<JulyMetadataDisplayVo011>>
        rowKey="_key"
        columns={columns}
        dataSource={rows}
        pagination={false}
        scroll={{ x: 1000 }}
        loading={saving}
        rowClassName={(r) => (r._deleted ? 'draft-row-deleted' : r._dirty ? 'draft-row-dirty' : '')}
        locale={{ emptyText: '暂无显示列，点「新增一行」开始录入' }}
      />
    </>
  );
});
DisplayTable.displayName = 'DisplayTable';
