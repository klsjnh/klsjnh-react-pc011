/** 布局左侧：antd Sider + Menu（菜单来自 useNavMenus：全局配置 / 接口） */
import React, { useMemo, useState } from 'react';
import { Layout, Menu } from 'antd';
import { uiStore, useUiState } from '@/stores/uiStore';
import { useNavMenus } from '@/stores/system011/julyMenuStore';
import type { NavItem, LeftProps } from '@/types/view/layout';

const { Sider } = Layout;

function toItems(nodes: NavItem[]): NonNullable<React.ComponentProps<typeof Menu>['items']> {
  return nodes.map((n) => {
    const Icon = n.icon;
    return {
      key: n.path,
      icon: <Icon />,
      label: n.label,
      children: n.children?.length ? toItems(n.children) : undefined,
    };
  });
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

export const Left = ({ currentPath, onNavigate }: LeftProps) => {
  const collapsed = useUiState().sidebarCollapsed;
  const menus = useNavMenus();
  const [openKeys, setOpenKeys] = useState<string[]>([]);

  /** 当前路由所属分组（应自动展开），同时覆盖配置菜单 / 接口菜单两种 key 形态 */
  const autoOpenKeys = useMemo(() => ancestorsOf(menus, currentPath) ?? [], [menus, currentPath]);
  const autoSig = autoOpenKeys.join('|');
  const [lastAutoSig, setLastAutoSig] = useState('');

  // 路由或菜单变化时同步展开项：采用 React 官方的「渲染期调整 state」写法，
  // 避免在 useEffect 内 setState 触发级联渲染（react-hooks/set-state-in-effect）。
  if (autoSig && autoSig !== lastAutoSig) {
    setLastAutoSig(autoSig);
    setOpenKeys(autoOpenKeys);
  }

  /**
   * 侧边栏菜单展开控制：最多同时展开 2 个一级主菜单。
   * 当展开第三个主菜单时，自动关闭最早展开的主菜单及其子项。
   */
  const handleOpenChange = (keys: string[]) => {
    // 计算 key 的层级深度（0 = 一级主菜单）
    function getDepth(nodes: NavItem[], key: string, depth: number): number {
      for (const n of nodes) {
        if (n.path === key) return depth;
        if (n.children?.length) {
          const d = getDepth(n.children, key, depth + 1);
          if (d !== -1) return d;
        }
      }
      return -1;
    }

    // 找出一级主菜单的父节点路径（用于判断子项归属）
    function findParentPath(nodes: NavItem[], key: string): string | null {
      for (const n of nodes) {
        if (n.path === key) return null; // 自身是一级菜单
        if (n.children?.length) {
          if (n.children.some(c => c.path === key)) return n.path;
          const p = findParentPath(n.children, key);
          if (p) return p;
        }
      }
      return null;
    }

    // 合并新旧 keys，找出一级主菜单（depth === 0）已展开的项
    const allKeys = Array.from(new Set([...openKeys, ...keys]));
    const topLevelOpened = allKeys.filter(k => getDepth(menus, k, 0) === 0);

    let finalKeys = allKeys;
    // 一级主菜单超过 2 个时，关闭最早展开的
    if (topLevelOpened.length > 2) {
      const [first, ...rest] = topLevelOpened;
      const keepSet = new Set(rest);
      finalKeys = allKeys.filter(k => {
        if (k === first) return false; // 关闭最早的一级菜单
        const parent = findParentPath(menus, k);
        if (parent === first) return false; // 关闭该菜单的子项
        return true;
      });
    }

    setOpenKeys(finalKeys);
  };

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
        onOpenChange={handleOpenChange}
        onClick={({ key }) => onNavigate(String(key))}
      />
    </Sider>
  );
};
