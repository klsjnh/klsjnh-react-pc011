/** 菜单 UI 类型 */
import type { JulyMenuVo011 } from '../system011';

/** 菜单配置（侧边栏 / 菜单管理页消费结构） */
export interface MenuConfig {
  id: number;
  parentId: number;
  name: string;
  path: string;
  icon: string;
  title: string;
  type: 'tab' | 'page' | 'button';
  sort: number;
  visible: boolean;
  children?: MenuConfig[];
}

/** 菜单 store 状态 */
export interface MenuState {
  menus: MenuConfig[];
  loaded: boolean;
  loading: boolean;
}

/** 菜单权限勾选树节点（julyPermission 用） */
export interface MenuTreeNode {
  id: number;
  title: string;
  path: string;
  icon: string;
  permissionCode: string;
  children?: MenuTreeNode[];
}

export type { JulyMenuVo011 };
