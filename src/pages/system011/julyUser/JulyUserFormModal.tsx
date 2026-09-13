/**
 * 用户新增 / 编辑弹窗（julyUser 模块组件）
 * 负责表单字段、校验、组织/角色选择；提交走 julyUserService.saveUser。
 */
import React, { useState, useEffect } from 'react';
import { saveUser } from '../../../services/system011';
import { OrgPickerModal } from '../../../components/OrgPickerModal';
import { RolePickerModal } from '../../../components/RolePickerModal';
import { toast } from '../../../utils/toast';
import { validateJulyUserForm } from '../../../utils/validate';
import type { RoleDetail, OrgTreeNode } from '../../../stores/system011/julyRoleStore';
import type { JulyUserView } from '../../../types/view';

interface JulyUserFormModalProps {
  open: boolean;
  /** null = 新增，非空 = 编辑 */
  user: JulyUserView | null;
  roles: RoleDetail[];
  orgTree: OrgTreeNode[];
  onClose: () => void;
  /** 保存成功后回调（由页面刷新角色关联等） */
  onSaved: () => void;
}

const emptyForm = { username: '', realName: '', email: '', phone: '', password: '' };

export const JulyUserFormModal: React.FC<JulyUserFormModalProps> = ({
  open, user, roles, orgTree, onClose, onSaved,
}) => {
  const [form, setForm] = useState(emptyForm);
  const [formDept, setFormDept] = useState<{ id: string | null; name: string }>({ id: null, name: '' });
  const [formRoleIds, setFormRoleIds] = useState<string[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [orgPicker, setOrgPicker] = useState(false);
  const [rolePicker, setRolePicker] = useState(false);

  // 打开 / 切换用户时回填表单
  useEffect(() => {
    if (!open) return;
    if (user) {
      setForm({ username: user.username, realName: user.realName, email: user.email, phone: user.phone, password: '' });
      setFormDept({ id: user.departmentId, name: user.department });
      setFormRoleIds(user.roles.map((name) => roles.find((r) => r.name === name)?.id).filter((id): id is string => id != null));
    } else {
      setForm(emptyForm);
      setFormDept({ id: null, name: '' });
      setFormRoleIds([]);
    }
    setErrors({});
  }, [open, user, roles]);

  const inputStyle = (field: string): React.CSSProperties => ({
    width: '100%', height: '38px', padding: '0 12px',
    border: errors[field] ? '1px solid var(--danger)' : '1px solid var(--border)',
    borderRadius: 'var(--radius)', fontSize: '14px', outline: 'none',
  });

  const handleSave = async () => {
    if (saving) return;
    const e = validateJulyUserForm(form, {
      isEdit: !!user,
      department: formDept.name,
      roleIds: formRoleIds,
    });
    setErrors(e);
    if (Object.keys(e).length > 0) return;

    setSaving(true);
    const isEdit = !!user;
    try {
      const id = await saveUser({
        id: user?.id,
        userAccount: form.username.trim(),
        userName: form.realName.trim(),
        password: form.password,
        mobile: form.phone.trim(),
        email: form.email.trim(),
        pkOrg: formDept.id || undefined,
      }, formRoleIds);
      toast.success(`${isEdit ? 'update' : 'insert'} ${id} success ...`);
      onSaved();
      onClose();
    } catch (err: any) {
      const msg = err?.message || '保存失败';
      toast.error(msg);
      setErrors((prev) => ({ ...prev, _global: msg }));
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;

  return (
    <>
      <div
        style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}
        onClick={onClose}
      >
        <div
          style={{ width: '520px', maxHeight: '85vh', overflowY: 'auto', background: '#fff', borderRadius: '12px', padding: '20px' }}
          onClick={(e) => e.stopPropagation()}
        >
          <div style={{ fontSize: '16px', fontWeight: 600, marginBottom: '16px' }}>
            {user ? '编辑用户' : '新建用户'}
          </div>

          {errors._global && (
            <div style={{ padding: '8px 12px', marginBottom: '12px', background: '#fff2f0', border: '1px solid #ffccc7', borderRadius: '8px', fontSize: '13px', color: 'var(--danger)' }}>
              ⚠ {errors._global}
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ display: 'flex', gap: '12px' }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '13px', marginBottom: '4px' }}>用户名 {!user && '*'}</div>
                <input style={inputStyle('username')} value={form.username} disabled={!!user}
                  onChange={(e) => setForm((f) => ({ ...f, username: e.target.value }))} placeholder="请输入用户名" />
                {errors.username && <div style={{ fontSize: '12px', color: 'var(--danger)', marginTop: '2px' }}>{errors.username}</div>}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '13px', marginBottom: '4px' }}>姓名 *</div>
                <input style={inputStyle('realName')} value={form.realName}
                  onChange={(e) => setForm((f) => ({ ...f, realName: e.target.value }))} placeholder="请输入姓名" />
                {errors.realName && <div style={{ fontSize: '12px', color: 'var(--danger)', marginTop: '2px' }}>{errors.realName}</div>}
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '13px', marginBottom: '4px' }}>邮箱 *</div>
                <input style={inputStyle('email')} value={form.email}
                  onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} placeholder="请输入邮箱" />
                {errors.email && <div style={{ fontSize: '12px', color: 'var(--danger)', marginTop: '2px' }}>{errors.email}</div>}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '13px', marginBottom: '4px' }}>手机号 *</div>
                <input style={inputStyle('phone')} value={form.phone}
                  onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} placeholder="请输入手机号" />
                {errors.phone && <div style={{ fontSize: '12px', color: 'var(--danger)', marginTop: '2px' }}>{errors.phone}</div>}
              </div>
            </div>

            {/* 组织：弹窗选择 */}
            <div>
              <div style={{ fontSize: '13px', marginBottom: '4px' }}>组织 *</div>
              <div
                onClick={() => setOrgPicker(true)}
                style={{
                  ...inputStyle('department'), display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  cursor: 'pointer', color: formDept.name ? 'var(--text-primary)' : 'var(--text-muted)',
                }}
              >
                <span>{formDept.name || '请选择组织'}</span>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>▾</span>
              </div>
              {errors.department && <div style={{ fontSize: '12px', color: 'var(--danger)', marginTop: '2px' }}>{errors.department}</div>}
            </div>

            {/* 角色：弹窗多选 */}
            <div>
              <div style={{ fontSize: '13px', marginBottom: '4px' }}>角色 * <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>（可多选，保存时整存替换）</span></div>
              <div
                onClick={() => setRolePicker(true)}
                style={{
                  ...inputStyle('roles'), display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px',
                  cursor: 'pointer', minHeight: '38px', height: 'auto', padding: '6px 12px',
                }}
              >
                {formRoleIds.length === 0 ? (
                  <span style={{ color: 'var(--text-muted)' }}>请选择角色</span>
                ) : (
                  <span style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                    {formRoleIds.map((id) => {
                      const role = roles.find((r) => r.id === id);
                      return <span key={id} className="status-badge" style={{ background: '#f0f5ff', color: '#597ef7' }}>{role?.label || id}</span>;
                    })}
                  </span>
                )}
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>▾</span>
              </div>
              {errors.roles && <div style={{ fontSize: '12px', color: 'var(--danger)', marginTop: '2px' }}>{errors.roles}</div>}
            </div>

            {!user && (
              <div>
                <div style={{ fontSize: '13px', marginBottom: '4px' }}>密码 *</div>
                <input style={inputStyle('password')} type="password" value={form.password}
                  onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))} placeholder="至少6位" />
                {errors.password && <div style={{ fontSize: '12px', color: 'var(--danger)', marginTop: '2px' }}>{errors.password}</div>}
              </div>
            )}
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
            <button className="btn btn-default" onClick={onClose}>取消</button>
            <button className="btn btn-primary" onClick={handleSave} disabled={saving}>{saving ? '保存中...' : '保存'}</button>
          </div>
        </div>
      </div>

      {orgPicker && (
        <OrgPickerModal
          title="选择组织"
          tree={orgTree}
          selectedId={formDept.id}
          onConfirm={(id, name) => { setFormDept({ id, name }); setErrors((e) => ({ ...e, department: '' })); setOrgPicker(false); }}
          onCancel={() => setOrgPicker(false)}
        />
      )}

      {rolePicker && (
        <RolePickerModal
          title="选择角色"
          roles={roles}
          selectedIds={formRoleIds}
          onConfirm={(ids) => { setFormRoleIds(ids); setErrors((e) => ({ ...e, roles: '' })); setRolePicker(false); }}
          onCancel={() => setRolePicker(false)}
        />
      )}
    </>
  );
};
