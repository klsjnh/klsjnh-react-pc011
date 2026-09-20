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
import { LOWCODE011_ROUTES, DATASERVICE011_ROUTES } from '@/config/routes';
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
 * 剥掉「单根包装节点」：后端菜单树（julyMenu）顶层可能是唯一的人工根节点
 * （menuName 如「菜单」、menuRoute 为空串 ''——历史接口约定，真实后端与 mock 均是此形态）。
 * 侧边栏不需要这一层；且 antd Menu 以 key 索引节点，空串 key 会导致该节点的
 * children 在渲染时全部丢失（只剩一个孤立 SubMenu）。故映射前先把顶层唯一根剥掉。
 *
 * 例外：若顶层多于一个节点（后端改了形态），保持原样不做剥离。
 */
function unwrapRoot(items: JulyMenuVo011[]): JulyMenuVo011[] {
  if (items.length === 1 && !items[0].menuRoute && items[0].children?.length) {
    return items[0].children;
  }
  return items;
}

/**
 * 导航隐藏清单（仅影响侧边栏入口，不影响路由 / 页面代码）。
 *
 * 2026-09-20 后端换版后以下资源已不存在，菜单项点了必然 404：
 *   - 低代码中心（`/lowcode011/*`）：模块整体迁去新项目，前端页面代码保留待后续处理
 *   - 业务建模（`/dataService011/JulyBusinessModeling`）：随低代码一同迁出，数据源页面保留
 * 恢复入口只需清空本数组（后端资源回来后）。
 */
const HIDDEN_NAV_ROUTES: readonly string[] = [
  LOWCODE011_ROUTES.root, // 覆盖 /lowcode011 目录本身及以下全部子路径（元数据 / schemaRuntime 等）
  DATASERVICE011_ROUTES.julyBusinessModeling, // 业务建模子项；其父目录「数据管理」因含数据源页面而保留
];

/** path 是否命中隐藏清单（自身或子路径） */
function isHiddenNavRoute(path: string): boolean {
  return HIDDEN_NAV_ROUTES.some((r) => path === r || path.startsWith(r + '/'));
}

/** 侧边栏导航项过滤：隐藏清单命中即剔除（递归） */
function filterHiddenNav(items: NavItem[]): NavItem[] {
  return items
    .filter((item) => !isHiddenNavRoute(item.path))
    .map((item) => (item.children ? { ...item, children: filterHiddenNav(item.children) } : item));
}

/**
 * 侧边栏导航菜单：全局配置（开发态）或接口菜单。
 * 接口菜单取 `navMenus`（RBAC 当前登录人树），不是 `menus`（全量树）——
 * 全量树供菜单管理用，直接当导航会绕过权限。
 * 两个数据源在此汇合，故隐藏入口的过滤只做这一处。
 */
export function useNavMenus(): NavItem[] {
  const { navMenus } = useMenuState();
  return useMemo(
    () => filterHiddenNav(
      globalConfig.menuFromConfig ? GLOBAL_MENUS : unwrapRoot(navMenus).map(toNavItem),
    ),
    [navMenus],
  );
}
