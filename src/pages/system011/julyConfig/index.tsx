/**
 * 配置列表页（julyConfig）- antd 版
 * 列表读 julyConfigStore；分页/保存/删除调 julyConfigService。
 * 字段直接对齐后端：code/data/status。
 */
import React, { useEffect, useRef, useState } from 'react';
import { DatabaseOutlined, DeleteOutlined, DownloadOutlined, DownOutlined, PlusOutlined } from '@ant-design/icons';
import { Button, Card, Dropdown, Input, Popconfirm, Space, Table, Tag } from 'antd';
import type { MenuProps } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { useConfigState } from '@/stores/system011/julyConfigStore';
import { fetchConfigPage, removeConfig, removeConfigs, exportConfig, backupConfig011 } from '@/services/system011';
import { useTableFillHeight } from '@/hooks/useTableFillHeight';
import { PAGE_SIZE_OPTIONS } from '@/utils/pageSizePref';
import { toast } from '@/utils/toast';
import { ConfigFormModal } from '@/pages/system011/julyConfig/ConfigFormModal';
import type { JulyConfigVo011 } from '@/types/system011/julyConfig';

/** 表头单元格水平居中 */
const hdrCenter = (): React.HTMLAttributes<HTMLElement> => ({ style: { textAlign: 'center' } });

/** 数据内容左对齐 + 表头居中 */
const leftCell = { align: 'left' as const, onHeaderCell: hdrCenter };

export const JulyConfig = () => {
  const { list, total, loading, query } = useConfigState();
  const [modal, setModal] = useState<{ open: boolean; node: JulyConfigVo011 | null }>({ open: false, node: null });
  const [actionLoading, setActionLoading] = useState<'export' | 'backup' | null>(null);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [batchDeleting, setBatchDeleting] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const tableBodyHeight = useTableFillHeight(cardRef, `${total}-${loading}`);

  // 只重置 pageIndex：pageSize 是用户偏好（存在 store 里），传值会把它覆盖回默认值
  useEffect(() => { fetchConfigPage({ pageIndex: 1 }); }, []);

  // 导出全部配置 -> 下载细节收敛在 service，页面只反馈结果
  const handleExport = async (format: 'json' | 'csv' = 'csv') => {
    setActionLoading('export');
    try {
      const res = await exportConfig(format);
      toast.success(`export julyConfig success, ${res.rowCount} rows (${format})`);
    } catch (e) {
      toast.error((e as Error)?.message || '导出失败，请重试');
    } finally {
      setActionLoading(null);
    }
  };

  // 备份全部配置到存储中心 -> 返回 object key
  const handleBackup = async () => {
    setActionLoading('backup');
    try {
      const key = await backupConfig011();
      toast.success(`backup julyConfig success, key=${key}`);
    } catch (e) {
      toast.error((e as Error)?.message || '备份失败，请重试');
    } finally {
      setActionLoading(null);
    }
  };

  // 导出格式下拉（json / csv）
  const exportMenu: MenuProps = {
    items: [
      { key: 'json', label: 'JSON (.json)' },
      { key: 'csv', label: 'CSV (.csv)' },
    ],
    onClick: ({ key }) => handleExport(key as 'json' | 'csv'),
  };

  // 表单初始值逻辑已收敛到 ConfigFormModal（destroyOnHidden + initialValues）

  const handleRemove = async (id: string) => {
    try {
      await removeConfig(id);
      toast.success(`delete ${id} success ...`);
    } catch (e) {
      toast.error((e as Error)?.message || '删除失败，请重试');
    }
  };

  // 批量逻辑删除（选中行 -> service，删除/刷新已收敛在 service；后端无批量端点，service 内循环单删）
  const handleBatchRemove = async () => {
    if (!selectedRowKeys.length) return;
    setBatchDeleting(true);
    try {
      const res = await removeConfigs(selectedRowKeys.map(String));
      setSelectedRowKeys([]);
      toast.success(`批量删除成功 ${res.success} 条，失败 ${res.failed} 条`);
    } catch (e) {
      toast.error((e as Error)?.message || '批量删除失败，请重试');
    } finally {
      setBatchDeleting(false);
    }
  };

  const rowSelection = {
    selectedRowKeys,
    onChange: (keys: React.Key[]) => setSelectedRowKeys(keys),
  };

  const columns: ColumnsType<JulyConfigVo011> = [
    { ...leftCell, title: '配置键', dataIndex: 'code', width: 160, render: (v) => <code>{v}</code> },
    { ...leftCell, title: '配置值', dataIndex: 'data' },
    { title: '状态', dataIndex: 'status', align: 'center', onHeaderCell: hdrCenter, width: 130, render: (s) => <Tag color={s === '1' ? 'green' : 'red'}>{s === '1' ? '启用' : '停用'}</Tag> },
    {
      title: '操作', key: 'action', width: 140, fixed: 'right', align: 'center', onHeaderCell: hdrCenter,
      render: (_, r) => (
        <Space size="small">
          <Button type="link" size="small" onClick={() => setModal({ open: true, node: r })}>编辑</Button>
          <Popconfirm title="确定删除这条配置吗？" okText="删除" cancelText="取消" okButtonProps={{ danger: true }} onConfirm={() => handleRemove(r.id)}>
            <Button type="link" size="small" danger>删除</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div className="page-fill">
      <div className="page-header">
        <h2>配置管理</h2>
      </div>

      <div className="page-toolbar" style={{ display: 'block' }}>
        <div className="toolbar-row-search" style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
          <Input.Search
            allowClear
            placeholder="搜索 code / data"
            style={{ width: 320 }}
            onSearch={(v) => fetchConfigPage({ pageIndex: 1, keyword: v || undefined })}
          />
        </div>
        <div className="toolbar-right">
          {/* 浅底 tonal（variant="filled"）：颜色表达强度、跟随主题 token，不写死色，与用户管理保持一致 */}
          <Button
            color="primary" variant="filled"
            icon={<PlusOutlined />}
            onClick={() => setModal({ open: true, node: null })}
          >新建配置</Button>
          <Popconfirm
            title={`确定要删除选中的 ${selectedRowKeys.length} 条配置吗？`}
            okText="删除" cancelText="取消" okButtonProps={{ danger: true }}
            onConfirm={handleBatchRemove}
            disabled={!selectedRowKeys.length}
          >
            <Button
              color="danger" variant="filled"
              icon={<DeleteOutlined />}
              disabled={!selectedRowKeys.length}
              loading={batchDeleting}
            >批量删除</Button>
          </Popconfirm>
          <Button
            color="default" variant="filled"
            icon={<DatabaseOutlined />}
            loading={actionLoading === 'backup'}
            onClick={handleBackup}
          >备份011</Button>
          <Dropdown menu={exportMenu} trigger={['click']}>
            <Button
              color="default" variant="filled"
              icon={<DownloadOutlined />}
              loading={actionLoading === 'export'}
            >
              导出 <DownOutlined />
            </Button>
          </Dropdown>
        </div>
      </div>

      <Card className="table-wrapper" ref={cardRef} styles={{ body: { padding: 0 } }}>
        <Table<JulyConfigVo011>
          rowKey="id"
          columns={columns}
          rowSelection={rowSelection}
          dataSource={list}
          loading={loading}
          scroll={{ x: 800, y: tableBodyHeight }}
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

      <ConfigFormModal
        open={modal.open}
        node={modal.node}
        onClose={() => setModal({ open: false, node: null })}
        onSaved={() => {}}
      />
    </div>
  );
};