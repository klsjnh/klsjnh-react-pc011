/**
 * 定时任务列表页（julyScheduler）- antd 版
 * 列表读 julySchedulerStore；分页/保存/启停/删除调 julySchedulerService。
 * 字段直接对齐后端：schedulerCode/schedulerName/schedulerHandler/schedulerCron/status。
 * ?? status / remark 为前端先行字段（2026-09-21 线上 Query/Insert VO 暂无），用户将补后端，mock 已支持。
 * 工具栏对齐金标准（julyUser / julyConfig）：第一行 搜索 + 状态筛选，第二行 新建 + 批量删除；
 * 备注 / 状态为前端先行字段（后端 Insert/Query VO 暂无），用户将补后端，mock 已支持。
 */
import React, { useEffect, useRef, useState } from 'react';
import { DeleteOutlined, PlusOutlined } from '@ant-design/icons';
import { Button, Card, Input, Popconfirm, Select, Space, Table, Tag } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { useSchedulerState } from '@/stores/system011/julySchedulerStore';
import {
  fetchSchedulerPage, runSchedulerOnce, removeScheduler, removeSchedulerBatch,
} from '@/services/system011';
import { useTableFillHeight } from '@/hooks/useTableFillHeight';
import { PAGE_SIZE_OPTIONS } from '@/utils/pageSizePref';
import { toast } from '@/utils/toast';
import { SchedulerFormModal } from '@/pages/system011/julyScheduler/SchedulerFormModal';
import type { JulySchedulerVo011 } from '@/types/system011';

/** 表头单元格水平居中 */
const hdrCenter = (): React.HTMLAttributes<HTMLElement> => ({ style: { textAlign: 'center' } });

/** 数据内容左对齐 + 表头居中 */
const leftCell = { align: 'left' as const, onHeaderCell: hdrCenter };

export const JulyScheduler = () => {
  const { list, total, loading, query } = useSchedulerState();
  const [modal, setModal] = useState<{ open: boolean; node: JulySchedulerVo011 | null }>({ open: false, node: null });
  const [keyword, setKeyword] = useState('');
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [batchDeleting, setBatchDeleting] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const tableBodyHeight = useTableFillHeight(cardRef, `${total}-${loading}`);

  // 只重置 pageIndex：pageSize 是用户偏好（存在 store 里），传值会把它覆盖回默认值
  useEffect(() => { fetchSchedulerPage({ pageIndex: 1 }); }, []);

  const handleRunOnce = async (id: string) => {
    try {
      await runSchedulerOnce(id);
      toast.success(`run once ${id} success ...`);
      await fetchSchedulerPage(query);
    } catch (e) {
      toast.error((e as Error)?.message || '执行失败，请重试');
    }
  };

  const handleRemove = async (id: string) => {
    try {
      await removeScheduler(id);
      toast.success(`delete ${id} success ...`);
    } catch (e) {
      toast.error((e as Error)?.message || '删除失败，请重试');
    }
  };

  // 批量逻辑删除（logicDeleteBatch，body {ids:[...]}；service 内已刷新列表）
  const handleBatchRemove = async () => {
    if (!selectedRowKeys.length) return;
    setBatchDeleting(true);
    try {
      const res = await removeSchedulerBatch(selectedRowKeys.map(String));
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

  const columns: ColumnsType<JulySchedulerVo011> = [
    { ...leftCell, title: '任务编码', dataIndex: 'schedulerCode', width: 140, render: (v) => <code>{v}</code> },
    { ...leftCell, title: '任务名称', dataIndex: 'schedulerName', width: 200 },
    { ...leftCell, title: '处理器', dataIndex: 'schedulerHandler', width: 220 },
    { title: 'Cron', dataIndex: 'schedulerCron', width: 150, align: 'center', onHeaderCell: hdrCenter, render: (v) => <code>{v}</code> },
    { title: '执行次数', dataIndex: 'executeTimes', width: 90, align: 'center', onHeaderCell: hdrCenter },
    { title: '状态', dataIndex: 'status', width: 90, align: 'center', onHeaderCell: hdrCenter, render: (s) => <Tag color={s === '1' ? 'green' : 'default'}>{s === '1' ? '运行中' : '已停止'}</Tag> },
    { ...leftCell, title: '备注', dataIndex: 'remark', render: (v) => v || '—' },
    {
      title: '操作', key: 'action', width: 200, fixed: 'right', align: 'center', onHeaderCell: hdrCenter,
      render: (_, r) => (
        <Space size="small">
          <Button type="link" size="small" onClick={() => setModal({ open: true, node: r })}>编辑</Button>
          <Button type="link" size="small" onClick={() => handleRunOnce(r.id)}>执行一次</Button>
          <Popconfirm title="确定删除这个定时任务吗？" okText="删除" cancelText="取消" okButtonProps={{ danger: true }} onConfirm={() => handleRemove(r.id)}>
            <Button type="link" size="small" danger>删除</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div className="page-fill">
      <div className="page-header">
        <h2>定时任务</h2>
      </div>

      {/* 工具栏对齐金标准（julyUser / julyConfig）：第一行 搜索 + 状态筛选，第二行 新建 + 批量删除 */}
      <div className="page-toolbar" style={{ display: 'block' }}>
        <div className="toolbar-row-search" style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
          <Input.Search
            allowClear
            placeholder="搜索编码 / 名称"
            style={{ width: 260 }}
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            onSearch={(v) => fetchSchedulerPage({ pageIndex: 1, schedulerName: v || undefined })}
          />
          {/* status 为前端先行查询字段（线上 QueryVo 暂无），后端补齐后生效 */}
          <Select
            style={{ width: 140 }}
            value={query.status ?? ''}
            onChange={(v) => fetchSchedulerPage({ pageIndex: 1, status: v || undefined })}
            options={[
              { value: '', label: '全部状态' },
              { value: '1', label: '运行中' },
              { value: '0', label: '已停止' },
            ]}
          />
        </div>
        <div className="toolbar-right">
          {/* 浅底 tonal（variant="filled"）：颜色表达强度、跟随主题 token，不写死色，与配置管理保持一致 */}
          <Button color="primary" variant="filled" icon={<PlusOutlined />}
            onClick={() => setModal({ open: true, node: null })}>新建任务</Button>
          <Popconfirm
            title={`确定要删除选中的 ${selectedRowKeys.length} 个任务吗？`}
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
        </div>
      </div>

      <Card className="table-wrapper" ref={cardRef} styles={{ body: { padding: 0 } }}>
        <Table<JulySchedulerVo011>
          rowKey="id"
          columns={columns}
          rowSelection={rowSelection}
          dataSource={list}
          loading={loading}
          scroll={{ x: 1200, y: tableBodyHeight }}
          pagination={{
            current: query.pageIndex,
            pageSize: query.pageSize,
            total,
            showSizeChanger: true,
            pageSizeOptions: PAGE_SIZE_OPTIONS,
            showTotal: (t) => `共 ${t} 条`,
            onChange: (pageIndex, pageSize) => fetchSchedulerPage({ pageIndex, pageSize }),
          }}
        />
      </Card>

      <SchedulerFormModal
        open={modal.open}
        node={modal.node}
        onClose={() => setModal({ open: false, node: null })}
      />
    </div>
  );
};

export default JulyScheduler;
