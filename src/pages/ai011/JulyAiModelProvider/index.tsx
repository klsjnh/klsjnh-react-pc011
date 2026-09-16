/**
 * AI 模型供应商管理页面（ai011 · julyAiModelProvider）- 对齐后端 AiModelProviderController
 * 字段：providerCode/providerName/baseUrl/models/sortOrder/status/remark
 * 行内「测试」+ 弹窗底部「测试连接」双测试；表头居中、内容左对齐。
 * 子表（API 密钥）管理见 ProviderFormModal。
 */
import React, { useEffect, useState } from 'react';
import { ApiOutlined } from '@ant-design/icons';
import { Button, Card, Input, Popconfirm, Space, Table, Tag } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { useAiModelProviderState } from '@/stores/ai011/julyAiModelProviderStore';
import { fetchProviderPage, removeProvider, testProviderConnection } from '@/services/ai011';
import { toast } from '@/utils/toast';
import { TestFeedbackAlert, type TestFeedback } from '@/components/system011/TestFeedbackAlert';
import { ProviderFormModal } from '@/pages/ai011/JulyAiModelProvider/ProviderFormModal';
import type { AiModelProviderItem, AiModelProviderTestResultVo011 } from '@/types/ai011/aiModelProvider/vo';
import { STATUS_LABEL } from '@/config/constants';

const hdrCenter = (): React.HTMLAttributes<HTMLElement> => ({ style: { textAlign: 'center' } });
const leftCell = { align: 'left' as const, onHeaderCell: hdrCenter };

function buildFeedback(res: AiModelProviderTestResultVo011, startedAt?: number): TestFeedback {
  const elapsedMs = startedAt != null ? Date.now() - startedAt : undefined;
  return { ok: res.success, message: res.message || (res.success ? '连接成功' : '连接失败'), elapsedMs };
}
function failureFeedback(e: unknown, startedAt?: number): TestFeedback {
  const elapsedMs = startedAt != null ? Date.now() - startedAt : undefined;
  return { ok: false, message: (e as Error)?.message || '连接测试请求失败', elapsedMs };
}

export const JulyAiModelProvider = () => {
  const { list, total, loading, query } = useAiModelProviderState();
  const [modal, setModal] = useState<{ open: boolean; node: AiModelProviderItem | null }>({ open: false, node: null });
  const [rowTestingId, setRowTestingId] = useState<string | null>(null);
  const [pageTest, setPageTest] = useState<TestFeedback | null>(null);

  useEffect(() => { fetchProviderPage({ pageIndex: 1, pageSize: 10 }); }, []);

  const handleRowTest = async (row: AiModelProviderItem) => {
    setRowTestingId(row.id);
    setPageTest(null);
    const startedAt = Date.now();
    try {
      const res = await testProviderConnection({ providerCode: row.providerCode });
      setPageTest(buildFeedback(res, startedAt));
    } catch (e) { setPageTest(failureFeedback(e, startedAt)); }
    finally { setRowTestingId(null); }
  };

  const handleRemove = async (id: string) => {
    try { await removeProvider(id); toast.success(`delete ${id} success ...`); }
    catch (e) { toast.error((e as Error)?.message || '删除失败，请重试'); }
  };

  const columns: ColumnsType<AiModelProviderItem> = [
    { ...leftCell, title: '供应商编码', dataIndex: 'providerCode', width: 140, render: (v) => <code>{v}</code> },
    { ...leftCell, title: '供应商名称', dataIndex: 'providerName', width: 150 },
    { ...leftCell, title: '基础地址', dataIndex: 'baseUrl', width: 260, ellipsis: true, render: (v) => <code>{v}</code> },
    { ...leftCell, title: '模型数', dataIndex: 'models', width: 90, render: (v) => <Tag color="geekblue">{v ? String(v).split(',').filter(Boolean).length : 0}</Tag> },
    { ...leftCell, title: '状态', dataIndex: 'status', width: 90, render: (s) => <Tag color={s === '1' ? 'green' : 'red'}>{STATUS_LABEL[s] || s}</Tag> },
    { ...leftCell, title: '备注', dataIndex: 'remark', width: 160, ellipsis: true },
    {
      title: '操作', key: 'action', width: 200, align: 'left',
      render: (_, r) => (
        <Space size="small" wrap>
          <Button type="link" size="small" icon={<ApiOutlined />} loading={rowTestingId === r.id} onClick={() => handleRowTest(r)}>测试</Button>
          <Button type="link" size="small" onClick={() => setModal({ open: true, node: r })}>编辑</Button>
          <Popconfirm title="确定删除该供应商吗？" okText="删除" cancelText="取消" okButtonProps={{ danger: true }} onConfirm={() => handleRemove(r.id)}>
            <Button type="link" size="small" danger>删除</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div className="page-header">
        <h2>AI 模型供应商</h2>
        <p>共 {total} 个供应商 · 接口 /julyAiModelProvider/v1/selectListByPage</p>
      </div>

      <div className="page-toolbar">
        <div className="toolbar-left">
          <Input.Search
            allowClear
            placeholder="搜索编码 / 名称 / 基础地址"
            className="search-input"
            onSearch={(v) => fetchProviderPage({ pageIndex: 1, keyword: v || undefined })}
          />
        </div>
        <div className="toolbar-right">
          <Button type="primary" onClick={() => setModal({ open: true, node: null })}>+ 新建供应商</Button>
        </div>
      </div>

      {pageTest && <TestFeedbackAlert data={pageTest} />}

      <Card className="table-wrapper" styles={{ body: { padding: 0 } }}>
        <Table<AiModelProviderItem>
          rowKey="id"
          columns={columns}
          dataSource={list}
          loading={loading}
          scroll={{ x: 1080 }}
          pagination={{
            current: query.pageIndex,
            pageSize: query.pageSize,
            total,
            showSizeChanger: true,
            pageSizeOptions: [10, 50, 100],
            showTotal: (t) => `共 ${t} 条`,
            onChange: (pageIndex, pageSize) => fetchProviderPage({ pageIndex, pageSize }),
          }}
        />
      </Card>

      <ProviderFormModal
        open={modal.open}
        node={modal.node}
        onClose={() => setModal({ open: false, node: null })}
        onSaved={() => {}}
      />
    </div>
  );
};

export default JulyAiModelProvider;
