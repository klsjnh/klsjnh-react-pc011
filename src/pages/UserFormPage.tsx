/**
 * 用户新建/编辑表单页 - 移动端（角色多选）
 */
import React, { useState, useEffect, useMemo } from 'react';
import { PageHeader } from '../components';
import { roleStore, useRoleState } from '../stores/roleStore';

interface UserFormPageProps {
  userId?: number;
  onBack: () => void;
  onSaved?: () => void;
}

export const UserFormPage: React.FC<UserFormPageProps> = ({ userId, onBack, onSaved }) => {
  const isEdit = !!userId;
  const { roles } = useRoleState();
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    username: '', realName: '', email: '', phone: '',
    department: '', password: '',
  });
  const [selectedRoleIds, setSelectedRoleIds] = useState<Set<number>>(new Set());
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => { roleStore.load(); }, []);

  useEffect(() => {
    if (userId) {
      // 从 roleStore 获取用户已关联的角色
      const role = roles.find(r => r.userIds.includes(userId));
      if (role) setSelectedRoleIds(new Set([role.id]));
      // 模拟加载用户数据
      setLoading(false);
    }
  }, [userId, roles]);

  const validate = (): boolean => {
    const e: Record<string, string> = {};
    if (!form.realName?.trim()) e.realName = '请输入姓名';
    if (!form.email?.trim()) e.email = '请输入邮箱';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = '邮箱格式不正确';
    if (!form.phone?.trim()) e.phone = '请输入手机号';
    else if (!/^1[3-9]\d{9}$/.test(form.phone)) e.phone = '手机号格式不正确';
    if (!form.department?.trim()) e.department = '请选择部门';
    if (selectedRoleIds.size === 0) e.roles = '请至少选择一个角色';
    if (!isEdit && !form.password?.trim()) e.password = '请输入密码';
    else if (!isEdit && form.password && form.password.length < 6) e.password = '密码至少6位';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setSaving(true);
    // 保存角色关联
    selectedRoleIds.forEach(roleId => {
      roleStore.addUserToRole(roleId, userId || Date.now());
    });
    await new Promise(r => setTimeout(r, 600));
    setSaving(false);
    if (onSaved) onSaved();
    onBack();
  };

  const toggleRole = (roleId: number) => {
    setSelectedRoleIds(prev => {
      const next = new Set(prev);
      if (next.has(roleId)) next.delete(roleId); else next.add(roleId);
      return next;
    });
  };

  if (loading) return <div className="loading-state">加载中...</div>;

  const departments = ['技术中心', '产品部', '运营部', '市场部', '财务部', '人力资源部'];

  const inputStyle = (field: string) => ({
    width: '100%', height: '40px', padding: '0 12px',
    border: errors[field] ? '1px solid var(--danger)' : '1px solid var(--border)',
    borderRadius: 'var(--radius)', fontSize: '16px', outline: 'none',
  });

  return (
    <div className="page">
      <PageHeader title={isEdit ? '编辑用户' : '新建用户'} onBack={onBack} />

      <div style={{ background: 'var(--bg-card)', borderRadius: 'var(--radius)', padding: '16px', marginBottom: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {!isEdit && (
            <div>
              <div style={{ fontSize: '13px', fontWeight: 500, marginBottom: '4px' }}>用户名 *</div>
              <input style={inputStyle('username')} value={form.username} onChange={e => setForm(f => ({ ...f, username: e.target.value }))} placeholder="请输入用户名" />
            </div>
          )}
          <div>
            <div style={{ fontSize: '13px', fontWeight: 500, marginBottom: '4px' }}>姓名 *</div>
            <input style={inputStyle('realName')} value={form.realName} onChange={e => setForm(f => ({ ...f, realName: e.target.value }))} placeholder="请输入姓名" />
            {errors.realName && <div style={{ fontSize: '12px', color: 'var(--danger)', marginTop: '2px' }}>{errors.realName}</div>}
          </div>
          <div>
            <div style={{ fontSize: '13px', fontWeight: 500, marginBottom: '4px' }}>邮箱 *</div>
            <input style={inputStyle('email')} value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="请输入邮箱" />
            {errors.email && <div style={{ fontSize: '12px', color: 'var(--danger)', marginTop: '2px' }}>{errors.email}</div>}
          </div>
          <div>
            <div style={{ fontSize: '13px', fontWeight: 500, marginBottom: '4px' }}>手机号 *</div>
            <input style={inputStyle('phone')} value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="请输入手机号" />
            {errors.phone && <div style={{ fontSize: '12px', color: 'var(--danger)', marginTop: '2px' }}>{errors.phone}</div>}
          </div>
          <div>
            <div style={{ fontSize: '13px', fontWeight: 500, marginBottom: '4px' }}>部门 *</div>
            <select style={inputStyle('department')} value={form.department || ''} onChange={e => setForm(f => ({ ...f, department: e.target.value }))}>
              <option value="">请选择部门</option>
              {departments.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
            {errors.department && <div style={{ fontSize: '12px', color: 'var(--danger)', marginTop: '2px' }}>{errors.department}</div>}
          </div>

          {/* 角色多选 */}
          <div>
            <div style={{ fontSize: '13px', fontWeight: 500, marginBottom: '6px' }}>
              角色 * <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 400 }}>（可多选）</span>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {roles.map(role => {
                const checked = selectedRoleIds.has(role.id);
                return (
                  <button
                    key={role.id}
                    onClick={() => toggleRole(role.id)}
                    style={{
                      padding: '8px 14px', borderRadius: '20px', fontSize: '13px',
                      border: '1px solid ' + (checked ? 'var(--primary)' : 'var(--border)'),
                      background: checked ? '#e6f7ff' : '#fff',
                      color: checked ? 'var(--primary)' : 'var(--text-secondary)',
                      cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px',
                    }}
                  >
                    {checked && <span>✓</span>}
                    {role.label}
                    <span style={{ fontSize: '10px', opacity: 0.6 }}>{role.name}</span>
                  </button>
                );
              })}
            </div>
            {errors.roles && <div style={{ fontSize: '12px', color: 'var(--danger)', marginTop: '4px' }}>{errors.roles}</div>}
          </div>

          {!isEdit && (
            <div>
              <div style={{ fontSize: '13px', fontWeight: 500, marginBottom: '4px' }}>密码 *</div>
              <input style={inputStyle('password')} type="password" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} placeholder="至少6位" />
              {errors.password && <div style={{ fontSize: '12px', color: 'var(--danger)', marginTop: '2px' }}>{errors.password}</div>}
            </div>
          )}
        </div>
      </div>

      {/* 操作按钮 */}
      <div style={{ display: 'flex', gap: '10px' }}>
        <button onClick={onBack} style={{ flex: 1, height: '40px', background: '#fff', color: 'var(--text-secondary)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', fontSize: '14px', cursor: 'pointer' }}>取消</button>
        <button onClick={handleSave} disabled={saving} style={{ flex: 1, height: '40px', background: saving ? '#a0c4ff' : 'var(--primary)', color: '#fff', border: 'none', borderRadius: 'var(--radius)', fontSize: '14px', cursor: saving ? 'not-allowed' : 'pointer' }}>
          {saving ? '保存中...' : '保存'}
        </button>
      </div>
    </div>
  );
};
