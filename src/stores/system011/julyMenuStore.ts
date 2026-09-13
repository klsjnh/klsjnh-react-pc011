/**
 * 菜单 store（system011 · julyMenu）
 * 菜单管理页的增删改 → 实时驱动侧边栏 / 系统宫格 / 首页快捷入口
 * 状态基于 src/stores/createStore.ts（useSyncExternalStore）
 */
import { useMemo } from 'react';
import { type MenuConfig } from '../../mock/menuConfig';
import { isMockMode } from '../../config/appConfig';
import { fireApi } from '../../api/request';
import { selectUserMenuTree } from '../../services/system011';
import { createStore, useStoreState } from '../createStore';
import type { JulyMenuVo011 } from '../../types/system011';

/** 后端 JulyMenuVo011 → 前端 MenuConfig（菜单管理页消费的结构） */
function mapJulyMenuToConfig(m: JulyMenuVo011): MenuConfig {
  const pid = m.parentId ? Number(m.parentId) : 0;
  return {
    id: Number(m.id),
    parentId: pid,
    name: m.menuCode,
    path: m.menuRoute,
    icon: m.menuIcon || '📄',
    title: m.menuName,
    type: m.menuType === '3' ? 'button' : 'page',
    sort: m.sortOrder ?? 0,
    visible: m.status === '1',
    children: m.children?.map(mapJulyMenuToConfig),
  };
}

interface MenuState {
  menus: MenuConfig[];
  loaded: boolean;
  loading: boolean;
}

const base = createStore<MenuState>({ menus: [], loaded: false, loading: false });

