/**
 * PC 端应用根组件（完整功能 · Mock 数据）
 */
import React, { useState, useEffect, Suspense, lazy } from 'react';
import { LoginPage } from './pages/LoginPage';
import { SidebarLayout } from './components/layout/SidebarLayout';
import { useIsAuthenticated } from './stores/authStore';
import { menuStore } from './stores/menuStore';

// 懒加载页面
const DashboardPage = lazy(() => import('./pages/DashboardPage').then(m => ({ default: m.DashboardPage })));
// 系统管理模块（pages/system011/）
const julyUser = lazy(() => import('./pages/system011/julyUser').then(m => ({ default: m.julyUser })));
const julyMenu = lazy(() => import('./pages/system011/julyMenu').then(m => ({ default: m.julyMenu })));
const julyPermission = lazy(() => import('./pages/system011/julyPermission').then(m => ({ default: m.julyPermission })));
const julyOrganization = lazy(() => import('./pages/system011/julyOrganization').then(m => ({ default: m.julyOrganization })));
const AuditPage = lazy(() => import('./pages/management-pages').then(m => ({ default: m.AuditPage })));
const SettingsPage = lazy(() => import('./pages/management-pages').then(m => ({ default: m.SettingsPage })));

// 业务功能页
const BusinessPage = lazy(() => import('./pages/BusinessPage').then(m => ({ default: m.BusinessPage })));
const ConfigPage = lazy(() => import('./pages/business-pages').then(m => ({ default: m.ConfigPage })));
const SchedulerPage = lazy(() => import('./pages/business-pages').then(m => ({ default: m.SchedulerPage })));
const DictPage = lazy(() => import('./pages/business-pages').then(m => ({ default: m.DictPage })));
const MonitorPage = lazy(() => import('./pages/business-pages').then(m => ({ default: m.MonitorPage })));
const OnlineUsersPage = lazy(() => import('./pages/business-pages').then(m => ({ default: m.OnlineUsersPage })));
const CachePage = lazy(() => import('./pages/business-pages').then(m => ({ default: m.CachePage })));
const DataSourcePage = lazy(() => import('./pages/business-pages').then(m => ({ default: m.DataSourcePage })));
const StoragePage = lazy(() => import('./pages/business-pages').then(m => ({ default: m.StoragePage })));
const ParamsPage = lazy(() => import('./pages/business-pages').then(m => ({ default: m.ParamsPage })));
const TemplatePage = lazy(() => import('./pages/business-pages').then(m => ({ default: m.TemplatePage })));
const PushPage = lazy(() => import('./pages/business-pages').then(m => ({ default: m.PushPage })));
const StatsPage = lazy(() => import('./pages/business-pages').then(m => ({ default: m.StatsPage })));
const TrendPage = lazy(() => import('./pages/business-pages').then(m => ({ default: m.TrendPage })));
const ChartsPage = lazy(() => import('./pages/business-pages').then(m => ({ default: m.ChartsPage })));
const ExportPage = lazy(() => import('./pages/business-pages').then(m => ({ default: m.ExportPage })));
const DashboardScreenPage = lazy(() => import('./pages/business-pages').then(m => ({ default: m.DashboardScreenPage })));
const CalcPage = lazy(() => import('./pages/business-pages').then(m => ({ default: m.CalcPage })));
const QueryPage = lazy(() => import('./pages/business-pages').then(m => ({ default: m.QueryPage })));
const ServiceLogPage = lazy(() => import('./pages/business-pages').then(m => ({ default: m.ServiceLogPage })));

// 其他页面
const ReportsPage = lazy(() => import('./pages/ReportsPage').then(m => ({ default: m.ReportsPage })));
const NotificationsPage = lazy(() => import('./pages/NotificationsPage').then(m => ({ default: m.NotificationsPage })));
const HelpPage = lazy(() => import('./pages/HelpPage').then(m => ({ default: m.HelpPage })));
const AboutPage = lazy(() => import('./pages/AboutPage').then(m => ({ default: m.AboutPage })));
const ProfilePage = lazy(() => import('./pages/ProfilePage').then(m => ({ default: m.ProfilePage })));
const BusinessPlaceholderPage = lazy(() => import('./pages/BusinessPlaceholderPage').then(m => ({ default: m.BusinessPlaceholderPage })));

export const App: React.FC = () => {
  const isAuthenticated = useIsAuthenticated();
  const [currentPath, setCurrentPath] = useState(() => {
    const hash = window.location.hash.replace('#', '');
    return hash || '/dashboard';
  });

  const handleNavigate = (path: string) => {
    setCurrentPath(path);
    window.history.pushState({}, '', `#${path}`);
  };

  useEffect(() => {
    menuStore.load();
    const handlePopState = () => {
      const hash = window.location.hash.replace('#', '');
      setCurrentPath(hash || '/dashboard');
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // 登录态变化（未登录 → 已登录）时，API 模式下用新拿到的 token 重新拉菜单树
  useEffect(() => {
    if (isAuthenticated) menuStore.reload();
  }, [isAuthenticated]);

  if (!isAuthenticated) {
    return <LoginPage />;
  }

  const renderPage = () => {
    // 业务子路由（已实现 → 真实页面，未实现 → 占位页）
    if (currentPath.startsWith('/business/')) {
      const action = currentPath.split('/')[2] || '';
      const titleMap: Record<string, string> = {
        config: '配置管理', scheduler: '定时任务', datasource: '数据源管理',
        storage: '存储中心', params: '参数设置', dict: '字典管理',
        template: '通知模板', push: '消息推送', stats: '数据统计',
        trend: '趋势分析', charts: '图表展示', export: '数据导出',
        dashboard: '数据大屏', calc: '数据计算', query: '数据查询',
        monitor: '系统监控', online: '在线用户', cache: '缓存管理',
        servicelog: '服务日志',
      };
      const title = titleMap[action] || '业务功能';

      const realPages: Record<string, React.FC<any>> = {
        config: ConfigPage, scheduler: SchedulerPage, dict: DictPage,
        monitor: MonitorPage, online: OnlineUsersPage, cache: CachePage,
        datasource: DataSourcePage, storage: StoragePage, params: ParamsPage,
        template: TemplatePage, push: PushPage, stats: StatsPage,
        trend: TrendPage, charts: ChartsPage, export: ExportPage,
        dashboard: DashboardScreenPage, calc: CalcPage, query: QueryPage,
        servicelog: ServiceLogPage,
      };
      const RealPage = realPages[action];
      if (RealPage) return <RealPage />;
      return <BusinessPlaceholderPage title={title} path={currentPath} />;
    }

    const pageMap: Record<string, React.FC<any>> = {
      '/dashboard': DashboardPage,
      '/user': julyUser,
      '/menu': julyMenu,
      '/permission': julyPermission,
      '/organization': julyOrganization,
      '/audit': AuditPage,
      '/settings': SettingsPage,
      '/business': BusinessPage,
      '/reports': ReportsPage,
      '/notifications': NotificationsPage,
      '/help': HelpPage,
      '/about': AboutPage,
      '/profile': ProfilePage,
    };

    const PageComponent = pageMap[currentPath] || DashboardPage;
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
