/**
 * AI 提示词 新建 / 编辑弹窗（antd Form + Modal）
 * 新建：主表字段 + 业务域明细（Form.List，随后端 insert 的 details[] 一次下发）；
 * 编辑：仅主表字段（后端 update 不含明细，明细走页面级 DetailFormModal）。
 *
 * ⚠️ 回填时序坑（同 ProviderFormModal）：antd6 Modal + destroyOnHidden 下表单内容
 * 挂载晚于父组件 effect，effect 里 setFieldsValue 会落空。故表单体拆成
 * PromptFormBody（父层按 node.id 挂 key，每次打开都是全新 form 实例），
 * 用 initialValues 在挂载时定型，彻底不依赖 effect 时序。
 */
import { useState } from 'react';
import { MinusCircleOutlined, PlusOutlined } from '@ant-design/icons';
import { Button, Col, Empty, Form, Input, Modal, Row, Select } from 'antd';
import { savePrompt } from '@/services/aiCenter';
import { toast } from '@/utils/toast';
import { AI_SCENE_OPTIONS, STATUS_OPTIONS } from '@/config/constants';
import type { JulyAiPromptItem, JulyAiPromptDetailItem } from '@/types/aiCenter';

export interface PromptFormModalProps {
  open: boolean;
  /** 编辑对象（null = 新建） */
  node: JulyAiPromptItem | null;
  /** 新建时预填的业务域（从主页选中域带入；编辑态忽略） */
  defaultDomain?: string;
  onClose: () => void;
  onSaved: () => void;
}

/** 新建态默认值 */
const NEW_DEFAULTS = { status: '1', sortOrder: 1 };

/** 明细行默认值（Form.List 新增行） */
const NEW_DETAIL = { contentMode: 'inline', sortOrder: 1, status: '1' };

/**
 * 表单体：每次打开都是新实例（父层按 node.id 挂 key），initialValues 挂载即定型。
 * 操作按钮渲染在表单下方（不走 Modal footer——footer 在 Form 之外拿不到表单态）。
 */
