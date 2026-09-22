/**
 * AI 模型供应商管理页面（aiCenter · julyAiModelProvider）- 主子表布局
 * 主表：供应商（/julyAiModelProvider/v1/*，对齐后端 AiModelProviderController）
 * 子表：API 密钥（/julyAiModelProvider/v1/*Api，按 providerCode 挂接）
 *
 * 形态对齐存储中心主子表（storageCenter/julyStorage/BucketListPage.tsx）：
 *   上主表（行点击选中 → master-row-selected 高亮）+ 下子表（Tabs 标签带供应商编码，
 *   未选中时居中提示）；页面自然流（非 page-fill），表格随内容增高、整页滚动。
 * 2026-09-20 改造：原「主表单 + 子表塞同一个弹窗」形态废弃，供应商编辑 / API 增改
 * 各自独立弹窗（ProviderFormModal / ApiFormModal）。
 * 字段：providerCode/providerName/baseUrl/models/sortOrder/status/remark
 *      apiCode/apiName/apiKey/sortOrder/status/remark
 */
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ApiOutlined, KeyOutlined, PlusOutlined, ReloadOutlined } from '@ant-design/icons';
import { Button, Card, Popconfirm, Space, Table, Tabs, Tag } from 'antd';
import { KlsjnhPageToolbar011, KlsjnhSearchInput011, KlsjnhStatusTag011 } from '@/components/klsjnh011';
import type { ColumnsType } from 'antd/es/table';
import { useAiModelProviderState } from '@/stores/aiCenter/julyAiModelProviderStore';
import {
  fetchProviderPage, removeProvider,
  selectApiListByProvider, removeProviderApi, testProviderApiConnection,
} from '@/services/aiCenter';
import { toast } from '@/utils/toast';
import { TestFeedbackAlert, type TestFeedback } from '@/components/system011/TestFeedbackAlert';
import { ProviderFormModal } from '@/pages/aiCenter/JulyAiModelProvider/ProviderFormModal';
import { ApiFormModal } from '@/pages/aiCenter/JulyAiModelProvider/ApiFormModal';
import type { AiModelProviderItem, AiModelProviderApiItem, AiModelProviderTestResultVo011 } from '@/types/aiCenter/aiModelProvider/vo';
import { useTableFillHeight } from '@/hooks/useTableFillHeight';

// 2026-09-21 定稿：单元格与表头一律左对齐
const leftCell = {};

function buildFeedback(res: AiModelProviderTestResultVo011, startedAt?: number): TestFeedback {
  const elapsedMs = startedAt != null ? Date.now() - startedAt : undefined;
  return { ok: !!res.success, message: res.message || (res.success ? '连接成功' : '连接失败'), elapsedMs };
}
function failureFeedback(e: unknown, startedAt?: number): TestFeedback {
  const elapsedMs = startedAt != null ? Date.now() - startedAt : undefined;
  return { ok: false, message: (e as Error)?.message || '连接测试请求失败', elapsedMs };
}

