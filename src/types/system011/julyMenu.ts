/** julyMenu 模块契约类型（/julyMenu/v1/*） */

/** 菜单节点（julyMenu 树，子节点按排序） */
export interface JulyMenuVo011 {
  id: string; // UUID 字符串
  parentId: string;
  menuCode: string;
  menuName: string;
  menuType: string; // 1 目录 / 2 菜单 / 3 按钮
  menuIcon: string;
  menuRoute: string;
  permissionCode: string | null; // 目录节点为 null
  component: string | null;
  sortOrder: number;
  status: string; // 0 停用 / 1 启用
  children?: JulyMenuVo011[];
  createBy?: string;
  updateBy?: string;
  createTime?: string;
  updateTime?: string;
}

/** 菜单查询参数（julyMenu/v1/selectListByPage） */
export interface JulyMenuQueryVo011 {
  pageIndex: number;
  pageSize: number;
  keyword?: string;
}
