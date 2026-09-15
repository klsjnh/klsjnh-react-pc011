/** 布局 / 导航相关类型 */
import type React from 'react';

/**
 * 导航图标：统一用 antd 图标组件承载，不再用 emoji 字符串。
 *  - 组件引用可被 tsc 校验（写错图标名编译期就报错）
 *  - 渲染层统一控制尺寸 / 颜色，避免各页各自为政
 *  - 接口菜单（后端 menuIcon 为字符串）经 resolveMenuIcon 适配后再赋值
 */
export type NavIcon = React.ComponentType<{ className?: string; style?: React.CSSProperties }>;

/** 侧边栏导航项 */
export interface NavItem {
  path: string;
  label: string;
  icon: NavIcon;
  children?: NavItem[];
}

export interface SidebarLayoutProps {
  children: React.ReactNode;
  currentPath: string;
  onNavigate: (path: string) => void;
}

export interface LeftProps {
  currentPath: string;
  onNavigate: (path: string) => void;
}

export interface TopProps {
  onNavigate: (path: string) => void;
}
