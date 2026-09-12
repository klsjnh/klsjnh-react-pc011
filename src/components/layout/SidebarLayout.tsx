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
      { path: '/menus', label: '菜单管理', icon: '📋' },
      { path: '/departments', label: '组织管理', icon: '🏢' },
      { path: '/users', label: '用户管理', icon: '👥' },
      { path: '/permissions', label: '权限管理', icon: '🔑' },
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
          <span className="header-user">
            <img
              className="header-avatar"
              src={user?.avatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=default'}
              alt=""
            />
            <span className="header-username">{user?.realName || '未登录'}</span>
          </span>
          <button className="header-logout" onClick={handleLogout}>退出</button>
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
    </div>
  );
};
