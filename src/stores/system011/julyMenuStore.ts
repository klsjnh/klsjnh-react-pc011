/**
 * 菜单 store（system011 · julyMenu）
 * 菜单管理页的增删改 → 实时驱动侧边栏；状态基于 zustand createStore。
 * 前端直接使用后端字段（menuCode/menuName/menuIcon/menuRoute/menuType/sortOrder/status）。
 */
import { useMemo } from 'react';
import { isMockMode } from '@/config/appConfig';
import { resolveMenuRoute } from '@/config/routes';
import { globalConfig, GLOBAL_MENUS } from '@/config/global';
import { fireApi } from '@/api/request';
import { selectUserMenuTree } from '@/services/system011';
import { createStore, useStoreState } from '../createStore';
import type { JulyMenuVo011, MenuState } from '@/types/system011/julyMenu';
import type { NavItem } from '@/types/view/layout';

const base = createStore<MenuState>({ menus: [], loaded: false, loading: false });

/** 生成新菜单 id（mock / api 均为字符串主键） */
const genId = () => `menu${Date.now()}${Math.random().toString(36).slice(2, 6)}`;

/** 深度优先查找 */
function findMenu(items: JulyMenuVo011[], id: string): JulyMenuVo011 | null {
  for (const item of items) {
    if (item.id === id) return item;
    if (item.children) {
      const found = findMenu(item.children, id);
      if (found) return found;
    }
  }
  return null;
}

/** node 子树是否包含 id（禁止移到自身/子孙下） */
function containsId(node: JulyMenuVo011, id: string): boolean {
  return node.id === id || (node.children || []).some((c) => containsId(c, id));
}

export const menuStore = {
  getSnapshot: base.getSnapshot,
  subscribe: base.subscribe,

  /** 初始化加载菜单（只加载一次） */
  load: async () => {
    const s = base.getSnapshot();
    if (s.loading || s.loaded) return;
    base.setState({ loading: true });
    try {
      const tree = await selectUserMenuTree();
      const mapRoute = (list: JulyMenuVo011[]): JulyMenuVo011[] =>
        list.map((m) => ({ ...m, menuRoute: resolveMenuRoute(m.menuRoute), children: m.children ? mapRoute(m.children) : undefined }));
      base.setState({ menus: mapRoute(tree), loaded: true, loading: false });
    } catch {
      base.setState({ loading: false });
    }
  },

  /** 清空缓存重新加载（切换数据模式后调用） */
  reload: async () => {
    base.replace({ menus: [], loaded: false, loading: false });
    await menuStore.load();
  },

  /** 获取某个路由下的子菜单 */
  getChildMenus: (parentRoute: string): JulyMenuVo011[] => {
    const { menus } = base.getSnapshot();
    const parent = menus.find((m) => m.menuRoute === parentRoute);
    return (parent?.children || []).filter((m) => m.status === '1').sort((a, b) => a.sortOrder - b.sortOrder);
  },

  /** 添加菜单 */
  add: (data: Omit<JulyMenuVo011, 'id' | 'children'>) => {
    const { menus } = base.getSnapshot();
    const created: JulyMenuVo011 = { ...data, id: genId(), children: [] };
    if (!created.parentId) {
      base.setState({ menus: [...menus, created] });
    } else {
      const addToParent = (items: JulyMenuVo011[]): JulyMenuVo011[] =>
        items.map((item) => item.id === created.parentId
          ? { ...item, children: [...(item.children || []), created] }
          : { ...item, children: item.children ? addToParent(item.children) : item.children });
      base.setState({ menus: addToParent(menus) });
    }
    if (!isMockMode()) fireApi('/julyMenu/v1/insert', created);
  },

  /** 更新菜单 */
  update: (id: string, patch: Partial<JulyMenuVo011>) => {
    const { menus } = base.getSnapshot();
    const updateRecursive = (items: JulyMenuVo011[]): JulyMenuVo011[] =>
      items.map((item) => item.id === id
        ? { ...item, ...patch }
        : { ...item, children: item.children ? updateRecursive(item.children) : item.children });
    base.setState({ menus: updateRecursive(menus) });
    if (!isMockMode()) fireApi('/julyMenu/v1/update', { id, ...patch });
  },

  /** 删除菜单 */
  remove: (id: string) => {
    const { menus } = base.getSnapshot();
    const removeRecursive = (items: JulyMenuVo011[]): JulyMenuVo011[] =>
      items.filter((item) => item.id !== id)
        .map((item) => ({ ...item, children: item.children ? removeRecursive(item.children) : undefined }));
    base.setState({ menus: removeRecursive(menus) });
    if (!isMockMode()) fireApi('/julyMenu/v1/logicDelete', { id });
  },

  /** 移动菜单到新的上级（parentId 为空串表示顶级；不能移到自己或子孙下） */
  move: (id: string, newParentId: string): boolean => {
    const { menus } = base.getSnapshot();
    const node = findMenu(menus, id);
    if (!node || id === newParentId) return false;
    if (newParentId && (newParentId === id || containsId(node, newParentId))) return false;
    const detached = (items: JulyMenuVo011[]): JulyMenuVo011[] =>
      items.filter((item) => item.id !== id)
        .map((item) => ({ ...item, children: item.children ? detached(item.children) : undefined }));
    const rest = detached(menus);
    const moved: JulyMenuVo011 = { ...node, parentId: newParentId };
    if (!newParentId) {
      base.setState({ menus: [...rest, moved] });
    } else {
      const addUnder = (items: JulyMenuVo011[]): JulyMenuVo011[] =>
        items.map((item) => item.id === newParentId
          ? { ...item, children: [...(item.children || []), moved] }
          : { ...item, children: item.children ? addUnder(item.children) : item.children });
      base.setState({ menus: addUnder(rest) });
    }
    if (!isMockMode()) fireApi('/julyMenu/v1/update', { id, parentId: newParentId });
    return true;
  },

  /** 切换启用/停用 */
  toggleStatus: (id: string) => {
    const node = findMenu(base.getSnapshot().menus, id);
    if (!node) return;
    const status = node.status === '1' ? '0' : '1';
    menuStore.update(id, { status });
  },
};

// ==================== Hooks ====================

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
