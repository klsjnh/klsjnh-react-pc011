/** julyMenu 模块 - 前端视图类型（表格行、store 状态、表单值等） */
import type { JulyMenuVo011 } from './vo';

// ==================== 视图 ====================

/** 菜单 store 状态 */
export interface MenuState {
  menus: JulyMenuVo011[];
  loaded: boolean;
  loading: boolean;
}

/** 菜单权限勾选树 Props（julyPermission 用） */
export interface MenuCheckTreeProps {
  tree: JulyMenuVo011[];
  checkedCodes: Set<string>;
  onCheck: (code: string, checked: boolean) => void;
  depth?: number;
}
