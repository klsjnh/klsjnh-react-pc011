/**
 * 存储管理（主子表：存储实例 → 存储桶）
 * 路由：/storageCenter/bucketList
 */
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Button, Card, Input, Popconfirm, Space, Table, Tag } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { PlusOutlined, DeleteOutlined, ReloadOutlined } from '@ant-design/icons';
import { useTableFillHeight } from '@/hooks/useTableFillHeight';
import { toast } from '@/utils/toast';
import type { JulyStorage } from '@/types/storage011';
import {
  fetchStoragePage, listStorages, removeStorage, removeStorages, testStorageConnection,
} from '@/services/storage011/julyStorageService';
import { fetchBucketPage } from '@/services/storage011/storageBucketService';
import { useStorageState } from '@/stores/storage011/julyStorageStore';
import { useStorageBucketState } from '@/stores/storage011/storageBucketStore';
import { PAGE_SIZE_OPTIONS } from '@/utils/pageSizePref';
import { StorageFormModal } from './StorageFormModal';
import { StorageBucketPane } from './index';

const hdrCenter = (): React.HTMLAttributes<HTMLElement> => ({ style: { textAlign: 'center' } });
const leftCell = { align: 'left' as const, onHeaderCell: hdrCenter };

const PROVIDER_META: Record<string, { label: string; color: string }> = {
  local011: { label: '本地磁盘', color: 'green' },
  minio011: { label: 'MinIO', color: 'blue' },
  cos011: { label: '腾讯云 COS', color: 'cyan' },
  tos011: { label: '火山 TOS', color: 'purple' },
  oss011: { label: '阿里云 OSS', color: 'orange' },
  s3011: { label: '通用 S3', color: 'geekblue' },
};

