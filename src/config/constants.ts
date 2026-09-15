/**
 * 系统级全局常量（枚举 / 选项 / 默认值 / 菜单 / 配置）
 * 避免各页面重复定义同一组选项。
 */

import {
  ApartmentOutlined,
  AppstoreAddOutlined,
  AppstoreOutlined,
  AreaChartOutlined,
  BarChartOutlined,
  BellOutlined,
  BookOutlined,
  CalculatorOutlined,
  ClockCircleOutlined,
  ControlOutlined,
  DashboardOutlined,
  DatabaseOutlined,
  DesktopOutlined,
  ExportOutlined,
  FieldTimeOutlined,
  FileSearchOutlined,
  FileTextOutlined,
  FormOutlined,
  HddOutlined,
  InfoCircleOutlined,
  KeyOutlined,
  LineChartOutlined,
  MenuOutlined,
  MonitorOutlined,
  NotificationOutlined,
  PieChartOutlined,
  QuestionCircleOutlined,
  SearchOutlined,
  SettingOutlined,
  SmileOutlined,
  TeamOutlined,
  ThunderboltOutlined,
  ToolOutlined,
  UserOutlined,
  UserSwitchOutlined,
} from '@ant-design/icons';
import { SYSTEM011_ROUTES } from '@/config/routes';
import type { NavItem } from '@/types/view/layout';

/** 菜单类型 */
export const MENU_TYPE_OPTIONS = [
  { value: '1', label: '目录' },
  { value: '2', label: '菜单' },
  { value: '3', label: '按钮' },
] as const;

/** 菜单类型文本映射（用于展示） */
export const MENU_TYPE_LABEL: Record<string, string> = {
  '1': '目录',
  '2': '菜单',
  '3': '按钮',
};

/** 通用状态（启用 / 停用） */
export const STATUS_OPTIONS = [
  { value: '1', label: '启用' },
  { value: '0', label: '停用' },
] as const;

/** 通用状态文本映射 */
export const STATUS_LABEL: Record<string, string> = {
  '1': '启用',
  '0': '停用',
};

/** 本地菜单列表（开发态使用；非开发态走接口 selectUserMenuTree） */
export const GLOBAL_MENUS: NavItem[] = [
  { path: '/dashboard', label: '仪表盘', icon: DashboardOutlined },
  {
    path: '/system',
    label: '系统管理',
    icon: SettingOutlined,
    children: [
      { path: SYSTEM011_ROUTES.julyMenu, label: '菜单管理', icon: MenuOutlined },
      { path: SYSTEM011_ROUTES.julyOrganization, label: '组织管理', icon: ApartmentOutlined },
      { path: SYSTEM011_ROUTES.julyUser, label: '用户管理', icon: TeamOutlined },
      { path: SYSTEM011_ROUTES.julyPermission, label: '权限管理', icon: KeyOutlined },
    ],
  },
  {
    path: '/business',
    label: '业务中心',
    icon: AppstoreOutlined,
    children: [
      { path: '/business/config', label: '配置管理', icon: SettingOutlined },
      { path: '/business/scheduler', label: '定时任务', icon: FieldTimeOutlined },
      { path: '/business/dict', label: '字典管理', icon: BookOutlined },
      { path: '/business/monitor', label: '系统监控', icon: MonitorOutlined },
      { path: '/business/online', label: '在线用户', icon: UserSwitchOutlined },
      { path: '/business/cache', label: '缓存管理', icon: ThunderboltOutlined },
      { path: '/business/datasource', label: '数据源', icon: DatabaseOutlined },
      { path: '/business/storage', label: '存储中心', icon: HddOutlined },
      { path: '/business/params', label: '参数设置', icon: ControlOutlined },
      { path: '/business/template', label: '通知模板', icon: FormOutlined },
      { path: '/business/push', label: '消息推送', icon: NotificationOutlined },
      { path: '/business/stats', label: '数据统计', icon: BarChartOutlined },
      { path: '/business/trend', label: '趋势分析', icon: LineChartOutlined },
      { path: '/business/charts', label: '图表展示', icon: PieChartOutlined },
      { path: '/business/export', label: '数据导出', icon: ExportOutlined },
      { path: '/business/dashboard', label: '数据大屏', icon: DesktopOutlined },
      { path: '/business/calc', label: '数据计算', icon: CalculatorOutlined },
      { path: '/business/query', label: '数据查询', icon: SearchOutlined },
      { path: '/business/servicelog', label: '服务日志', icon: FileTextOutlined },
    ],
  },
  {
    path: '/appcenter',
    label: '应用中心',
    icon: AppstoreAddOutlined,
    children: [
      { path: '/reports', label: '数据报表', icon: AreaChartOutlined },
      { path: '/profile', label: '人中心', icon: UserOutlined },
    ],
  },
  {
    path: '/tools',
    label: '系统工具',
    icon: ToolOutlined,
    children: [
      { path: '/notifications', label: '消息通知', icon: BellOutlined },
      { path: '/audit', label: '审计日志', icon: FileSearchOutlined },
      { path: '/settings', label: '系统设置', icon: SettingOutlined },
      { path: '/help', label: '帮助反馈', icon: QuestionCircleOutlined },
      { path: '/about', label: '关于系统', icon: InfoCircleOutlined },
    ],
  },
];

export const globalConfig = {
  appName: '企业管理系统',
  /** true：菜单取自 GLOBAL_MENUS；false：走接口（menuStore → selectUserMenuTree） */
  menuFromConfig: !!import.meta.env?.DEV,
};
