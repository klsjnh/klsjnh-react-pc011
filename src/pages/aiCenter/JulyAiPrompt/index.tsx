/**
 * AI 提示词管理页面（aiCenter · julyAiDomainPrompt）- 左右分栏
 *
 * 2026-09-21 新契约重构（bundle 模型：域树 + 提示词明细 pkMt 挂域）：
 *   左侧 = 业务域**树**（KlsjnhTreeList011，selectTree；节点动作：新建子域/编辑/删除）
 *   右侧 = 选中业务域下的提示词列表（selectDetailListByPage 按 pkMt 直查，一次拉取）
 *
 * 选中态：域 id 入 URL（?domain=，刷新不丢）；提示词选中为页面级（供渲染预览）。
 * 「编辑内容」跳整页编辑器（正文最长 2.1 万汉字，弹窗放不下，路由已注册）。
 */
import { useEffect, useMemo, useState } from 'react';
import { PlusOutlined } from '@ant-design/icons';
import { useSearchParams } from 'react-router-dom';
import { Button, Modal, Space, Tag } from 'antd';
import { KlsjnhTreeList011 } from '@/components/klsjnh011';
import type { KlsjnhTreeList011Action } from '@/components/klsjnh011';
import { useJulyAiPromptState } from '@/stores/aiCenter/julyAiPromptStore';
import { useJulyAiDomainState } from '@/stores/aiCenter/julyAiDomainStore';
import {
  fetchDomainTree, saveDomain, removeDomain, fetchPromptsByDomain, removePrompt,
} from '@/services/aiCenter';
import { toast } from '@/utils/toast';
import { PromptFormModal } from '@/pages/aiCenter/JulyAiPrompt/PromptFormModal';
import { DomainFormModal } from '@/pages/aiCenter/JulyAiPrompt/DomainFormModal';
import { RenderPreviewModal } from '@/pages/aiCenter/JulyAiPrompt/RenderPreviewModal';
import { PromptPanel } from '@/pages/aiCenter/JulyAiPrompt/PromptPanel';
import type { JulyAiDomainItem, SaveJulyAiDomainParams } from '@/types/aiCenter';
import type { JulyAiDomainPromptVo011 } from '@/types/aiCenter/aiPrompt/vo';

/** 树 → 平铺（反查选中域节点用） */
function flattenTree(nodes: JulyAiDomainItem[], out: JulyAiDomainItem[] = []): JulyAiDomainItem[] {
  for (const n of nodes) {
    out.push(n);
    if (n.children?.length) flattenTree(n.children, out);
  }
  return out;
}

