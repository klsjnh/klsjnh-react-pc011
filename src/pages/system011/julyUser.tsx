/**
 * 用户列表页 - PC 端
 * 数据来源：统一 mock 后端 /julyUser/v1/selectListByPage（真实 JulyUserVo011 形状）
 * 角色/组织关系为前端专用（mockRelations），不在后端契约内。
 */
import React, { useState, useEffect } from 'react';
import { roleStore, useRoleState } from '../../stores/roleStore';
import { OrgPickerModal } from '../../components/OrgPickerModal';
import { RolePickerModal } from '../../components/RolePickerModal';
import { selectUserListByPage } from '../../services/system011';
import { mockRelations } from '../../mock/system011';
import type { JulyUserVo011 } from '../../types/system011';

interface User {
  id: string;
  username: string;
  realName: string;
  email: string;
  phone: string;
  department: string;
  departmentId: string | null;
  roles: string[];
  status: 'active' | 'inactive';
  createdAt: string;
}

/** 后端 JulyUserVo011 → 页面 UI User（角色/部门来自前端关系数据） */
function toUI(u: JulyUserVo011): User {
  return {
    id: u.id,
    username: u.userAccount,
    realName: u.userName,
    email: u.email || '',
    phone: u.mobile || '',
    department: mockRelations.orgName(u.pkOrg || undefined),
    departmentId: u.pkOrg || null,
    roles: mockRelations.userRoles(u.userAccount),
    status: u.status === '1' ? 'active' : 'inactive',
    createdAt: (u.createTime || '').slice(0, 10),
  };
}

interface UserListPageProps {
  onNavigate?: (path: string) => void;
}

