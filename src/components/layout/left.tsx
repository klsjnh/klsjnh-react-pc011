/** 布局左侧：antd Sider + Menu（菜单来自 useNavMenus：全局配置 / 接口） */
import React, { useEffect, useState } from 'react';
import { Layout, Menu } from 'antd';
import { uiStore, useUiState } from '@/stores/uiStore';
import { useNavMenus } from '@/stores/system011/julyMenuStore';
import type { NavItem, LeftProps } from '@/types/view/layout';

const { Sider } = Layout;

function toItems(nodes: NavItem[]): NonNullable<React.ComponentProps<typeof Menu>['items']> {
  return nodes.map((n) => ({
    key: n.path,
    icon: <span className="nav-emoji">{n.icon}</span>,
    label: n.label,
    children: n.children?.length ? toItems(n.children) : undefined,
  }));
}

/** 找到 currentPath 的所有祖先菜单 key（用于默认展开所属分组） */
function ancestorsOf(nodes: NavItem[], currentPath: string): string[] | null {
  for (const n of nodes) {
    if (n.path === currentPath) return [];
    if (n.children?.length) {
      const sub = ancestorsOf(n.children, currentPath);
      if (sub) return [n.path, ...sub];
    }
  }
  return null;
}

export const Left: React.FC<LeftProps> = ({ currentPath, onNavigate }) => {
  const collapsed = useUiState().sidebarCollapsed;
  const menus = useNavMenus();
  const [openKeys, setOpenKeys] = useState<string[]>([]);

  // 依据当前路由自动展开所属分组（同时覆盖配置菜单 / 接口菜单两种 key 形态）
  useEffect(() => {
    const anc = ancestorsOf(menus, currentPath);
    if (anc?.length) setOpenKeys(anc);
  }, [menus, currentPath]);

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
        openKeys={openKeys}
        onOpenChange={setOpenKeys}
        onClick={({ key }) => onNavigate(String(key))}
      />
    </Sider>
  );
};
