/**
 * AI 提示词 · 正文编辑页（julyAiDomainPrompt 明细，/detail/new 或 /detail/:id）
 * 整页编辑器（对齐元数据 / 业务建模的 FormPage 模式）：正文可长达 2.1 万汉字，
 * 弹窗放不下，独立成页（路由 PAGE_COMPONENTS 注入 props）。
 *
 * 2026-09-21 新契约：明细点查 getDetailById 替代旧「拉列表反查」；
 * domainCode 输入改为「所属业务域」（pkMt，新建时从主页选中域预填且只读——归属随创建定型）；
 * 正文编辑仍为项目唯一 Markdown 编辑器（KlsjnhMarkdown011，016 §9.1）。
 */
import { useEffect, useState } from 'react';
import { ArrowLeftOutlined } from '@ant-design/icons';
import { Button, Card, Col, Form, Input, Row, Select, Space, Tag } from 'antd';
import { KlsjnhMarkdown011 } from '@/components/system011';
import { getPromptById, getPromptContent, savePrompt } from '@/services/aiCenter';
import { toast } from '@/utils/toast';
import { AICENTER_ROUTES } from '@/config/routes';
import { AI_SCENE_OPTIONS, STATUS_OPTIONS } from '@/config/constants';
import type { PageNavProps } from '@/types/view/page';
import type { JulyAiDomainPromptVo011 } from '@/types/aiCenter/aiPrompt/vo';

/** 内容模式选项 */
const CONTENT_MODE_OPTIONS = [
  { value: 'inline', label: '内置正文' },
  { value: 'storage', label: '对象存储' },
];

export interface PromptDetailEditorPageProps extends PageNavProps {
  /** 'new' = 新增；否则为提示词主键 */
  detailId: string;
  /** 所属业务域 id（query 带入；新建必传，编辑态忽略） */
  pkMt?: string;
  /** 预填业务域编码显示用（query 带入） */
  domain?: string;
}

