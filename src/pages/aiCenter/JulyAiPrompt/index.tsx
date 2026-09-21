/**
 * AI 提示词管理页面（aiCenter · julyAiPrompt）- 业务域主子表
 *
 * 2026-09-20 用户定稿「先做业务域、再做提示词，主子表」：
 *   主表 = 业务域（由各提示词的明细聚合派生——后端无独立业务域实体，
 *          domainCode 仅是明细字段；待后端加域实体后可换真源）
 *    子表 = 选中业务域下的提示词（该域有明细的提示词）
 *
 * 交互：域行点击选中（选中态入 URL ?domain=，刷新不丢）；
 *   子表行操作：编辑内容（跳明细整页编辑器，编辑该域下的提示词正文）/
 *   设置（提示词主表字段弹窗）/ 删除（删提示词，级联其全部域明细）；
 *   子表行点击选中提示词 → 工具栏「渲染预览」对该提示词 + 当前域做 ${var} 渲染。
 *
 * ⚠️ 数据加载：域聚合需要全量提示词的明细（N+1 请求，管理端规模可接受）；
 *   明细列表依赖后端 selectDetailListByPrompt（待上线，mock 已实现）。
 */
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  FileTextOutlined, PlayCircleOutlined, PlusOutlined, ReloadOutlined,
} from '@ant-design/icons';
import { Button, Card, Popconfirm, Space, Table, Tabs, Tag } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { useJulyAiPromptState } from '@/stores/aiCenter/julyAiPromptStore';
import {
  fetchAllPrompts, removePrompt,
  selectDetailListByPrompt,
} from '@/services/aiCenter';
import { toast } from '@/utils/toast';
import { PromptFormModal } from '@/pages/aiCenter/JulyAiPrompt/PromptFormModal';
import { RenderPreviewModal } from '@/pages/aiCenter/JulyAiPrompt/RenderPreviewModal';
import type { JulyAiPromptItem, JulyAiPromptDetailItem } from '@/types/aiCenter';
import { AI_SCENE_OPTIONS, STATUS_LABEL } from '@/config/constants';
import { AICENTER_ROUTES } from '@/config/routes';
import { useTableFillHeight } from '@/hooks/useTableFillHeight';

const hdrCenter = (): React.HTMLAttributes<HTMLElement> => ({ style: { textAlign: 'center' } });
const leftCell = { align: 'left' as const, onHeaderCell: hdrCenter };

/** scene 编码 → 文案 */
const SCENE_LABEL: Record<string, string> = Object.fromEntries(AI_SCENE_OPTIONS.map((o) => [o.value, o.label]));

/** 业务域聚合行（派生实体） */
interface DomainRow {
  domainCode: string;
  /** 该域下有内容的提示词数 */
  promptCount: number;
}

