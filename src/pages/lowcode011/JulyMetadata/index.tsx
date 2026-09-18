/**
 * 元数据管理（lowcode011 / julyMetadata）—— 列表页。
 * 主表 CRUD + 批量删除；编辑 / 新增走路由跳转（一主三子整体编辑，见 MetadataFormPage）。
 *
 * 工具栏对齐 julyUser / julyConfig 标准：.page-toolbar > .toolbar-right（卡片之外、左对齐一行按钮）。
 * 卡头高度遵循 antd6 Card.headerHeight（项目统一 46）。
 * 注：元数据无「导出 / 备份」类操作（后端 julyMetadata 无对应接口），工具栏不放置。
 *
 * 支持 `?objectName=xxx` 预置搜索：业务建模页按对象名跳过来时直接定位（见 JulyBusinessModeling）。
 */
import React, { useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { App } from 'antd';
import { Button, Card, Input, Popconfirm, Space, Table, Tag } from 'antd';
import { DeleteOutlined, EditOutlined, PlayCircleOutlined, PlusOutlined, ReloadOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { useMetadataState, julyMetadataStore } from '@/stores/lowcode011/julyMetadataStore';
import {
  fetchMetadataPage, removeMetadata, removeMetadataBatch,
} from '@/services/lowcode011';
import { LOWCODE011_ROUTES } from '@/config/routes';
import { PAGE_SIZE_OPTIONS } from '@/utils/pageSizePref';
import type { PageNavProps } from '@/types/view/page';
import type { JulyMetadataVo011 } from '@/types/lowcode011';

const STATUS_TAG = (s?: string) => <Tag color={s === '1' ? 'green' : 'red'}>{s === '1' ? '启用' : '停用'}</Tag>;

const hdrCenter = (): React.HTMLAttributes<HTMLElement> => ({ style: { textAlign: 'center' } });
const leftCell = { align: 'left' as const, onHeaderCell: hdrCenter };

export const JulyMetadata = ({ onNavigate }: PageNavProps) => {
  const { list, total, loading, query, selectedRowKeys } = useMetadataState();
  const location = useLocation();
  const { modal } = App.useApp();

  /** 业务建模页跳转过来时带的定位参数 */
  const presetObjectName = useMemo(
    () => new URLSearchParams(location.search).get('objectName') || '',
    [location.search],
  );
  const [keyword, setKeyword] = useState(presetObjectName);

  useEffect(() => {
    // sync preset search keyword from query
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setKeyword(presetObjectName);
    fetchMetadataPage({ pageIndex: 1, keyword: presetObjectName || undefined });
  }, [presetObjectName]);

  const handleSearch = (kw?: string) => {
    setKeyword(kw || '');
    fetchMetadataPage({ keyword: kw || '', pageIndex: 1 });
  };

  const handleRemove = async (id: string) => {
    modal.confirm({
      title: '删除确认',
      content: `确定要删除元数据 ${id} 吗？会级联删除其全部字段/显示列/服务。`,
      okText: '删除',
      okType: 'danger',
      cancelText: '取消',
      onOk: async () => {
        await removeMetadata(id);
        await fetchMetadataPage(query);
      },
    });
  };

  const handleBatchRemove = async () => {
    if (!selectedRowKeys.length) return;
    modal.confirm({
      title: '批量删除确认',
      content: `确定要删除选中的 ${selectedRowKeys.length} 条元数据吗？会级联删除全部字段/显示列/服务。`,
      okText: '删除',
      okType: 'danger',
      cancelText: '取消',
      onOk: async () => {
        await removeMetadataBatch(selectedRowKeys);
        await fetchMetadataPage(query);
      },
    });
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
      title: '操作', key: 'action', width: 220, align: 'center', fixed: 'right', onHeaderCell: hdrCenter,
      render: (_, r) => (
        <Space size="small">
          <Button type="link" size="small" icon={<EditOutlined />} onClick={() => onNavigate?.(`${LOWCODE011_ROUTES.julyMetadata}/${r.id}`)}>编辑</Button>
          <Button
            type="link" size="small" icon={<PlayCircleOutlined />}
            onClick={() => onNavigate?.(`${LOWCODE011_ROUTES.schemaRuntime}?objectName=${encodeURIComponent(r.objectName)}`)}
          >
            运行
          </Button>
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
          <Button color="primary" variant="filled" icon={<PlusOutlined />} onClick={() => onNavigate?.(LOWCODE011_ROUTES.julyMetadataNew)}>新建元数据</Button>
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
          scroll={{ x: 1180 }}
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
    </div>
  );
};

export default JulyMetadata;
