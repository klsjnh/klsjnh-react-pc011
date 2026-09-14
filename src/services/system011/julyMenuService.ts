/**
 * 菜单服务（julyMenu/v1/*）
 * 所有业务操作（含 CRUD 编排）在此；可写 store 状态。
 * 分层：page → service → store；store 不调用 service。
 */
import { isMockMode } from '@/config/appConfig';
import { resolveMenuRoute } from '@/config/routes';
import { fireApi } from '@/api/request';
import { api } from '@/api/request';
import { SYSTEM011_ACTIONS } from './actions';
import { menuStore } from '@/stores/system011/julyMenuStore';
import type { JulyMenuVo011 } from '@/types/system011/julyMenu/vo';

/** 当前登录人的菜单树（RBAC 侧边栏数据源；内置角色走全量旁路） */
export function selectUserMenuTree(): Promise<JulyMenuVo011[]> {
  return api.post<JulyMenuVo011[]>(SYSTEM011_ACTIONS.menu.selectUserMenuTree, {});
}

/** 全量菜单树（权限配置用） */
export function selectMenuTree(): Promise<JulyMenuVo011[]> {
  return api.post<JulyMenuVo011[]>(SYSTEM011_ACTIONS.menu.selectTree, {});
}

// ==================== 业务编排（写 store 状态） ====================

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

/** 初始化加载菜单（只加载一次） */
export async function loadMenus(): Promise<void> {
  const s = menuStore.getSnapshot();
  if (s.loading || s.loaded) return;
  menuStore.setState({ loading: true });
  try {
    const tree = await selectUserMenuTree();
    const mapRoute = (list: JulyMenuVo011[]): JulyMenuVo011[] =>
      list.map((m) => ({ ...m, menuRoute: resolveMenuRoute(m.menuRoute), children: m.children ? mapRoute(m.children) : undefined }));
    menuStore.setState({ menus: mapRoute(tree), loaded: true, loading: false });
  } catch {
    menuStore.setState({ loading: false });
  }
}

/** 清空缓存重新加载（切换数据模式后调用） */
export async function reloadMenus(): Promise<void> {
  menuStore.replace({ menus: [], loaded: false, loading: false });
  await loadMenus();
}

/** 获取某个路由下的子菜单 */
export function getChildMenus(parentRoute: string): JulyMenuVo011[] {
  const { menus } = menuStore.getSnapshot();
  const parent = menus.find((m) => m.menuRoute === parentRoute);
  return (parent?.children || []).filter((m) => m.status === '1').sort((a, b) => a.sortOrder - b.sortOrder);
}

/** 添加菜单 */
export function addMenu(data: Omit<JulyMenuVo011, 'id' | 'children'>): void {
  const { menus } = menuStore.getSnapshot();
  const created: JulyMenuVo011 = { ...data, id: genId(), children: [] };
  if (!created.parentId) {
    menuStore.setState({ menus: [...menus, created] });
  } else {
    const addToParent = (items: JulyMenuVo011[]): JulyMenuVo011[] =>
      items.map((item) => item.id === created.parentId
        ? { ...item, children: [...(item.children || []), created] }
        : { ...item, children: item.children ? addToParent(item.children) : item.children });
    menuStore.setState({ menus: addToParent(menus) });
  }
  if (!isMockMode()) fireApi('/julyMenu/v1/insert', created);
}

/** 更新菜单 */
export function updateMenu(id: string, patch: Partial<JulyMenuVo011>): void {
  const { menus } = menuStore.getSnapshot();
  const updateRecursive = (items: JulyMenuVo011[]): JulyMenuVo011[] =>
    items.map((item) => item.id === id
      ? { ...item, ...patch }
      : { ...item, children: item.children ? updateRecursive(item.children) : item.children });
  menuStore.setState({ menus: updateRecursive(menus) });
  if (!isMockMode()) fireApi('/julyMenu/v1/update', { id, ...patch });
}

/** 删除菜单 */
export function removeMenu(id: string): void {
  const { menus } = menuStore.getSnapshot();
  const removeRecursive = (items: JulyMenuVo011[]): JulyMenuVo011[] =>
    items.filter((item) => item.id !== id)
      .map((item) => ({ ...item, children: item.children ? removeRecursive(item.children) : undefined }));
  menuStore.setState({ menus: removeRecursive(menus) });
  if (!isMockMode()) fireApi('/julyMenu/v1/logicDelete', { id });
}

/** 移动菜单到新的上级（parentId 为空串表示顶级；不能移到自己或子孙下） */
export function moveMenu(id: string, newParentId: string): boolean {
  const { menus } = menuStore.getSnapshot();
  const node = findMenu(menus, id);
  if (!node || id === newParentId) return false;
  if (newParentId && (newParentId === id || containsId(node, newParentId))) return false;
  const detached = (items: JulyMenuVo011[]): JulyMenuVo011[] =>
    items.filter((item) => item.id !== id)
      .map((item) => ({ ...item, children: item.children ? detached(item.children) : undefined }));
  const rest = detached(menus);
  const moved: JulyMenuVo011 = { ...node, parentId: newParentId };
  if (!newParentId) {
    menuStore.setState({ menus: [...rest, moved] });
  } else {
    const addUnder = (items: JulyMenuVo011[]): JulyMenuVo011[] =>
      items.map((item) => item.id === newParentId
        ? { ...item, children: [...(item.children || []), moved] }
        : { ...item, children: item.children ? addUnder(item.children) : item.children });
    menuStore.setState({ menus: addUnder(rest) });
  }
  if (!isMockMode()) fireApi('/julyMenu/v1/update', { id, parentId: newParentId });
  return true;
}

/** 切换启用/停用 */
export function toggleMenuStatus(id: string): void {
  const node = findMenu(menuStore.getSnapshot().menus, id);
  if (!node) return;
  const status = node.status === '1' ? '0' : '1';
  updateMenu(id, { status });
}
