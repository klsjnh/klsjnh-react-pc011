/**
 * 存储管理（主子表：存储实例 → 存储桶）
 * 路由：/storageCenter/bucketList
 * 行内「测试连接」结果用 TestFeedbackAlert 展示（与数据源页一致），不再用 toast。
 */
import React, { useEffect, useRef, useState } from 'react';
import { Button, Card, Input, Popconfirm, Space, Table, Tag, Tabs } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { PlusOutlined, ReloadOutlined } from '@ant-design/icons';
import { useTableFillHeight } from '@/hooks/useTableFillHeight';
import { toast } from '@/utils/toast';
import type { JulyStorage, JulyStorageConnect, StorageTestResult } from '@/types/storageCenter';
import { fetchStoragePage, removeStorage, testStorageConnection } from '@/services/storageCenter/julyStorageService';
import { useStorageState } from '@/stores/storageCenter/julyStorageStore';
import { storageExplorerStore, useStorageExplorer } from '@/stores/storageCenter/storageExplorerStore';
import { PAGE_SIZE_OPTIONS } from '@/utils/pageSizePref';
import { TestFeedbackAlert, type TestFeedback, type TestFeedbackDetail } from '@/components/system011/TestFeedbackAlert';
import { StorageFormModal } from '@/pages/storageCenter/julyStorage/StorageFormModal';
import { StorageBucketPane } from '@/pages/storageCenter/julyStorage';

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

/** 组装存储测试反馈（供 TestFeedbackAlert 消费）：存储没有「数据库产品/版本」，改用 details 详情行 */
function buildStorageFeedback(res: StorageTestResult, startedAt: number, providerLabel?: string): TestFeedback {
  const details: TestFeedbackDetail[] = [];
  if (providerLabel) details.push({ label: '类型', value: providerLabel });
  if (res.endpoint) details.push({ label: '接入点', value: res.endpoint });
  if (res.basePath) details.push({ label: '根路径', value: res.basePath });
  if (res.bucketCount != null) details.push({ label: '桶数量', value: String(res.bucketCount) });
  return {
    ok: !!res.success,
    message: res.message || (res.success ? '连接成功' : '连接失败'),
    elapsedMs: Date.now() - startedAt,
    details,
  };
}

/** 请求异常（如 HTTP 500）时的失败反馈 -> 用 Alert 展示，而非 toast */
function failureFeedback(e: unknown, startedAt: number): TestFeedback {
  return {
    ok: false,
    message: (e as Error)?.message || '连接测试请求失败',
    elapsedMs: Date.now() - startedAt,
  };
}

export const BucketListPage = () => {
  const { list, total, loading, query } = useStorageState();
  const [modal, setModal] = useState<{ open: boolean; node: JulyStorage | null }>({ open: false, node: null });
  const [testingId, setTestingId] = useState<string | null>(null);
  const [pageTest, setPageTest] = useState<TestFeedback | null>(null);
  const [keyword, setKeyword] = useState('');
  // 选中的存储实例放持久化 store：拉到文件列表页 / 刷新后回来，仍停在上次选中的实例
  const explorer = useStorageExplorer();
  const selectedCode = explorer.storageCode;
  const cardRef = useRef<HTMLDivElement>(null);
  const tableBodyHeight = useTableFillHeight(cardRef, `${total}-${loading}`);

  useEffect(() => { void fetchStoragePage({ pageIndex: 1 }); }, []);

  const search = (v: string) => { setKeyword(v); void fetchStoragePage({ pageIndex: 1, keyword: v || undefined }); };

  /** 表行内测试（对已保存实例重测），结果展示在页面顶部 Alert */
  const handleTest = async (row: JulyStorage) => {
    setTestingId(row.id);
    setPageTest(null);
    const startedAt = Date.now();
    try {
      // 后端 testConnection 入参是 JulyStorageConnectVo011（只接受 id 或连接字段）
      // 已保存实例只传 id —— 让后端按库里的连接配置测；secretKey 列表页默认不回显，拼草稿字段也不可信
      const payload: JulyStorageConnect = { id: row.id };
      const res = await testStorageConnection(payload);
      setPageTest(buildStorageFeedback(res || { success: false }, startedAt, PROVIDER_META[row.provider ?? '']?.label));
    } catch (e) {
      setPageTest(failureFeedback(e, startedAt));
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

  /** 点击行切右侧桶子表（写持久化 store，切页/刷新后仍记得） */
  const handleRowClick = (row: JulyStorage) => {
    if (row.storageCode === selectedCode) return;
    storageExplorerStore.selectStorage(row.storageCode);
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

      {pageTest && <TestFeedbackAlert data={pageTest} />}

      <Card className="table-wrapper" styles={{ body: { padding: 0 } }} title="存储实例">
        <Table<JulyStorage>
          rowKey="id"
          columns={columns}
          onRow={(r) => ({ onClick: () => handleRowClick(r), style: { cursor: 'pointer' } })}
          rowClassName={(r) => (r.storageCode && r.storageCode === selectedCode ? 'master-row-selected' : '')}
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
        onSaved={() => storageExplorerStore.selectStorage(undefined)}
      />
    </div>
  );
};
