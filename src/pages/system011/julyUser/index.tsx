/**
 * 用户列表页（julyUser）- PC 端
 * 列表读 julyUserStore；分页/保存调 julyUserService（新增/编辑弹窗见 JulyUserFormModal）。
 *
 * 已对齐接口：
 *  - selectListByPage  分页查询（userAccount 账号模糊）
 *  - insert/update/assignRoles  由 service.saveUser 编排
 *
 * 说明：用户→角色关系后端由 assignRoles 维护，列表接口不返回角色，
 *      因此角色列为前端关系数据（mockRelations.userRoles）展示。
 */
import React, { useState, useEffect, useMemo } from 'react';
import { roleStore, useRoleState } from '@/stores/system011/julyRoleStore';
import { useUserState } from '@/stores/system011/julyUserStore';
import { fetchUserPage } from '@/services/system011';
import { toast } from '@/utils/toast';
import { mockRelations } from '@/mock/system011';
import { JulyUserFormModal } from './JulyUserFormModal';
import type { JulyUserVo011 } from '@/types/system011';
import type { JulyUserView } from '@/types/view';

/** 后端 JulyUserVo011 → 页面 UI 视图（角色来自前端关系数据，组织名来自后端组织树） */
function toUI(u: JulyUserVo011, orgNameById: Map<string, string>): JulyUserView {
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
  const { list, total, totalPages, query } = useUserState();
  const [keyword, setKeyword] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  /** 启停用为本地展示（后端无启停接口），用覆盖表保留切换结果 */
  const [statusOverride, setStatusOverride] = useState<Record<string, JulyUserView['status']>>({});
  const [formModal, setFormModal] = useState<{ open: boolean; user: JulyUserView | null }>({ open: false, user: null });

  /** 组织 id → 名称（由后端组织树建立，用于「组织」列展示） */
  const orgNameById = useMemo(() => {
    const m = new Map<string, string>();
    const walk = (nodes: typeof orgTree) => {
      for (const o of nodes) { m.set(o.id, o.name); if (o.children) walk(o.children); }
    };
    walk(orgTree);
    return m;
  }, [orgTree]);

  useEffect(() => { roleStore.load(); }, []);
  useEffect(() => { fetchUserPage({ pageIndex: 1, pageSize: 10 }); }, []);

  /** 用户列表 UI 投影（组织名来自后端组织树，角色来自前端关系数据） */
  const users = useMemo(
    () => list.map((u) => {
      const ui = toUI(u, orgNameById);
      return statusOverride[u.id] ? { ...ui, status: statusOverride[u.id] } : ui;
    }),
    [list, orgNameById, statusOverride],
  );

  /** 状态过滤为纯前端（后端用户查询无 status 字段），作用于当前页 */
  const pageData = users.filter((u) => !statusFilter || u.status === statusFilter);

  const page = query.pageIndex;
  const pageSize = query.pageSize;
  const roleLabel = (name: string) => roles.find((r) => r.name === name)?.label || name;

  /** 启停用：真实后端 update 不含 status → 仅前端展示切换（本地覆盖） */
  const toggleStatus = (id: string) => {
    const cur = users.find((u) => u.id === id);
    if (!cur) return;
    setStatusOverride((prev) => ({ ...prev, [id]: cur.status === 'active' ? 'inactive' : 'active' }));
    toast.success('状态已切换（仅本地展示；后端无启停接口）');
  };

  return (
    <div>
      <div className="page-header">
        <h2>用户管理</h2>
        <p>共 {total} 个用户 · 接口 /julyUser/v1/selectListByPage</p>
      </div>

      <div className="page-toolbar">
        <div className="toolbar-left">
          <input className="form-input" placeholder="搜索用户名" style={{ width: '240px' }}
            value={keyword} onChange={(e) => { const v = e.target.value; setKeyword(v); fetchUserPage({ pageIndex: 1, userAccount: v || undefined }); }} />
          <select className="form-select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="">全部状态</option>
            <option value="active">正常</option>
            <option value="inactive">停用</option>
          </select>
        </div>
        <div className="toolbar-right">
          <button className="btn btn-primary" onClick={() => setFormModal({ open: true, user: null })}>+ 新建用户</button>
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
              pageData.map((user) => (
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
                        : user.roles.map((name) => (
                            <span key={name} className="status-badge" style={{ background: '#f0f5ff', color: '#597ef7' }}>{roleLabel(name)}</span>
                          ))}
                    </div>
                  </td>
                  <td><span className={`status-badge status-${user.status}`}>{user.status === 'active' ? '正常' : '停用'}</span></td>
                  <td style={{ color: 'var(--text-muted)', fontSize: '12px' }}>{user.lastLoginTime}</td>
                  <td>
                    <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                      <button className="btn-link" onClick={() => setFormModal({ open: true, user })}>编辑</button>
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
        <select
          className="form-select"
          style={{ width: 'auto', height: '32px' }}
          value={pageSize}
          onChange={(e) => { fetchUserPage({ pageIndex: 1, pageSize: Number(e.target.value) }); }}
        >
          <option value={10}>10 条/页</option>
          <option value={50}>50 条/页</option>
          <option value={100}>100 条/页</option>
        </select>
        <button className="page-btn" disabled={page <= 1} onClick={() => fetchUserPage({ pageIndex: page - 1 })}>上一页</button>
        <span className="page-info">{page} / {totalPages}</span>
        <button className="page-btn" disabled={page >= totalPages} onClick={() => fetchUserPage({ pageIndex: page + 1 })}>下一页</button>
      </div>

      <JulyUserFormModal
        open={formModal.open}
        user={formModal.user}
        roles={roles}
        orgTree={orgTree}
        onClose={() => setFormModal({ open: false, user: null })}
        onSaved={() => { roleStore.reload(); }}
      />
    </div>
  );
};
