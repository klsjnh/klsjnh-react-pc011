/**
 * AI 提示词管理页面（aiCenter · julyAiPrompt）- 左右分栏（仿权限管理）
 *
 * 2026-09-20 用户定稿「模仿角色页：左边业务域、右边提示词」：
 *   左侧 = 业务域（实体源：julyAiDomain，左上角 CRUD——新建 / 编辑 / 删除；
 *          后端域实体未上线，service/mock 前端先行，删域与改名级联同步明细 domainCode）
 *    右侧 = 选中业务域下的提示词（该域内容编辑 / 提示词设置 / 删除 / 渲染预览）
 *
 * 交互：域点击选中（选中态入 URL ?domain=，刷新不丢）；
 *   提示词行点击选中（供右侧「渲染预览」对该提示词 + 当前域做 ${var} 渲染）；
 *   行内「编辑内容」：已配置→明细编辑器；未配置→新建并预填当前域（闭环）。
 *
 * ⚠️ 数据加载：提示词全量（域计数 / 子表 / 级联引用都要）+ 每个提示词的明细（N+1，
 *   管理端规模可接受）；明细列表依赖后端 selectDetailListByPrompt（待上线，mock 已实现）。
 */
import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ApartmentOutlined, PlayCircleOutlined, PlusOutlined } from '@ant-design/icons';
import { Button, Card, Empty, List, Popconfirm, Space, Table, Tag } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { useJulyAiPromptState } from '@/stores/aiCenter/julyAiPromptStore';
import { useJulyAiDomainState } from '@/stores/aiCenter/julyAiDomainStore';
import {
  fetchAllPrompts, removePrompt, removePromptDetail,
  selectDetailListByPrompt,
  fetchDomainPage, saveDomain, renameDomain, removeDomain,
} from '@/services/aiCenter';
import { toast } from '@/utils/toast';
import { PromptFormModal } from '@/pages/aiCenter/JulyAiPrompt/PromptFormModal';
import { DomainFormModal } from '@/pages/aiCenter/JulyAiPrompt/DomainFormModal';
import { RenderPreviewModal } from '@/pages/aiCenter/JulyAiPrompt/RenderPreviewModal';
import type { JulyAiPromptItem, JulyAiPromptDetailItem, JulyAiDomainItem, SaveJulyAiDomainParams } from '@/types/aiCenter';
import { AI_SCENE_OPTIONS, STATUS_LABEL } from '@/config/constants';
import { AICENTER_ROUTES } from '@/config/routes';

const hdrCenter = (): React.HTMLAttributes<HTMLElement> => ({ style: { textAlign: 'center' } });
const leftCell = { align: 'left' as const, onHeaderCell: hdrCenter };

/** scene 编码 → 文案 */
const SCENE_LABEL: Record<string, string> = Object.fromEntries(AI_SCENE_OPTIONS.map((o) => [o.value, o.label]));

/** 左侧域行（实体 + 聚合计数） */
interface DomainRow {
  id: string;
  domainCode: string;
  domainName: string;
  status: string;
  sortOrder?: number;
  /** 该域下有内容的提示词数（明细聚合） */
  promptCount: number;
}

