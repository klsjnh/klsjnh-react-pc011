/**
 * 通道 pane（出站/入站共用）：关键词筛选 + 表格 + 新增/编辑/删除/批量删。
 * config 列为 JSON 字符串，展示截断；providerType 直接展示。
 */
import React, { useEffect, useRef, useState } from 'react';
import { Button, Card, Input, Popconfirm, Space, Table } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { DeleteOutlined, EditOutlined, PlusOutlined, ReloadOutlined } from '@ant-design/icons';
import { useTableFillHeight } from '@/hooks/useTableFillHeight';
import { toast } from '@/utils/toast';
import { outboundStore, useOutboundState } from '@/stores/messageCenter/outboundStore';
import { inboundStore, useInboundState } from '@/stores/messageCenter/inboundStore';
import {
  removeOutboundChannel, removeOutboundChannelBatch, saveOutboundChannel, selectOutboundChannelListByPage,
} from '@/services/messageCenter/julyOutboundChannelService';
import {
  removeInboundChannel, removeInboundChannelBatch, saveInboundChannel, selectInboundChannelListByPage,
} from '@/services/messageCenter/julyInboundChannelService';
import { ChannelFormModal, type ChannelFormValue } from '@/pages/messageCenter/ChannelFormModal';
import type { Direction } from '@/pages/messageCenter/paneTypes';
import type { JulyOutboundChannelVo011, JulyInboundChannelVo011 } from '@/types/messageCenter';

interface ChannelPaneProps {
  direction: Direction;
}

export const ChannelPane = ({ direction }: ChannelPaneProps) => {
  const isOut = direction === 'outbound';
  const out = useOutboundState();
  const inb = useInboundState();
  const rows = (isOut ? out.channels : inb.channels) as (JulyOutboundChannelVo011 | JulyInboundChannelVo011)[];
  const total = isOut ? out.channelTotal : inb.channelTotal;
  const query = isOut ? out.channelQuery : inb.channelQuery;

  const [keyword, setKeyword] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<ChannelFormValue | null>(null);
  const [selectedKeys, setSelectedKeys] = useState<React.Key[]>([]);
  const cardRef = useRef<HTMLDivElement>(null);
  const tableBodyHeight = useTableFillHeight(cardRef, `${total}-${rows.length}`);

  const reload = async (pageIndex = query.pageIndex) => {
    const body = { pageIndex, pageSize: query.pageSize, keyword: keyword || undefined };
    try {
      if (isOut) {
        const res = await selectOutboundChannelListByPage(body);
        outboundStore.setChannels({ rows: res.rows || [], total: res.total });
      } else {
        const res = await selectInboundChannelListByPage(body);
        inboundStore.setChannels({ rows: res.rows || [], total: res.total });
      }
      setSelectedKeys([]);
    } catch {
      toast.error('通道列表加载失败');
    }
  };

  // direction 切换重拉列表；reload 身份随 keyword 变化，入 deps 会每渲染重复请求
  // eslint-disable-next-line react-hooks/set-state-in-effect, react-hooks/exhaustive-deps
  useEffect(() => { void reload(1); }, [direction]);

  const handleSubmit = async (value: ChannelFormValue) => {
    const payload = { ...value, sortOrder: Number(value.sortOrder) || 1 };
    if (isOut) await saveOutboundChannel(payload); else await saveInboundChannel(payload);
    toast.success('保存成功');
    await reload();
  };

  const handleRemove = async (id: string) => {
    if (isOut) await removeOutboundChannel(id); else await removeInboundChannel(id);
    toast.success('删除成功');
    await reload();
  };

  const handleBatchRemove = async () => {
    const ids = selectedKeys.map(String);
    if (!ids.length) return;
    if (isOut) await removeOutboundChannelBatch(ids); else await removeInboundChannelBatch(ids);
    toast.success(`已删除 ${ids.length} 条`);
    await reload();
  };

  const columns: ColumnsType<JulyOutboundChannelVo011 | JulyInboundChannelVo011> = [
    { title: '通道编码', dataIndex: 'channelCode', width: 160 },
    { title: '通道名称', dataIndex: 'channelName', width: 180 },
    { title: '供应商类型', dataIndex: 'providerType', width: 140 },
    {
      title: '配置', dataIndex: 'config', ellipsis: true,
      render: (v?: string) => (v ? v.slice(0, 80) : '-'),
    },
    { title: '备注', dataIndex: 'remark', width: 160, ellipsis: true },
    {
      title: '操作', key: 'ops', width: 120, fixed: 'right',
      render: (_, row) => (
        <Space size={4}>
          <Button type="link" size="small" icon={<EditOutlined />} onClick={() => {
            setEditing({
              id: row.id, channelCode: row.channelCode, channelName: row.channelName,
              providerType: row.providerType, config: row.config, sortOrder: row.sortOrder, remark: row.remark,
            });
            setModalOpen(true);
          }} />
          <Popconfirm title="确认删除该通道？" onConfirm={() => void handleRemove(row.id)}>
            <Button type="link" size="small" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <>
      <Space wrap style={{ marginBottom: 12 }}>
        <Input.Search
          allowClear
          placeholder="编码 / 名称关键字"
          style={{ width: 220 }}
          onSearch={(v) => { setKeyword(v); void reload(1); }}
        />
        <Button type="primary" icon={<PlusOutlined />} onClick={() => { setEditing(null); setModalOpen(true); }}>
          新增通道
        </Button>
        <Popconfirm title={`确认删除选中的 ${selectedKeys.length} 条通道？`} onConfirm={() => void handleBatchRemove()}>
          <Button danger icon={<DeleteOutlined />} disabled={!selectedKeys.length}>批量删除</Button>
        </Popconfirm>
        <Button icon={<ReloadOutlined />} onClick={() => void reload()}>刷新</Button>
      </Space>

      <Card ref={cardRef} className="table-wrapper" style={{ flex: 1, minHeight: 0 }}>
        <Table
          rowKey="id"
          size="middle"
          columns={columns}
          dataSource={rows}
          pagination={{
            current: query.pageIndex, pageSize: query.pageSize, total,
            showSizeChanger: true, showQuickJumper: true,
            showTotal: (t) => `共 ${t} 条`,
            onChange: (p, s) => {
              if (isOut) outboundStore.patchChannelQuery({ pageIndex: p, pageSize: s });
              else inboundStore.patchChannelQuery({ pageIndex: p, pageSize: s });
              void reload(p);
            },
          }}
          rowSelection={{ selectedRowKeys: selectedKeys, onChange: setSelectedKeys }}
          scroll={{ y: tableBodyHeight, x: 900 }}
        />
      </Card>

      <ChannelFormModal
        open={modalOpen}
        direction={direction}
        editing={editing}
        onCancel={() => setModalOpen(false)}
        onSubmit={handleSubmit}
      />
    </>
  );
};
