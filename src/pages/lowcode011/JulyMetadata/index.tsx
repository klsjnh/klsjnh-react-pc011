/**
 * 元数据管理（lowcode011 / julyMetadata）—— 列表页。
 * 主表 CRUD + 批量删除；编辑走右侧抽屉（一主三子整体编辑，见 MetadataEditorDrawer）。
 *
 * 工具栏对齐 julyUser / julyConfig 标准：.page-toolbar > .toolbar-right（卡片之外、左对齐一行按钮）。
 * 卡头高度遵循 antd6 Card.headerHeight（项目统一 46）。
 * 注：元数据无「导出 / 备份」类操作（后端 julyMetadata 无对应接口），工具栏不放置。
 */
import React, { useEffect, useState } from 'react';
import { Button, Card, Input, Popconfirm, Space, Table, Tag } from 'antd';
import { DeleteOutlined, EditOutlined, PlusOutlined, ReloadOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { useMetadataState } from '@/stores/lowcode011/julyMetadataStore';
import {
  fetchMetadataPage, getMetadataById, removeMetadata, removeMetadataBatch,
} from '@/services/lowcode011';
import { toast } from '@/utils/toast';
import { PAGE_SIZE_OPTIONS } from '@/utils/pageSizePref';
import { MetadataEditorDrawer } from './MetadataEditorDrawer';
import type { JulyMetadataVo011 } from '@/types/lowcode011';

const STATUS_TAG = (s?: string) => <Tag color={s === '1' ? 'green' : 'red'}>{s === '1' ? '启用' : '停用'}</Tag>;

const hdrCenter = (): React.HTMLAttributes<HTMLElement> => ({ style: { textAlign: 'center' } });
const leftCell = { align: 'left' as const, onHeaderCell: hdrCenter };

export const JulyMetadata = () => {
  const { list, total, loading, query, selectedRowKeys } = useMetadataState();
  const [keyword, setKeyword] = useState('');
  const [editor, setEditor] = useState<{ open: boolean; node: JulyMetadataVo011 | null }>({ open: false, node: null });
  const [editLoadingId, setEditLoadingId] = useState<string | null>(null);

  useEffect(() => { fetchMetadataPage({ pageIndex: 1 }); }, []);

  const handleSearch = (kw?: string) => {
    setKeyword(kw || '');
    fetchMetadataPage({ keyword: kw || '', pageIndex: 1 });
  };

  const handleEdit = async (row: JulyMetadataVo011) => {
    setEditLoadingId(row.id);
    try {
      // 列表行只含主表概要，编辑需拉全量（含三子）
      const full = await getMetadataById(row.id);
      setEditor({ open: true, node: full });
    } catch (e) {
      toast.error((e as Error)?.message || '加载详情失败');
    } finally {
      setEditLoadingId(null);
    }
  };

  const handleRemove = async (id: string) => {
    try {
      await removeMetadata(id);
      toast.success(`delete ${id} success ...`);
    } catch (e) {
      toast.error((e as Error)?.message || '删除失败');
    }
  };

  const handleBatchRemove = async () => {
    if (!selectedRowKeys.length) return;
    try {
      await removeMetadataBatch(selectedRowKeys);
      toast.success(`batch delete ${selectedRowKeys.length} success ...`);
      julyMetadataStore.setState({ selectedRowKeys: [] });
    } catch (e) {
      toast.error((e as Error)?.message || '批量删除失败');
    }
  };

  const columns: ColumnsType<JulyMetadataVo011> = [
    { title: '对象名', dataIndex: 'objectName', ...leftCell, width: 180, render: (v) => <code>{v}</code> },
    { title: '类型', dataIndex: 'objectType', width: 120, align: 'center', onHeaderCell: hdrCenter, render: (v) => <Tag color="geekblue">{v}</Tag> },
    { title: '描述', dataIndex: 'description', ...leftCell, render: (v) => v || '-' },
    { title: '业务字段', dataIndex: 'businessField', ...leftCell, render: (v) => v || '-' },
    { title: '包名', dataIndex: 'packageName', ...leftCell, render: (v) => v || '-' },
    { title: '路由', dataIndex: 'routerPath', ...leftCell, render: (v) => v || '-' },
    { title: '状态', dataIndex: 'status', width: 90, align: 'center', onHeaderCell: hdrCenter, render: STATUS_TAG },
    {
      title: '操作', key: 'action', width: 150, align: 'center', onHeaderCell: hdrCenter,
      render: (_, r) => (
        <Space size="small">
          <Button type="link" size="small" icon={<EditOutlined />} loading={editLoadingId === r.id} onClick={() => handleEdit(r)}>编辑</Button>
          <Popconfirm title="删除该元数据会级联删除其全部字段/显示列/服务，确定吗？" okText="删除" cancelText="取消" okButtonProps={{ danger: true }} onConfirm={() => handleRemove(r.id)}>
            <Button type="link" size="small" danger icon={<DeleteOutlined />}>删除</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div className="page-header">
        <h2>元数据管理</h2>
      </div>

      {/* 工具栏：卡片之外、左对齐一行（搜索 + 按钮） */}
      <div className="page-toolbar" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Input.Search
          placeholder="按对象名 / 描述搜索"
          allowClear
          style={{ width: 280 }}
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          onSearch={handleSearch}
        />
        <div className="toolbar-right">
          <Button color="primary" variant="filled" icon={<PlusOutlined />} onClick={() => setEditor({ open: true, node: null })}>新建元数据</Button>
          <Button color="default" variant="filled" icon={<ReloadOutlined />} onClick={() => fetchMetadataPage({ pageIndex: 1 })}>刷新</Button>
          <Button danger icon={<DeleteOutlined />} disabled={!selectedRowKeys.length} onClick={handleBatchRemove}>批量删除</Button>
        </div>
      </div>

      <Card className="table-wrapper" styles={{ body: { padding: 0 } }} title="元数据">
        <Table<JulyMetadataVo011>
          rowKey="id"
          columns={columns}
          dataSource={list}
          loading={loading}
          scroll={{ x: 1100 }}
          rowSelection={{ selectedRowKeys, onChange: (keys) => julyMetadataStore.setState({ selectedRowKeys: keys as string[] }) }}
          pagination={{
            current: query.pageIndex,
            pageSize: query.pageSize,
            total,
            showSizeChanger: true,
            pageSizeOptions: PAGE_SIZE_OPTIONS,
            showTotal: (t) => `共 ${t} 条`,
            onChange: (pageIndex, pageSize) => fetchMetadataPage({ pageIndex, pageSize }),
          }}
        />
      </Card>

      <MetadataEditorDrawer
        open={editor.open}
        node={editor.node}
        onClose={() => setEditor({ open: false, node: null })}
      />
    </div>
  );
};

export default JulyMetadata;
