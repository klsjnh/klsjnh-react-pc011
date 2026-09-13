/**
 * 登录后主界面（Home）：hash 路由分发 + 侧边栏布局
 * 登录判定由 App.tsx 负责；本组件仅在已登录时挂载。
 */
import React, { useState, useEffect, Suspense, lazy } from 'react';
import { SidebarLayout } from '@/components/layout';
import { menuStore } from '@/stores/system011/julyMenuStore';
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
const BusinessPlaceholderPage = lazy(() => import('../BusinessPlaceholderPage').then(m => ({ default: m.BusinessPlaceholderPage })));

const BUSINESS_TITLES: Record<string, string> = {
  config: '配置管理', scheduler: '定时任务', datasource: '数据源管理',
  storage: '存储中心', params: '参数设置', dict: '字典管理',
  template: '通知模板', push: '消息推送', stats: '数据统计',
  trend: '趋势分析', charts: '图表展示', export: '数据导出',
  dashboard: '数据大屏', calc: '数据计算', query: '数据查询',
  monitor: '系统监控', online: '在线用户', cache: '缓存管理',
  servicelog: '服务日志',
};

const BUSINESS_PAGES: Record<string, React.FC<any>> = {
  config: ConfigPage, scheduler: SchedulerPage, dict: DictPage,
  monitor: MonitorPage, online: OnlineUsersPage, cache: CachePage,
  datasource: DataSourcePage, storage: StoragePage, params: ParamsPage,
  template: TemplatePage, push: PushPage, stats: StatsPage,
  trend: TrendPage, charts: ChartsPage, export: ExportPage,
  dashboard: DashboardScreenPage, calc: CalcPage, query: QueryPage,
  servicelog: ServiceLogPage,
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
  const [currentPath, setCurrentPath] = useState(() => {
    const hash = window.location.hash.replace('#', '');
    return hash || DEFAULT_ROUTE;
  });

  const handleNavigate = (path: string) => {
    setCurrentPath(path);
    window.history.pushState({}, '', `#${path}`);
  };

  useEffect(() => {
    // 登录后进入主界面：重新拉取菜单（清缓存，避免上次会话残留）
    menuStore.reload();
    const handlePopState = () => {
      const hash = window.location.hash.replace('#', '');
      setCurrentPath(hash || DEFAULT_ROUTE);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const renderPage = () => {
    // 业务子路由（已实现 → 真实页面，未实现 → 占位页）
    if (currentPath.startsWith('/business/')) {
      const action = currentPath.split('/')[2] || '';
      const RealPage = BUSINESS_PAGES[action];
      if (RealPage) return <RealPage />;
      return <BusinessPlaceholderPage title={BUSINESS_TITLES[action] || '业务功能'} path={currentPath} />;
    }
    const PageComponent = PAGE_MAP[currentPath] || DashboardPage;
    return <PageComponent onNavigate={handleNavigate} />;
  };

  return (
    <SidebarLayout currentPath={currentPath} onNavigate={handleNavigate}>
      <Suspense fallback={<div className="page-loading">加载中...</div>}>
        {renderPage()}
      </Suspense>
    </SidebarLayout>
  );
};