export const menuStore = {
  getSnapshot: base.getSnapshot,
  subscribe: base.subscribe,

  /** 初始化加载菜单（只加载一次） */
  load: async () => {
    const s = base.getSnapshot();
    if (s.loading || s.loaded) return;
    base.setState({ loading: true });
    try {
      // mock / api 共用：selectUserMenuTree 在 mock 模式命中统一 mock 后端（返回 JulyMenuVo011[]）
      const tree = await selectUserMenuTree();
      base.setState({ menus: tree.map(mapJulyMenuToConfig), loaded: true, loading: false });
    } catch {
      // 加载失败：保留空菜单，loaded 仍为 false，登录后可 reload 重试
      base.setState({ loading: false });
    }
  },

  /** 清空缓存重新加载（切换数据模式后调用） */
  reload: async () => {
    base.replace({ menus: [], loaded: false, loading: false });
    await menuStore.load();
  },

  /** 获取 TabBar 项（/tabbar 的子节点，visible） */
  getTabMenus: (): MenuConfig[] => {
    const { menus } = base.getSnapshot();
    const tabParent = menus.find((m) => m.path === '/tabbar');
    return (tabParent?.children || []).filter((m) => m.visible).sort((a, b) => a.sort - b.sort);
  },

  /** 获取某个父路径下的子菜单（visible） */
  getChildMenus: (parentPath: string): MenuConfig[] => {
    const { menus } = base.getSnapshot();
    const parent = menus.find((m) => m.path === parentPath);
    return (parent?.children || []).filter((m) => m.visible).sort((a, b) => a.sort - b.sort);
  },

  /** 添加菜单 */
  add: (menu: Omit<MenuConfig, 'id'>) => {
    const { menus } = base.getSnapshot();
    const maxId = Math.max(0, ...menus.map((m) => m.id), ...menus.flatMap((m) => (m.children || []).map((c) => c.id)));
    const newMenu: MenuConfig = { ...menu, id: maxId + 1 };
    if (newMenu.parentId === 0) {
      base.setState({ menus: [...menus, newMenu] });
    } else {
      const addToParent = (items: MenuConfig[]): MenuConfig[] =>
        items.map((item) => {
          if (item.id === newMenu.parentId) {
            return { ...item, children: [...(item.children || []), newMenu] };
          }
          return item.children ? { ...item, children: addToParent(item.children) } : item;
        });
      base.setState({ menus: addToParent(menus) });
    }
    if (!isMockMode()) fireApi('/menu/insert', newMenu);
  },

  /** 更新菜单 */
  update: (id: number, data: Partial<MenuConfig>) => {
    const { menus } = base.getSnapshot();
    const updateRecursive = (items: MenuConfig[]): MenuConfig[] =>
      items.map((item) => {
        if (item.id === id) return { ...item, ...data };
        if (item.children) return { ...item, children: updateRecursive(item.children) };
        return item;
      });
    base.setState({ menus: updateRecursive(menus) });
    if (!isMockMode()) fireApi('/menu/update', { id, ...data });
  },

  /** 删除菜单 */
  remove: (id: number) => {
    const { menus } = base.getSnapshot();
    const deleteRecursive = (items: MenuConfig[]): MenuConfig[] =>
      items.filter((item) => item.id !== id).map((item) => ({
        ...item,
        children: item.children ? deleteRecursive(item.children) : undefined,
      }));
    base.setState({ menus: deleteRecursive(menus) });
    if (!isMockMode()) fireApi('/menu/logicDelete', { id });
  },

  /** 移动菜单到新的父级（parentId=0 表示顶级；不能移动到自己或自己的子孙下） */
  move: (id: number, newParentId: number): boolean => {
    const { menus } = base.getSnapshot();
    const find = (items: MenuConfig[]): MenuConfig | null => {
      for (const item of items) {
        if (item.id === id) return item;
        if (item.children) {
          const found = find(item.children);
          if (found) return found;
        }
      }
      return null;
    };
    const node = find(menus);
    if (!node || id === newParentId) return false;
    if (newParentId !== 0) {
      const inSubtree = (n: MenuConfig): boolean =>
        n.id === newParentId || (n.children || []).some(inSubtree);
      if (inSubtree(node)) return false;
    }
    const removeId = (items: MenuConfig[]): MenuConfig[] =>
      items.filter((item) => item.id !== id).map((item) => ({
        ...item,
        children: item.children ? removeId(item.children) : undefined,
      }));
    const rest = removeId(menus);
    const targetSort = newParentId === 0
      ? rest.length + 1
      : (() => {
          const parent = find(rest);
          return (parent?.children?.length || 0) + 1;
        })();
    if (!isMockMode()) fireApi('/menu/move', { id, parentId: newParentId });
    const moved: MenuConfig = { ...node, parentId: newParentId, sort: targetSort };
    if (newParentId === 0) {
      base.setState({ menus: [...rest, moved] });
    } else {
      const addUnder = (items: MenuConfig[]): MenuConfig[] =>
        items.map((item) => {
          if (item.id === newParentId) return { ...item, children: [...(item.children || []), moved] };
          return item.children ? { ...item, children: addUnder(item.children) } : item;
        });
      base.setState({ menus: addUnder(rest) });
    }
    return true;
  },

  /** 切换可见性 */
  toggleVisible: (id: number) => {
    const { menus } = base.getSnapshot();
    const findNode = (items: MenuConfig[]): MenuConfig | null => {
      for (const item of items) {
        if (item.id === id) return item;
        if (item.children) {
          const found = findNode(item.children);
          if (found) return found;
        }
      }
      return null;
    };
    const node = findNode(menus);
    const nextVisible = node ? !node.visible : undefined;
    const toggleRecursive = (items: MenuConfig[]): MenuConfig[] =>
      items.map((item) => {
        if (item.id === id) return { ...item, visible: !item.visible };
        if (item.children) return { ...item, children: toggleRecursive(item.children) };
        return item;
      });
    base.setState({ menus: toggleRecursive(menus) });
    if (!isMockMode() && nextVisible !== undefined) fireApi('/menu/update', { id, visible: nextVisible });
  },
};

// ==================== Hooks ====================

/** 获取菜单原始状态（组件内用 useMemo 派生数据，避免 selector 返回新引用导致无限渲染） */
export function useMenuState(): MenuState {
  return useStoreState(base);
}

/** 获取 TabBar 菜单 */
export function useTabMenus(): MenuConfig[] {
  const { menus } = useMenuState();
  return useMemo(() => {
    const tabParent = menus.find((m) => m.path === '/tabbar');
    return (tabParent?.children || []).filter((m) => m.visible).sort((a, b) => a.sort - b.sort);
  }, [menus]);
}

/** 获取某个父路径下的子菜单 */
export function useChildMenus(parentPath: string): MenuConfig[] {
  const { menus } = useMenuState();
  return useMemo(() => {
    const parent = menus.find((m) => m.path === parentPath);
    return (parent?.children || []).filter((m) => m.visible).sort((a, b) => a.sort - b.sort);
  }, [menus, parentPath]);
}

export type { MenuConfig };
