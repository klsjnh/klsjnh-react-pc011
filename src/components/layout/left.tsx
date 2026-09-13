/** 布局左侧：antd Sider + Menu（菜单来自 useNavMenus：全局配置 / 接口） */
import React from 'react';
import { Layout, Menu } from 'antd';
import { uiStore, useUiState } from '@/stores/uiStore';
import { useNavMenus } from '@/stores/system011/julyMenuStore';
import type { NavItem } from '@/types/view/layout';

const { Sider } = Layout;

function toItems(nodes: NavItem[]): NonNullable<React.ComponentProps<typeof Menu>['items']> {
  return nodes.map((n) => ({
    key: n.path,
    icon: <span className="nav-emoji">{n.icon}</span>,
    label: n.label,
    children: n.children?.length ? toItems(n.children) : undefined,
  }));
}

interface LeftProps {
  currentPath: string;
  onNavigate: (path: string) => void;
}

export const Left: React.FC<LeftProps> = ({ currentPath, onNavigate }) => {
  const collapsed = useUiState().sidebarCollapsed;
  const menus = useNavMenus();

  return (
    <Sider
      className="app-sider"
      theme="light"
      collapsible
      collapsed={collapsed}
      onCollapse={(v) => uiStore.setSidebarCollapsed(v)}
      width={220}
      collapsedWidth={60}
    >
      <Menu
        className="side-menu"
        mode="inline"
        items={toItems(menus)}
        selectedKeys={[currentPath]}
        defaultOpenKeys={['/system', '/tools']}
        onClick={({ key }) => onNavigate(String(key))}
      />
    </Sider>
  );
};
