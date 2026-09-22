/**
 * AI 业务域 新建 / 编辑弹窗（antd Form + Modal）
 * 2026-09-21 树形态：新增「上级域」选择（parentId 空串=顶级；编辑时不可选自己及子树防环）。
 * ?? 回填时序坑（同 ProviderFormModal）：表单体拆成 DomainFormBody，
 * 父层按 node.id 挂 key，每次打开都是全新 form 实例 + initialValues 定型。
 */
import { useState } from 'react';
import { Col, Form, Input, Modal, Row, Select } from 'antd';
import type { ReactNode } from 'react';
import { toast } from '@/utils/toast';
import { STATUS_OPTIONS } from '@/config/constants';
import type { JulyAiDomainItem, SaveJulyAiDomainParams } from '@/types/aiCenter';

export interface DomainFormModalProps {
  open: boolean;
  /** 编辑对象（null = 新建） */
  node: JulyAiDomainItem | null;
  /** 新建时预填的上级域 id（树节点「新建子域」带入；'' = 顶级） */
  parentId?: string;
  /** 全量域树（上级域选项 + 防环校验） */
  domainTree: JulyAiDomainItem[];
  onClose: () => void;
  /** 保存回调（insert/update 分流在 service） */
  onSave: (params: SaveJulyAiDomainParams) => Promise<void>;
}

/** 新建态默认值 */
const NEW_DEFAULTS = { status: '1', sortOrder: 1 };

/** 节点及其子树是否包含 targetId（防环：编辑时不能把自己/子树选为上级） */
function containsId(nodes: JulyAiDomainItem[], id: string): boolean {
  for (const n of nodes) {
    if (n.id === id) return true;
    if (n.children?.length && containsId(n.children, id)) return true;
  }
  return false;
}

/** 上级域选项（层级缩进；exclude 子树禁选） */
function buildParentOptions(
  tree: JulyAiDomainItem[],
  exclude: JulyAiDomainItem | null,
): { value: string; label: ReactNode; disabled: boolean }[] {
  const options: { value: string; label: ReactNode; disabled: boolean }[] = [];
  const walk = (items: JulyAiDomainItem[], depth: number) => {
    items.forEach((n) => {
      options.push({
        value: n.id,
        label: <span>{'　'.repeat(depth)}{n.domainCode} {n.domainName}</span>,
        disabled: !!exclude && containsId([exclude], n.id),
      });
      if (n.children?.length) walk(n.children, depth + 1);
    });
  };
  walk(tree, 0);
  return options;
}

const DomainFormBody = ({ node, parentId, domainTree, onClose, onSave }: Omit<DomainFormModalProps, 'open'>) => {
  const [form] = Form.useForm();
  const [saving, setSaving] = useState(false);
  const isEdit = !!node?.id;

  const handleSave = async () => {
    try {
      const v = await form.validateFields();
      setSaving(true);
      await onSave({
        id: node?.id,
        domainCode: String(v.domainCode).trim(),
        domainName: String(v.domainName).trim(),
        parentId: v.parentId || '',
        sortOrder: v.sortOrder,
        status: isEdit ? v.status : undefined,
        remark: v.remark,
      });
      onClose();
    } catch (e) {
      if (e && typeof e === 'object' && 'errorFields' in e) return;
      toast.error((e as Error)?.message || '保存失败，请检查输入');
    } finally { setSaving(false); }
  };

  const initialValues = node
    ? {
      domainCode: node.domainCode,
      domainName: node.domainName,
      parentId: node.parentId || '',
      sortOrder: node.sortOrder ?? 1,
      status: node.status || '1',
      remark: node.remark || '',
    }
    : {
      ...NEW_DEFAULTS,
      domainCode: '',
      domainName: '',
      parentId: parentId || '',
    };

  return (
    <Modal
      title={node ? '编辑业务域' : '新建业务域'}
      open
      onCancel={onClose}
      onOk={handleSave}
      okText="保存"
      cancelText="取消"
      confirmLoading={saving}
      width={600}
      destroyOnHidden
    >
      <Form form={form} layout="vertical" preserve={false} initialValues={initialValues}>
        <Row gutter={16}>
          <Col span={8}>
            <Form.Item name="domainCode" label="业务域编码" rules={[
              { required: true, message: '请输入业务域编码' },
              { pattern: /^[A-Za-z0-9_-]+$/, message: '仅支持字母 / 数字 / 下划线 / 连字符' },
            ]} extra="全局唯一；创建后不可修改" >
              <Input placeholder="如 finance" disabled={isEdit} />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item name="domainName" label="业务域名称" rules={[{ required: true, message: '请输入业务域名称' }]}>
              <Input placeholder="如 财务域" />
            </Form.Item>
          </Col>
          <Col span={8}>
            {/* 上级域：留空 = 顶级；编辑时排除自己及子树（防环） */}
            <Form.Item name="parentId" label="上级域">
              <Select allowClear placeholder="（顶级域）" options={buildParentOptions(domainTree, node)} />
            </Form.Item>
          </Col>
        </Row>
        <Row gutter={16}>
          <Col span={8}>
            <Form.Item name="sortOrder" label="排序" rules={[{ required: true, message: '请输入排序' }]}>
              <Input type="number" placeholder="越小越靠前" />
            </Form.Item>
          </Col>
        </Row>

        {/* 备注、状态各自独占一行，备注在前（016 §9.1 表单布局铁律） */}
        <Form.Item name="remark" label="备注">
          <Input.TextArea rows={2} />
        </Form.Item>

        {isEdit && (
          <Form.Item name="status" label="状态" initialValue="1">
            <Select options={STATUS_OPTIONS} />
          </Form.Item>
        )}
      </Form>
    </Modal>
  );
};

export const DomainFormModal = ({ open, node, parentId, domainTree, onClose, onSave }: DomainFormModalProps) =>
  open ? (
    <DomainFormBody
      key={node?.id ?? `new-${parentId ?? 'root'}`}
      node={node}
      parentId={parentId}
      domainTree={domainTree}
      onClose={onClose}
      onSave={onSave}
    />
  ) : null;

export default DomainFormModal;
