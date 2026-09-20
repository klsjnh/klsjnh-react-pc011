/**
 * 前端路由 — 单一路径源 + 路由组件懒加载映射（唯一可信来源）
 *
 * 本文件同时承担：
 *   1) 路径常量（避免各处硬编码字面量）
 *   2) 路由 → 懒加载组件映射（PAGE_MAP / BUSINESS_PAGES / …）
 *
 * 约定：
 *   - home/index.tsx 引用本文件的常量与映射，不重复定义
 *   - 页面如需 onNavigate，由 home/index.tsx 在渲染时注入
 */

import React, { lazy } from 'react';

/* ===================================================================== */
/* 路径常量                                                              */
/* ===================================================================== */

/* ---------------- system011 ---------------- */
export const SYSTEM011_ROUTES = {
  julyMenu: '/system011/julyMenu',
  julyUser: '/system011/julyUser',
  julyPermission: '/system011/julyPermission',
  julyOrganization: '/system011/julyOrganization',
  julyScheduler: '/system011/julyScheduler',
  julyConfig: '/system011/julyConfig',
  julyDictionary: '/system011/julyDictionary',
} as const;

/* ---------------- dataservice011 ---------------- */
export const DATASERVICE011_ROUTES = {
  julyDatasource: '/dataService011/julyDatasource',
  julyBusinessModeling: '/dataService011/JulyBusinessModeling',
  julyBusinessModelingNew: '/dataService011/JulyBusinessModeling/new',
  julyBusinessModelingEdit: '/dataService011/JulyBusinessModeling/:id',
} as const;

/* ---------------- aiCenter ---------------- */
export const AICENTER_ROUTES = {
  julyAiModelProvider: '/aiCenter/julyAiModelProvider',
  julyAiChat: '/aiCenter/julyAiChat',
} as const;

/* ---------------- lowcode011 ---------------- */
export const LOWCODE011_ROUTES = {
  /** 低代码中心根路径（侧边栏顶层目录；模块已迁去新项目，当前仅作导航过滤用） */
  root: '/lowcode011',
  julyMetadata: '/lowcode011/JulyMetadata',
  julyMetadataNew: '/lowcode011/JulyMetadata/new',
  julyMetadataEdit: '/lowcode011/JulyMetadata/:id',
  /** 元数据对象的运行时数据页：参数走 query（?objectName=xxx），objectName 用户自定义故不入路径段 */
  schemaRuntime: '/lowcode011/schemaRuntime',
} as const;

/* ---------------- storageCenter ---------------- */
export const STORAGE_CENTER_ROUTES = {
  bucketList: '/storageCenter/bucketList',
  fileList: '/storageCenter/fileList',
  /** 对象在线编辑（整页）：参数走 query（storageCode / bucketName / objectName / prefix） */
  fileEdit: '/storageCenter/fileList/edit',
} as const;

/* ---------------- messageCenter ---------------- */
export const MESSAGE_CENTER_ROUTES = {
  index: '/messageCenter/index',
} as const;

/* ---------------- 通用业务 / 子模块 ---------------- */
export const COMMON_ROUTES = {
  dashboard: '/dashboard',
  audit: '/audit',
  settings: '/settings',
  settingsParams: '/settings/params',
  business: '/business',
  reports: '/reports',
  notifications: '/notifications',
  profile: '/profile',
} as const;

/* ---------------- Home 二级页（about / help） ---------------- */
export const HOME_ROUTES = {
  help: '/home/help',
  about: '/home/about',
} as const;

/* ---------------- Business 子路由 action 名 ---------------- */
export const BUSINESS_ROUTE_ACTIONS = {
  config: 'config',
  scheduler: 'scheduler',
  dict: 'dict',
  monitor: 'monitor',
  online: 'online',
  cache: 'cache',
  datasource: 'datasource',
  storage: 'storage',
  params: 'params',
  template: 'template',
  push: 'push',
  stats: 'stats',
  trend: 'trend',
  charts: 'charts',
  export: 'export',
  dashboard: 'dashboard',
  calc: 'calc',
  servicelog: 'servicelog',
  markdown: 'markdown',
  sql: 'sql',
} as const;

/* ---------------- 数据宝宝子路由 action 名 ---------------- */
export const DATA_BABY_ROUTE_ACTIONS = {
  overview: 'overview',
  query: 'query',
} as const;

/* ---------------- 个人中心子路由 action 名 ---------------- */
export const PERSONAL_ROUTE_ACTIONS = {
  profile: 'profile',
  settings: 'settings',
} as const;

/* ---------------- 默认落地页 ---------------- */
export const DEFAULT_ROUTE = '/dashboard';

/* ===================================================================== */
/* 页面组件超集类型                                                      */
/* ===================================================================== */

/** 所有懒加载页面组件的超集类型：可选接收 onNavigate（由渲染侧注入） */
export interface PageNavProps { onNavigate?: (path: string) => void }
export type PageComponent = React.LazyExoticComponent<React.ComponentType<PageNavProps>>;

