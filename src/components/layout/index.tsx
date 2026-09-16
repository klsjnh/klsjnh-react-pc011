/** 布局容器：antd Layout（Header + Sider + Content） */
import React from 'react';
import { Layout } from 'antd';
import { useNavMenus } from '@/stores/system011/julyMenuStore';
import type { SidebarLayoutProps } from '@/types/view/layout';
import { Top } from '@/components/layout/Top';
import { Left } from '@/components/layout/Left';

export const SidebarLayout = ({ children, currentPath, onNavigate }: SidebarLayoutProps) => {
  const menus = useNavMenus();

  // 面包屑：一级菜单 + 其直接子级（只比对两层）
  const breadcrumb = (() => {
    const labels: string[] = [];
    menus.forEach((m) => {
      if (m.path === currentPath) labels.push(m.label);
      if (m.children) {
        const sub = m.children.find((c) => c.path === currentPath);
        if (sub) {
          labels.push(m.label);
          labels.push(sub.label);
        }
      }
    });
    return labels.length > 0 ? labels.join(' / ') : '仪表盘';
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
