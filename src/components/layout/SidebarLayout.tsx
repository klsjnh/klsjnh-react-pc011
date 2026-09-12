/**
 * PC 端侧边栏布局（顶栏 + 侧边栏 + 内容区）
 */
import React, { useState } from 'react';
import { useCurrentUser, authStore } from '@/stores/authStore';

interface SidebarLayoutProps {
  children: React.ReactNode;
  currentPath: string;
  onNavigate: (path: string) => void;
}

interface NavItem {
  path: string;
  label: string;
  icon: string;
  children?: NavItem[];
}

const navMenus: NavItem[] = [
  { path: '/dashboard', label: '仪表盘', icon: '📊' },
  {
    path: '/system',
    label: '系统管理',
    icon: '⚙️',
    children: [
      { path: '/menu', label: '菜单管理', icon: '📋' },
      { path: '/organization', label: '组织管理', icon: '🏢' },
      { path: '/user', label: '用户管理', icon: '👥' },
      { path: '/permission', label: '权限管理', icon: '🔑' },
    ],
  },
  { path: '/business', label: '业务中心', icon: '💼' },
  { path: '/reports', label: '数据报表', icon: '📈' },
  {
    path: '/tools',
    label: '系统工具',
    icon: '🛠',
    children: [
      { path: '/notifications', label: '消息通知', icon: '🔔' },
      { path: '/audit', label: '审计日志', icon: '📝' },
      { path: '/settings', label: '系统设置', icon: '⚙️' },
      { path: '/help', label: '帮助反馈', icon: '❓' },
      { path: '/about', label: '关于系统', icon: 'ℹ️' },
    ],
  },
  { path: '/profile', label: '个人中心', icon: '👤' },
];

