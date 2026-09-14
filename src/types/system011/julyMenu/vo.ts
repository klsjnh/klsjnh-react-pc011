/** julyMenu 模块 - 后端契约类型（DTO/VO，与 swagger 一一对应） */
import type { BaseVo011 } from '@/types/common';

// ==================== 契约（/julyMenu/v1/*） ====================

/**
 * 菜单节点（julyMenu 树）
 * 继承 BaseVo011（id / status / createBy / updateBy / createTime / updateTime），
 * 前端直接使用后端字段名，不再重命名。
 */
export interface JulyMenuVo011 extends BaseVo011 {
  parentId: string;              // 上级菜单 id（根为空串）
  menuCode: string;              // 菜单编码
  menuName: string;              // 菜单名称
  menuType: string;              // 1 目录 / 2 菜单 / 3 按钮
  menuIcon: string;              // 图标
  menuRoute: string;             // 路由路径
  permissionCode: string | null; // 权限编码（目录节点为 null）
  component: string | null;      // 前端组件（可空）
  sortOrder: number;             // 同级排序
  status: string;                // 0 停用 / 1 启用（覆盖基类可选）
  children?: JulyMenuVo011[];    // 子菜单
}

/** 菜单查询参数（julyMenu/v1/selectListByPage） */
export interface JulyMenuQueryVo011 {
  pageIndex: number;
  pageSize: number;
  keyword?: string;
}