const PromptFormBody = ({ node, defaultDomain, onClose, onSaved }: Omit<PromptFormModalProps, 'open'>) => {
  const [form] = Form.useForm();
  const [saving, setSaving] = useState(false);
  const isEdit = !!node?.id;

  const handleSave = async () => {
    try {
      const v = await form.validateFields();
      setSaving(true);
      const details: JulyAiPromptDetailItem[] = isEdit ? [] : (v.details || []).filter((d: JulyAiPromptDetailItem) => d?.domainCode);
      const savedId = await savePrompt({
        id: node?.id,
        promptCode: v.promptCode,
        promptName: v.promptName,
        scene: v.scene,
        sortOrder: v.sortOrder,
        remark: v.remark,
        details,
        status: v.status,
      });
      toast.success(isEdit ? `update ${node?.id} success ...` : `insert ${savedId} success ...`);
      onSaved();
      onClose();
    } catch (e) {
      if (e && typeof e === 'object' && 'errorFields' in e) return;
      toast.error((e as Error)?.message || '保存失败，请检查输入');
    } finally { setSaving(false); }
  };

  return (
    <>
      <Form
        form={form}
        layout="vertical"
        preserve={false}
        initialValues={node
          ? {
            promptCode: node.promptCode,
            promptName: node.promptName,
            scene: node.scene || undefined,
            sortOrder: 1,
            remark: '',
            status: node.status || '1',
          }
          : {
            ...NEW_DEFAULTS,
            // 主页选中业务域时，新建态预填第一行明细的域编码（先域后提示词）
            details: defaultDomain ? [{ ...NEW_DETAIL, domainCode: defaultDomain }] : [],
          }}
      >
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item name="promptCode" label="提示词编码" rules={[{ required: true, message: '请输入提示词编码' }]}>
              <Input disabled={isEdit} placeholder="全局唯一，创建后不可修改，如 chat.table.output" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="promptName" label="提示词名称" rules={[{ required: true, message: '请输入提示词名称' }]}>
              <Input placeholder="如 表格输出约束" />
            </Form.Item>
          </Col>
        </Row>
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item name="scene" label="适用能力">
              <Select options={AI_SCENE_OPTIONS} placeholder="选择适用能力" allowClear />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="sortOrder" label="排序" rules={[{ required: true, message: '请输入排序' }]}>
              <Input type="number" placeholder="数字越小越靠前" />
            </Form.Item>
          </Col>
        </Row>
        {isEdit && (
          <Form.Item name="status" label="状态" rules={[{ required: true }]}>
            <Select options={STATUS_OPTIONS} />
          </Form.Item>
        )}
        <Form.Item name="remark" label="备注">
          <Input placeholder="备注说明" />
        </Form.Item>

        {/* 业务域明细：仅新建态可维护（后端 update 不含明细，编辑态明细走页面级弹窗） */}
        {!isEdit && (
          <Form.List name="details">
            {(fields, { add, remove }) => (
              <div className="prompt-detail-editor">
                <div className="prompt-detail-editor-head">
                  <span>业务域明细</span>
                  <Button size="small" icon={<PlusOutlined />} onClick={() => add({ ...NEW_DETAIL })}>添加业务域</Button>
                </div>
                {fields.length === 0 && <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无业务域，新增后可随主表单次提交" />}
                {fields.map(({ key, name, ...restField }) => (
                  <div key={key} className="prompt-detail-row">
                    <Row gutter={8}>
                      <Col span={8}>
                        <Form.Item
                          {...restField}
                          name={[name, 'domainCode']}
                          rules={[{ required: true, message: '请输入业务域编码' }]}
                        >
                          <Input placeholder="业务域编码，如 default" />
                        </Form.Item>
                      </Col>
                      <Col span={8}>
                        <Form.Item {...restField} name={[name, 'contentMode']} initialValue="inline">
                          <Select options={[{ value: 'inline', label: '内置正文' }, { value: 'storage', label: '对象存储' }]} />
                        </Form.Item>
                      </Col>
                      <Col span={8}>
                        <Form.Item {...restField} name={[name, 'sortOrder']} initialValue={1}>
                          <Input type="number" placeholder="排序" />
                        </Form.Item>
                      </Col>
                    </Row>
                    <Form.Item
                      {...restField}
                      name={[name, 'content']}
                      rules={[{ required: true, message: '请输入正文' }]}
                    >
                      <Input.TextArea rows={3} placeholder="正文（${var} 为变量占位；storage 模式将写入对象存储）" />
                    </Form.Item>
                    <div className="prompt-detail-row-foot">
                      <Form.Item {...restField} name={[name, 'variables']} style={{ flex: 1, marginBottom: 0 }}>
                        <Input placeholder="变量声明，逗号分隔，如 scene,subject" />
                      </Form.Item>
                      <Button type="text" danger icon={<MinusCircleOutlined />} onClick={() => remove(name)}>移除</Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Form.List>
        )}
      </Form>
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 16 }}>
        <Button onClick={onClose}>取消</Button>
        <Button type="primary" loading={saving} onClick={handleSave}>保存</Button>
      </div>
    </>
  );
};

export const PromptFormModal = ({ open, node, defaultDomain, onClose, onSaved }: PromptFormModalProps) => (
  <Modal
    title={node ? '编辑 AI 提示词' : '新建 AI 提示词'}
    open={open}
    onCancel={onClose}
    footer={null}
    width={720}
    destroyOnHidden
  >
    {/* open 时才挂表单体；key 随 node.id 变 → 每次打开/切行都是全新实例 + initialValues 定型 */}
    {open && <PromptFormBody key={node?.id ?? 'new'} node={node} defaultDomain={defaultDomain} onClose={onClose} onSaved={onSaved} />}
  </Modal>
);

export default PromptFormModal;
