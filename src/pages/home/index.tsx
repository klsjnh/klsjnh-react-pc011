/**
 * 登录后主界面（Home）：hash 路由分发 + 侧边栏布局
 * 登录判定由 App.tsx 负责；本组件仅在已登录时挂载。
 */
import React, { useEffect, Suspense, lazy } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { SidebarLayout } from '@/components/layout';
import { reloadMenus } from '@/services/system011';
import { SYSTEM011_ROUTES, DATASERVICE011_ROUTES, AI011_ROUTES, LOWCODE011_ROUTES, DEFAULT_ROUTE } from '@/config/routes';
import type { PageNavProps } from '@/types/view/page';

/**
 * 页面组件统一类型（懒加载组件，支持以字符串 key 索引）。
 * 路由分发统一注入 PageNavProps（onNavigate 可选）：需要跳转的页面取用，其余页面无参即可，
 * 因此无需 any 即可承载全部页面。
 */
type PageComponent = React.LazyExoticComponent<React.ComponentType<PageNavProps>>;

// 懒加载页面
const DashboardPage = lazy(() => import('@/pages/DashboardPage').then(m => ({ default: m.DashboardPage })));
// 系统管理模块（system011/）
const JulyUserPage = lazy(() => import('@/pages/system011/julyUser').then(m => ({ default: m.JulyUser })));
const JulyMenuPage = lazy(() => import('@/pages/system011/julyMenu').then(m => ({ default: m.JulyMenu })));
const JulyPermissionPage = lazy(() => import('@/pages/system011/julyPermission').then(m => ({ default: m.JulyPermission })));
const JulyOrganizationPage = lazy(() => import('@/pages/system011/julyOrganization').then(m => ({ default: m.JulyOrganization })));
const JulySchedulerPage = lazy(() => import('@/pages/system011/julyScheduler').then(m => ({ default: m.JulyScheduler })));
const JulyConfigPage = lazy(() => import('@/pages/system011/julyConfig').then(m => ({ default: m.JulyConfig })));
const JulyDictionaryPage = lazy(() => import('@/pages/system011/julyDictionary').then(m => ({ default: m.JulyDictionary })));
const AuditPage = lazy(() => import('@/pages/management-pages').then(m => ({ default: m.AuditPage })));

// 业务功能页
const BusinessPage = lazy(() => import('@/pages/BusinessPage').then(m => ({ default: m.BusinessPage })));
const DictPage = lazy(() => import('@/pages/business-pages').then(m => ({ default: m.DictPage })));
const MonitorPage = lazy(() => import('@/pages/business-pages').then(m => ({ default: m.MonitorPage })));
const OnlineUsersPage = lazy(() => import('@/pages/business-pages').then(m => ({ default: m.OnlineUsersPage })));
const CachePage = lazy(() => import('@/pages/business-pages').then(m => ({ default: m.CachePage })));
const JulyDatasourcePage = lazy(() => import('@/pages/dataService011/JulyDatasources').then(m => ({ default: m.JulyDatasource })));
const JulyBusinessModelingPage = lazy(() => import('@/pages/dataService011/JulyBusinessModeling').then(m => ({ default: m.JulyBusinessModeling })));
const JulyBusinessModelingFormPage = lazy(() => import('@/pages/dataService011/JulyBusinessModeling/ModelingFormPage').then(m => ({ default: m.ModelingFormPage })));
const JulyAiModelProviderPage = lazy(() => import('@/pages/ai011/JulyAiModelProvider').then(m => ({ default: m.JulyAiModelProvider })));
const JulyMetadataPage = lazy(() => import('@/pages/lowcode011/JulyMetadata').then(m => ({ default: m.JulyMetadata })));
const StoragePage = lazy(() => import('@/pages/business-pages').then(m => ({ default: m.StoragePage })));
const ParamsPage = lazy(() => import('@/pages/business-pages').then(m => ({ default: m.ParamsPage })));
const TemplatePage = lazy(() => import('@/pages/business-pages').then(m => ({ default: m.TemplatePage })));
const PushPage = lazy(() => import('@/pages/business-pages').then(m => ({ default: m.PushPage })));
const StatsPage = lazy(() => import('@/pages/business-pages').then(m => ({ default: m.StatsPage })));
const TrendPage = lazy(() => import('@/pages/business-pages').then(m => ({ default: m.TrendPage })));
const ChartsPage = lazy(() => import('@/pages/business-pages').then(m => ({ default: m.ChartsPage })));
const ExportPage = lazy(() => import('@/pages/business-pages').then(m => ({ default: m.ExportPage })));
const DashboardScreenPage = lazy(() => import('@/pages/business-pages').then(m => ({ default: m.DashboardScreenPage })));
const CalcPage = lazy(() => import('@/pages/business-pages').then(m => ({ default: m.CalcPage })));
const QueryPage = lazy(() => import('@/pages/business-pages').then(m => ({ default: m.QueryPage })));
const ServiceLogPage = lazy(() => import('@/pages/business-pages').then(m => ({ default: m.ServiceLogPage })));
const MarkdownEditorPage = lazy(() => import('@/pages/business-pages').then(m => ({ default: m.MarkdownEditorPage })));
const SqlEditorPage = lazy(() => import('@/pages/business-pages').then(m => ({ default: m.SqlEditorPage })));

