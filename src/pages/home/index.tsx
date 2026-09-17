/**
 * 登录后主界面（Home）：hash 路由分发 + 侧边栏布局
 *
 * 设计原则：
 *   - 路径常量 + 路由→组件映射统一来自 @/config/routes（单一可信来源）
 *   - 本文件仅负责：渲染分发 + onNavigate 注入 + 动态路由（元数据/业务建模编辑）
 */
import React, { useEffect, Suspense } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

import { SidebarLayout } from '@/components/layout';
import { reloadMenus } from '@/services/system011';
import {
  LOWCODE011_ROUTES,
  DATASERVICE011_ROUTES,
  DEFAULT_ROUTE,
  PAGE_MAP,
  BUSINESS_PAGES,
  DATA_BABY_PAGES,
  PERSONAL_PAGES,
  DYNAMIC_ROUTES,
  DashboardPage,
  type PageNavProps,
} from '@/config/routes';

export const Home = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const currentPath = location.pathname || DEFAULT_ROUTE;

  useEffect(() => {
    reloadMenus();
  }, []);

  const renderPage = () => {
    // Business 子路由
    if (currentPath.startsWith('/business/')) {
      const action = currentPath.split('/')[2] || '';
      const RealPage = BUSINESS_PAGES[action];
      return RealPage ? <RealPage /> : <DashboardPage />;
    }

    // 数据宝宝子路由
    if (currentPath.startsWith('/data-baby/')) {
      const action = currentPath.split('/')[2] || '';
      const RealPage = DATA_BABY_PAGES[action];
      return RealPage ? <RealPage /> : <DashboardPage />;
    }

    // 个人中心子路由
    if (currentPath.startsWith('/personal/')) {
      const action = currentPath.split('/')[2] || '';
      const RealPage = PERSONAL_PAGES[action];
      return RealPage ? <RealPage /> : <DashboardPage />;
    }

    // 元数据编辑动态路由：/lowcode011/JulyMetadata/:id
    if (currentPath !== LOWCODE011_ROUTES.julyMetadata && currentPath.startsWith(LOWCODE011_ROUTES.julyMetadata + '/')) {
      const suffix = currentPath.slice(LOWCODE011_ROUTES.julyMetadata.length + 1);
      if (suffix && suffix !== 'new') {
        const Comp = DYNAMIC_ROUTES.JulyMetadataFormPage;
        return <Comp id={suffix} onNavigate={(p: string) => navigate(p)} />;
      }
    }

    // 业务建模编辑动态路由：/dataService011/JulyBusinessModeling/:id
    if (currentPath !== DATASERVICE011_ROUTES.julyBusinessModeling && currentPath.startsWith(DATASERVICE011_ROUTES.julyBusinessModeling + '/')) {
      const suffix = currentPath.slice(DATASERVICE011_ROUTES.julyBusinessModeling.length + 1);
      if (suffix && suffix !== 'new') {
        const Comp = DYNAMIC_ROUTES.JulyBusinessModelingFormPage;
        return <Comp id={suffix} onNavigate={(p: string) => navigate(p)} />;
      }
    }

    const OnNavigate = { onNavigate: (p: string) => navigate(p) } as PageNavProps;
    const Page = PAGE_MAP[currentPath] || DashboardPage;
    return <Page {...OnNavigate} />;
  };

  return (
    <SidebarLayout currentPath={currentPath} onNavigate={(p) => navigate(p)}>
      <Suspense fallback={<div className="page-loading">加载中...</div>}>
        {renderPage()}
      </Suspense>
    </SidebarLayout>
  );
};
