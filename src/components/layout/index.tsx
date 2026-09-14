/** 布局容器：antd Layout（Header + Sider + Content） */
import React from 'react';
import { Layout } from 'antd';
import { useNavMenus } from '@/stores/system011/julyMenuStore';
import type { SidebarLayoutProps } from '@/types/view/layout';
import { Top } from '@/components/layout/Top';
import { Left } from '@/components/layout/Left';

export const SidebarLayout = ({ children, currentPath, onNavigate }: SidebarLayoutProps) => {
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
    <Layout className="app-layout">
      <Top onNavigate={onNavigate} />
      <Layout>
        <Left currentPath={currentPath} onNavigate={onNavigate} />
        <Layout.Content className="layout-content">
          <div className="content-breadcrumb">{breadcrumb}</div>
          {children}
        </Layout.Content>
      </Layout>
    </Layout>
  );
};
