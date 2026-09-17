/**
 * 存储实例管理弹窗（存储桶页 / 文件列表页工具栏共用）
 * 存储中心只分「存储桶」「文件列表」两个页面，实例的增删改查收敛到这里，
 * 通过两页工具栏的「管理实例」入口打开；任何增删都会回调 onChanged() 让父页重拉下拉项。
 */
import React, { useCallback, useEffect, useState } from 'react';
import { Button, Card, Input, Modal, Popconfirm, Space, Table, Tag } from 'antd';
import { DeleteOutlined, PlusOutlined, ReloadOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { PAGE_SIZE_OPTIONS } from '@/utils/pageSizePref';
import { toast } from '@/utils/toast';
import type { JulyStorage } from '@/types/storage011';
import {
  fetchStoragePage, removeStorage, removeStorages, testStorageConnection,
} from '@/services/storage011/julyStorageService';
import { useStorageState } from '@/stores/storage011/julyStorageStore';
import { StorageFormModal } from '@/pages/backup011/storageCenter/StorageFormModal';

/** 表头单元格水平居中 */
const hdrCenter = (): React.HTMLAttributes<HTMLElement> => ({ style: { textAlign: 'center' } });

/** 数据内容左对齐 + 表头居中 */
const leftCell = { align: 'left' as const, onHeaderCell: hdrCenter };

interface Props {
  open: boolean;
  onClose: () => void;
  /** 实例被新增/删除/修改后回调（父页据此重拉「存储实例」下拉项） */
  onChanged?: () => void;
}

export const StorageInstancesModal = ({ open, onClose, onChanged }: Props) => {
  const { list, total, loading, query } = useStorageState();
  const [modal, setModal] = useState<{ open: boolean; node: JulyStorage | null }>({ open: false, node: null });
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [batchDeleting, setBatchDeleting] = useState(false);
  const [testingId, setTestingId] = useState<string | null>(null);
  const [keyword, setKeyword] = useState('');

  // 每次打开都回到第 1 页重拉：弹窗里的数据应当是"当前后端最新"，不复用上次残留的分页位置
  useEffect(() => {
    if (!open) return;
    setSelectedRowKeys([]);
    void fetchStoragePage({ pageIndex: 1, storageName: keyword || undefined });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const reload = useCallback((patch: { pageIndex?: number; pageSize?: number } = {}) => {
    void fetchStoragePage({ pageIndex: patch.pageIndex ?? 1, pageSize: patch.pageSize, storageName: keyword || undefined });
  }, [keyword]);

  const search = (v: string) => {
    setKeyword(v);
    void fetchStoragePage({ pageIndex: 1, storageName: v || undefined });
  };

  const handleTest = async (row: JulyStorage) => {
    setTestingId(row.id);
    try {
      // 后端 testConnection 入参是 JulyStorageConnectVo011：已保存实例只 id，secretKey 默认不回显所以不能拿整行测
      const res = await testStorageConnection({ id: row.id });
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
      onChanged?.();
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
      onChanged?.();
      toast.success(`批量删除成功 ${res.success} 条，失败 ${res.failed} 条`);
    } catch (e) {
      toast.error((e as Error)?.message || '批量删除失败，请重试');
    } finally {
      setBatchDeleting(false);
    }
  };

  const columns: ColumnsType<JulyStorage> = [
    { ...leftCell, title: '编码', dataIndex: 'storageCode', width: 140, render: (v) => <code>{v}</code> },
    { ...leftCell, title: '名称', dataIndex: 'storageName', width: 150 },
    {
      title: '类型', dataIndex: 'provider', width: 110, align: 'center', onHeaderCell: hdrCenter,
      render: (v) => <Tag color={v === 'S3' ? 'blue' : 'default'}>{v || '-'}</Tag>,
    },
    {
      ...leftCell, title: '接入点 / 根路径', key: 'endpoint', width: 260,
      render: (_, r) => <code>{r.endpoint || r.basePath || '-'}</code>,
    },
    { ...leftCell, title: '默认桶', dataIndex: 'defaultBucket', width: 110, render: (v) => v || '-' },
    {
      title: '状态', dataIndex: 'status', width: 90, align: 'center', onHeaderCell: hdrCenter,
      render: (s) => <Tag color={s === '1' ? 'green' : 'red'}>{s === '1' ? '启用' : '停用'}</Tag>,
    },
    {
      title: '操作', key: 'action', width: 190, fixed: 'right', align: 'center', onHeaderCell: hdrCenter,
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
    <>
      <Modal
        title="存储实例管理"
        open={open}
        onCancel={onClose}
        footer={<Button onClick={onClose}>关闭</Button>}
        width={1120}
        destroyOnHidden
      >
        <div className="page-toolbar">
          <div className="toolbar-left">
            <Input.Search allowClear placeholder="搜索名称" style={{ width: 280 }} onSearch={search} />
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
            <Button color="default" variant="filled" icon={<ReloadOutlined />} onClick={() => reload()}>刷新</Button>
          </div>
        </div>

        <Card className="table-wrapper" styles={{ body: { padding: 0 } }}>
          <Table<JulyStorage>
            rowKey="id"
            columns={columns}
            rowSelection={{ selectedRowKeys, onChange: (keys) => setSelectedRowKeys(keys) }}
            dataSource={list}
            loading={loading}
            scroll={{ x: 1050, y: 340 }}
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
      </Modal>

      <StorageFormModal
        open={modal.open}
        node={modal.node}
        onClose={() => setModal({ open: false, node: null })}
        onSaved={() => { setSelectedRowKeys([]); onChanged?.(); }}
      />
    </>
  );
};