/* ===================================================================== */
/* 懒加载组件                                                            */
/* ===================================================================== */

// 仪表盘 / 首页
export const DashboardPage = lazy(() => import('@/pages/DashboardPage').then((m) => ({ default: m.DashboardPage })));

// system011
const JulyUserPage = lazy(() => import('@/pages/system011/julyUser').then((m) => ({ default: m.JulyUser })));
const JulyMenuPage = lazy(() => import('@/pages/system011/julyMenu').then((m) => ({ default: m.JulyMenu })));
const JulyPermissionPage = lazy(() => import('@/pages/system011/julyPermission').then((m) => ({ default: m.JulyPermission })));
const JulyOrganizationPage = lazy(() => import('@/pages/system011/julyOrganization').then((m) => ({ default: m.JulyOrganization })));
const JulySchedulerPage = lazy(() => import('@/pages/system011/julyScheduler').then((m) => ({ default: m.JulyScheduler })));
const JulyConfigPage = lazy(() => import('@/pages/system011/julyConfig').then((m) => ({ default: m.JulyConfig })));
const JulyDictionaryPage = lazy(() => import('@/pages/system011/julyDictionary').then((m) => ({ default: m.JulyDictionary })));

// 业务功能页（原 business-pages.tsx 导出）
const BusinessPage = lazy(() => import('@/pages/BusinessPage').then((m) => ({ default: m.BusinessPage })));
const DictPage = lazy(() => import('@/pages/business-pages').then((m) => ({ default: m.DictPage })));
const MonitorPage = lazy(() => import('@/pages/business-pages').then((m) => ({ default: m.MonitorPage })));
const OnlineUsersPage = BusinessPage; // 占位（原 OnlineUsersPage 暂未实现，走 BusinessPage 兜底展示）
const CachePage = lazy(() => import('@/pages/business-pages').then((m) => ({ default: m.CachePage })));
const JulyDatasourcePage = lazy(() => import('@/pages/dataService011/JulyDatasources').then((m) => ({ default: m.JulyDatasource })));
const JulyBusinessModelingPage = lazy(() => import('@/pages/dataService011/JulyBusinessModeling').then((m) => ({ default: m.JulyBusinessModeling })));
const JulyAiModelProviderPage = lazy(() => import('@/pages/aiCenter/JulyAiModelProvider').then((m) => ({ default: m.JulyAiModelProvider })));
const JulyAiChatPage = lazy(() => import('@/pages/aiCenter/JulyAiChat').then((m) => ({ default: m.JulyAiChat })));
const JulyMetadataPage = lazy(() => import('@/pages/lowcode011/JulyMetadata').then((m) => ({ default: m.JulyMetadata })));
const SchemaRuntimePage = lazy(() => import('@/pages/lowcode011/JulyMetadata/SchemaRuntimePage').then((m) => ({ default: m.SchemaRuntimePage })));
const ParamsPage = lazy(() => import('@/pages/demo16/demo011').then((m) => ({ default: m.Demo011 })));
const TemplatePage = lazy(() => import('@/pages/business-pages').then((m) => ({ default: m.TemplatePage })));
const PushPage = lazy(() => import('@/pages/business-pages').then((m) => ({ default: m.PushPage })));
const StatsPage = lazy(() => import('@/pages/business-pages').then((m) => ({ default: m.StatsPage })));
const TrendPage = lazy(() => import('@/pages/business-pages').then((m) => ({ default: m.TrendPage })));
const ChartsPage = lazy(() => import('@/pages/business-pages').then((m) => ({ default: m.ChartsPage })));
const ExportPage = lazy(() => import('@/pages/business-pages').then((m) => ({ default: m.ExportPage })));
const DashboardScreenPage = lazy(() => import('@/pages/business-pages').then((m) => ({ default: m.DashboardScreenPage })));
const CalcPage = lazy(() => import('@/pages/business-pages').then((m) => ({ default: m.CalcPage })));
const ServiceLogPage = lazy(() => import('@/pages/business-pages').then((m) => ({ default: m.ServiceLogPage })));
const MarkdownEditorPage = lazy(() => import('@/pages/business-pages').then((m) => ({ default: m.MarkdownEditorPage })));
const SqlEditorPage = lazy(() => import('@/pages/business-pages').then((m) => ({ default: m.SqlEditorPage })));

// 其他页面
const AuditPage = lazy(() => import('@/pages/management-pages').then((m) => ({ default: m.AuditPage })));
const ReportsPage = lazy(() => import('@/pages/ReportsPage').then((m) => ({ default: m.ReportsPage })));
const NotificationsPage = lazy(() => import('@/pages/NotificationsPage').then((m) => ({ default: m.NotificationsPage })));
const HelpPage = lazy(() => import('@/pages/home/help').then((m) => ({ default: m.HelpPage })));
const AboutPage = lazy(() => import('@/pages/home/about').then((m) => ({ default: m.AboutPage })));
const ProfilePage = lazy(() => import('@/pages/ProfilePage').then((m) => ({ default: m.ProfilePage })));
const SettingsPage = lazy(() => import('@/pages/demo16/demo011').then((m) => ({ default: m.Demo011 })));

