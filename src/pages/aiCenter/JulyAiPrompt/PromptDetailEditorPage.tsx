/**
 * AI 提示词 · 业务域明细编辑页（julyAiPrompt/detail/new 或 /detail/:id）
 * 整页编辑器（对齐元数据 / 业务建模的 FormPage 模式）：正文可长达 2.1 万汉字，
 * 弹窗放不下，按用户要求「子表编辑跳转路由」独立成页。
 *
 * 数据加载：promptId 走 query（列表页选中态同步到 URL，刷新不丢）；
 * 后端无「明细按 id 点查」端点，编辑态靠 selectDetailListByPrompt(promptId) 拉列表反查。
 * 保存走 insertDetail / updateDetail；storage 模式正文由后端写入对象存储（约定桶 ai-prompt）。
 */
import { useEffect, useState } from 'react';
import { ArrowLeftOutlined } from '@ant-design/icons';
import { Button, Card, Col, Form, Input, Row, Select, Space, Tag } from 'antd';
import { KlsjnhMarkdown011 } from '@/components/system011';
import { getPromptById, selectDetailListByPrompt, savePromptDetail } from '@/services/aiCenter';
import { toast } from '@/utils/toast';
import { AICENTER_ROUTES } from '@/config/routes';
import { STATUS_OPTIONS } from '@/config/constants';
import type { PageNavProps } from '@/types/view/page';
import type { JulyAiPromptItem, JulyAiPromptDetailItem } from '@/types/aiCenter';

/** 内容模式选项 */
const CONTENT_MODE_OPTIONS = [
  { value: 'inline', label: '内置正文' },
  { value: 'storage', label: '对象存储' },
];

export interface PromptDetailEditorPageProps extends PageNavProps {
  /** 'new' = 新增；否则为明细主键 */
  detailId: string;
  /** 所属提示词主键（query 带入） */
  promptId: string;
  /** 预填业务域编码（query 带入；仅新建态生效） */
  domain?: string;
}

