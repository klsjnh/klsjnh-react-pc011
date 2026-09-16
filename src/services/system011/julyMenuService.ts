/**
 * 菜单服务（julyMenu/v1/*）
 * 所有业务操作（含 CRUD 编排）在此；可写 store 状态。
 * 分层：page → service → store；store 不调用 service。
 */
import { isMockMode } from '@/config/appConfig';
import { api, fireApi } from '@/api/request';
import { SYSTEM011_ACTIONS } from '@/services/system011/actions';
import { menuStore } from '@/stores/system011/julyMenuStore';
import { uiStore } from '@/stores/uiStore';
import type { JulyMenuVo011 } from '@/types/system011/julyMenu/vo';

/** 当前登录人的菜单树（RBAC 侧边栏数据源；内置角色走全量旁路） */
export function selectUserMenuTree(): Promise<JulyMenuVo011[]> {
  return api.get<JulyMenuVo011[]>(SYSTEM011_ACTIONS.menu.selectUserMenuTree);
}

/** 全量菜单树（GET /julyMenu/v1/selectTree）：菜单管理页 + 角色授权树的数据源 */
export function selectMenuTree(): Promise<JulyMenuVo011[]> {
  return api.get<JulyMenuVo011[]>(SYSTEM011_ACTIONS.menu.selectTree);
}

// ==================== 业务编排（写 store 状态） ====================

/** 生成新菜单 id（mock / api 均为字符串主键） */
const genId = () => `menu${Date.now()}${Math.random().toString(36).slice(2, 6)}`;

/** 新建菜单图标默认值 */
const DEFAULT_MENU_ICON = 'FileTextOutlined';

/** 新建菜单入参（页面只传表单字段，默认值由 service 补齐） */
export interface CreateMenuData {
  parentId?: string;
  menuCode: string;
  menuName: string;
  menuIcon?: string;
  menuRoute: string;
  menuType: string;
  status?: string;
  /** 权限编码（目录节点为 null；菜单/按钮必填） */
  permissionCode?: string | null;
  /** 前端组件路径（仅菜单类型有值；目录/按钮为 null） */
  component?: string | null;
}

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

/** 初始化加载全量菜单树（菜单管理 / 角色授权的数据源；只加载一次） */
export async function loadMenus(): Promise<void> {
  const s = menuStore.getSnapshot();
  if (s.loading || s.loaded) return;
  menuStore.setState({ loading: true });
  try {
    const tree = await selectMenuTree();
    menuStore.setState({ menus: tree, loaded: true, loading: false });
  } catch {
    menuStore.setState({ loading: false });
  }
}

/**
 * 加载当前登录人的菜单树（RBAC 侧边栏数据源）。
 * 与 loadMenus 分属两个后端接口：本函数走 selectUserMenuTree（非内置角色只返回已授权菜单），
 * 不能与 selectTree 换用，否则导航会绕过权限。
 */
export async function loadNavMenus(): Promise<void> {
  try {
    const tree = await selectUserMenuTree();
    menuStore.setState({ navMenus: tree });
  } catch {
    menuStore.setState({ navMenus: [] });
  }
}

/** 清空缓存重新加载（切换数据模式 / 登录后进主界面时调用）：全量树 + 导航树一起重拉 */
export async function reloadMenus(): Promise<void> {
  menuStore.replace({ menus: [], navMenus: [], loaded: false, loading: false });
  uiStore.setMenuTreeSelectedId(null);
  await Promise.all([loadMenus(), loadNavMenus()]);
}

/** 获取某个路由下的子菜单（导航树数据源，仅取启用项） */
export function getChildMenus(parentRoute: string): JulyMenuVo011[] {
  const { navMenus } = menuStore.getSnapshot();
  const parent = navMenus.find((m) => m.menuRoute === parentRoute);
  return (parent?.children || []).filter((m) => m.status === '1').sort((a, b) => a.sortOrder - b.sortOrder);
}

