/**
 * 出站消息 pane：通道/状态筛选 + 消息记录表格 + 发送 / 重发 / 单条与批量删除。
 * status 口径（后端约定）：待发送 / 已发送 / 失败等，未在 Swagger 建模枚举，前端按状态展示不猜名。
 */
import React, { useEffect, useRef, useState } from 'react';
import { Button, Card, Input, Popconfirm, Space, Table, Tag } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { DeleteOutlined, ReloadOutlined, SendOutlined } from '@ant-design/icons';
import { useTableFillHeight } from '@/hooks/useTableFillHeight';
import { toast } from '@/utils/toast';
import { outboundStore, useOutboundState } from '@/stores/messageCenter/outboundStore';
import { KlsjnhBatchDeleteButton011 } from '@/components/klsjnh011';
import {
  removeOutboundMessage, removeOutboundMessageBatch, resendOutboundMessage, selectOutboundMessageListByPage,
} from '@/services/messageCenter/julyOutboundMessageService';
import { selectOutboundChannelListByPage } from '@/services/messageCenter/julyOutboundChannelService';
import { selectOutboundTemplateListByPage } from '@/services/messageCenter/julyOutboundTemplateService';
import { SendMessageModal } from '@/pages/messageCenter/SendMessageModal';
import type { JulyOutboundMessageVo011 } from '@/types/messageCenter';

/** 消息状态展示（不猜未建模枚举名，原样 + 已知状态着色） */
function statusTag(v?: string) {
  if (!v) return '-';
  const color = v.includes('失败') || v === 'FAILED' ? 'red'
    : v.includes('成功') || v === 'SENT' ? 'green'
      : v.includes('待') || v === 'PENDING' ? 'orange' : 'default';
  return <Tag color={color}>{v}</Tag>;
}

export const OutboundMessagePane = () => {
  const { messages, messageTotal, messageQuery } = useOutboundState();
  const [keyword, setKeyword] = useState('');
  const [channelCode, setChannelCode] = useState<string | undefined>();
  const [channelOptions, setChannelOptions] = useState<{ value: string; label: string }[]>([]);
  const [templateOptions, setTemplateOptions] = useState<{ value: string; label: string }[]>([]);
  const [sendOpen, setSendOpen] = useState(false);
  const [selectedKeys, setSelectedKeys] = useState<React.Key[]>([]);
  const cardRef = useRef<HTMLDivElement>(null);
  const tableBodyHeight = useTableFillHeight(cardRef, `${messageTotal}-${messages.length}`);

  const reload = async (pageIndex = messageQuery.pageIndex) => {
    try {
      const res = await selectOutboundMessageListByPage({
        pageIndex, pageSize: messageQuery.pageSize,
        keyword: keyword || undefined, channelCode,
      });
      outboundStore.setMessages({ rows: res.rows || [], total: res.total, totalPages: res.totalPages });
      setSelectedKeys([]);
    } catch {
      toast.error('消息记录加载失败');
    }
  };

  // 挂载即拉列表 + 通道/模板选项（发送弹窗用）；reload 身份随筛选条件变化，入 deps 会每渲染重复请求
  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect, react-hooks/exhaustive-deps */
    void reload(1);
    void selectOutboundChannelListByPage({ pageIndex: 1, pageSize: 200 })
      .then((res) => setChannelOptions((res.rows || []).map((c) => ({ value: c.channelCode, label: c.channelName }))))
      .catch(() => setChannelOptions([]));
    void selectOutboundTemplateListByPage({ pageIndex: 1, pageSize: 200 })
      .then((res) => setTemplateOptions((res.rows || []).map((t) => ({ value: t.templateCode, label: t.templateName }))))
      .catch(() => setTemplateOptions([]));
  }, []);

  const handleResend = async (row: JulyOutboundMessageVo011) => {
    try {
      const res = await resendOutboundMessage(row.id);
      if (res.success) { toast.success('重发成功'); await reload(); }
      else toast.error(res.error || '重发失败');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : '重发请求失败');
    }
  };

  const handleRemove = async (id: string) => {
    await removeOutboundMessage(id);
    toast.success('删除成功');
    await reload();
  };

  const handleBatchRemove = async () => {
    const ids = selectedKeys.map(String);
    if (!ids.length) return;
    await removeOutboundMessageBatch(ids);
    toast.success(`已删除 ${ids.length} 条`);
    await reload();
  };

  const columns: ColumnsType<JulyOutboundMessageVo011> = [
    { title: '接收方', dataIndex: 'msgTo', width: 180, ellipsis: true },
    { title: '通道', dataIndex: 'channelCode', width: 120 },
    { title: '模板', dataIndex: 'templateCode', width: 160, ellipsis: true },
    { title: '标题', dataIndex: 'title', width: 160, ellipsis: true },
    {
      title: '状态', dataIndex: 'status', width: 90,
      render: statusTag,
    },
    { title: '重试', dataIndex: 'retryCount', width: 64 },
    { title: '错误', dataIndex: 'error', width: 160, ellipsis: true },
    { title: '创建时间', dataIndex: 'createTime', width: 170 },
    {
      title: '操作', key: 'ops', width: 120, fixed: 'right',
      render: (_, row) => (
        <Space size={4}>
          <Button type="link" size="small" icon={<SendOutlined />} onClick={() => void handleResend(row)}>重发</Button>
          <Popconfirm title="确认删除该消息记录？" onConfirm={() => void handleRemove(row.id)}>
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
          placeholder="接收方 / 标题关键字"
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
        <Button color="green" variant="filled" icon={<SendOutlined />} onClick={() => setSendOpen(true)}>发送消息</Button>
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
            onChange: (p, s) => { outboundStore.patchMessageQuery({ pageIndex: p, pageSize: s }); void reload(p); },
          }}
          rowSelection={{ selectedRowKeys: selectedKeys, onChange: setSelectedKeys }}
          scroll={{ y: tableBodyHeight, x: 1180 }}
        />
      </Card>

      <SendMessageModal
        open={sendOpen}
        channelOptions={channelOptions}
        templateOptions={templateOptions}
        onCancel={() => setSendOpen(false)}
        onSent={() => void reload()}
      />
    </>
  );
};
