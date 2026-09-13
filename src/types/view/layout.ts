/** 布局 UI 类型（侧边栏导航项） */
export interface NavItem {
  path: string;
  label: string;
  icon: string;
  children?: NavItem[];
}