/** 添加菜单（service 内部补齐 id / children / 默认值） */
export async function addMenu(data: CreateMenuData): Promise<void> {
  const { menus } = menuStore.getSnapshot();
  const created: JulyMenuVo011 = {
    ...data,
    id: genId(),
    children: [],
    menuIcon: data.menuIcon || DEFAULT_MENU_ICON,
    permissionCode: data.permissionCode ?? null,
    component: data.component ?? null,
    sortOrder: 0,
    status: '1',
    parentId: data.parentId || '',
  };
  if (!created.parentId) {
    menuStore.setState({ menus: [...menus, created] });
  } else {
    const addToParent = (items: JulyMenuVo011[]): JulyMenuVo011[] =>
      items.map((item) => item.id === created.parentId
        ? { ...item, children: [...(item.children || []), created] }
        : { ...item, children: item.children ? addToParent(item.children) : item.children });
    menuStore.setState({ menus: addToParent(menus) });
  }
  if (!isMockMode()) await fireApi(SYSTEM011_ACTIONS.menu.insert, created);
}

/** 更新菜单 */
export async function updateMenu(id: string, patch: Partial<JulyMenuVo011>): Promise<void> {
  const { menus } = menuStore.getSnapshot();
  const updateRecursive = (items: JulyMenuVo011[]): JulyMenuVo011[] =>
    items.map((item) => item.id === id
      ? { ...item, ...patch }
      : { ...item, children: item.children ? updateRecursive(item.children) : item.children });
  menuStore.setState({ menus: updateRecursive(menus) });
  if (!isMockMode()) await fireApi(SYSTEM011_ACTIONS.menu.update, { id, ...patch });
}

/** 删除菜单 */
export async function removeMenu(id: string): Promise<void> {
  const { menus } = menuStore.getSnapshot();
  const removeRecursive = (items: JulyMenuVo011[]): JulyMenuVo011[] =>
    items.filter((item) => item.id !== id)
      .map((item) => ({ ...item, children: item.children ? removeRecursive(item.children) : undefined }));
  menuStore.setState({ menus: removeRecursive(menus) });
  if (!isMockMode()) await fireApi(SYSTEM011_ACTIONS.menu.logicDelete, { id });
}

/** 移动菜单到新的上级（parentId 为空串表示顶级；不能移到自己或子孙下） */
export async function moveMenu(id: string, newParentId: string): Promise<boolean> {
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
  if (!isMockMode()) {
    await fireApi(SYSTEM011_ACTIONS.menu.update, {
      id,
      menuName: node.menuName,
      menuType: node.menuType,
      menuIcon: node.menuIcon,
      menuRoute: node.menuRoute,
      permissionCode: node.permissionCode,
      component: node.component,
      parentId: newParentId,
      sortOrder: node.sortOrder,
    });
  }
  return true;
}

/** 同级排序重排（更新 sortOrder；仅前端 store 编排，不改父级） */
export async function reorderMenu(dragId: string, targetId: string, position: number): Promise<void> {
  const { menus } = menuStore.getSnapshot();
  const dragNode = findMenu(menus, dragId);
  const targetNode = findMenu(menus, targetId);
  if (!dragNode || !targetNode) return;

  const parentId = targetNode.parentId || '';
  const siblings = parentId
    ? findMenu(menus, parentId)?.children || []
    : menus;

  const sorted = [...siblings].sort((a, b) => a.sortOrder - b.sortOrder);
  const dragIndex = sorted.findIndex((x) => x.id === dragId);
  const targetIndex = sorted.findIndex((x) => x.id === targetId);
  if (dragIndex === -1 || targetIndex === -1) return;

  sorted.splice(dragIndex, 1);
  const insertIndex = targetIndex > dragIndex ? targetIndex - 1 : targetIndex;
  sorted.splice(position === -1 ? insertIndex : insertIndex + 1, 0, dragNode);

  const reordered = sorted.map((item, idx) => ({ ...item, sortOrder: idx + 1 }));

  const apply = (items: JulyMenuVo011[]): JulyMenuVo011[] =>
    items.map((item) => {
      if (item.id === parentId && item.children) {
        return { ...item, children: reordered };
      }
      if (item.children) {
        return { ...item, children: apply(item.children) };
      }
      return item;
    });

  menuStore.setState({ menus: apply(menus) });
}

/** 切换启用/停用 */
export async function toggleMenuStatus(id: string): Promise<void> {
  const node = findMenu(menuStore.getSnapshot().menus, id);
  if (!node) return;
  const status = node.status === '1' ? '0' : '1';
  await updateMenu(id, { status });
}
