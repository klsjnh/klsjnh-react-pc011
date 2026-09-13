/** 布局 / 导航相关类型 */
import type React from 'react';

/** 侧边栏导航项 */
export interface NavItem {
  path: string;
  label: string;
  icon: string;
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
