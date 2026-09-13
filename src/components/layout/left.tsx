/** 布局左侧：侧边栏导航（菜单由外部传入，来源见 config/global.ts / menuStore） */
import React, { useState } from 'react';
import { uiStore } from '@/stores/uiStore';
import type { NavItem } from '@/types/view/layout';

interface LeftProps {
  menus: NavItem[];
  currentPath: string;
  collapsed: boolean;
  onNavigate: (path: string) => void;
}

export const Left: React.FC<LeftProps> = ({ menus, currentPath, collapsed, onNavigate }) => {
  const [expandedMenus, setExpandedMenus] = useState<Set<string>>(new Set(['/system', '/monitor']));

  const toggleExpand = (path: string) => {
    setExpandedMenus((prev) => {
      const next = new Set(prev);
      if (next.has(path)) next.delete(path);
      else next.add(path);
      return next;
    });
  };

  const renderNavItem = (item: NavItem, depth = 0): React.ReactNode => {
    const isActive = currentPath === item.path;
    const isExpanded = expandedMenus.has(item.path);
    const hasChildren = !!item.children && item.children.length > 0;

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
    <aside className="pc-sidebar">
      <nav className="sidebar-nav">
        {menus.map((item) => renderNavItem(item))}
      </nav>
      <div className="sidebar-footer">
        <button className="sidebar-toggle-btn" onClick={() => uiStore.setSidebarCollapsed(!collapsed)}>
          {collapsed ? '▶' : '◀'} {!collapsed && '收起'}
        </button>
      </div>
    </aside>
  );
};
