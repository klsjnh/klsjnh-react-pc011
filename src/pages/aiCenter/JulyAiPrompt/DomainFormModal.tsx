/**
 * AI 业务域 新建 / 编辑弹窗（antd Form + Modal）
 * 字段：domainCode（唯一，编辑可改——改名由页面级联同步明细）/ domainName / sortOrder / status / remark。
 *
 * ⚠️ 回填时序坑（同 ProviderFormModal）：表单体拆成 DomainFormBody，
 * 父层按 node.id 挂 key，每次打开都是全新 form 实例 + initialValues 定型。
 */
import { useState } from 'react';
import { Button, Col, Form, Input, Modal, Row, Select } from 'antd';
import { toast } from '@/utils/toast';
import { STATUS_OPTIONS } from '@/config/constants';
import type { JulyAiDomainItem, SaveJulyAiDomainParams } from '@/types/aiCenter';

export interface DomainFormModalProps {
  open: boolean;
  /** 编辑对象（null = 新建） */
  node: JulyAiDomainItem | null;
  onClose: () => void;
  /** 保存回调（页面据此判断是否走改名级联） */
  onSave: (params: SaveJulyAiDomainParams) => Promise<void>;
}

/** 新建态默认值 */
const NEW_DEFAULTS = { status: '1', sortOrder: 1 };

const DomainFormBody = ({ node, onClose, onSave }: Omit<DomainFormModalProps, 'open'>) => {
  const [form] = Form.useForm();
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    try {
      const v = await form.validateFields();
      setSaving(true);
      await onSave({
        id: node?.id,
        domainCode: String(v.domainCode).trim(),
        domainName: String(v.domainName).trim(),
        sortOrder: v.sortOrder,
        status: v.status,
        remark: v.remark,
      });
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
            domainCode: node.domainCode,
            domainName: node.domainName,
            sortOrder: node.sortOrder ?? 1,
            status: node.status || '1',
            remark: node.remark || '',
          }
          : NEW_DEFAULTS}
      >
        <Row gutter={16}>
          <Col span={8}>
            <Form.Item name="domainCode" label="业务域编码" rules={[
              { required: true, message: '请输入业务域编码' },
              { pattern: /^[A-Za-z0-9_-]+$/, message: '仅支持字母 / 数字 / 下划线 / 连字符' },
            ]} extra="全局唯一；提示词明细按此编码关联">
              <Input placeholder="如 finance" />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item name="domainName" label="业务域名称" rules={[{ required: true, message: '请输入业务域名称' }]}>
              <Input placeholder="如 财务域" />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item name="sortOrder" label="排序" rules={[{ required: true, message: '请输入排序' }]}>
              <Input type="number" placeholder="越小越靠前" />
            </Form.Item>
          </Col>
        </Row>

        {/* 状态、备注各自独占一行（016 §9.1 表单布局铁律） */}
        <Form.Item name="status" label="状态" initialValue="1">
          <Select options={STATUS_OPTIONS} />
        </Form.Item>

        <Form.Item name="remark" label="备注">
          <Input.TextArea rows={2} />
        </Form.Item>

      </Form>
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 16 }}>
        <Button onClick={onClose}>取消</Button>
        <Button type="primary" loading={saving} onClick={handleSave}>保存</Button>
      </div>
    </>
  );
};

export const DomainFormModal = ({ open, node, onClose, onSave }: DomainFormModalProps) => (
  <Modal
    title={node ? '编辑业务域' : '新建业务域'}
    open={open}
    onCancel={onClose}
    footer={null}
    width={600}
    destroyOnHidden
  >
    {open && <DomainFormBody key={node?.id ?? 'new-domain'} node={node} onClose={onClose} onSave={onSave} />}
  </Modal>
);

export default DomainFormModal;
