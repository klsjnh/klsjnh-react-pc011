/**
 * 用户列表页 - PC 端（Mock 数据）
 */
import React, { useState } from 'react';

interface User {
  id: number;
  username: string;
  realName: string;
  email: string;
  department: string;
  role: string;
  status: 'active' | 'inactive';
  createdAt: string;
}

interface UserListPageProps {
  onNavigate?: (path: string) => void;
}

export const UserListPage: React.FC<UserListPageProps> = ({ onNavigate }) => {
  const [users, setUsers] = useState<User[]>(() =>
    Array.from({ length: 20 }, (_, i) => ({
      id: i + 1,
      username: `user${String(i + 1).padStart(3, '0')}`,
      realName: `用户${i + 1}`,
      email: `user${i + 1}@example.com`,
      department: ['技术中心', '产品部', '运营部', '市场部', '财务部'][i % 5],
      role: ['admin', 'manager', 'editor', 'viewer'][i % 4],
      status: (i % 5 === 4 ? 'inactive' : 'active') as User['status'],
      createdAt: `2026-0${(i % 9) + 1}-15`,
    }))
  );
  const [keyword, setKeyword] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const pageSize = 10;

  const filtered = users.filter(u =>
    (!keyword || u.username.includes(keyword) || u.realName.includes(keyword) || u.email.includes(keyword)) &&
    (!statusFilter || u.status === statusFilter)
  );
  const totalPages = Math.ceil(filtered.length / pageSize) || 1;
  const pageData = filtered.slice((page - 1) * pageSize, page * pageSize);

  const handleDelete = (id: number) => {
    if (!window.confirm('确定删除该用户吗？')) return;
    setUsers(prev => prev.filter(u => u.id !== id));
  };

  const toggleStatus = (id: number) => {
    setUsers(prev => prev.map(u => u.id === id ? { ...u, status: u.status === 'active' ? 'inactive' : 'active' } : u));
  };

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
          <button className="btn btn-primary" onClick={() => onNavigate?.('/user/create')}>+ 新建用户</button>
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
              <th>ID</th><th>用户名</th><th>姓名</th><th>邮箱</th><th>部门</th><th>角色</th><th>状态</th><th>创建时间</th><th style={{ width: '160px' }}>操作</th>
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
                  <td><span className="status-badge" style={{ background: '#f0f5ff', color: '#597ef7' }}>{user.role}</span></td>
                  <td><span className={`status-badge status-${user.status}`}>{user.status === 'active' ? '正常' : '停用'}</span></td>
                  <td style={{ color: 'var(--text-muted)' }}>{user.createdAt}</td>
                  <td>
                    <div style={{ display: 'flex', gap: '4px' }}>
                      <button className="btn-link" onClick={() => onNavigate?.(`/user/edit/${user.id}`)}>编辑</button>
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
    </div>
  );
};