export const JulyAiPrompt = () => {
  const { list } = useJulyAiPromptState();
  const { list: domainList, loading: domainLoading } = useJulyAiDomainState();

  /* ---------- 选中态：域入 URL（刷新不丢）；提示词选中为页面级（供渲染预览） ---------- */
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const selectedDomain = searchParams.get('domain');
  const [selectedPromptId, setSelectedPromptId] = useState<string | null>(null);

  /* ---------- 明细聚合：promptId → 该提示词的全部业务域明细 ---------- */
  const [detailsMap, setDetailsMap] = useState<Record<string, JulyAiPromptDetailItem[]>>({});
  const [detailsLoading, setDetailsLoading] = useState(false);

  /* ---------- 弹窗态 ---------- */
  const [promptModal, setPromptModal] = useState<{ open: boolean; node: JulyAiPromptItem | null; defaultDomain?: string }>({ open: false, node: null });
  const [domainModal, setDomainModal] = useState<{ open: boolean; node: JulyAiDomainItem | null }>({ open: false, node: null });
  const [renderOpen, setRenderOpen] = useState(false);

  // 挂载：拉全部提示词（子表 + 域计数 + 级联引用都要全量）+ 业务域实体列表
  useEffect(() => {
    fetchAllPrompts();
    fetchDomainPage({ pageIndex: 1, pageSize: 200 });
  }, []);

  /**
   * 提示词列表变化 → 并发拉每个提示词的明细（域计数 / 该域内容标记 / 级联引用都靠它）。
   * N+1 是固有代价（明细只能按提示词查）；alive 守卫丢弃过期响应。
   */
  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect -- 加载置位属 intentional reset */
    if (!list.length) { setDetailsMap({}); return; }
    let alive = true;
    setDetailsLoading(true);
    Promise.all(
      list.map((p) =>
        selectDetailListByPrompt(p.id)
          .then((rows) => ({ id: p.id, rows: rows || [], ok: true }))
          .catch(() => ({ id: p.id, rows: [] as JulyAiPromptDetailItem[], ok: false })),
      ),
    ).then((results) => {
      if (!alive) return;
      setDetailsMap(Object.fromEntries(results.map((r) => [r.id, r.rows])));
      // 全部失败才提示（明细列表端点未上线时避免 N 条 toast 刷屏）
      if (results.length > 0 && results.every((r) => !r.ok)) {
        toast.warning('业务域明细加载失败（后端 selectDetailListByPrompt 待上线）');
      }
    }).finally(() => { if (alive) setDetailsLoading(false); });
    return () => { alive = false; };
  }, [list]);

  /** 左侧域行：实体列表 + 明细聚合的提示词计数 */
  const domains = useMemo<DomainRow[]>(() => {
    const countByDomain = new Map<string, number>();
    for (const rows of Object.values(detailsMap)) {
      const seen = new Set<string>();
      for (const d of rows) {
        if (seen.has(d.domainCode)) continue;
        seen.add(d.domainCode);
        countByDomain.set(d.domainCode, (countByDomain.get(d.domainCode) || 0) + 1);
      }
    }
    return domainList.map((d) => ({
      id: d.id,
      domainCode: d.domainCode,
      domainName: d.domainName,
      status: d.status,
      sortOrder: d.sortOrder,
      promptCount: countByDomain.get(d.domainCode) || 0,
    }));
  }, [domainList, detailsMap]);

  /** 选中业务域后的提示词全集（含未配置该域内容的——行内「编辑内容」走新建预填闭环） */
  const domainPrompts = useMemo(() => (selectedDomain ? list : []), [list, selectedDomain]);

  const selectedPrompt = useMemo(
    () => list.find((p) => p.id === selectedPromptId) ?? null,
    [list, selectedPromptId],
  );

  const selectedDomainItem = useMemo(
    () => domainList.find((d) => d.domainCode === selectedDomain) ?? null,
    [domainList, selectedDomain],
  );

  /** 某业务域下的全部明细引用（删域 / 改名级联用） */
  const domainDetailRefs = (code: string) => {
    const refs: { detailId: string; promptId: string }[] = [];
    for (const [promptId, rows] of Object.entries(detailsMap)) {
      for (const d of rows) {
        if (d.domainCode === code && d.id) refs.push({ detailId: d.id, promptId });
      }
    }
    return refs;
  };

  /** 明细编辑器路径：该提示词在该域下的明细；无明细则走 new。domain 始终带上（回跳保留选中态） */
  const detailEditorPath = (promptId: string, domain: string): string => {
    const detail = (detailsMap[promptId] || []).find((d) => d.domainCode === domain);
    return `${AICENTER_ROUTES.julyAiPromptDetail}/${detail?.id ?? 'new'}?promptId=${promptId}&domain=${encodeURIComponent(domain)}`;
  };

  /* ---------- 业务域 CRUD ---------- */
  const handleSaveDomain = async (params: SaveJulyAiDomainParams) => {
    // 先存旧码：renameDomain 会刷新域列表，之后 selectedDomainItem 已是新值
    const oldCode = selectedDomainItem?.domainCode;
    try {
      if (params.id && oldCode && oldCode !== params.domainCode) {
        await renameDomain(params.id, oldCode, params.domainCode, domainDetailRefs(oldCode));
        // 改名的正是当前选中域 → URL 同步新码（保持选中）+ 重拉提示词明细（计数/标记刷新）
        if (selectedDomain === oldCode) {
          setSearchParams({ domain: params.domainCode }, { replace: true });
        }
        await fetchAllPrompts();
      } else {
        await saveDomain(params);
      }
      toast.success('保存成功');
    } catch (e) {
      toast.error((e as Error)?.message || '保存失败');
      throw e; // 让弹窗保持打开（不关）
    }
  };

  const handleRemoveDomain = async (domain: DomainRow) => {
    try {
      await removeDomain(domain.id, domainDetailRefs(domain.domainCode));
      toast.success('删除成功');
      if (selectedDomain === domain.domainCode) setSearchParams({}, { replace: true });
    } catch (e) { toast.error((e as Error)?.message || '删除失败，请重试'); }
  };

  /* ---------- 提示词操作 ---------- */
  const handleRemovePrompt = async (row: JulyAiPromptItem) => {
    try {
      await removePrompt(row.id);
      toast.success('删除成功');
      if (selectedPromptId === row.id) setSelectedPromptId(null);
    } catch (e) { toast.error((e as Error)?.message || '删除失败，请重试'); }
  };

  /** 删除该提示词在当前业务域下的内容（主表不受影响；删后重拉驱动聚合刷新） */
  const handleRemoveDetail = async (row: JulyAiPromptItem) => {
    const detail = (detailsMap[row.id] || []).find((d) => d.domainCode === selectedDomain);
    if (!detail?.id) return;
    try {
      await removePromptDetail(detail.id);
      toast.success('删除成功');
      fetchAllPrompts();
    } catch (e) { toast.error((e as Error)?.message || '删除失败'); }
  };

  const promptColumns: ColumnsType<JulyAiPromptItem> = [
    { ...leftCell, title: '提示词编码', dataIndex: 'promptCode', width: 200, render: (v) => <code>{v}</code> },
    { ...leftCell, title: '提示词名称', dataIndex: 'promptName', width: 150 },
    {
      title: '场景', dataIndex: 'scene', width: 100, align: 'center', onHeaderCell: hdrCenter,
      render: (s) => s ? <Tag color="blue">{SCENE_LABEL[s] || s}</Tag> : <Tag>未指定</Tag>,
    },
    {
      title: '状态', dataIndex: 'status', width: 80, align: 'center', onHeaderCell: hdrCenter,
      render: (s) => <Tag color={s === '1' ? 'green' : 'red'}>{STATUS_LABEL[s] || s}</Tag>,
    },
    {
      title: '该域内容', key: 'domainContent', width: 100, align: 'center', onHeaderCell: hdrCenter,
      render: (_, r) => {
        const has = (detailsMap[r.id] || []).some((d) => d.domainCode === selectedDomain);
        return has ? <Tag color="green">已配置</Tag> : <Tag color="orange">未配置</Tag>;
      },
    },
    {
      title: '操作', key: 'action', width: 280, fixed: 'right', align: 'center', onHeaderCell: hdrCenter,
      render: (_, r) => {
        const hasDetail = (detailsMap[r.id] || []).some((d) => d.domainCode === selectedDomain);
        return (
          <Space size="small">
            <Button type="link" size="small" onClick={() => navigate(detailEditorPath(r.id, selectedDomain || ''))}>编辑内容</Button>
            <Button type="link" size="small" onClick={() => setPromptModal({ open: true, node: r })}>设置</Button>
            {hasDetail && (
              <Popconfirm title={`确定删除「${r.promptName}」在 ${selectedDomain} 域下的内容吗？（提示词主表不受影响）`} okText="删除" cancelText="取消" okButtonProps={{ danger: true }} onConfirm={() => handleRemoveDetail(r)}>
                <Button type="link" size="small" danger>删除内容</Button>
              </Popconfirm>
            )}
            <Popconfirm title={`确定删除提示词「${r.promptName}」吗？（其全部业务域内容将一并删除）`} okText="删除" cancelText="取消" okButtonProps={{ danger: true }} onConfirm={() => handleRemovePrompt(r)}>
              <Button type="link" size="small" danger>删除提示词</Button>
            </Popconfirm>
          </Space>
        );
      },
    },
  ];

  return (
    <div>
      <div className="page-header">
        <h2>AI 提示词</h2>
      </div>

      <div className="permission-layout">
        {/* 左：业务域（实体源；左上角 CRUD——新建/编辑/删除作用于当前选中域） */}
        <Card
          className="permission-sider"
          loading={domainLoading || detailsLoading}
          styles={{ body: { padding: 8, minHeight: 640, maxHeight: 640, overflowY: 'auto' } }}
          title={(
            <Space size="small">
              <span>业务域</span>
              <Button size="small" color="primary" variant="filled" icon={<PlusOutlined />} onClick={() => setDomainModal({ open: true, node: null })}>新建域</Button>
              <Button size="small" type="link" disabled={!selectedDomainItem} onClick={() => selectedDomainItem && setDomainModal({ open: true, node: selectedDomainItem })}>编辑</Button>
            </Space>
          )}
        >
          {domains.length === 0 && !domainLoading ? (
            <Empty description="暂无业务域" />
          ) : (
            <List
              dataSource={domains}
              renderItem={(d) => {
                const item = domainList.find((x) => x.domainCode === d.domainCode) ?? null;
                return (
                  <List.Item
                    className={`domain-item ${d.domainCode === selectedDomain ? 'active' : ''}`}
                    onClick={() => setSearchParams({ domain: d.domainCode }, { replace: true })}
                    actions={[
                      <Button
                        key="edit"
                        size="small"
                        type="link"
                        onClick={(e) => { e.stopPropagation(); if (item) setDomainModal({ open: true, node: item }); }}
                      >编辑</Button>,
                      <Popconfirm
                        key="delete"
                        title={`确定删除业务域「${d.domainName}」吗？`}
                        description="该域下所有提示词的内容将一并删除（提示词主表保留）"
                        okText="删除" cancelText="取消" okButtonProps={{ danger: true }}
                        onConfirm={(e) => { e?.stopPropagation(); handleRemoveDomain(d); }}
                      >
                        <Button size="small" type="link" danger onClick={(e) => e.stopPropagation()}>删除</Button>
                      </Popconfirm>,
                    ]}
                  >
                    <List.Item.Meta
                      avatar={<ApartmentOutlined className="domain-icon" />}
                      title={(
                        <Space size="small">
                          <code>{d.domainCode}</code>
                          <Tag color={d.status === '1' ? 'green' : 'red'}>{STATUS_LABEL[d.status] || d.status}</Tag>
                        </Space>
                      )}
                      description={`${d.domainName} · ${d.promptCount} 个提示词`}
                    />
                  </List.Item>
                );
              }}
            />
          )}
        </Card>

        {/* 右：选中业务域下的提示词 */}
        <div className="permission-main">
          {!selectedDomain ? (
            <Card className="permission-empty"><Empty description="请从左侧选择一个业务域" /></Card>
          ) : (
            <Card
              title={`提示词 · ${selectedDomain}`}
              styles={{ body: { padding: 8, minHeight: 640, maxHeight: 640, overflowY: 'auto' } }}
              extra={
                <Space size="small">
                  <Button
                    size="small"
                    icon={<PlusOutlined />}
                    onClick={() => setPromptModal({ open: true, node: null, defaultDomain: selectedDomain })}
                  >新建提示词</Button>
                  <Button
                    size="small"
                    icon={<PlayCircleOutlined />}
                    disabled={!selectedPrompt}
                    onClick={() => setRenderOpen(true)}
                  >渲染预览</Button>
                </Space>
              }
            >
              <Table<JulyAiPromptItem>
                rowKey="id"
                size="small"
                columns={promptColumns}
                dataSource={domainPrompts}
                scroll={{ x: 1080 }}
                pagination={false}
                onRow={(row) => ({
                  style: { cursor: 'pointer' },
                  onClick: () => setSelectedPromptId(row.id === selectedPromptId ? null : row.id),
                })}
                rowClassName={(row) => (row.id === selectedPrompt?.id ? 'master-row-selected' : '')}
              />
            </Card>
          )}
        </div>
      </div>

      <PromptFormModal
        open={promptModal.open}
        node={promptModal.node}
        defaultDomain={promptModal.defaultDomain}
        onClose={() => setPromptModal({ open: false, node: null })}
        onSaved={() => { }}
      />

      <DomainFormModal
        open={domainModal.open}
        node={domainModal.node}
        onClose={() => setDomainModal({ open: false, node: null })}
        onSave={handleSaveDomain}
      />

      <RenderPreviewModal
        open={renderOpen}
        prompt={selectedPrompt}
        details={selectedPrompt ? (detailsMap[selectedPrompt.id] || []) : []}
        defaultDomain={selectedDomain || undefined}
        onClose={() => setRenderOpen(false)}
      />
    </div>
  );
};

export default JulyAiPrompt;
