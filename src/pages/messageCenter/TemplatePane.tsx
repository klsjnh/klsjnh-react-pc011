/**
 * 模板 pane（出站/入站共用）：关键词 / 通道筛选 + 表格 + 新增/编辑/删除/批量删。
 * direction 决定 store 段、service 调用与表格列细节。
 */
import React, { useEffect, useRef, useState } from 'react';
import { Button, Card, Input, Popconfirm, Space, Table, Tag } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { DeleteOutlined, EditOutlined, PlusOutlined, ReloadOutlined } from '@ant-design/icons';
import { useTableFillHeight } from '@/hooks/useTableFillHeight';
import { toast } from '@/utils/toast';
import { outboundStore, useOutboundState } from '@/stores/messageCenter/outboundStore';
import { inboundStore, useInboundState } from '@/stores/messageCenter/inboundStore';
import {
  removeOutboundTemplate, removeOutboundTemplateBatch, saveOutboundTemplate, selectOutboundTemplateListByPage,
} from '@/services/messageCenter/julyOutboundTemplateService';
import {
  removeInboundTemplate, removeInboundTemplateBatch, saveInboundTemplate, selectInboundTemplateListByPage,
} from '@/services/messageCenter/julyInboundTemplateService';
import { selectOutboundChannelListByPage } from '@/services/messageCenter/julyOutboundChannelService';
import { selectInboundChannelListByPage } from '@/services/messageCenter/julyInboundChannelService';
import { TemplateFormModal, type TemplateFormValue } from '@/pages/messageCenter/TemplateFormModal';
import type { Direction } from '@/pages/messageCenter/paneTypes';
import type { JulyOutboundTemplateVo011, JulyInboundTemplateVo011 } from '@/types/messageCenter';

interface TemplatePaneProps {
  direction: Direction;
}

export const TemplatePane = ({ direction }: TemplatePaneProps) => {
  const isOut = direction === 'outbound';
  const out = useOutboundState();
  const inb = useInboundState();
  const rows = (isOut ? out.templates : inb.templates) as (JulyOutboundTemplateVo011 | JulyInboundTemplateVo011)[];
  const total = isOut ? out.templateTotal : inb.templateTotal;
  const query = isOut ? out.templateQuery : inb.templateQuery;

  const [keyword, setKeyword] = useState('');
  const [channelCode, setChannelCode] = useState<string | undefined>();
  const [channelOptions, setChannelOptions] = useState<{ value: string; label: string }[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<TemplateFormValue | null>(null);
  const [selectedKeys, setSelectedKeys] = useState<React.Key[]>([]);
  const cardRef = useRef<HTMLDivElement>(null);
  const tableBodyHeight = useTableFillHeight(cardRef, `${total}-${rows.length}`);

  // 通道下拉（两个方向各自的通道列表；也供模板表单的所属通道选择）
  useEffect(() => {
    const load = isOut ? selectOutboundChannelListByPage : selectInboundChannelListByPage;
    void load({ pageIndex: 1, pageSize: 200 })
      .then((res) => setChannelOptions((res.rows || []).map((c) => ({ value: c.channelCode, label: c.channelName }))))
      .catch(() => setChannelOptions([]));
  }, [isOut]);

  const reload = async (pageIndex = query.pageIndex) => {
    const body = { pageIndex, pageSize: query.pageSize, keyword: keyword || undefined, channelCode };
    try {
      if (isOut) {
        const res = await selectOutboundTemplateListByPage(body);
        outboundStore.setTemplates({ rows: res.rows || [], total: res.total, totalPages: res.totalPages });
      } else {
        const res = await selectInboundTemplateListByPage(body);
        inboundStore.setTemplates({ rows: res.rows || [], total: res.total, totalPages: res.totalPages });
      }
      setSelectedKeys([]);
    } catch {
      toast.error('模板列表加载失败');
    }
  };

  // direction 切换重拉列表；reload 身份随 keyword/channelCode 变化，入 deps 会每渲染重复请求
  // eslint-disable-next-line react-hooks/set-state-in-effect, react-hooks/exhaustive-deps
  useEffect(() => { void reload(1); }, [direction]);

  const handleSubmit = async (value: TemplateFormValue) => {
    const payload = { ...value, sortOrder: Number(value.sortOrder) || 1 };
    if (isOut) {
      await saveOutboundTemplate(payload);
      outboundStore.patchTemplateQuery({ pageIndex: out.templateQuery.pageIndex });
    } else {
      await saveInboundTemplate(payload);
      inboundStore.patchTemplateQuery({ pageIndex: inb.templateQuery.pageIndex });
    }
    toast.success('保存成功');
    await reload();
  };

  const handleRemove = async (id: string) => {
    if (isOut) await removeOutboundTemplate(id); else await removeInboundTemplate(id);
    toast.success('删除成功');
    await reload();
  };

  const handleBatchRemove = async () => {
    const ids = selectedKeys.map(String);
    if (!ids.length) return;
    if (isOut) await removeOutboundTemplateBatch(ids); else await removeInboundTemplateBatch(ids);
    toast.success(`已删除 ${ids.length} 条`);
    await reload();
  };

  const columns: ColumnsType<JulyOutboundTemplateVo011 | JulyInboundTemplateVo011> = [
    { title: '模板编码', dataIndex: 'templateCode', width: 160 },
    { title: '模板名称', dataIndex: 'templateName', width: 160 },
    { title: '所属通道', dataIndex: 'channelCode', width: 140 },
    { title: '标题', dataIndex: 'title', ellipsis: true },
    {
      title: '状态', dataIndex: 'status', width: 80,
      render: (v: string) => <Tag color={v === '1' ? 'green' : 'default'}>{v === '1' ? '启用' : '停用'}</Tag>,
    },
    { title: '备注', dataIndex: 'remark', width: 160, ellipsis: true },
    {
      title: '操作', key: 'ops', width: 120, fixed: 'right',
      render: (_, row) => (
        <Space size={4}>
          <Button type="link" size="small" icon={<EditOutlined />} onClick={() => {
            setEditing({
              id: row.id, templateCode: row.templateCode, templateName: row.templateName,
              channelCode: row.channelCode, title: row.title, content: row.content || '',
              sortOrder: row.sortOrder, remark: row.remark,
            });
            setModalOpen(true);
          }} />
          <Popconfirm title="确认删除该模板？" onConfirm={() => void handleRemove(row.id)}>
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
        <Input
          allowClear
          placeholder="通道编码"
          style={{ width: 160 }}
          value={channelCode ?? ''}
          onChange={(e) => setChannelCode(e.target.value || undefined)}
          onPressEnter={() => void reload(1)}
          onBlur={() => void reload(1)}
        />
        <Button type="primary" icon={<PlusOutlined />} onClick={() => { setEditing(null); setModalOpen(true); }}>
          新增模板
        </Button>
        <Popconfirm title={`确认删除选中的 ${selectedKeys.length} 条模板？`} onConfirm={() => void handleBatchRemove()}>
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
              if (isOut) outboundStore.patchTemplateQuery({ pageIndex: p, pageSize: s });
              else inboundStore.patchTemplateQuery({ pageIndex: p, pageSize: s });
              void reload(p);
            },
          }}
          rowSelection={{ selectedRowKeys: selectedKeys, onChange: setSelectedKeys }}
          scroll={{ y: tableBodyHeight, x: 960 }}
        />
      </Card>

      <TemplateFormModal
        open={modalOpen}
        direction={direction}
        editing={editing}
        channelOptions={channelOptions}
        onCancel={() => setModalOpen(false)}
        onSubmit={handleSubmit}
      />
    </>
  );
};