export const BucketListPage = () => {
  const { list, total, loading, query } = useStorageState();
  const [modal, setModal] = useState<{ open: boolean; node: JulyStorage | null }>({ open: false, node: null });
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [batchDeleting, setBatchDeleting] = useState(false);
  const [testingId, setTestingId] = useState<string | null>(null);
  const [keyword, setKeyword] = useState('');
  const [selectedCode, setSelectedCode] = useState<string | undefined>();
  const cardRef = useRef<HTMLDivElement>(null);
  const tableBodyHeight = useTableFillHeight(cardRef, `${total}-${loading}`);

  useEffect(() => { void fetchStoragePage({ pageIndex: 1 }); }, []);

  const search = (v: string) => { setKeyword(v); void fetchStoragePage({ pageIndex: 1, keyword: v || undefined }); };

  const handleTest = async (row: JulyStorage) => {
    setTestingId(row.id);
    try {
      const res = await testStorageConnection({ ...row, secretKey: undefined });
      if (res?.success) toast.success(`连接成功${res.message ? '：' + res.message : ''}`);
      else toast.error(`连接失败：${res?.message || '未知原因'}`);
    } catch (e) {
      toast.error((e as Error)?.message || '测试失败');
    } finally {
      setTestingId(null);
    }
  };

  const handleRemove = async (id: string) => {
    try {
      await removeStorage(id);
      toast.success('删除成功');
    } catch (e) {
      toast.error((e as Error)?.message || '删除失败，请重试');
    }
  };

  const handleBatchRemove = async () => {
    if (!selectedRowKeys.length) return;
    setBatchDeleting(true);
    try {
      const res = await removeStorages(selectedRowKeys.map(String));
      setSelectedRowKeys([]);
      toast.success(`批量删除成功 ${res.success} 条，失败 ${res.failed} 条`);
    } catch (e) {
      toast.error((e as Error)?.message || '批量删除失败，请重试');
    } finally {
      setBatchDeleting(false);
    }
  };

  const columns: ColumnsType<JulyStorage> = [
    { ...leftCell, title: '编码', dataIndex: 'storageCode', width: 150, render: (v) => <code>{v}</code> },
    { ...leftCell, title: '名称', dataIndex: 'storageName', width: 170 },
    {
      title: '类型', dataIndex: 'provider', width: 130, align: 'center', onHeaderCell: hdrCenter,
      render: (v: string) => {
        const meta = PROVIDER_META[v] || { label: v || '-', color: 'default' };
        return <Tag color={meta.color}>{meta.label}</Tag>;
      },
    },
    {
      ...leftCell, title: '接入点 / 根路径', key: 'endpoint', width: 300,
      render: (_, r) => <code>{r.endpoint || r.basePath || '-'}</code>,
    },
    { ...leftCell, title: '默认桶', dataIndex: 'defaultBucket', width: 130, render: (v) => v || '-' },
    {
      title: '状态', dataIndex: 'status', width: 100, align: 'center', onHeaderCell: hdrCenter,
      render: (s) => <Tag color={s === '1' ? 'green' : 'red'}>{s === '1' ? '启用' : '停用'}</Tag>,
    },
    {
      title: '操作', key: 'action', width: 210, fixed: 'right', align: 'center', onHeaderCell: hdrCenter,
      render: (_, r) => (
        <Space size="small">
          <Button type="link" size="small" loading={testingId === r.id} onClick={() => handleTest(r)}>测试连接</Button>
          <Button type="link" size="small" onClick={() => setModal({ open: true, node: r })}>编辑</Button>
          <Popconfirm
            title="确定删除该存储实例吗？" okText="删除" cancelText="取消" okButtonProps={{ danger: true }}
            onConfirm={() => handleRemove(r.id)}
          >
            <Button type="link" size="small" danger>删除</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div className="page-fill">
      <div className="page-header">
        <h2>存储管理</h2>
      </div>

      <div className="page-toolbar">
        <div className="toolbar-left">
          <Input.Search allowClear placeholder="搜索编码 / 名称" style={{ width: 320 }} onSearch={search} />
        </div>
        <div className="toolbar-right">
          <Button color="primary" variant="filled" icon={<PlusOutlined />} onClick={() => setModal({ open: true, node: null })}>
            新建存储实例
          </Button>
          <Popconfirm
            title={`确定要删除选中的 ${selectedRowKeys.length} 条存储实例吗？`}
            okText="删除" cancelText="取消" okButtonProps={{ danger: true }}
            onConfirm={handleBatchRemove}
            disabled={!selectedRowKeys.length}
          >
            <Button color="danger" variant="filled" icon={<DeleteOutlined />} disabled={!selectedRowKeys.length} loading={batchDeleting}>
              批量删除
            </Button>
          </Popconfirm>
          <Button
            color="default" variant="filled" icon={<ReloadOutlined />}
            onClick={() => void fetchStoragePage({ pageIndex: 1, keyword: keyword || undefined })}
          >刷新</Button>
        </div>
      </div>

      <Card className="table-wrapper" ref={cardRef} styles={{ body: { padding: 0 } }}>
        <Table<JulyStorage>
          rowKey="id"
          columns={columns}
          rowSelection={{ selectedRowKeys, onChange: (keys) => {
            setSelectedRowKeys(keys);
            if (keys.length > 0) {
              const row = list.find((item) => item.id === keys[0]);
              if (row) setSelectedCode(row.storageCode);
            }
          }}}
          dataSource={list}
          loading={loading}
          scroll={{ x: 1160, y: tableBodyHeight }}
          pagination={{
            current: query.pageIndex,
            pageSize: query.pageSize,
            total,
            showSizeChanger: true,
            pageSizeOptions: PAGE_SIZE_OPTIONS,
            showTotal: (t) => `共 ${t} 条`,
            onChange: (pageIndex, pageSize) => void fetchStoragePage({ pageIndex, pageSize }),
          }}
        />
      </Card>

      <StorageFormModal
        open={modal.open}
        node={modal.node}
        onClose={() => setModal({ open: false, node: null })}
        onSaved={() => setSelectedRowKeys([])}
      />

      {selectedCode && (
        <div style={{ marginTop: 16 }}>
          <StorageBucketPane defaultStorageCode={selectedCode} />
        </div>
      )}
    </div>
  );
};
