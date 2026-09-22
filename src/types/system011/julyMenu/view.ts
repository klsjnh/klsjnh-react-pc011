/** julyMenu 模块 - 前端视图类型（表格行、store 状态、表单值等） */
import type { JulyMenuVo011 } from '@/types/system011/julyMenu/vo';

// ==================== 视图 ====================

/**
 * 菜单 store 状态。
 *
 * 两个数据源语义不同，不可混用（后端 julyMenu 有两个树接口）：
 * - `menus`    → GET /julyMenu/v1/selectTree      全量菜单树（**菜单管理 / 权限配置**用）
 * - `navMenus` → GET /julyMenu/v1/selectUserMenuTree 当前登录人菜单树（**侧边栏导航**用，
 *                非内置角色只返回已授权菜单；未登录直接 401）
 */
export interface MenuState {
  /** 全量菜单树（菜单管理页数据源 + CRUD 操作对象） */
  menus: JulyMenuVo011[];
  /** 当前登录人菜单树（RBAC 侧边栏数据源） */
  navMenus: JulyMenuVo011[];
  /** 全量树（menus）是否已加载 */
  loaded: boolean;
  loading: boolean;
}

