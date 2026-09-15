/**
 * 菜单 store（system011 · julyMenu）
 * 只负责状态 + 本地持久化；业务操作（含 CRUD 编排）在 services/system011/julyMenuService。
 * 分层：page → service → store；store 不调用 service。
 *
 * `menus`（全量树，管理用）与 `navMenus`（当前登录人树，导航用）来自两个不同的后端接口，
 * 由 service 层分别装载，store 只存不管来源。详见 types/system011/julyMenu/view.ts 的 MenuState。
 */
import { useMemo } from 'react';
import { globalConfig, GLOBAL_MENUS } from '@/config/constants';
import { resolveMenuIcon } from '@/components/layout/MenuIcons';
import { createStore, useStoreState } from '@/stores/createStore';
import type { JulyMenuVo011 } from '@/types/system011/julyMenu/vo';
import type { MenuState } from '@/types/system011/julyMenu/view';
import type { NavItem } from '@/types/view/layout';

const base = createStore<MenuState>({ menus: [], navMenus: [], loaded: false, loading: false });

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
    icon: resolveMenuIcon(m.menuIcon),
    children: (m.children || []).filter((c) => c.menuType !== '3').map(toNavItem),
  };
}

/**
 * 侧边栏导航菜单：全局配置（开发态）或接口菜单。
 * 接口菜单取 `navMenus`（RBAC 当前登录人树），不是 `menus`（全量树）——
 * 全量树供菜单管理用，直接当导航会绕过权限。
 */
export function useNavMenus(): NavItem[] {
  const { navMenus } = useMenuState();
  return useMemo(
    () => (globalConfig.menuFromConfig ? GLOBAL_MENUS : navMenus.map(toNavItem)),
    [navMenus],
  );
}
