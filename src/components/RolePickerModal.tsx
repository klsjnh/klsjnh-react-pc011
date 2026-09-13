/**
 * 角色多选弹窗 - PC 端
 */
import React, { useState } from 'react';
import type { RoleDetail } from '../stores/system011/julyRoleStore';

interface RolePickerModalProps {
  title?: string;
  roles: RoleDetail[];
  /** 当前已选角色 ID（用于回显勾选） */
  selectedIds: string[];
  onConfirm: (ids: string[]) => void;
  onCancel: () => void;
}

export const RolePickerModal: React.FC<RolePickerModalProps> = ({
  title = '选择角色', roles, selectedIds, onConfirm, onCancel,
}) => {
  const [picked, setPicked] = useState<Set<string>>(new Set(selectedIds));

  const toggle = (id: string) => {
    setPicked(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  };

  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100 }}
      onClick={onCancel}
    >
      <div
        style={{ width: '420px', maxHeight: '70vh', background: '#fff', borderRadius: '12px', padding: '20px', display: 'flex', flexDirection: 'column' }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{ fontSize: '16px', fontWeight: 600, marginBottom: '12px' }}>
          {title}
          <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 400, marginLeft: '8px' }}>可多选 · 已选 {picked.size} 个</span>
        </div>
        <div style={{ flex: 1, overflowY: 'auto', border: '1px solid var(--border)', borderRadius: 'var(--radius)', minHeight: '200px' }}>
          {roles.map(role => {
            const checked = picked.has(role.id);
            return (
              <div
                key={role.id}
                onClick={() => toggle(role.id)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 14px',
                  cursor: 'pointer', borderBottom: '1px solid var(--border-light)',
                  background: checked ? '#e6f7ff' : 'transparent',
                }}
              >
                <input type="checkbox" checked={checked} readOnly />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '13px', fontWeight: 500 }}>
                    🛡 {role.label}
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginLeft: '6px' }}>({role.name})</span>
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{role.description}</div>
                </div>
                <span className={`status-badge status-${role.status}`}>
                  {role.status === 'active' ? '启用' : '停用'}
                </span>
              </div>
            );
          })}
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '16px' }}>
          <button className="btn btn-default" onClick={onCancel}>取消</button>
          <button className="btn btn-primary" onClick={() => onConfirm(Array.from(picked))}>确定</button>
        </div>
      </div>
    </div>
  );
};