export const JulyAiModelProvider = () => {
  const { list, total, loading, query } = useAiModelProviderState();

  /* ---------- 弹窗态 ---------- */
  const [providerModal, setProviderModal] = useState<{ open: boolean; node: AiModelProviderItem | null }>({ open: false, node: null });
  const [apiModal, setApiModal] = useState<{ open: boolean; node: AiModelProviderApiItem | null }>({ open: false, node: null });

  /* ---------- 主子表选中态（页面级，不持久化；按 id 从最新列表派生，删除/编辑后自动跟随） ---------- */
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selectedProvider = useMemo(() => list.find((r) => r.id === selectedId) ?? null, [list, selectedId]);
  const [apis, setApis] = useState<AiModelProviderApiItem[]>([]);
  const [apisLoading, setApisLoading] = useState(false);

  /* ---------- 测试反馈（仅 API 子表行内测试；主表无测试入口） ---------- */
  const [apiTestingId, setApiTestingId] = useState<string | null>(null);
  const [apiTest, setApiTest] = useState<TestFeedback | null>(null);

  const masterCardRef = useRef<HTMLDivElement>(null);
  const masterBodyHeight = useTableFillHeight(masterCardRef, `${total}-${loading}`);

  // 只重置 pageIndex：pageSize 是用户偏好（存在 store 里），传值会把它覆盖回默认值
  useEffect(() => { fetchProviderPage({ pageIndex: 1 }); }, []);

  /** 选中供应商变化 → 重拉其 API 子表（alive 守卫丢弃过期响应） */
  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect -- 选中即清空 / 加载置位属 intentional reset */
    if (!selectedProvider) { setApis([]); return; }
    let alive = true;
    setApisLoading(true);
    setApiTest(null);
    selectApiListByProvider({ providerCode: selectedProvider.providerCode })
      .then((rows) => { if (alive) setApis(rows || []); })
      .catch(() => { if (alive) setApis([]); })
      .finally(() => { if (alive) setApisLoading(false); });
    return () => { alive = false; };
  }, [selectedProvider]);

  const reloadApis = () => {
    if (!selectedProvider) return;
    setApisLoading(true);
    selectApiListByProvider({ providerCode: selectedProvider.providerCode })
      .then((rows) => setApis(rows || []))
      .catch(() => setApis([]))
      .finally(() => setApisLoading(false));
  };

  /* ---------- 主表操作 ---------- */
  const handleRemove = async (row: AiModelProviderItem) => {
    try {
      await removeProvider(row.id);
      toast.success('删除成功');
      // 删的是当前选中供应商 → 清选中（派生值随列表刷新自动清空，这里显式置空避免闪旧标题）
      if (selectedId === row.id) setSelectedId(null);
    } catch (e) { toast.error((e as Error)?.message || '删除失败，请重试'); }
  };

  const masterColumns: ColumnsType<AiModelProviderItem> = [
    { ...leftCell, title: '供应商编码', dataIndex: 'providerCode', width: 140, render: (v) => <code>{v}</code> },
    { ...leftCell, title: '供应商名称', dataIndex: 'providerName', width: 150 },
    { ...leftCell, title: '基础地址', dataIndex: 'baseUrl', width: 260, ellipsis: true, render: (v) => <code>{v}</code> },
    { ...leftCell, title: '模型数', dataIndex: 'models', width: 90, render: (v) => <Tag color="geekblue">{v ? String(v).split(',').filter(Boolean).length : 0}</Tag> },
    { title: '状态', dataIndex: 'status', width: 90, render: (s) => <KlsjnhStatusTag011 value={s} /> },
    { ...leftCell, title: '备注', dataIndex: 'remark', width: 160, ellipsis: true },
    {
      title: '操作', key: 'action', width: 140, fixed: 'right',
      render: (_, r) => (
        <Space size="small">
          <Button type="link" size="small" onClick={() => setProviderModal({ open: true, node: r })}>编辑</Button>
          <Popconfirm title="确定删除该供应商吗？（其 API 密钥子表将一并删除）" okText="删除" cancelText="取消" okButtonProps={{ danger: true }} onConfirm={() => handleRemove(r)}>
            <Button type="link" size="small" danger>删除</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  /* ---------- 子表操作 ---------- */
  const handleApiTest = async (row: AiModelProviderApiItem) => {
    setApiTestingId(row.id);
    setApiTest(null);
    const startedAt = Date.now();
    try { const res = await testProviderApiConnection(row.id); setApiTest(buildFeedback(res, startedAt)); }
    catch (e) { setApiTest(failureFeedback(e, startedAt)); }
    finally { setApiTestingId(null); }
  };

  const handleRemoveApi = async (row: AiModelProviderApiItem) => {
    try { await removeProviderApi(row.id); setApis((rows) => rows.filter((a) => a.id !== row.id)); toast.success('删除成功'); }
    catch (e) { toast.error((e as Error)?.message || '删除失败'); }
  };

  const apiColumns: ColumnsType<AiModelProviderApiItem> = [
    { ...leftCell, title: 'API 编码', dataIndex: 'apiCode', width: 140, render: (v) => <code>{v}</code> },
    { ...leftCell, title: '名称', dataIndex: 'apiName', width: 160 },
    { ...leftCell, title: 'API Key', dataIndex: 'apiKey', width: 300, ellipsis: true, render: (v) => <code title={v}>{v}</code> },
    { ...leftCell, title: '排序', dataIndex: 'sortOrder', width: 90 },
    { title: '状态', dataIndex: 'status', width: 90, render: (s) => <KlsjnhStatusTag011 value={s} /> },
    {
      title: '操作', key: 'action', width: 200, fixed: 'right',
      render: (_, r) => (
        <Space size="small">
          <Button type="link" size="small" icon={<ApiOutlined />} loading={apiTestingId === r.id} onClick={() => handleApiTest(r)}>测试连接</Button>
          <Button type="link" size="small" onClick={() => setApiModal({ open: true, node: r })}>编辑</Button>
          <Popconfirm title="确定删除该 API 密钥吗？" okText="删除" cancelText="取消" okButtonProps={{ danger: true }} onConfirm={() => handleRemoveApi(r)}>
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
      </div>

      {/* 工具栏（主子表口径）：单行靠左 —— 搜索 + 按钮紧排（toolbar-left 抵消 space-between） */}
      <KlsjnhPageToolbar011
        layout="inline"
        search={
          <KlsjnhSearchInput011
            placeholder="搜索编码 / 名称 / 基础地址"
            onSearch={(v) => fetchProviderPage({ pageIndex: 1, keyword: v || undefined })}
          />
        }
        actions={
          <>
          <Button color="green" variant="filled" icon={<PlusOutlined />} onClick={() => setProviderModal({ open: true, node: null })}>
            新建供应商
          </Button>
          <Button
            color="default" variant="filled" icon={<ReloadOutlined />}
            onClick={() => fetchProviderPage({ pageIndex: 1 })}
          >刷新</Button>
          </>}
      />

      {/* 主表：供应商（行点击选中，联动下方 API 子表） */}
      <Card className="table-wrapper" ref={masterCardRef} title="供应商" styles={{ body: { padding: 0 } }}>
        <Table<AiModelProviderItem>
          rowKey="id"
          columns={masterColumns}
          dataSource={list}
          loading={loading}
          scroll={{ x: 1080, y: masterBodyHeight }}
          onRow={(row) => ({ style: { cursor: 'pointer' }, onClick: () => setSelectedId(row.id) })}
          rowClassName={(row) => (row.id === selectedProvider?.id ? 'master-row-selected' : '')}
          pagination={{
            current: query.pageIndex,
            pageSize: 10,
            total,
            showSizeChanger: false,
            showTotal: (t) => `共 ${t} 条`,
            onChange: (pageIndex) => fetchProviderPage({ pageIndex, pageSize: 10 }),
          }}
        />
      </Card>

      {/* 子表：API 密钥（随主表选中供应商联动；未选中时居中提示，形态对齐存储中心的桶子表） */}
      <div style={{ marginTop: 16 }}>
        <Card className="table-wrapper" styles={{ body: { padding: 0 } }}>
          <Tabs
            className="detail-tabs"
            items={[
              {
                key: 'apis',
                label: selectedProvider ? `API 密钥（${selectedProvider.providerCode}）` : 'API 密钥',
                children: selectedProvider ? (
                  <>
                    {/* 工具栏内边距由 .detail-tabs .page-toolbar 统一给（16px，与页签条对齐），不另加 margin */}
                    <div className="page-toolbar">
                      <div className="toolbar-left">
                        <Button color="primary" variant="filled" icon={<PlusOutlined />} onClick={() => setApiModal({ open: true, node: null })}>新增 API</Button>
                        <Button color="default" variant="filled" icon={<ReloadOutlined />} loading={apisLoading} onClick={reloadApis}>刷新</Button>
                      </div>
                    </div>
                    {apiTest && <div style={{ padding: '0 16px' }}><TestFeedbackAlert data={apiTest} /></div>}
                    <Table<AiModelProviderApiItem>
                      rowKey="id"
                      size="small"
                      columns={apiColumns}
                      dataSource={apis}
                      loading={apisLoading}
                      scroll={{ x: 900 }}
                      pagination={false}
                    />
                  </>
                ) : (
                  <div className="detail-empty">
                    <KeyOutlined style={{ marginRight: 8 }} />
                    请在上方选中一个供应商
                  </div>
                ),
              },
            ]}
          />
        </Card>
      </div>

      <ProviderFormModal
        open={providerModal.open}
        node={providerModal.node}
        onClose={() => setProviderModal({ open: false, node: null })}
        onSaved={() => { }}
      />

      <ApiFormModal
        open={apiModal.open}
        provider={selectedProvider}
        node={apiModal.node}
        onClose={() => setApiModal({ open: false, node: null })}
        onSaved={reloadApis}
      />
    </div>
  );
};

export default JulyAiModelProvider;
