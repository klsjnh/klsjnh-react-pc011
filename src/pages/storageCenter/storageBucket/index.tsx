/**
 * 存储桶页（storage011 · bucket/*）
 *
 * 存储中心分「存储桶」「文件列表」两页：本页负责桶的增删与连通性，点「进入文件」跳到文件列表页。
 * 分层：page 调 service + 读 store；service 编排业务并写 store（store 不调 service）。
 * 布局：页面根 .page-fill（flex 列），.page-toolbar 与 Card.table-wrapper 均为其**直接子元素**
 *       → 卡片吃满剩余高度，表格体高度由 useTableFillHeight 实测后喂 antd scroll.y。
 *
 * ⚠️ 默认选中实例用**派生值**（explorer.storageCode ?? storages[0]）而不是 effect 回写 state：
 *    「先 setState 再靠 effect 触发查询」会让首个请求带 undefined 打全量，与随后的收窄请求并发，
 *    谁后返回谁写 store —— 实测出现过「桶列表混入其它实例的桶」。派生值 + ready 可保证只发一次。
 */
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ApiOutlined, HddOutlined, PlusOutlined, ReloadOutlined } from '@ant-design/icons';
import { Button, Card, Input, Popconfirm, Select, Space, Table, Tag } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { PAGE_SIZE_OPTIONS } from '@/utils/pageSizePref';
import { useTableFillHeight } from '@/hooks/useTableFillHeight';
import { toast } from '@/utils/toast';
import type { StorageBucket as StorageBucketVo } from '@/types/storage011';
import type { PageNavProps } from '@/types/view/page';
import { fetchBucketPage, removeBucket, testBucketConnection } from '@/services/storage011/storageBucketService';
import { useStorageBucketState } from '@/stores/storage011/storageBucketStore';
import { storageExplorerStore, useStorageExplorer } from '@/stores/storage011/storageExplorerStore';
import { useStorageOptions } from '@/pages/storageCenter/useStorageOptions';
import { StorageInstancesModal } from '@/pages/storageCenter/StorageInstancesModal';
import { BucketFormModal } from './BucketFormModal';

/** 文件列表页路由（与 config/routes 的存储中心子路由保持一致） */
const STORAGE_FILE_ROUTE = '/business/storage/file';

/** 表头单元格水平居中 */
const hdrCenter = (): React.HTMLAttributes<HTMLElement> => ({ style: { textAlign: 'center' } });

/** 数据内容左对齐 + 表头居中 */
const leftCell = { align: 'left' as const, onHeaderCell: hdrCenter };

