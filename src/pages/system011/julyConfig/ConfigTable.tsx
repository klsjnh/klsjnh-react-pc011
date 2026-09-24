/**
 * 配置表格（julyConfig 主表）
 * 只负责表格渲染（store 取数 / 列定义 / 勾选 / 分页 / 实测高度）；
 * 工具栏 / 弹窗 / 删除与批量删除处理由 index 页面壳编排（行内动作经回调上抛）。
 * 按钮口径对齐单表金标准（用户管理）：行内 filled 小按钮（编辑 primary / 删除 danger）。
 */
import React, { useRef } from 'react';
import { Button, Card, Popconfirm, Space, Table } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { KlsjnhStatusTag011 } from '@/components/klsjnh011';
import { useConfigState } from '@/stores/system011/julyConfigStore';
import { fetchConfigPage } from '@/services/system011';
import { useTableFillHeight } from '@/hooks/useTableFillHeight';
import { PAGE_SIZE_OPTIONS } from '@/utils/pageSizePref';
import type { JulyConfigVo011 } from '@/types/system011/julyConfig';

/** 表头单元格水平居中 */
const hdrCenter = (): React.HTMLAttributes<HTMLElement> => ({ style: { textAlign: 'center' } });

/** 数据内容左对齐 + 表头居中 */
const leftCell = { align: 'left' as const, onHeaderCell: hdrCenter };

export interface ConfigTableProps {
  /** 勾选行（index 持有，批量删除按钮消费） */
  selectedRowKeys: React.Key[];
  /** 勾选变化回调 */
  onSelectionChange: (keys: React.Key[]) => void;
  /** 行内「编辑」回调（弹窗状态由页面壳持有） */
  onEdit: (row: JulyConfigVo011) => void;
  /** 行内「删除」回调 */
  onRemove: (id: string) => void;
}

export const ConfigTable = ({ selectedRowKeys, onSelectionChange, onEdit, onRemove }: ConfigTableProps) => {
  const { list, total, loading, query } = useConfigState();
  const cardRef = useRef<HTMLDivElement>(null);
  const tableBodyHeight = useTableFillHeight(cardRef, `${total}-${loading}`);

  const rowSelection = {
    selectedRowKeys,
    onChange: (keys: React.Key[]) => onSelectionChange(keys),
  };

  const columns: ColumnsType<JulyConfigVo011> = [
    { ...leftCell, title: '配置键', dataIndex: 'code', width: 160, render: (v) => <code>{v}</code> },
    { ...leftCell, title: '配置值', dataIndex: 'data', ellipsis: true },
    { ...leftCell, title: '备注', dataIndex: 'remark', ellipsis: true, render: (v) => v || '—' },
    { title: '状态', dataIndex: 'status', align: 'center', onHeaderCell: hdrCenter, width: 90, render: (s) => <KlsjnhStatusTag011 value={s} /> },
    {
      title: '操作', key: 'action', width: 140, fixed: 'right', align: 'center', onHeaderCell: hdrCenter,
      render: (_, r) => (
        <Space size="small">
          <Button color="primary" variant="filled" size="small" onClick={() => onEdit(r)}>编辑</Button>
          <Popconfirm title="确定删除这条配置吗？" okText="删除" cancelText="取消" okButtonProps={{ danger: true }} onConfirm={() => onRemove(r.id)}>
            <Button color="danger" variant="filled" size="small" danger>删除</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <Card className="table-wrapper" ref={cardRef} styles={{ body: { padding: 0 } }}>
      <Table<JulyConfigVo011>
        rowKey="id"
        columns={columns}
        rowSelection={rowSelection}
        dataSource={list}
        loading={loading}
        scroll={{ x: 900, y: tableBodyHeight }}
        pagination={{
          current: query.pageIndex,
          pageSize: query.pageSize,
          total,
          showSizeChanger: true,
          pageSizeOptions: PAGE_SIZE_OPTIONS,
          showTotal: (t) => `共 ${t} 条`,
          onChange: (pageIndex, pageSize) => fetchConfigPage({ pageIndex, pageSize }),
        }}
      />
    </Card>
  );
};

export default ConfigTable;
