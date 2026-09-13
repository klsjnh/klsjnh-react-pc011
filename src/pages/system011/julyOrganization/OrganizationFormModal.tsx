/**
 * 组织新增 / 编辑弹窗（julyOrganization 模块组件）
 * 支持选择上级组织（编辑时可移动并排除自己及下级）；提交走 julyOrganizationService.saveOrganization。
 */
import React, { useState, useEffect } from 'react';
import { Modal } from '../../../components/Modal';
import { saveOrganization } from '../../../services/system011';
import { toast } from '../../../utils/toast';
import type { UserInfo } from '../../../stores/system011/julyRoleStore';
import type { OrgDeptNode } from '../../../types/view';

interface OrganizationFormModalProps {
  open: boolean;
  mode: 'create' | 'edit';
  node: OrgDeptNode | null;
  /** 组织树（用于上级下拉） */
  departments: OrgDeptNode[];
  /** 用户列表（负责人下拉） */
  users: UserInfo[];
  /** 初始上级组织 id（新建子部门 / 编辑回填） */
  initialParentId: string;
  onClose: () => void;
  onSaved: () => void;
}

const inputStyle: React.CSSProperties = {
  width: '100%', height: '38px', padding: '0 12px',
  border: '1px solid var(--border)', borderRadius: 'var(--radius)',
  fontSize: '14px', outline: 'none',
};

function containsId(node: OrgDeptNode, id: string): boolean {
  return node.id === id || (node.children || []).some((c) => containsId(c, id));
}

export const OrganizationFormModal: React.FC<OrganizationFormModalProps> = ({
  open, mode, node, departments, users, initialParentId, onClose, onSaved,
}) => {
  const [form, setForm] = useState({ name: '', code: '', leaderId: '', sortOrder: 0 });
  const [parentChoice, setParentChoice] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setForm({
      name: node?.name || '',
      code: node?.code || '',
      leaderId: node?.leaderId || '',
      sortOrder: node?.sortOrder ?? 0,
    });
    setParentChoice(initialParentId);
    setSaving(false);
  }, [open, node, initialParentId]);

  // 上级组织下拉选项（编辑时排除自己及下级）
  const parentOptions: { id: string; label: string; disabled: boolean }[] = [];
  const flatten = (items: OrgDeptNode[], depth: number) => {
    items.forEach((item) => {
      const disabled = mode === 'edit' && node != null && containsId(node, item.id);
      parentOptions.push({ id: item.id, label: `${'　'.repeat(depth)}${item.name}`, disabled });
      if (item.children?.length) flatten(item.children, depth + 1);
    });
  };
  flatten(departments, 0);

  const handleSave = async () => {
    if (saving) return;
    if (!form.name.trim()) { toast.error('请填写组织名称'); return; }
    if (mode === 'create' && !form.code.trim()) { toast.error('请填写组织编码'); return; }
    setSaving(true);
    try {
      const id = await saveOrganization({
        id: node?.id,
        orgCode: form.code.trim(),
        orgName: form.name.trim(),
        pkUser: form.leaderId || undefined,
        parentId: parentChoice || undefined,
        sortOrder: form.sortOrder,
      });
      toast.success(`${mode === 'edit' ? 'update' : 'insert'} ${id} success ...`);
      onSaved();
      onClose();
    } catch (e: any) {
      toast.error(e?.message || '保存失败');
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;

  return (
    <Modal
      title={mode === 'edit' ? '编辑组织' : parentChoice === '' ? '新建集团' : '新建子部门'}
      onClose={onClose}
      onSave={handleSave}
      saveDisabled={saving}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <div><div style={{ fontSize: '13px', marginBottom: '4px' }}>上级组织</div>
          <select style={{ ...inputStyle, background: '#fff' }} value={parentChoice} onChange={(e) => setParentChoice(e.target.value)}>
            <option value="">（顶级组织）</option>
            {parentOptions.map((o) => <option key={o.id} value={o.id} disabled={o.disabled}>{o.label}</option>)}
          </select>
        </div>
        <div><div style={{ fontSize: '13px', marginBottom: '4px' }}>名称 *</div>
          <input style={inputStyle} value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} /></div>
        <div><div style={{ fontSize: '13px', marginBottom: '4px' }}>编码 {mode === 'edit' ? '（不可改）' : '*'}</div>
          <input style={{ ...inputStyle, background: mode === 'edit' ? '#f5f5f5' : '#fff' }} value={form.code}
            disabled={mode === 'edit'} onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))} /></div>
        <div><div style={{ fontSize: '13px', marginBottom: '4px' }}>负责人</div>
          <select style={{ ...inputStyle, background: '#fff' }} value={form.leaderId} onChange={(e) => setForm((f) => ({ ...f, leaderId: e.target.value }))}>
            <option value="">（未指定）</option>
            {users.map((u) => <option key={u.id} value={u.id}>{u.realName}（{u.username}）</option>)}
          </select>
        </div>
        <div><div style={{ fontSize: '13px', marginBottom: '4px' }}>排序</div>
          <input type="number" style={inputStyle} value={form.sortOrder}
            onChange={(e) => setForm((f) => ({ ...f, sortOrder: Number(e.target.value) || 0 }))} /></div>
      </div>
      {saving && <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '8px' }}>保存中...</div>}
    </Modal>
  );
};
