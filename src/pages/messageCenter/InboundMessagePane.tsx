/**
 * 入站消息 pane：通道/状态筛选 + 消息记录表格 + 模拟回调（receive）+ 删除。
 * 入站消息没有 resend（第三方投递不可重放），只有 receive 模拟推送。
 */
import React, { useEffect, useRef, useState } from 'react';
import { Button, Card, Input, Popconfirm, Space, Table, Tag } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { DeleteOutlined, PlusOutlined, ReloadOutlined } from '@ant-design/icons';
import { useTableFillHeight } from '@/hooks/useTableFillHeight';
import { toast } from '@/utils/toast';
import { inboundStore, useInboundState } from '@/stores/messageCenter/inboundStore';
import { KlsjnhBatchDeleteButton011 } from '@/components/klsjnh011';
import {
  removeInboundMessage, removeInboundMessageBatch, selectInboundMessageListByPage,
} from '@/services/messageCenter/julyInboundMessageService';
import { ReceiveMessageModal } from '@/pages/messageCenter/ReceiveMessageModal';
import type { JulyInboundMessageVo011 } from '@/types/messageCenter';

function statusTag(v?: string) {
  if (!v) return '-';
  const color = v.includes('失败') || v === 'FAILED' ? 'red'
    : v.includes('成功') || v === 'RECEIVED' ? 'green' : 'default';
  return <Tag color={color}>{v}</Tag>;
}

export const InboundMessagePane = () => {
  const { messages, messageTotal, messageQuery } = useInboundState();
  const [keyword, setKeyword] = useState('');
  const [channelCode, setChannelCode] = useState<string | undefined>();
  const [receiveOpen, setReceiveOpen] = useState(false);
  const [selectedKeys, setSelectedKeys] = useState<React.Key[]>([]);
  const cardRef = useRef<HTMLDivElement>(null);
  const tableBodyHeight = useTableFillHeight(cardRef, `${messageTotal}-${messages.length}`);

  const reload = async (pageIndex = messageQuery.pageIndex) => {
    try {
      const res = await selectInboundMessageListByPage({
        pageIndex, pageSize: messageQuery.pageSize,
        keyword: keyword || undefined, channelCode,
      });
      inboundStore.setMessages({ rows: res.rows || [], total: res.total, totalPages: res.totalPages });
      setSelectedKeys([]);
    } catch {
      toast.error('消息记录加载失败');
    }
  };

  // 挂载即拉列表；reload 身份随 keyword/channelCode 变化，入 deps 会每渲染重复请求
  // eslint-disable-next-line react-hooks/set-state-in-effect, react-hooks/exhaustive-deps
  useEffect(() => { void reload(1); }, []);

  const handleRemove = async (id: string) => {
    await removeInboundMessage(id);
    toast.success('删除成功');
    await reload();
  };

  const handleBatchRemove = async () => {
    const ids = selectedKeys.map(String);
    if (!ids.length) return;
    await removeInboundMessageBatch(ids);
    toast.success(`已删除 ${ids.length} 条`);
    await reload();
  };

  const columns: ColumnsType<JulyInboundMessageVo011> = [
    { title: '来源（fromId）', dataIndex: 'fromId', width: 180, ellipsis: true },
    { title: '通道', dataIndex: 'channelCode', width: 120 },
    { title: '消息类型', dataIndex: 'messageType', width: 120 },
    { title: '内容', dataIndex: 'content', ellipsis: true },
    { title: '渠道单号', dataIndex: 'rawMessageId', width: 160, ellipsis: true },
    { title: '状态', dataIndex: 'status', width: 90, render: statusTag },
    { title: '创建时间', dataIndex: 'createTime', width: 170 },
    {
      title: '操作', key: 'ops', width: 100, fixed: 'right',
      render: (_, row) => (
        <Popconfirm title="确认删除该消息记录？" onConfirm={() => void handleRemove(row.id)}>
          <Button type="link" size="small" danger icon={<DeleteOutlined />} />
        </Popconfirm>
      ),
    },
  ];

  return (
    <>
      <Space wrap style={{ marginBottom: 12 }}>
        <Input.Search
          allowClear
          placeholder="来源 / 内容关键字"
          style={{ width: 220 }}
          onSearch={(v) => { setKeyword(v); void reload(1); }}
        />
        <Input
          allowClear
          placeholder="通道编码"
          style={{ width: 160 }}
          value={channelCode ?? ''}
          onChange={(e) => setChannelCode(e.target.value || undefined)}
          onPressEnter={() => void reload(1)}
          onBlur={() => void reload(1)}
        />
        <Button color="green" variant="filled" icon={<PlusOutlined />} onClick={() => setReceiveOpen(true)}>模拟回调</Button>
        <KlsjnhBatchDeleteButton011 selectedCount={selectedKeys.length} onDelete={() => void handleBatchRemove()} />
        <Button icon={<ReloadOutlined />} onClick={() => void reload()}>刷新</Button>
      </Space>

      <Card ref={cardRef} className="table-wrapper" style={{ flex: 1, minHeight: 0 }}>
        <Table
          rowKey="id"
          size="middle"
          columns={columns}
          dataSource={messages}
          pagination={{
            current: messageQuery.pageIndex, pageSize: messageQuery.pageSize, total: messageTotal,
            showSizeChanger: true, showQuickJumper: true,
            showTotal: (t) => `共 ${t} 条`,
            onChange: (p, s) => { inboundStore.patchMessageQuery({ pageIndex: p, pageSize: s }); void reload(p); },
          }}
          rowSelection={{ selectedRowKeys: selectedKeys, onChange: setSelectedKeys }}
          scroll={{ y: tableBodyHeight, x: 1080 }}
        />
      </Card>

      <ReceiveMessageModal
        open={receiveOpen}
        channelOptions={[]}
        onCancel={() => setReceiveOpen(false)}
        onReceived={() => void reload()}
      />
    </>
  );
};