export const julyUser: React.FC<UserListPageProps> = () => {
  const { roles, orgTree } = useRoleState();
  const [users, setUsers] = useState<User[]>([]);
  const [keyword, setKeyword] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const pageSize = 10;

  // 新增/编辑弹窗
  const [formModal, setFormModal] = useState<{ visible: boolean; user: User | null }>({ visible: false, user: null });
  const [form, setForm] = useState({ username: '', realName: '', email: '', phone: '', password: '' });
  const [formDept, setFormDept] = useState<{ id: string | null; name: string }>({ id: null, name: '' });
  const [formRoleIds, setFormRoleIds] = useState<string[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [orgPicker, setOrgPicker] = useState(false);
  const [rolePicker, setRolePicker] = useState(false);

  useEffect(() => {
    roleStore.load();
    selectUserListByPage({ pageIndex: 1, pageSize: 100 }).then((page) => {
      setUsers(page.rows.map(toUI));
    }).catch(() => setUsers([]));
  }, []);

  const roleLabel = (name: string) => roles.find(r => r.name === name)?.label || name;

  const filtered = users.filter(u =>
    (!keyword || u.username.includes(keyword) || u.realName.includes(keyword) || u.email.includes(keyword)) &&
    (!statusFilter || u.status === statusFilter)
  );
  const totalPages = Math.ceil(filtered.length / pageSize) || 1;
  const pageData = filtered.slice((page - 1) * pageSize, page * pageSize);

  const handleDelete = (id: string) => {
    if (!window.confirm('确定删除该用户吗？')) return;
    setUsers(prev => prev.filter(u => u.id !== id));
  };

  const toggleStatus = (id: string) => {
    setUsers(prev => prev.map(u => u.id === id ? { ...u, status: u.status === 'active' ? 'inactive' : 'active' } : u));
  };

  // ==================== 弹窗表单 ====================

  const openCreate = () => {
    setForm({ username: '', realName: '', email: '', phone: '', password: '' });
    setFormDept({ id: null, name: '' });
    setFormRoleIds([]);
    setErrors({});
    setFormModal({ visible: true, user: null });
  };

  const openEdit = (user: User) => {
    setForm({ username: user.username, realName: user.realName, email: user.email, phone: user.phone, password: '' });
    setFormDept({ id: user.departmentId, name: user.department });
    setFormRoleIds(user.roles.map(name => roles.find(r => r.name === name)?.id).filter((id): id is string => id != null));
    setErrors({});
    setFormModal({ visible: true, user });
  };

  const validate = (): boolean => {
    const e: Record<string, string> = {};
    if (!formModal.user && !form.username.trim()) e.username = '请输入用户名';
    if (!form.realName.trim()) e.realName = '请输入姓名';
    if (!form.email.trim()) e.email = '请输入邮箱';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = '邮箱格式不正确';
    if (!form.phone.trim()) e.phone = '请输入手机号';
    else if (!/^1[3-9]\d{9}$/.test(form.phone)) e.phone = '手机号格式不正确';
    if (!formDept.name) e.department = '请选择组织';
    if (formRoleIds.length === 0) e.roles = '请至少选择一个角色';
    if (!formModal.user) {
      if (!form.password.trim()) e.password = '请输入密码';
      else if (form.password.length < 6) e.password = '密码至少6位';
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = () => {
    if (!validate()) return;
    const roleNames = formRoleIds
      .map(id => roles.find(r => r.id === id)?.name)
      .filter((name): name is string => !!name);
    if (formModal.user) {
      const target = formModal.user;
      setUsers(prev => prev.map(u => u.id === target.id ? {
        ...u, username: form.username, realName: form.realName, email: form.email, phone: form.phone,
        department: formDept.name, departmentId: formDept.id, roles: roleNames,
      } : u));
    } else {
      const newUser: User = {
        id: 'tmp-user-' + Date.now(), username: form.username, realName: form.realName, email: form.email, phone: form.phone,
        department: formDept.name, departmentId: formDept.id, roles: roleNames,
        status: 'active', createdAt: new Date().toISOString().slice(0, 10),
      };
      setUsers(prev => [newUser, ...prev]);
      setPage(1);
    }
    setFormModal({ visible: false, user: null });
  };

  const inputStyle = (field: string): React.CSSProperties => ({
    width: '100%', height: '38px', padding: '0 12px',
    border: errors[field] ? '1px solid var(--danger)' : '1px solid var(--border)',
    borderRadius: 'var(--radius)', fontSize: '14px', outline: 'none',
  });

  return (
    <div>
      <div className="page-header">
        <h2>用户管理</h2>
        <p>共 {filtered.length} 个用户 · Mock 数据</p>
      </div>

      <div className="page-toolbar">
        <div className="toolbar-left">
          <input className="form-input" placeholder="搜索用户名/姓名/邮箱" style={{ width: '240px' }}
            value={keyword} onChange={(e) => { setKeyword(e.target.value); setPage(1); }} />
          <select className="form-select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="">全部状态</option>
            <option value="active">正常</option>
            <option value="inactive">停用</option>
          </select>
        </div>
        <div className="toolbar-right">
          {selectedIds.length > 0 && (
            <span style={{ fontSize: '13px', color: 'var(--primary)' }}>已选 {selectedIds.length} 项</span>
          )}
          <button className="btn btn-primary" onClick={openCreate}>+ 新建用户</button>
        </div>
      </div>

      <div className="table-wrapper">
        <table className="data-table">
          <thead>
            <tr>
              <th style={{ width: '40px' }}>
                <input type="checkbox" checked={selectedIds.length === pageData.length && pageData.length > 0}
                  onChange={(e) => setSelectedIds(e.target.checked ? pageData.map(u => u.id) : [])} />
              </th>
              <th>ID</th><th>用户名</th><th>姓名</th><th>邮箱</th><th>组织</th><th>角色</th><th>状态</th><th>创建时间</th><th style={{ width: '160px' }}>操作</th>
            </tr>
          </thead>
          <tbody>
            {pageData.length === 0 ? (
              <tr><td colSpan={10} style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)' }}>暂无数据</td></tr>
            ) : (
              pageData.map(user => (
                <tr key={user.id}>
                  <td><input type="checkbox" checked={selectedIds.includes(user.id)}
                    onChange={(e) => setSelectedIds(e.target.checked ? [...selectedIds, user.id] : selectedIds.filter(id => id !== user.id))} /></td>
                  <td>{user.id}</td>
                  <td>{user.username}</td>
                  <td style={{ fontWeight: 500 }}>{user.realName}</td>
                  <td style={{ color: 'var(--text-muted)' }}>{user.email}</td>
                  <td>{user.department}</td>
                  <td>
                    <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                      {user.roles.map(name => (
                        <span key={name} className="status-badge" style={{ background: '#f0f5ff', color: '#597ef7' }}>{roleLabel(name)}</span>
                      ))}
                    </div>
                  </td>
                  <td><span className={`status-badge status-${user.status}`}>{user.status === 'active' ? '正常' : '停用'}</span></td>
                  <td style={{ color: 'var(--text-muted)' }}>{user.createdAt}</td>
                  <td>
                    <div style={{ display: 'flex', gap: '4px' }}>
                      <button className="btn-link" onClick={() => openEdit(user)}>编辑</button>
                      <button className="btn-link" onClick={() => toggleStatus(user.id)}>{user.status === 'active' ? '停用' : '启用'}</button>
                      <button className="btn-link danger" onClick={() => handleDelete(user.id)}>删除</button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="pagination-bar">
        <span className="page-info">共 {filtered.length} 条</span>
        <button className="page-btn" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>上一页</button>
        <span className="page-info">{page} / {totalPages}</span>
        <button className="page-btn" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>下一页</button>
      </div>

      {/* ===== 新增/编辑用户弹窗 ===== */}
      {formModal.visible && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}
          onClick={() => setFormModal({ visible: false, user: null })}
        >
          <div
            style={{ width: '520px', maxHeight: '85vh', overflowY: 'auto', background: '#fff', borderRadius: '12px', padding: '20px' }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ fontSize: '16px', fontWeight: 600, marginBottom: '16px' }}>
              {formModal.user ? '编辑用户' : '新建用户'}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'flex', gap: '12px' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '13px', marginBottom: '4px' }}>用户名 {!formModal.user && '*'}</div>
                  <input style={inputStyle('username')} value={form.username} disabled={!!formModal.user}
                    onChange={e => setForm(f => ({ ...f, username: e.target.value }))} placeholder="请输入用户名" />
                  {errors.username && <div style={{ fontSize: '12px', color: 'var(--danger)', marginTop: '2px' }}>{errors.username}</div>}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '13px', marginBottom: '4px' }}>姓名 *</div>
                  <input style={inputStyle('realName')} value={form.realName}
                    onChange={e => setForm(f => ({ ...f, realName: e.target.value }))} placeholder="请输入姓名" />
                  {errors.realName && <div style={{ fontSize: '12px', color: 'var(--danger)', marginTop: '2px' }}>{errors.realName}</div>}
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '13px', marginBottom: '4px' }}>邮箱 *</div>
                  <input style={inputStyle('email')} value={form.email}
                    onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="请输入邮箱" />
                  {errors.email && <div style={{ fontSize: '12px', color: 'var(--danger)', marginTop: '2px' }}>{errors.email}</div>}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '13px', marginBottom: '4px' }}>手机号 *</div>
                  <input style={inputStyle('phone')} value={form.phone}
                    onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="请输入手机号" />
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
                <div style={{ fontSize: '13px', marginBottom: '4px' }}>角色 * <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>（可多选）</span></div>
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
                      {formRoleIds.map(id => {
                        const role = roles.find(r => r.id === id);
                        return <span key={id} className="status-badge" style={{ background: '#f0f5ff', color: '#597ef7' }}>{role?.label || id}</span>;
                      })}
                    </span>
                  )}
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>▾</span>
                </div>
                {errors.roles && <div style={{ fontSize: '12px', color: 'var(--danger)', marginTop: '2px' }}>{errors.roles}</div>}
              </div>

              {!formModal.user && (
                <div>
                  <div style={{ fontSize: '13px', marginBottom: '4px' }}>密码 *</div>
                  <input style={inputStyle('password')} type="password" value={form.password}
                    onChange={e => setForm(f => ({ ...f, password: e.target.value }))} placeholder="至少6位" />
                  {errors.password && <div style={{ fontSize: '12px', color: 'var(--danger)', marginTop: '2px' }}>{errors.password}</div>}
                </div>
              )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
              <button className="btn btn-default" onClick={() => setFormModal({ visible: false, user: null })}>取消</button>
              <button className="btn btn-primary" onClick={handleSave}>保存</button>
            </div>
          </div>
        </div>
      )}

      {/* 组织选择弹窗 */}
      {orgPicker && (
        <OrgPickerModal
          title="选择组织"
          tree={orgTree}
          selectedId={formDept.id}
          onConfirm={(id, name) => { setFormDept({ id, name }); setErrors(e => ({ ...e, department: '' })); setOrgPicker(false); }}
          onCancel={() => setOrgPicker(false)}
        />
      )}

      {/* 角色多选弹窗 */}
      {rolePicker && (
        <RolePickerModal
          title="选择角色"
          roles={roles}
          selectedIds={formRoleIds}
          onConfirm={(ids) => { setFormRoleIds(ids); setErrors(e => ({ ...e, roles: '' })); setRolePicker(false); }}
          onCancel={() => setRolePicker(false)}
        />
      )}
    </div>
  );
};