export const StorageBucket = ({ onNavigate }: PageNavProps) => {
  const { list, total, loading, query } = useStorageBucketState();
  const { storages, ready, reload: reloadStorages } = useStorageOptions();
  const explorer = useStorageExplorer();
  const [keyword, setKeyword] = useState('');
  const [bucketModalOpen, setBucketModalOpen] = useState(false);
  const [instancesOpen, setInstancesOpen] = useState(false);
  const [testing, setTesting] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const tableBodyHeight = useTableFillHeight(cardRef, `${total}-${loading}`);

  // 用户在 store 里选过、且该实例仍存在时才用它；否则派生为第一个可用实例
  const storageCode = explorer.storageCode && storages.some((s) => s.storageCode === explorer.storageCode)
    ? explorer.storageCode
    : storages[0]?.storageCode;

  // 实例列表就绪后才发首个查询：条件一次带全，不会出现「先全量、后被收窄覆盖」的竞态
  useEffect(() => {
    if (!ready) return;
    void fetchBucketPage({ pageIndex: 1, storageCode, keyword: keyword || undefined });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, storageCode]);

  const reload = useCallback((patch: { pageIndex?: number; pageSize?: number } = {}) => {
    void fetchBucketPage({
      pageIndex: patch.pageIndex ?? 1,
      pageSize: patch.pageSize,
      storageCode,
      keyword: keyword || undefined,
    });
  }, [storageCode, keyword]);

  const search = (v: string) => {
    setKeyword(v);
    void fetchBucketPage({ pageIndex: 1, storageCode, keyword: v || undefined });
  };

  const storageNameOf = (code?: string) => storages.find((s) => s.storageCode === code)?.storageName || code || '-';

  /** 桶级连通性测试：验证当前实例能否正常访问其桶 */
  const handleTestConnection = async () => {
    if (!storageCode) { toast.warning('请先选择存储实例'); return; }
    setTesting(true);
    try {
      const res = await testBucketConnection(storageCode);
      if (res?.success) toast.success(`连接成功${res.message ? '：' + res.message : ''}`);
      else toast.error(`连接失败：${res.message || '未知原因'}`);
    } catch (e) {
      toast.error((e as Error)?.message || '测试失败');
    } finally {
      setTesting(false);
    }
  };

  const handleRemove = async (row: StorageBucketVo) => {
    try {
      await removeBucket(row.storageCode ?? storageCode, row.bucketName);
      toast.success('删除成功');
    } catch (e) {
      toast.error((e as Error)?.message || '删除失败，请重试');
    }
  };

  /** 进入该桶的文件列表：先把实例 + 桶写进跨页 store，再跳路由 */
  const handleEnter = (row: StorageBucketVo) => {
    storageExplorerStore.enterBucket(row.storageCode ?? storageCode, row.bucketName);
    onNavigate?.(STORAGE_FILE_ROUTE);
  };

  const columns: ColumnsType<StorageBucketVo> = [
    { ...leftCell, title: '桶名', dataIndex: 'bucketName', width: 220, render: (v) => <code>{v}</code> },
    { ...leftCell, title: '归属实例', key: 'storageCode', width: 200, render: (_, r) => storageNameOf(r.storageCode ?? storageCode) },
    { ...leftCell, title: '区域', dataIndex: 'region', width: 160, render: (v) => v || '-' },
    {
      title: '状态', dataIndex: 'exists', width: 110, align: 'center', onHeaderCell: hdrCenter,
      render: (v) => <Tag color={v === false ? 'red' : 'green'}>{v === false ? '不存在' : '正常'}</Tag>,
    },
    { ...leftCell, title: '创建时间', dataIndex: 'creationDate', width: 200, render: (v) => v || '-' },
    {
      title: '操作', key: 'action', width: 160, fixed: 'right', align: 'center', onHeaderCell: hdrCenter,
      render: (_, r) => (
        <Space size="small">
          <Button type="link" size="small" onClick={() => handleEnter(r)}>进入文件</Button>
          <Popconfirm
            title="确定删除该桶吗？（桶内需为空）" okText="删除" cancelText="取消" okButtonProps={{ danger: true }}
            onConfirm={() => handleRemove(r)}
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
        <h2>存储桶</h2>
      </div>

      {/* 有搜索条件 → 条件单独占一行，按钮区放 .toolbar-right（与全站列表页一致） */}
      <div className="page-toolbar" style={{ display: 'block' }}>
        <div className="toolbar-row-search" style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
          <Select
            placeholder="存储实例" style={{ width: 260 }}
            value={storageCode}
            onChange={(v) => storageExplorerStore.selectStorage(v)}
            options={storages.map((s) => ({ value: s.storageCode, label: `${s.storageName} (${s.storageCode})` }))}
          />
          <Input.Search allowClear placeholder="搜索桶名" style={{ width: 240 }} onSearch={search} />
        </div>
        <div className="toolbar-right">
          <Button color="primary" variant="filled" icon={<PlusOutlined />} disabled={!ready} onClick={() => setBucketModalOpen(true)}>
            新建桶
          </Button>
          <Button color="default" variant="filled" icon={<ApiOutlined />} loading={testing} disabled={!storageCode} onClick={handleTestConnection}>
            测试连接
          </Button>
          <Button color="default" variant="filled" icon={<HddOutlined />} onClick={() => setInstancesOpen(true)}>
            管理实例
          </Button>
          <Button color="default" variant="filled" icon={<ReloadOutlined />} onClick={() => reload()}>刷新</Button>
        </div>
      </div>

      <Card className="table-wrapper" ref={cardRef} styles={{ body: { padding: 0 } }}>
        <Table<StorageBucketVo>
          rowKey={(r) => `${r.storageCode ?? storageCode ?? ''}|${r.bucketName}`}
          columns={columns}
          dataSource={list}
          loading={loading}
          scroll={{ x: 1000, y: tableBodyHeight }}
          pagination={{
            current: query.pageIndex,
            pageSize: query.pageSize,
            total,
            showSizeChanger: true,
            pageSizeOptions: PAGE_SIZE_OPTIONS,
            showTotal: (t) => `共 ${t} 条`,
            onChange: (pageIndex, pageSize) => reload({ pageIndex, pageSize }),
          }}
        />
      </Card>

      <BucketFormModal
        open={bucketModalOpen}
        storages={storages}
        defaultStorageCode={storageCode}
        onClose={() => setBucketModalOpen(false)}
      />

      <StorageInstancesModal
        open={instancesOpen}
        onClose={() => setInstancesOpen(false)}
        onChanged={reloadStorages}
      />
    </div>
  );
};