export const PromptDetailEditorPage = ({ detailId, promptId, domain, onNavigate }: PromptDetailEditorPageProps) => {
  const isNew = detailId === 'new';
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [prompt, setPrompt] = useState<JulyAiPromptItem | null>(null);
  const [node, setNode] = useState<JulyAiPromptDetailItem | null>(null);

  const backPath = `${AICENTER_ROUTES.julyAiPrompt}?promptId=${promptId}`;

  /** 加载提示词上下文 + （编辑态）明细行反查 */
  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect -- 加载置位属 intentional reset */
    if (!promptId) {
      toast.error('缺少提示词上下文（promptId）');
      onNavigate?.(AICENTER_ROUTES.julyAiPrompt);
      return;
    }
    let alive = true;
    setLoading(true);
    (async () => {
      try {
        const p = await getPromptById(promptId);
        if (!alive) return;
        setPrompt(p);
        if (!isNew) {
          const rows = await selectDetailListByPrompt(promptId);
          if (!alive) return;
          const hit = rows.find((r) => r.id === detailId);
          if (!hit) {
            toast.error('业务域明细不存在或已删除');
            onNavigate?.(backPath);
            return;
          }
          setNode(hit);
        }
      } catch (e) {
        if (!alive) return;
        toast.error((e as Error)?.message || '加载失败');
        onNavigate?.(backPath);
        return;
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- 挂载时按路由参数加载一次
  }, []);

  const handleSave = async () => {
    if (!prompt) return;
    try {
      const v = await form.validateFields();
      setSaving(true);
      await savePromptDetail({
        id: node?.id,
        promptId: prompt.id,
        domainCode: v.domainCode,
        contentMode: v.contentMode,
        content: v.content,
        storageCode: v.contentMode === 'storage' ? v.storageCode : undefined,
        bucket: v.contentMode === 'storage' ? v.bucket : undefined,
        variables: v.variables,
        sortOrder: v.sortOrder,
        remark: v.remark,
        status: v.status,
      });
      toast.success(isNew ? 'insert detail success ...' : `update detail ${node?.id} success ...`);
      onNavigate?.(backPath);
    } catch (e) {
      if (e && typeof e === 'object' && 'errorFields' in e) return;
      toast.error((e as Error)?.message || '保存失败');
    } finally { setSaving(false); }
  };

  return (
    <div>
      {/* 页头动作区：返回 + 标题 + 提示词标签 + 保存/取消（对齐 016 §9.1 表单布局铁律：按钮不沉底） */}
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
        <Space>
          <Button icon={<ArrowLeftOutlined />} onClick={() => onNavigate?.(backPath)}>返回列表</Button>
          <h2 style={{ margin: 0 }}>{isNew ? '新增业务域明细' : '编辑业务域明细'}</h2>
          {prompt && <Tag color="blue">{prompt.promptName}（{prompt.promptCode}）</Tag>}
        </Space>
        <Space>
          <Button type="primary" loading={saving} disabled={loading} onClick={handleSave}>保存</Button>
          <Button onClick={() => onNavigate?.(backPath)}>取消</Button>
        </Space>
      </div>

      <Card loading={loading}>
        {!loading && (
          <Form
            key={node?.id ?? 'new-detail'}
            form={form}
            layout="vertical"
            preserve={false}
            initialValues={node
              ? {
                domainCode: node.domainCode,
                contentMode: node.contentMode || 'inline',
                content: node.content || '',
                bucket: node.bucket || '',
                variables: node.variables || '',
                sortOrder: node.sortOrder ?? 1,
                remark: node.remark || '',
                status: node.status || '1',
              }
              : {
                  contentMode: 'inline', sortOrder: 1, status: '1',
                  // 从主页带域跳转（该提示词在该域下还没有内容）：预填业务域编码
                  ...(domain ? { domainCode: domain } : {}),
                }}
            style={{ maxWidth: 880 }}
          >
            <Row gutter={16}>
              <Col span={8}>
                <Form.Item name="domainCode" label="业务域编码" rules={[{ required: true, message: '请输入业务域编码' }]}
                  extra="同一提示词下唯一">
                  <Input placeholder="如 default" />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item name="contentMode" label="内容模式" rules={[{ required: true }]}
                  extra="内置入库 / 存储写对象">
                  <Select options={CONTENT_MODE_OPTIONS} />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item name="sortOrder" label="排序" rules={[{ required: true, message: '请输入排序' }]}>
                  <Input type="number" placeholder="越小越靠前" />
                </Form.Item>
              </Col>
            </Row>
            {/* 变量声明：正文上一行（整行） */}
            <Form.Item name="variables" label="变量声明" extra="逗号分隔，如 scene,subject；渲染时按名传值替换 ${var}">
              <Input placeholder="如 scene,subject" />
            </Form.Item>
            {/* 正文：项目唯一 Markdown 编辑器（016 §9.1） */}
            <Form.Item name="content" label="正文" rules={[{ required: true, message: '请输入正文' }]}>
              <KlsjnhMarkdown011 height={360} placeholder="提示词正文（Markdown）" />
            </Form.Item>
            <Form.Item noStyle shouldUpdate={(prev, cur) => prev.contentMode !== cur.contentMode}>
              {({ getFieldValue }) => getFieldValue('contentMode') === 'storage' ? (
                <Form.Item name="bucket" label="桶" extra="留空用后端约定桶 ai-prompt">
                  <Input placeholder="ai-prompt" style={{ maxWidth: 320 }} />
                </Form.Item>
              ) : null}
            </Form.Item>
            {/* 状态、备注各自独占一行（016 §9.1） */}
            <Form.Item name="status" label="状态" rules={[{ required: true }]}>
              <Select options={STATUS_OPTIONS} style={{ maxWidth: 240 }} />
            </Form.Item>
            <Form.Item name="remark" label="备注">
              <Input placeholder="备注说明" />
            </Form.Item>
          </Form>
        )}
      </Card>
    </div>
  );
};

export default PromptDetailEditorPage;