export const JulyAiPrompt = () => {
  const { list, total, loading } = useJulyAiPromptState();

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
  const [renderOpen, setRenderOpen] = useState(false);

  const masterCardRef = useRef<HTMLDivElement>(null);
  const masterBodyHeight = useTableFillHeight(masterCardRef, `${list.length}-${loading}-${detailsLoading}`);

  // 挂载：拉全部提示词（域聚合必须全量；不碰分页偏好）
  useEffect(() => { fetchAllPrompts(); }, []);

  /**
   * 提示词列表变化 → 并发拉每个提示词的明细，聚合出业务域。
   * N+1 是域主表的固有代价（域只能从明细反推）；alive 守卫丢弃过期响应。
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

  /** 业务域聚合（domainCode 去重 + 提示词计数） */
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
    return [...countByDomain.entries()]
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([domainCode, promptCount]) => ({ domainCode, promptCount }));
  }, [detailsMap]);

  /** 选中业务域后的提示词全集（含未配置该域内容的——行内「编辑内容」走新建预填闭环） */
  const domainPrompts = useMemo(() => (selectedDomain ? list : []), [list, selectedDomain]);

  const selectedPrompt = useMemo(
    () => list.find((p) => p.id === selectedPromptId) ?? null,
    [list, selectedPromptId],
  );

  /** 明细编辑器路径：该提示词在该域下的明细；无明细则走 new 并带 domain 预填 */
  const detailEditorPath = (promptId: string, domain: string): string => {
    const detail = (detailsMap[promptId] || []).find((d) => d.domainCode === domain);
    const base = `${AICENTER_ROUTES.julyAiPromptDetail}/${detail?.id ?? 'new'}?promptId=${promptId}`;
    return detail?.id ? base : `${base}&domain=${encodeURIComponent(domain)}`;
  };

  /* ---------- 主表操作 ---------- */
  const handleRemovePrompt = async (row: JulyAiPromptItem) => {
    try {
      await removePrompt(row.id);
      toast.success('删除成功');
      if (selectedPromptId === row.id) setSelectedPromptId(null);
    } catch (e) { toast.error((e as Error)?.message || '删除失败，请重试'); }
  };

  const domainColumns: ColumnsType<DomainRow> = [
    { ...leftCell, title: '业务域编码', dataIndex: 'domainCode', render: (v) => <code>{v}</code> },
    { title: '提示词数', dataIndex: 'promptCount', width: 120, align: 'center', onHeaderCell: hdrCenter },
  ];

  /* ---------- 子表操作（选中域下的提示词） ---------- */
  const promptColumns: ColumnsType<JulyAiPromptItem> = [
    { ...leftCell, title: '提示词编码', dataIndex: 'promptCode', width: 200, render: (v) => <code>{v}</code> },
    { ...leftCell, title: '提示词名称', dataIndex: 'promptName', width: 160 },
    {
      title: '场景', dataIndex: 'scene', width: 110, align: 'center', onHeaderCell: hdrCenter,
      render: (s) => s ? <Tag color="blue">{SCENE_LABEL[s] || s}</Tag> : <Tag>未指定</Tag>,
    },
    {
      title: '状态', dataIndex: 'status', width: 90, align: 'center', onHeaderCell: hdrCenter,
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
      title: '操作', key: 'action', width: 220, fixed: 'right', align: 'center', onHeaderCell: hdrCenter,
      render: (_, r) => (
        <Space size="small">
          <Button type="link" size="small" onClick={() => navigate(detailEditorPath(r.id, selectedDomain || ''))}>编辑内容</Button>
          <Button type="link" size="small" onClick={() => setPromptModal({ open: true, node: r })}>设置</Button>
          <Popconfirm title={`确定删除提示词「${r.promptName}」吗？（其全部业务域内容将一并删除）`} okText="删除" cancelText="取消" okButtonProps={{ danger: true }} onConfirm={() => handleRemovePrompt(r)}>
            <Button type="link" size="small" danger>删除</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div className="page-header">
        <h2>AI 提示词</h2>
      </div>

      <div className="page-toolbar">
        <div className="toolbar-left">
          <span className="prompt-domain-hint">
            先选业务域，再维护该域下的提示词
            {total > list.length ? `（提示词共 ${total} 条，聚合展示前 ${list.length} 条）` : ''}
          </span>
        </div>
        <div className="toolbar-right">
          <Button
            color="primary" variant="filled" icon={<PlusOutlined />}
            onClick={() => setPromptModal({ open: true, node: null, defaultDomain: selectedDomain || undefined })}
          >新建提示词</Button>
          <Button
            color="default" variant="filled" icon={<PlayCircleOutlined />}
            disabled={!selectedPrompt}
            onClick={() => setRenderOpen(true)}
          >渲染预览</Button>
          <Button color="default" variant="filled" icon={<ReloadOutlined />} loading={loading || detailsLoading} onClick={() => fetchAllPrompts()}>刷新</Button>
        </div>
      </div>

      {/* 主表：业务域（聚合派生；行点击选中，联动下方提示词） */}
      <Card className="table-wrapper" ref={masterCardRef} title="业务域" loading={detailsLoading} styles={{ body: { padding: 0 } }}>
        <Table<DomainRow>
          rowKey="domainCode"
          columns={domainColumns}
          dataSource={domains}
          scroll={{ x: 400, y: masterBodyHeight }}
          onRow={(row) => ({ style: { cursor: 'pointer' }, onClick: () => setSearchParams({ domain: row.domainCode }, { replace: true }) })}
          rowClassName={(row) => (row.domainCode === selectedDomain ? 'master-row-selected' : '')}
          pagination={false}
        />
      </Card>

      {/* 子表：选中业务域下的提示词（该域有内容的） */}
      <div style={{ marginTop: 16 }}>
        <Card className="table-wrapper" styles={{ body: { padding: 0 } }}>
          <Tabs
            className="detail-tabs"
            items={[
              {
                key: 'prompts',
                label: selectedDomain ? `提示词 · ${selectedDomain}` : '提示词',
                children: !selectedDomain ? (
                  <div className="detail-empty">
                    <FileTextOutlined style={{ marginRight: 8 }} />
                    请在上方选中一个业务域
                  </div>
                ) : domainPrompts.length > 0 ? (
                  <Table<JulyAiPromptItem>
                    rowKey="id"
                    columns={promptColumns}
                    dataSource={domainPrompts}
                    scroll={{ x: 1000 }}
                    pagination={false}
                    onRow={(row) => ({
                      style: { cursor: 'pointer' },
                      onClick: () => setSelectedPromptId(row.id === selectedPromptId ? null : row.id),
                    })}
                    rowClassName={(row) => (row.id === selectedPrompt?.id ? 'master-row-selected' : '')}
                  />
                ) : (
                  <div className="detail-empty">
                    <FileTextOutlined style={{ marginRight: 8 }} />
                    暂无提示词，点右上角「新建提示词」开始
                  </div>
                ),
              },
            ]}
          />
        </Card>
      </div>

      <PromptFormModal
        open={promptModal.open}
        node={promptModal.node}
        defaultDomain={promptModal.defaultDomain}
        onClose={() => setPromptModal({ open: false, node: null })}
        onSaved={() => { }}
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