export const PromptDetailEditorPage = ({ detailId, pkMt, domain, onNavigate }: PromptDetailEditorPageProps) => {
  const isNew = detailId === 'new';
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [node, setNode] = useState<JulyAiDomainPromptVo011 | null>(null);
  /** 正文（getContent 取回；随 initialValues 定型，避免 setFieldsValue 早于挂载丢值） */
  const [contentText, setContentText] = useState('');

  /** 返回路径：保留主页选中态（?domain=） */
  const backPath = domain
    ? `${AICENTER_ROUTES.julyAiPrompt}?domain=${encodeURIComponent(domain)}`
    : AICENTER_ROUTES.julyAiPrompt;

  /** 所属域展示名（树内反查；找不到就显示 id） */
  const ownerDomain = domain || node?.pkMt || pkMt || '';

  /** 加载：编辑态点查明细；新建态校验 pkMt */
  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect -- 加载置位属 intentional reset */
    let alive = true;
    setLoading(true);
    (async () => {
      try {
        if (isNew) {
          // 新契约下创建走列表页「新建提示词」弹窗（insertDetail）；编辑器只做已有提示词的正文/设置修改
          toast.error('请先在列表页「新建提示词」，再进入编辑内容');
          onNavigate?.(backPath);
          return;
        }
        const hit = await getPromptById(detailId);
        if (!alive) return;
        // 正文不随 Vo 回传（超长）—— getContent 取回后随 initialValues 定型
        const text = await getPromptContent(detailId);
        if (!alive) return;
        setContentText(text);
        setNode(hit);
      } catch (e) {
        if (!alive) return;
        toast.error((e as Error)?.message || '加载失败');
        onNavigate?.(backPath);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- 挂载时按路由参数加载一次
  }, []);

  const handleSave = async () => {
    try {
      const v = await form.validateFields();
      setSaving(true);
      await savePrompt({
        id: node?.id,
        pkMt: node?.pkMt ?? pkMt,
        promptCode: node?.promptCode,
        promptName: String(v.promptName).trim(),
        scene: v.scene,
        contentMode: v.contentMode,
        content: v.content,
        storageCode: v.contentMode === 'storage' ? v.storageCode : undefined,
        bucket: v.contentMode === 'storage' ? v.bucket : undefined,
        variables: v.variables,
        sortOrder: v.sortOrder,
        remark: v.remark,
        status: v.status,
      });
      toast.success(isNew ? 'insert success ...' : `update ${node?.id} success ...`);
      onNavigate?.(backPath);
    } catch (e) {
      if (e && typeof e === 'object' && 'errorFields' in e) return;
      toast.error((e as Error)?.message || '保存失败');
    } finally { setSaving(false); }
  };

  return (
    <div>
      {/* 页头动作区：返回列表 + 保存 同在左侧（返回即放弃）；右侧展示归属域 */}
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
        <Space>
          <Button icon={<ArrowLeftOutlined />} onClick={() => onNavigate?.(backPath)}>返回列表</Button>
          <Button type="primary" loading={saving} disabled={loading} onClick={handleSave}>保存</Button>
          <h2 style={{ margin: 0 }}>{isNew ? '新增提示词正文' : '编辑提示词正文'}</h2>
          {node && <Tag color="blue">{node.promptName}（{node.promptCode}）</Tag>}
          {ownerDomain && <Tag color="purple">所属域：{ownerDomain}</Tag>}
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
                promptName: node.promptName,
                scene: node.scene,
                contentMode: node.contentMode || 'inline',
                content: contentText,
                storageCode: node.storageCode || '',
                bucket: node.bucket || '',
                variables: node.variables || '',
                sortOrder: node.sortOrder ?? 1,
                remark: node.remark || '',
                status: node.status || '1',
              }
              : {
                contentMode: 'inline', sortOrder: 1, status: '1',
              }}
            style={{ maxWidth: 880 }}
          >
            <Row gutter={16}>
              <Col span={8}>
                <Form.Item name="promptName" label="提示词名称" rules={[{ required: true, message: '请输入提示词名称' }]}>
                  <Input placeholder="如 SQL 助手" maxLength={100} disabled={!!node} />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item name="scene" label="适用能力" extra="仅分类标注">
                  <Select allowClear placeholder="未指定" options={AI_SCENE_OPTIONS} />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item name="contentMode" label="内容模式" rules={[{ required: true }]}
                  extra="内置入库 / 存储写对象">
                  <Select options={CONTENT_MODE_OPTIONS} />
                </Form.Item>
              </Col>
            </Row>
            <Row gutter={16}>
              <Col span={8}>
                <Form.Item name="sortOrder" label="排序" rules={[{ required: true, message: '请输入排序' }]}>
                  <Input type="number" placeholder="越小越靠前" />
                </Form.Item>
              </Col>
              <Col span={16}>
                {/* 变量声明：正文上一行（整行剩余宽度） */}
                <Form.Item name="variables" label="变量声明" extra="逗号分隔，如 scene,subject；渲染时按名传值替换 ${var}">
                  <Input placeholder="如 scene,subject" />
                </Form.Item>
              </Col>
            </Row>
            {/* 正文：项目唯一 Markdown 编辑器（016 §9.1）；编辑态正文由 getContent 异步填充 */}
            <Form.Item name="content" label="正文" rules={[{ required: true, message: '请输入正文' }]}>
              <KlsjnhMarkdown011 height={360} placeholder="提示词正文（Markdown）" />
            </Form.Item>
            <Form.Item noStyle shouldUpdate={(prev, cur) => prev.contentMode !== cur.contentMode}>
              {({ getFieldValue }) => getFieldValue('contentMode') === 'storage' ? (
                <Row gutter={16}>
                  <Col span={8}>
                    <Form.Item name="storageCode" label="存储实例" extra="留空用默认实例">
                      <Input placeholder="default" />
                    </Form.Item>
                  </Col>
                  <Col span={8}>
                    <Form.Item name="bucket" label="桶" extra="留空用后端约定桶 ai-prompt">
                      <Input placeholder="ai-prompt" />
                    </Form.Item>
                  </Col>
                </Row>
              ) : null}
            </Form.Item>
            {/* 备注（多行）在前、状态在后，各自独占一行（016 §9.1 / 2026-09-21 定稿） */}
            <Form.Item name="remark" label="备注">
              <Input.TextArea rows={2} maxLength={300} showCount placeholder="备注说明" />
            </Form.Item>
            <Form.Item name="status" label="状态" rules={[{ required: true }]}>
              <Select options={STATUS_OPTIONS} style={{ maxWidth: 240 }} />
            </Form.Item>
          </Form>
        )}
      </Card>
    </div>
  );
};

export default PromptDetailEditorPage;
