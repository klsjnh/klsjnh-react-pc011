/**
 * AI 提示词 · 右栏提示词面板（JulyAiPrompt 拆分件）
 * 2026-09-21 新契约版：数据源 = 按域直查（pkMt）；
 * 「该域内容」列随明细模型废弃而移除（提示词行本身就在当前域下）。
 * 纯展示 + 动作上抛：列定义在此，动作处理逻辑在壳 index.tsx。
 */
import { useNavigate } from 'react-router-dom';
import { Button, Card, Empty, Popconfirm, Space, Table, Tag } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { PlayCircleOutlined, PlusOutlined } from '@ant-design/icons';
import type { JulyAiDomainPromptVo011 } from '@/types/aiCenter/aiPrompt/vo';
import { AI_SCENE_OPTIONS, STATUS_LABEL } from '@/config/constants';
import { AICENTER_ROUTES } from '@/config/routes';

/** scene 编码 → 文案 */
const SCENE_LABEL: Record<string, string> = Object.fromEntries(AI_SCENE_OPTIONS.map((o) => [o.value, o.label]));

export interface PromptPanelProps {
  /** null = 未选中域（显示引导空态；Card 标题展示用，取 domainCode） */
  selectedDomain: string | null;
  /** 选中域 id（编辑内容跳转 / 回跳选中态恢复用） */
  selectedDomainId: string | null;
  prompts: JulyAiDomainPromptVo011[];
  loading?: boolean;
  selectedPromptId: string | null;
  onToggleSelect: (id: string) => void;
  onNewPrompt: () => void;
  onEditPrompt: (row: JulyAiDomainPromptVo011) => void;
  onRemovePrompt: (row: JulyAiDomainPromptVo011) => void;
  onRender: () => void;
}

export const PromptPanel = ({
  selectedDomain, selectedDomainId, prompts, loading = false, selectedPromptId,
  onToggleSelect, onNewPrompt, onEditPrompt, onRemovePrompt, onRender,
}: PromptPanelProps) => {
  const navigate = useNavigate();

  const promptColumns: ColumnsType<JulyAiDomainPromptVo011> = [
    { title: '提示词编码', dataIndex: 'promptCode', width: 220, render: (v) => <code>{v}</code> },
    { title: '提示词名称', dataIndex: 'promptName', width: 160 },
    {
      title: '场景', dataIndex: 'scene', width: 100,
      render: (s) => (s ? <Tag color="blue">{SCENE_LABEL[s] || s}</Tag> : <Tag>未指定</Tag>),
    },
    {
      title: '状态', dataIndex: 'status', width: 80,
      render: (s) => <Tag color={s === '1' ? 'green' : 'red'}>{STATUS_LABEL[s] || s}</Tag>,
    },
    {
      title: '备注', dataIndex: 'remark', ellipsis: true, render: (v) => v || '—',
    },
    {
      title: '操作', key: 'action', width: 200, fixed: 'right',
      render: (_, r) => (
        <Space size="small">
          <Button type="link" size="small" onClick={() => navigate(`${AICENTER_ROUTES.julyAiPromptDetail}/${r.id}?domain=${encodeURIComponent(selectedDomainId || '')}`)}>编辑内容</Button>
          <Button type="link" size="small" onClick={() => onEditPrompt(r)}>设置</Button>
          <Popconfirm title={`确定删除提示词「${r.promptName}」吗？`} okText="删除" cancelText="取消" okButtonProps={{ danger: true }} onConfirm={() => onRemovePrompt(r)}>
            <Button type="link" size="small" danger>删除</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  if (!selectedDomain) {
    return <Card className="permission-empty"><Empty description="请从左侧选择一个业务域" /></Card>;
  }

  return (
    <Card
      title={`提示词 · ${selectedDomain}`}
      styles={{ body: { padding: 8, minHeight: 640, maxHeight: 640, overflowY: 'auto' } }}
      extra={(
        <Space size="small">
          <Button
            size="small"
            icon={<PlusOutlined />}
            onClick={onNewPrompt}
          >新建提示词</Button>
          <Button
            size="small"
            icon={<PlayCircleOutlined />}
            disabled={!selectedPromptId}
            onClick={onRender}
          >渲染预览</Button>
        </Space>
      )}
    >
      <Table<JulyAiDomainPromptVo011>
        rowKey="id"
        size="small"
        columns={promptColumns}
        dataSource={prompts}
        loading={loading}
        scroll={{ x: 1000 }}
        pagination={false}
        onRow={(row) => ({
          style: { cursor: 'pointer' },
          onClick: () => onToggleSelect(row.id),
        })}
        rowClassName={(row) => (row.id === selectedPromptId ? 'master-row-selected' : '')}
      />
    </Card>
  );
};
