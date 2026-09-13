/**
 * 用户列表页 - PC 端
 * 数据来源：真实后端 julyUser/v1/*（mock 模式走 src/mock/system011.ts 同名 action，两模式同形）
 *
 * 已对齐的接口：
 *  - selectListByPage  分页查询（userAccount 账号模糊 / userName 姓名精确）
 *  - insert            新增（userAccount + userName + password 必填）
 *  - update            修改资料（不含账号与密码）
 *  - assignRoles       分配角色（整存替换 pkRoles）
 *
 * 操作列仅保留「编辑」与「停用/启用」（按需求裁剪；删除/重置密码已移除）。
 *
 * 说明：用户→角色关系后端由 assignRoles 维护，列表接口不返回角色，
 *      因此角色列为前端关系数据（mockRelations.userRoles）展示。
 */
import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { roleStore, useRoleState } from '../../stores/roleStore';
import { OrgPickerModal } from '../../components/OrgPickerModal';
import { RolePickerModal } from '../../components/RolePickerModal';
import { toast } from '../../utils/toast';
import {
  selectUserListByPage, insertUser, updateUser, assignUserRoles,
} from '../../services/system011';
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
  lastLoginTime: string;
}

/** 后端 JulyUserVo011 → 页面 UI User（角色来自前端关系数据，组织名来自后端组织树） */
function toUI(u: JulyUserVo011, orgNameById: Map<string, string>): User {
  return {
    id: u.id,
    username: u.userAccount,
    realName: u.userName,
    email: u.email || '',
    phone: u.mobile || '',
    department: u.pkOrg ? (orgNameById.get(u.pkOrg) || '') : '',
    departmentId: u.pkOrg || null,
    roles: mockRelations.userRoles(u.userAccount),
    status: u.status === '1' ? 'active' : 'inactive',
    createdAt: (u.createTime || '').slice(0, 10),
    lastLoginTime: u.lastLoginTime ? u.lastLoginTime.replace('T', ' ').slice(0, 19) : '—',
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
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [serverMode, setServerMode] = useState(false);
  const pageSize = 10;

  /** 组织 id → 名称（由后端组织树建立，用于「组织」列展示） */
  const orgNameById = useMemo(() => {
    const m = new Map<string, string>();
    const walk = (list: typeof orgTree) => {
      for (const o of list) { m.set(o.id, o.name); if (o.children) walk(o.children); }
    };
    walk(orgTree);
    return m;
  }, [orgTree]);

  // 新增/编辑弹窗
  const [formModal, setFormModal] = useState<{ visible: boolean; user: User | null }>({ visible: false, user: null });
  const [form, setForm] = useState({ username: '', realName: '', email: '', phone: '', password: '' });
  const [formDept, setFormDept] = useState<{ id: string | null; name: string }>({ id: null, name: '' });
  const [formRoleIds, setFormRoleIds] = useState<string[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [orgPicker, setOrgPicker] = useState(false);
  const [rolePicker, setRolePicker] = useState(false);

  /** 成功/失败提示 → 全局 toast 浮层（对齐老项目 message.success / message.error） */
  const flash = (msg: string) => {
    const isOk = msg.startsWith('✅');
    const content = msg.replace(/^[✅⚠]\s*/, '');
    if (isOk) toast.success(content);
    else toast.error(content);
  };

  /**
   * 拉取列表。注意两点（修「修改不生效」）：
   *  1) 用 ref 保存「当前实际生效的查询参数」，避免保存后 reload 命中 useCallback 旧闭包；
   *  2) 角色列来自 mockRelations（列表接口不返回角色），保存后必须 invalidate 该关系缓存。
   */
  const queryRef = useRef<{ page: number; keyword: string }>({ page: 1, keyword: '' });
  const [reloadFlag, setReloadFlag] = useState(0);

  const load = useCallback(async () => {
    const q = queryRef.current;
    try {
      const res = await selectUserListByPage({
        pageIndex: q.keyword ? 1 : q.page,
        pageSize: q.keyword ? 100 : pageSize,
        userAccount: q.keyword || undefined,
      });
      setUsers(res.rows.map((u) => toUI(u, orgNameById)));
      setTotal(res.total);
      setTotalPages(res.totalPages || 1);
      setServerMode(true);
    } catch {
      setUsers([]);
      setTotal(0);
      setTotalPages(1);
    }
  }, [reloadFlag, orgNameById]);

  // 同步查询参数到 ref，并在参数变化时触发重新加载
  useEffect(() => {
    queryRef.current = { page, keyword };
    setReloadFlag(f => f + 1);
  }, [page, keyword]);

  useEffect(() => { roleStore.load(); }, []);
  useEffect(() => { load(); }, [load]);

  /** 状态过滤为纯前端（后端用户查询无 status 字段） */
  const displayed = users.filter(u => !statusFilter || u.status === statusFilter);
  const pageData = keyword ? displayed.slice((page - 1) * pageSize, page * pageSize) : displayed;

  const roleLabel = (name: string) => roles.find(r => r.name === name)?.label || name;

  // ==================== 停用 / 启用 ====================

  /** 启停用：真实后端 update 不含 status，mock 里同样不提供 → 仅前端提示 */
  const toggleStatus = (id: string) => {
    setUsers(prev => prev.map(u => u.id === id ? { ...u, status: u.status === 'active' ? 'inactive' : 'active' } : u));
    flash('✅ 状态已切换（仅本地展示；后端 status 由专门接口维护）');
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

  const handleSave = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      let okMsg = '';
      if (formModal.user) {
        // 编辑：update 只提交资料字段（不含账号与密码）
        const { id } = await updateUser({
          id: formModal.user.id,
          userName: form.realName.trim(),
          mobile: form.phone.trim(),
          email: form.email.trim(),
          pkOrg: formDept.id || undefined,
        });
        // 角色：整存替换
        await assignUserRoles(formModal.user.id, formRoleIds);
        okMsg = `update ${id} success`; // 对齐后端 message 文案
      } else {
        // 新增：insert 返回新 id，随后分配角色
        const { id } = await insertUser({
          userAccount: form.username.trim(),
          userName: form.realName.trim(),
          password: form.password,
          mobile: form.phone.trim(),
          email: form.email.trim(),
          pkOrg: formDept.id || undefined,
        });
        if (id && formRoleIds.length > 0) await assignUserRoles(id, formRoleIds);
        okMsg = `insert ${id} success`;
        setPage(1);
      }
      setFormModal({ visible: false, user: null });
      // 保存成功提示（对齐老项目：message.success(`${msg} ...`)）
      flash(`✅ ${okMsg} ...`);
      // 重新拉取：用户列表 + 组织/角色关联（角色列依赖关系缓存）
      await roleStore.reload();
      setReloadFlag(f => f + 1);
    } catch (e: any) {
      // 失败提示（对齐老项目：message.error(err)）
      flash(`⚠ ${e?.message || '保存失败'}`);
      setErrors({ _global: e?.message || '保存失败' });
    } finally {
      setSaving(false);
    }
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
        <p>共 {total} 个用户 · 接口 /julyUser/v1/{serverMode ? 'selectListByPage' : '—'}</p>
      </div>

      <div className="page-toolbar">
        <div className="toolbar-left">
          <input className="form-input" placeholder="搜索用户名" style={{ width: '240px' }}
            value={keyword} onChange={(e) => { setKeyword(e.target.value); setPage(1); }} />
          <select className="form-select" value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}>
            <option value="">全部状态</option>
            <option value="active">正常</option>
            <option value="inactive">停用</option>
          </select>
        </div>
        <div className="toolbar-right">
          <button className="btn btn-primary" onClick={openCreate}>+ 新建用户</button>
        </div>
      </div>

      <div className="table-wrapper">
        <table className="data-table">
          <thead>
            <tr>
              <th>用户名</th><th>姓名</th><th>邮箱</th><th>手机号</th><th>组织</th><th>角色</th><th>状态</th><th>最近登录</th><th style={{ width: '120px' }}>操作</th>
            </tr>
          </thead>
          <tbody>
            {pageData.length === 0 ? (
              <tr><td colSpan={9} style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)' }}>暂无数据</td></tr>
            ) : (
              pageData.map(user => (
                <tr key={user.id}>
                  <td style={{ fontWeight: 500 }}>{user.username}</td>
                  <td>{user.realName}</td>
                  <td style={{ color: 'var(--text-muted)' }}>{user.email || '—'}</td>
                  <td style={{ color: 'var(--text-muted)' }}>{user.phone || '—'}</td>
                  <td>{user.department || '—'}</td>
                  <td>
                    <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                      {user.roles.length === 0
                        ? <span style={{ color: 'var(--text-muted)', fontSize: '12px' }}>—</span>
                        : user.roles.map(name => (
                            <span key={name} className="status-badge" style={{ background: '#f0f5ff', color: '#597ef7' }}>{roleLabel(name)}</span>
                          ))}
                    </div>
                  </td>
                  <td><span className={`status-badge status-${user.status}`}>{user.status === 'active' ? '正常' : '停用'}</span></td>
                  <td style={{ color: 'var(--text-muted)', fontSize: '12px' }}>{user.lastLoginTime}</td>
                  <td>
                    <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                      <button className="btn-link" onClick={() => openEdit(user)}>编辑</button>
                      <button className="btn-link" onClick={() => toggleStatus(user.id)}>{user.status === 'active' ? '停用' : '启用'}</button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="pagination-bar">
        <span className="page-info">共 {total} 条</span>
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

            {errors._global && (
              <div style={{ padding: '8px 12px', marginBottom: '12px', background: '#fff2f0', border: '1px solid #ffccc7', borderRadius: '8px', fontSize: '13px', color: 'var(--danger)' }}>
                ⚠ {errors._global}
              </div>
            )}

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
              <button className="btn btn-primary" onClick={handleSave} disabled={saving}>{saving ? '保存中...' : '保存'}</button>
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
