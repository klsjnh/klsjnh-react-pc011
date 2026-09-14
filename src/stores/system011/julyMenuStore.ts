/**
 * 菜单 store（system011 · julyMenu）
 * 只负责状态 + 本地持久化；业务操作（含 CRUD 编排）在 services/system011/julyMenuService。
 * 分层：page → service → store；store 不调用 service。
 */
import { useMemo } from 'react';
import { globalConfig, GLOBAL_MENUS } from '@/config/global';
import { createStore, useStoreState } from '../createStore';
import type { JulyMenuVo011 } from '@/types/system011/julyMenu/vo';
import type { MenuState } from '@/types/system011/julyMenu/view';
import type { NavItem } from '@/types/view/layout';

const base = createStore<MenuState>({ menus: [], loaded: false, loading: false });

export const menuStore = {
  getSnapshot: base.getSnapshot,
  subscribe: base.subscribe,
  setState: base.setState,
  replace: base.replace,
};

export function useMenuState(): MenuState {
  return useStoreState(base);
}

/** JulyMenuVo011 → 侧边栏导航项 */
function toNavItem(m: JulyMenuVo011): NavItem {
  return {
    path: m.menuRoute,
    label: m.menuName,
    icon: m.menuIcon || '📄',
    children: (m.children || []).filter((c) => c.menuType !== '3').map(toNavItem),
  };
}

/** 侧边栏导航菜单：全局配置（开发态）或接口菜单 */
export function useNavMenus(): NavItem[] {
  const { menus } = useMenuState();
  return useMemo(
    () => (globalConfig.menuFromConfig ? GLOBAL_MENUS : menus.map(toNavItem)),
    [menus],
  );
}