// 其他页面
const ReportsPage = lazy(() => import('@/pages/ReportsPage').then(m => ({ default: m.ReportsPage })));
const NotificationsPage = lazy(() => import('@/pages/NotificationsPage').then(m => ({ default: m.NotificationsPage })));
const HelpPage = lazy(() => import('@/pages/HelpPage').then(m => ({ default: m.HelpPage })));
const AboutPage = lazy(() => import('@/pages/AboutPage').then(m => ({ default: m.AboutPage })));
const ProfilePage = lazy(() => import('@/pages/ProfilePage').then(m => ({ default: m.ProfilePage })));
const SettingsPage = lazy(() => import('@/pages/SettingsPage').then(m => ({ default: m.SettingsPage })));

// 数据宝宝（暂用 BusinessPage 占位）
const DataOverviewPage = lazy(() => import('@/pages/BusinessPage').then(m => ({ default: m.BusinessPage })));
const DataQueryPage = lazy(() => import('@/pages/BusinessPage').then(m => ({ default: m.BusinessPage })));

// 个人中心
const MyProfilePage = lazy(() => import('@/pages/ProfilePage').then(m => ({ default: m.ProfilePage })));
const MySettingsPage = lazy(() => import('@/pages/SettingsPage').then(m => ({ default: m.SettingsPage })));

const BUSINESS_PAGES: Record<string, PageComponent> = {
  config: JulyConfigPage, scheduler: JulySchedulerPage, dict: DictPage,
  monitor: MonitorPage, online: OnlineUsersPage, cache: CachePage,
  datasource: JulyDatasourcePage, storage: StoragePage, params: ParamsPage,
  template: TemplatePage, push: PushPage, stats: StatsPage,
  trend: TrendPage, charts: ChartsPage, export: ExportPage,
  dashboard: DashboardScreenPage, calc: CalcPage, query: QueryPage,
  servicelog: ServiceLogPage, markdown: MarkdownEditorPage, sql: SqlEditorPage,
};

const DATA_BABY_PAGES: Record<string, PageComponent> = {
  overview: DataOverviewPage,
  query: DataQueryPage,
};

const PERSONAL_PAGES: Record<string, PageComponent> = {
  profile: MyProfilePage,
  settings: MySettingsPage,
};

const PAGE_MAP: Record<string, PageComponent> = {
  '/dashboard': DashboardPage,
  [SYSTEM011_ROUTES.julyUser]: JulyUserPage,
  [SYSTEM011_ROUTES.julyMenu]: JulyMenuPage,
  [SYSTEM011_ROUTES.julyPermission]: JulyPermissionPage,
  [SYSTEM011_ROUTES.julyOrganization]: JulyOrganizationPage,
  [SYSTEM011_ROUTES.julyScheduler]: JulySchedulerPage,
  [SYSTEM011_ROUTES.julyConfig]: JulyConfigPage,
  [SYSTEM011_ROUTES.julyDictionary]: JulyDictionaryPage,
  [DATASERVICE011_ROUTES.julyDatasource]: JulyDatasourcePage,
  [DATASERVICE011_ROUTES.julyBusinessModeling]: JulyBusinessModelingPage,
  [DATASERVICE011_ROUTES.julyBusinessModelingNew]: JulyBusinessModelingFormPage,
  [AI011_ROUTES.julyAiModelProvider]: JulyAiModelProviderPage,
  [LOWCODE011_ROUTES.julyMetadata]: JulyMetadataPage,
  '/audit': AuditPage,
  '/settings': SettingsPage,
  '/settings/params': SettingsPage,
  '/business': BusinessPage,
  '/reports': ReportsPage,
  '/notifications': NotificationsPage,
  '/help': HelpPage,
  '/about': AboutPage,
  '/profile': ProfilePage,
};

export const Home = () => {
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
