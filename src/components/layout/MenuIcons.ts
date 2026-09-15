/**
 * 菜单图标适配层
 *
 * 后端 julyMenu.menuIcon 是字符串，前端要渲染成图标必须做一次「字符串 → antd 图标组件」转换，
 * 故集中在此维护。这是「接口数据 → 视图」的适配，不是路由别名映射（§A2 所禁的那类补丁）：
 * 字符串本就在库里，无处可躲；集中一处才能保证全站图标语义一致。
 *
 * 同时兼容两种存储形态，便于后端逐步迁移：
 *  1. antd 图标名     —— 'SettingOutlined'（推荐后端改存名称，前端无需再动）
 *  2. emoji（历史值） —— '⚙️'
 * 未命中一律回退 FALLBACK_MENU_ICON，保证菜单永远有图标、不会渲染成空白。
 */
import {
  ApartmentOutlined,
  AppstoreOutlined,
  BarChartOutlined,
  BookOutlined,
  CalculatorOutlined,
  ClockCircleOutlined,
  ControlOutlined,
  DashboardOutlined,
  DatabaseOutlined,
  DesktopOutlined,
  ExportOutlined,
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
import type { NavIcon } from '@/types/view/layout';

/** 菜单图标兜底（菜单无 icon 或值无法识别时使用） */
export const FALLBACK_MENU_ICON: NavIcon = FileTextOutlined;

/**
 * 字符串 → 图标组件。
 * 后端 menuIcon 统一存 antd 图标名（如 SettingOutlined），
 * 此处直接做名称到组件的映射。
 */
const MENU_ICON_MAP: Record<string, NavIcon> = {
  // ===== antd 图标名（与后端 menuIcon 字段一一对应）=====
  ApartmentOutlined,
  AppstoreOutlined,
  AppstoreAddOutlined,
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
};

/** 把后端 menuIcon 字符串解析为 antd 图标组件 */
export function resolveMenuIcon(raw?: string | null): NavIcon {
  if (!raw) return FALLBACK_MENU_ICON;
  const key = raw.trim();
  return MENU_ICON_MAP[key] ?? FALLBACK_MENU_ICON;
}
