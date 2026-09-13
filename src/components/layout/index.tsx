/**
 * PC 端布局容器：组装顶栏（Top）+ 侧边栏（Left）+ 内容区（面包屑 + children）
 * 侧边栏菜单来源见 julyMenuStore.useNavMenus（全局配置 / 接口）。
 */
import React from 'react';
import { useUiState } from '@/stores/uiStore';
import { useNavMenus } from '@/stores/system011/julyMenuStore';
import { Top } from './top';
import { Left } from './left';

interface SidebarLayoutProps {
  children: React.ReactNode;
  currentPath: string;
  onNavigate: (path: string) => void;
}

export const SidebarLayout: React.FC<SidebarLayoutProps> = ({ children, currentPath, onNavigate }) => {
  const collapsed = useUiState().sidebarCollapsed;
  const menus = useNavMenus();

  const breadcrumb = (() => {
    const parts: string[] = [];
    menus.forEach((m) => {
      if (m.path === currentPath) parts.push(m.label);
      if (m.children) {
        const child = m.children.find((c) => c.path === currentPath);
        if (child) { parts.push(m.label); parts.push(child.label); }
      }
    });
    return parts.length > 0 ? parts.join(' / ') : '仪表盘';
  })();

  return (
    <div className={`pc-layout ${collapsed ? 'collapsed' : ''}`}>
      <Top onNavigate={onNavigate} />
      <div className="pc-body">
        <Left menus={menus} currentPath={currentPath} collapsed={collapsed} onNavigate={onNavigate} />
        <main className="pc-content">
          <div className="content-breadcrumb">{breadcrumb}</div>
          {children}
        </main>
      </div>
    </div>
  );
};
