/**
 * 字典主表列表（julyDictionary 上半区）
 * 只负责主表渲染与行内操作；工具栏 / 弹窗 / 明细区由 index 页面壳编排。
 * 行内：编辑（回调 onEdit，弹窗状态由页面壳持有）/ 删除（Popconfirm → removeDictionary，service 内刷新列表）。
 * 行点击选中（master-row-selected）→ 写 store.active，子表订阅 store 自动跟随。
 */
import React from 'react';
import { Button, Popconfirm, Space, Table, Tag } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { useDictionaryState } from '@/stores/system011/julyDictionaryStore';
import { selectDictionary, removeDictionary, fetchDictionaryPage } from '@/services/system011';
import { toast } from '@/utils/toast';
import { PAGE_SIZE_OPTIONS } from '@/utils/pageSizePref';
import type { JulyDictionaryVo011 } from '@/types/system011';

const STATUS_TAG = (s?: string) => <Tag color={s === '1' ? 'green' : 'red'}>{s === '1' ? '启用' : '停用'}</Tag>;

/** 表头一律居中（antd 的 align 只管表体，表头要另给 onHeaderCell） */
const hdrCenter = (): React.HTMLAttributes<HTMLElement> => ({ style: { textAlign: 'center' } });
/** 内容左对齐 + 表头居中（编码 / 名称类列） */
const leftCell = { align: 'left' as const, onHeaderCell: hdrCenter };

export interface DictionaryTableProps {
  /** 行内「编辑」回调（弹窗 open/node 由页面壳持有） */
  onEdit: (row: JulyDictionaryVo011) => void;
}

export const DictionaryTable = ({ onEdit }: DictionaryTableProps) => {
  const { list, total, loading, query, active } = useDictionaryState();

  const handleDictRemove = async (id: string) => {
    try {
      await removeDictionary(id);
      toast.success(`delete ${id} success ...`);
    } catch (e) {
      toast.error((e as Error)?.message || '删除失败，请重试');
    }
  };

  const dictColumns: ColumnsType<JulyDictionaryVo011> = [
    { title: '字典编码', dataIndex: 'dictionaryCode', ...leftCell, render: (v) => <code>{v}</code> },
    { title: '字典名称', dataIndex: 'dictionaryName', ...leftCell },
    { title: '排序', dataIndex: 'sortOrder', align: 'center', onHeaderCell: hdrCenter, width: 80 },
    { title: '状态', dataIndex: 'status', align: 'center', onHeaderCell: hdrCenter, width: 80, render: STATUS_TAG },
    {
      title: '操作', key: 'action', width: 160, align: 'center', onHeaderCell: hdrCenter,
      render: (_, r) => (
        <Space size="small">
          <Button type="link" size="small" onClick={() => onEdit(r)}>编辑</Button>
          <Popconfirm title="删除该字典会同时删除其全部明细，确定吗？" okText="删除" cancelText="取消" okButtonProps={{ danger: true }} onConfirm={() => handleDictRemove(r.id)}>
            <Button type="link" size="small" danger>删除</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <Table<JulyDictionaryVo011>
      rowKey="id"
      columns={dictColumns}
      dataSource={list}
      loading={loading}
      scroll={{ x: 900 }}
      rowClassName={(r) => (active?.id === r.id ? 'master-row-selected' : '')}
      onRow={(r) => ({ onClick: () => selectDictionary(r), style: { cursor: 'pointer' } })}
      pagination={{
        current: query.pageIndex,
        pageSize: query.pageSize,
        total,
        showSizeChanger: true,
        pageSizeOptions: PAGE_SIZE_OPTIONS,
        showTotal: (t) => `共 ${t} 条`,
        onChange: (pageIndex, pageSize) => fetchDictionaryPage({ pageIndex, pageSize }),
      }}
    />
  );
};

export default DictionaryTable;