// 存储中心独立路由页
const BucketListPage = lazy(() => import('@/pages/storageCenter/julyStorage/BucketListPage').then((m) => ({ default: m.BucketListPage })));
const FileListPage = lazy(() => import('@/pages/storageCenter/julyFileList/FileListPage').then((m) => ({ default: m.FileListPage })));
const FileEditorPage = lazy(() => import('@/pages/storageCenter/julyFileList/FileEditorPage').then((m) => ({ default: m.FileEditorPage })));
const MessageCenterPage = lazy(() => import('@/pages/messageCenter').then((m) => ({ default: m.MessageCenter })));

// 数据宝宝（暂用 BusinessPage 占位）
const DataOverviewPage = lazy(() => import('@/pages/BusinessPage').then((m) => ({ default: m.BusinessPage })));
const DataQueryPage = lazy(() => import('@/pages/BusinessPage').then((m) => ({ default: m.BusinessPage })));

// 个人中心
const MyProfilePage = lazy(() => import('@/pages/ProfilePage').then((m) => ({ default: m.ProfilePage })));
const MySettingsPage = lazy(() => import('@/pages/demo16/demo011').then((m) => ({ default: m.Demo011 })));

// 动态路由页面（需要参数，映射时先占位，home/index.tsx 按前缀匹配时直接用）
const JulyMetadataFormPage = lazy(() => import('@/pages/lowcode011/JulyMetadata/MetadataFormPage').then((m) => ({ default: m.MetadataFormPage })));
const JulyBusinessModelingFormPage = lazy(() => import('@/pages/dataService011/JulyBusinessModeling/ModelingFormPage').then((m) => ({ default: m.ModelingFormPage })));

/* ===================================================================== */
/* 子路由映射表（路径后缀 action → 页面组件）                             */
/* ===================================================================== */

export const BUSINESS_PAGES: Record<string, PageComponent> = {
  config: JulyConfigPage,
  scheduler: JulySchedulerPage,
  dict: DictPage,
  monitor: MonitorPage,
  online: OnlineUsersPage,
  cache: CachePage,
  datasource: JulyDatasourcePage,
  storage: BucketListPage,
  params: ParamsPage,
  template: TemplatePage,
  push: PushPage,
  stats: StatsPage,
  trend: TrendPage,
  charts: ChartsPage,
  export: ExportPage,
  dashboard: DashboardScreenPage,
  calc: CalcPage,
  servicelog: ServiceLogPage,
  markdown: MarkdownEditorPage,
  sql: SqlEditorPage,
};

export const DATA_BABY_PAGES: Record<string, PageComponent> = {
  overview: DataOverviewPage,
  query: DataQueryPage,
};

export const PERSONAL_PAGES: Record<string, PageComponent> = {
  profile: MyProfilePage,
  settings: MySettingsPage,
};

/* ===================================================================== */
/* 静态路径 → 组件主映射表                                              */
/* ===================================================================== */

export const PAGE_MAP: Record<string, PageComponent> = {
  [COMMON_ROUTES.dashboard]: DashboardPage,

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

  [AICENTER_ROUTES.julyAiModelProvider]: JulyAiModelProviderPage,
  [AICENTER_ROUTES.julyAiChat]: JulyAiChatPage,

  [LOWCODE011_ROUTES.julyMetadata]: JulyMetadataPage,
  [LOWCODE011_ROUTES.julyMetadataNew]: JulyMetadataFormPage,
  [LOWCODE011_ROUTES.schemaRuntime]: SchemaRuntimePage,

  [STORAGE_CENTER_ROUTES.bucketList]: BucketListPage,
  [STORAGE_CENTER_ROUTES.fileList]: FileListPage,
  [STORAGE_CENTER_ROUTES.fileEdit]: FileEditorPage,

  [MESSAGE_CENTER_ROUTES.index]: MessageCenterPage,

  [COMMON_ROUTES.audit]: AuditPage,
  [COMMON_ROUTES.settings]: SettingsPage,
  [COMMON_ROUTES.settingsParams]: SettingsPage,
  [COMMON_ROUTES.business]: BusinessPage,
  [COMMON_ROUTES.reports]: ReportsPage,
  [COMMON_ROUTES.notifications]: NotificationsPage,
  [COMMON_ROUTES.profile]: ProfilePage,

  [HOME_ROUTES.help]: HelpPage,
  [HOME_ROUTES.about]: AboutPage,
};

/* ===================================================================== */
/* 导出动态路由组件（供 home/index.tsx 按前缀匹配时使用）                 */
/* ===================================================================== */

export const DYNAMIC_ROUTES = {
  JulyMetadataFormPage,
  JulyBusinessModelingFormPage,
} as const;
