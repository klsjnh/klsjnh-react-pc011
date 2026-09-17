/**
 * 存储管理（主子表：存储实例 → 存储桶）
 * 路由：/storageCenter/bucketList
 */
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Button, Card, Input, Popconfirm, Space, Table, Tag, Tabs } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { PlusOutlined, DeleteOutlined, ReloadOutlined } from '@ant-design/icons';
import { useTableFillHeight } from '@/hooks/useTableFillHeight';
import { toast } from '@/utils/toast';
import type { JulyStorage, JulyStorageConnect } from '@/types/storage011';
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
      // 后端 testConnection 入参是 JulyStorageConnectVo011（只接受 id 或连接字段）
      // 已保存实例只传 id —— 让后端按库里的连接配置测；secretKey 列表页默认不回显，拼草稿字段也不可信
      const payload: JulyStorageConnect = { id: row.id };
      const res = await testStorageConnection(payload);
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

  /** 点击行切右侧桶子表 */
  const handleRowClick = (row: JulyStorage) => {
    setSelectedCode(row.storageCode);
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
    <div>
      <div className="page-header">
        <h2>存储管理</h2>
      </div>

      <div className="page-toolbar" style={{ flexWrap: 'wrap' }}>
        <div className="toolbar-left">
          <Input.Search allowClear placeholder="搜索编码 / 名称" style={{ width: 320 }} onSearch={search} />
        </div>
        <div className="toolbar-right" style={{ marginTop: 8 }}>
          <Button color="primary" variant="filled" icon={<PlusOutlined />} onClick={() => setModal({ open: true, node: null })}>
            新建存储实例
          </Button>
          <Button
            color="default" variant="filled" icon={<ReloadOutlined />}
            onClick={() => void fetchStoragePage({ pageIndex: 1, keyword: keyword || undefined })}
          >刷新</Button>
        </div>
      </div>

      <Card className="table-wrapper" styles={{ body: { padding: 0 } }} title="存储实例">
        <Table<JulyStorage>
          rowKey="id"
          columns={columns}
          onRow={(r) => ({ onClick: () => handleRowClick(r), style: { cursor: 'pointer' } })}
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

      <div style={{ marginTop: 16 }} className="bucket-detail">
        <Card className="table-wrapper" styles={{ body: { padding: 0 } }}>
          <Tabs
            className="detail-tabs"
            items={[
              {
                key: 'buckets',
                label: selectedCode ? `存储桶（${selectedCode}）` : '存储桶',
                children: selectedCode ? (
                  <StorageBucketPane key={selectedCode} defaultStorageCode={selectedCode} />
                ) : (
                  <div style={{ padding: '40px 0', textAlign: 'center', color: '#999' }}>
                    请在上方选中一个存储实例
                  </div>
                ),
              },
            ]}
          />
        </Card>
      </div>

      <StorageFormModal
        open={modal.open}
        node={modal.node}
        onClose={() => setModal({ open: false, node: null })}
        onSaved={() => setSelectedCode(undefined)}
      />
    </div>
  );
};
