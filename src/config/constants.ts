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
  DashboardOutlined,
  DatabaseOutlined,
  DesktopOutlined,
  ExportOutlined,
  FieldTimeOutlined,
  FileSearchOutlined,
  FileTextOutlined,
  FormOutlined,
  InfoCircleOutlined,
  KeyOutlined,
  LineChartOutlined,
  MenuOutlined,
  MonitorOutlined,
  NotificationOutlined,
  PieChartOutlined,
  QuestionCircleOutlined,
  SettingOutlined,
  TeamOutlined,
  ThunderboltOutlined,
  ToolOutlined,
  UserOutlined,
  UserSwitchOutlined,
} from '@ant-design/icons';
import { SYSTEM011_ROUTES, DATASERVICE011_ROUTES, AI011_ROUTES, LOWCODE011_ROUTES } from '@/config/routes';
import type { NavItem } from '@/types/view/layout';

/** 菜单类型：菜单 / 按钮（无目录） */
export const MENU_TYPE_OPTIONS = [
  { value: '2', label: '菜单' },
  { value: '3', label: '按钮' },
];

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
];

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
      { path: SYSTEM011_ROUTES.julyConfig, label: '配置管理', icon: SettingOutlined },
      { path: SYSTEM011_ROUTES.julyScheduler, label: '定时任务', icon: FieldTimeOutlined },
      { path: '/business/dict', label: '字典管理', icon: BookOutlined },
      { path: '/business/monitor', label: '系统监控', icon: MonitorOutlined },
      { path: '/business/online', label: '在线用户', icon: UserSwitchOutlined },
      { path: '/business/cache', label: '缓存管理', icon: ThunderboltOutlined },
      { path: '/storageCenter/bucketList', label: '存储桶列表', icon: DatabaseOutlined },
      { path: '/storageCenter/fileList', label: '文件列表', icon: FileTextOutlined },
      { path: '/business/template', label: '通知模板', icon: FormOutlined },
      { path: '/business/push', label: '消息推送', icon: NotificationOutlined },
      { path: '/business/stats', label: '数据统计', icon: BarChartOutlined },
      { path: '/business/trend', label: '趋势分析', icon: LineChartOutlined },
      { path: '/business/charts', label: '图表展示', icon: PieChartOutlined },
      { path: '/business/export', label: '数据导出', icon: ExportOutlined },
      { path: '/business/dashboard', label: '数据大屏', icon: DesktopOutlined },
      { path: '/business/calc', label: '数据计算', icon: CalculatorOutlined },
      { path: '/business/servicelog', label: '服务日志', icon: FileTextOutlined },
      { path: '/business/markdown', label: 'Markdown 编辑器', icon: BookOutlined },
      { path: '/business/sql', label: 'SQL 编辑器', icon: FileSearchOutlined },
    ],
  },
  {
    path: '/dataService011',
    label: '数据管理',
    icon: DatabaseOutlined,
    children: [
      { path: DATASERVICE011_ROUTES.julyDatasource, label: '数据源', icon: DatabaseOutlined },
      { path: DATASERVICE011_ROUTES.julyBusinessModeling, label: '业务建模', icon: FormOutlined },
    ],
  },
  {
    path: '/ai011',
    label: 'AI 中心',
    icon: ThunderboltOutlined,
    children: [
      { path: AI011_ROUTES.julyAiModelProvider, label: '模型供应商', icon: KeyOutlined },
    ],
  },
  {
    path: LOWCODE011_ROUTES.root,
    label: '低代码中心',
    icon: AppstoreAddOutlined,
    children: [
      { path: LOWCODE011_ROUTES.julyMetadata, label: '元数据管理', icon: DatabaseOutlined },
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
  /** false：菜单统一走接口（menuStore → selectUserMenuTree / selectTree） */
  menuFromConfig: false,
};