export const SidebarLayout: React.FC<SidebarLayoutProps> = ({
  children,
  currentPath,
  onNavigate,
}) => {
  const [collapsed, setCollapsed] = useState(false);
  const [expandedMenus, setExpandedMenus] = useState<Set<string>>(new Set(['/system', '/monitor']));
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [pwdModal, setPwdModal] = useState(false);
  const [pwdForm, setPwdForm] = useState({ oldPwd: '', newPwd: '', confirmPwd: '' });
  const [pwdError, setPwdError] = useState('');
  const user = useCurrentUser();

  const toggleExpand = (path: string) => {
    setExpandedMenus((prev) => {
      const next = new Set(prev);
      if (next.has(path)) next.delete(path);
      else next.add(path);
      return next;
    });
  };

  const handleLogout = () => {
    if (window.confirm('确定要退出登录吗？')) {
      authStore.logout();
    }
  };

  const handleSavePwd = () => {
    if (!pwdForm.oldPwd || !pwdForm.newPwd || !pwdForm.confirmPwd) { setPwdError('请填写完整'); return; }
    if (pwdForm.newPwd.length < 6) { setPwdError('新密码至少 6 位'); return; }
    if (pwdForm.newPwd !== pwdForm.confirmPwd) { setPwdError('两次输入的新密码不一致'); return; }
    setPwdModal(false);
    setPwdForm({ oldPwd: '', newPwd: '', confirmPwd: '' });
    setPwdError('');
    window.alert('密码修改成功');
  };

  const menuItemStyle: React.CSSProperties = {
    display: 'block', width: '100%', textAlign: 'left', padding: '9px 14px',
    background: 'none', border: 'none', fontSize: '13px', cursor: 'pointer',
    color: 'var(--text-primary)', borderRadius: '4px',
  };

  const renderNavItem = (item: NavItem, depth = 0) => {
    const isActive = currentPath === item.path;
    const isExpanded = expandedMenus.has(item.path);
    const hasChildren = item.children && item.children.length > 0;

    return (
      <div key={item.path}>
        <div
          className={`sidebar-nav-item ${isActive ? 'active' : ''} depth-${depth}`}
          onClick={() => {
            if (hasChildren) toggleExpand(item.path);
            else onNavigate(item.path);
          }}
        >
          <span className="nav-icon">{item.icon}</span>
          {!collapsed && <span className="nav-label">{item.label}</span>}
          {!collapsed && hasChildren && (
            <span className={`nav-arrow ${isExpanded ? 'expanded' : ''}`}>▸</span>
          )}
        </div>
        {hasChildren && isExpanded && !collapsed && (
          <div className="sidebar-nav-children">
            {item.children!.map((child) => renderNavItem(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className={`pc-layout ${collapsed ? 'collapsed' : ''}`}>
      {/* 顶栏 */}
      <header className="pc-header">
        <div className="header-left">
          <span className="header-logo">🏢</span>
          <span className="header-title">企业管理系统</span>
        </div>
        <div className="header-right">
          <div style={{ position: 'relative' }}>
            <div
              className="header-user"
              onClick={() => setUserMenuOpen(o => !o)}
              style={{ cursor: 'pointer', userSelect: 'none', display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <img
                className="header-avatar"
                src={user?.avatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=default'}
                alt=""
              />
              <span className="header-username">{user?.realName || '未登录'}</span>
              <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>▾</span>
            </div>

            {/* 用户下拉菜单 */}
            {userMenuOpen && (
              <>
                <div style={{ position: 'fixed', inset: 0, zIndex: 1300 }} onClick={() => setUserMenuOpen(false)} />
                <div style={{
                  position: 'absolute', right: 0, top: 'calc(100% + 8px)', zIndex: 1301,
                  background: '#fff', border: '1px solid var(--border)', borderRadius: '8px',
                  boxShadow: '0 4px 16px rgba(0,0,0,0.15)', minWidth: '150px', padding: '4px',
                }}>
                  <button style={menuItemStyle}
                    onClick={() => { onNavigate('/profile'); setUserMenuOpen(false); }}>
                    👤 个人信息
                  </button>
                  <button style={menuItemStyle}
                    onClick={() => { setPwdForm({ oldPwd: '', newPwd: '', confirmPwd: '' }); setPwdError(''); setPwdModal(true); setUserMenuOpen(false); }}>
                    🔑 修改密码
                  </button>
                  <div style={{ height: '1px', background: 'var(--border-light)', margin: '4px 0' }} />
                  <button style={{ ...menuItemStyle, color: 'var(--danger)' }} onClick={handleLogout}>
                    🚪 退出登录
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </header>

      <div className="pc-body">
        {/* 侧边栏 */}
        <aside className="pc-sidebar">
          <nav className="sidebar-nav">
            {navMenus.map((item) => renderNavItem(item))}
          </nav>
          <div className="sidebar-footer">
            <button
              className="sidebar-toggle-btn"
              onClick={() => setCollapsed(!collapsed)}
            >
              {collapsed ? '▶' : '◀'} {!collapsed && '收起'}
            </button>
          </div>
        </aside>

        {/* 内容区 */}
        <main className="pc-content">
          <div className="content-breadcrumb">
            {(() => {
              const parts: string[] = [];
              navMenus.forEach((m) => {
                if (m.path === currentPath) parts.push(m.label);
                if (m.children) {
                  const child = m.children.find((c) => c.path === currentPath);
                  if (child) { parts.push(m.label); parts.push(child.label); }
                }
              });
              return parts.length > 0 ? parts.join(' / ') : '仪表盘';
            })()}
          </div>
          {children}
        </main>
      </div>

      {/* 修改密码弹窗 */}
      {pwdModal && (
        <div className="modal-overlay" onClick={() => setPwdModal(false)}>
          <div className="modal-container" style={{ width: '400px' }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>修改密码</h3>
              <button className="modal-close" onClick={() => setPwdModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {([['oldPwd', '原密码'], ['newPwd', '新密码（至少 6 位）'], ['confirmPwd', '确认新密码']] as const).map(([key, label]) => (
                  <div key={key}>
                    <div style={{ fontSize: '13px', marginBottom: '4px' }}>{label}</div>
                    <input
                      type="password"
                      style={{ width: '100%', height: '38px', padding: '0 12px', border: '1px solid var(--border)', borderRadius: 'var(--radius)', fontSize: '14px', outline: 'none' }}
                      value={pwdForm[key]}
                      onChange={e => setPwdForm(f => ({ ...f, [key]: e.target.value }))}
                    />
                  </div>
                ))}
                {pwdError && <div style={{ fontSize: '12px', color: 'var(--danger)' }}>{pwdError}</div>}
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-default" onClick={() => setPwdModal(false)}>取消</button>
              <button className="btn btn-primary" onClick={handleSavePwd}>保存</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
