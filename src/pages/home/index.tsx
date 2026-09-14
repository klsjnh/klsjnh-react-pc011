/**
 * 登录后主界面（Home）：hash 路由分发 + 侧边栏布局
 * 登录判定由 App.tsx 负责；本组件仅在已登录时挂载。
 */
import React, { useEffect, Suspense, lazy } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { SidebarLayout } from '@/components/layout';
import { reloadMenus } from '@/services/system011';
import { SYSTEM011_ROUTES, DEFAULT_ROUTE } from '@/config/routes';

// 懒加载页面
const DashboardPage = lazy(() => import('../DashboardPage').then(m => ({ default: m.DashboardPage })));
// 系统管理模块（system011/）
const julyUser = lazy(() => import('../system011/julyUser').then(m => ({ default: m.julyUser })));
const julyMenu = lazy(() => import('../system011/julyMenu').then(m => ({ default: m.julyMenu })));
const julyPermission = lazy(() => import('../system011/julyPermission').then(m => ({ default: m.julyPermission })));
const julyOrganization = lazy(() => import('../system011/julyOrganization').then(m => ({ default: m.julyOrganization })));
const AuditPage = lazy(() => import('../management-pages').then(m => ({ default: m.AuditPage })));
const SettingsPage = lazy(() => import('../management-pages').then(m => ({ default: m.SettingsPage })));

// 业务功能页
const BusinessPage = lazy(() => import('../BusinessPage').then(m => ({ default: m.BusinessPage })));
const ConfigPage = lazy(() => import('../business-pages').then(m => ({ default: m.ConfigPage })));
const SchedulerPage = lazy(() => import('../business-pages').then(m => ({ default: m.SchedulerPage })));
const DictPage = lazy(() => import('../business-pages').then(m => ({ default: m.DictPage })));
const MonitorPage = lazy(() => import('../business-pages').then(m => ({ default: m.MonitorPage })));
const OnlineUsersPage = lazy(() => import('../business-pages').then(m => ({ default: m.OnlineUsersPage })));
const CachePage = lazy(() => import('../business-pages').then(m => ({ default: m.CachePage })));
const DataSourcePage = lazy(() => import('../business-pages').then(m => ({ default: m.DataSourcePage })));
const StoragePage = lazy(() => import('../business-pages').then(m => ({ default: m.StoragePage })));
const ParamsPage = lazy(() => import('../business-pages').then(m => ({ default: m.ParamsPage })));
const TemplatePage = lazy(() => import('../business-pages').then(m => ({ default: m.TemplatePage })));
const PushPage = lazy(() => import('../business-pages').then(m => ({ default: m.PushPage })));
const StatsPage = lazy(() => import('../business-pages').then(m => ({ default: m.StatsPage })));
const TrendPage = lazy(() => import('../business-pages').then(m => ({ default: m.TrendPage })));
const ChartsPage = lazy(() => import('../business-pages').then(m => ({ default: m.ChartsPage })));
const ExportPage = lazy(() => import('../business-pages').then(m => ({ default: m.ExportPage })));
const DashboardScreenPage = lazy(() => import('../business-pages').then(m => ({ default: m.DashboardScreenPage })));
const CalcPage = lazy(() => import('../business-pages').then(m => ({ default: m.CalcPage })));
const QueryPage = lazy(() => import('../business-pages').then(m => ({ default: m.QueryPage })));
const ServiceLogPage = lazy(() => import('../business-pages').then(m => ({ default: m.ServiceLogPage })));

// 其他页面
const ReportsPage = lazy(() => import('../ReportsPage').then(m => ({ default: m.ReportsPage })));
const NotificationsPage = lazy(() => import('../NotificationsPage').then(m => ({ default: m.NotificationsPage })));
const HelpPage = lazy(() => import('../HelpPage').then(m => ({ default: m.HelpPage })));
const AboutPage = lazy(() => import('../AboutPage').then(m => ({ default: m.AboutPage })));
const ProfilePage = lazy(() => import('../ProfilePage').then(m => ({ default: m.ProfilePage })));

// 数据宝宝（暂用 BusinessPage 占位）
const DataOverviewPage = lazy(() => import('../BusinessPage').then(m => ({ default: m.BusinessPage })));
const DataQueryPage = lazy(() => import('../BusinessPage').then(m => ({ default: m.BusinessPage })));

// 个人中心
const MyProfilePage = lazy(() => import('../ProfilePage').then(m => ({ default: m.ProfilePage })));
const MySettingsPage = lazy(() => import('../management-pages').then(m => ({ default: m.SettingsPage })));

const BUSINESS_PAGES: Record<string, React.FC<any>> = {
  config: ConfigPage, scheduler: SchedulerPage, dict: DictPage,
  monitor: MonitorPage, online: OnlineUsersPage, cache: CachePage,
  datasource: DataSourcePage, storage: StoragePage, params: ParamsPage,
  template: TemplatePage, push: PushPage, stats: StatsPage,
  trend: TrendPage, charts: ChartsPage, export: ExportPage,
  dashboard: DashboardScreenPage, calc: CalcPage, query: QueryPage,
  servicelog: ServiceLogPage,
};

const DATA_BABY_PAGES: Record<string, React.FC<any>> = {
  overview: DataOverviewPage,
  query: DataQueryPage,
};

const PERSONAL_PAGES: Record<string, React.FC<any>> = {
  profile: MyProfilePage,
  settings: MySettingsPage,
};

const PAGE_MAP: Record<string, React.FC<any>> = {
  '/dashboard': DashboardPage,
  [SYSTEM011_ROUTES.julyUser]: julyUser,
  [SYSTEM011_ROUTES.julyMenu]: julyMenu,
  [SYSTEM011_ROUTES.julyPermission]: julyPermission,
  [SYSTEM011_ROUTES.julyOrganization]: julyOrganization,
  '/audit': AuditPage,
  '/settings': SettingsPage,
  '/business': BusinessPage,
  '/reports': ReportsPage,
  '/notifications': NotificationsPage,
  '/help': HelpPage,
  '/about': AboutPage,
  '/profile': ProfilePage,
};

export const Home: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const currentPath = location.pathname || DEFAULT_ROUTE;

  useEffect(() => {
    // 登录后进入主界面：重新拉取菜单（清缓存，避免上次会话残留）
    reloadMenus();
  }, []);

  const renderPage = () => {
    // 业务子路由：19 个子页均已实现，未知 action 回退仪表盘
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
    const PageComponent = PAGE_MAP[currentPath] || DashboardPage;
    return <PageComponent onNavigate={(p: string) => navigate(p)} />;
  };

  return (
    <SidebarLayout currentPath={currentPath} onNavigate={(p) => navigate(p)}>
      <Suspense fallback={<div className="page-loading">加载中...</div>}>
        {renderPage()}
      </Suspense>
    </SidebarLayout>
  );
};