export const JulyAiPrompt = () => {
  const { list, loading: promptsLoading } = useJulyAiPromptState();
  const { tree, loading: domainLoading } = useJulyAiDomainState();

  /* ---------- 选中态：域 id 入 URL（刷新不丢）；提示词选中为页面级 ---------- */
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedDomainId = searchParams.get('domain');
  const [selectedPromptId, setSelectedPromptId] = useState<string | null>(null);

  /* ---------- 弹窗态 ---------- */
  const [promptModal, setPromptModal] = useState<{ open: boolean; node: JulyAiDomainPromptVo011 | null }>({ open: false, node: null });
  const [domainModal, setDomainModal] = useState<{ open: boolean; node: JulyAiDomainItem | null; parentId?: string }>({ open: false, node: null });
  const [renderOpen, setRenderOpen] = useState(false);

  /** 树展开态（undefined = 默认全展开；用户手动收起后转受控） */
  const [expandedKeys, setExpandedKeys] = useState<string[] | undefined>(undefined);

  // 挂载：拉域树
  useEffect(() => {
    fetchDomainTree();
  }, []);

  // 选中域变化 → 右栏按域直查提示词（一次拉取，替代旧 N+1）
  useEffect(() => {
    if (selectedDomainId) fetchPromptsByDomain(selectedDomainId);
  }, [selectedDomainId]);

  /** 选中域节点（树内反查：展示 domainCode 用） */
  const selectedDomainNode = useMemo(() => {
    if (!selectedDomainId) return null;
    return flattenTree(tree).find((n) => n.id === selectedDomainId) ?? null;
  }, [tree, selectedDomainId]);

  /* ---------- 树节点动作（右键） ---------- */
  const handleNodeAction = (node: JulyAiDomainItem, actionKey: string) => {
    if (actionKey === 'add') setDomainModal({ open: true, node: null, parentId: node.id });
    if (actionKey === 'edit') setDomainModal({ open: true, node });
    if (actionKey === 'del') {
      Modal.confirm({
        title: '删除业务域',
        content: `确定删除业务域「${node.domainName}」吗？（其下提示词与子域按后端口径级联处理）`,
        okText: '删除', cancelText: '取消', okButtonProps: { danger: true },
        onOk: async () => {
          try {
            await removeDomain(node.id);
            toast.success('删除成功');
            if (selectedDomainId === node.id) setSearchParams({}, { replace: true });
          } catch (e) { toast.error((e as Error)?.message || '删除失败，请重试'); }
        },
      });
    }
  };

  /* ---------- 域保存（insert/update 分流在 service；parentId 随弹窗下发） ---------- */
  const handleSaveDomain = async (params: SaveJulyAiDomainParams) => {
    try {
      await saveDomain(params);
      toast.success('保存成功');
    } catch (e) {
      toast.error((e as Error)?.message || '保存失败');
      throw e; // 让弹窗保持打开（不关）
    }
  };

  /* ---------- 提示词操作 ---------- */
  const handleRemovePrompt = async (row: JulyAiDomainPromptVo011) => {
    try {
      await removePrompt(row.id);
      toast.success('删除成功');
      if (selectedPromptId === row.id) setSelectedPromptId(null);
    } catch (e) { toast.error((e as Error)?.message || '删除失败，请重试'); }
  };

  /** 树节点动作集（右键：新建子域 / 编辑 / 删除） */
  const nodeActions = (_n: JulyAiDomainItem): KlsjnhTreeList011Action[] => [
    { key: 'add', label: '新建子域' },
    { key: 'edit', label: '编辑' },
    { key: 'del', label: '删除', danger: true },
  ];

  return (
    <div>
      <div className="page-header">
        <h2>AI 提示词</h2>
      </div>

      <div className="permission-layout">
        {/* 左：业务域树（KlsjnhTreeList011 通用件；动作见 handleNodeAction） */}
        <KlsjnhTreeList011<JulyAiDomainItem>
          className="permission-sider"
          title="业务域"
          extra={(
            <Button size="small" color="primary" variant="filled" icon={<PlusOutlined />}
              onClick={() => setDomainModal({ open: true, node: null, parentId: '' })}>新建顶级域</Button>
          )}
          nodes={tree}
          getKey={(n) => n.id}
          renderTitle={(n) => (
            <Space size={4}>
              <code>{n.domainCode}</code>
              <span className="text-muted text-xs">{n.domainName}</span>
              {n.status !== '1' && <Tag color="red">停用</Tag>}
            </Space>
          )}
          nodeActions={nodeActions}
          onAction={handleNodeAction}
          selectedKey={selectedDomainId}
          onSelect={(key) => setSearchParams(key ? { domain: key } : {}, { replace: true })}
          loading={domainLoading}
          emptyText="暂无业务域"
          expandedKeys={expandedKeys}
          onExpandedKeysChange={setExpandedKeys}
        />

        {/* 右：选中业务域下的提示词（按 pkMt 直查） */}
        <div className="permission-main">
          <PromptPanel
            selectedDomain={selectedDomainNode?.domainCode ?? null}
            selectedDomainId={selectedDomainId}
            prompts={list}
            loading={promptsLoading}
            selectedPromptId={selectedPromptId}
            onToggleSelect={(id) => setSelectedPromptId(id === selectedPromptId ? null : id)}
            onNewPrompt={() => setPromptModal({ open: true, node: null })}
            onEditPrompt={(row) => setPromptModal({ open: true, node: row })}
            onRemovePrompt={handleRemovePrompt}
            onRender={() => setRenderOpen(true)}
          />
        </div>
      </div>

      <PromptFormModal
        open={promptModal.open}
        node={promptModal.node}
        pkMt={selectedDomainId || undefined}
        onClose={() => setPromptModal({ open: false, node: null })}
      />

      <DomainFormModal
        open={domainModal.open}
        node={domainModal.node}
        parentId={domainModal.parentId}
        domainTree={tree}
        onClose={() => setDomainModal({ open: false, node: null })}
        onSave={handleSaveDomain}
      />

      <RenderPreviewModal
        open={renderOpen}
        prompt={list.find((p) => p.id === selectedPromptId) ?? null}
        onClose={() => setRenderOpen(false)}
      />
    </div>
  );
};

export default JulyAiPrompt;
