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
    if (labels.length > 0) return labels.join(' / ');

    // 前缀兜底：二级页自己派生的子页面（如 /storageCenter/fileList/edit）没有独立菜单项，
    // 取「菜单路径是当前路径前缀」里最长的那个，归到它的菜单名下 —— 否则会回退成「仪表盘」。
    const candidates: { parent: string; child: string; len: number }[] = [];
    menus.forEach((m) => {
      (m.children || []).forEach((c) => {
        if (c.path && currentPath.startsWith(`${c.path}/`)) {
          candidates.push({ parent: m.label, child: c.label, len: c.path.length });
        }
      });
    });
    candidates.sort((a, b) => b.len - a.len);
    const hit = candidates[0];
    return hit ? `${hit.parent} / ${hit.child}` : '仪表盘';
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
