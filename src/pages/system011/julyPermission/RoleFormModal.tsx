/** 角色新增 / 编辑弹窗（julyPermission 模块组件） */
import React, { useState, useEffect } from 'react';
import { Modal } from '@/components/Modal';
import { roleStore, type RoleDetail } from '@/stores/system011/julyRoleStore';

interface RoleFormModalProps {
  open: boolean;
  /** null = 新建 */
  role: RoleDetail | null;
  onClose: () => void;
}

export const RoleFormModal: React.FC<RoleFormModalProps> = ({ open, role, onClose }) => {
  const [form, setForm] = useState({ name: '', label: '', description: '' });

  useEffect(() => {
    if (!open) return;
    setForm({ name: role?.name || '', label: role?.label || '', description: role?.description || '' });
  }, [open, role]);

  const handleSave = () => {
    if (!form.label.trim()) return;
    if (role) {
      roleStore.updateRole(role.id, { label: form.label, description: form.description });
    } else {
      roleStore.addRole({ name: form.name, label: form.label, description: form.description, status: 'active', isBuiltin: false, permissions: [] });
    }
    onClose();
  };

  if (!open) return null;

  return (
    <Modal title={role ? '编辑角色' : '新建角色'} onClose={onClose} onSave={handleSave} width={420}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <div><div style={{ fontSize: '13px', marginBottom: '4px' }}>角色标识</div>
          <input className="form-input" style={{ width: '100%' }} value={form.name} disabled={!!role}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} /></div>
        <div><div style={{ fontSize: '13px', marginBottom: '4px' }}>角色名称 *</div>
          <input className="form-input" style={{ width: '100%' }} value={form.label}
            onChange={(e) => setForm((f) => ({ ...f, label: e.target.value }))} /></div>
        <div><div style={{ fontSize: '13px', marginBottom: '4px' }}>描述</div>
          <textarea className="form-input" style={{ width: '100%', height: '60px', resize: 'none' }} value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} /></div>
      </div>
    </Modal>
  );
};
