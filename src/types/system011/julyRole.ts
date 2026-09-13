/** julyRole 模块契约类型（/julyRole/v1/*） */

/** 角色（julyRole 列表/详情） */
export interface JulyRoleVo011 {
  id: string; // UUID 字符串
  roleCode: string; // 角色编码（唯一）
  roleName: string; // 角色名称
  isBuiltin: string; // 内置角色（1 是 / 0 否）
  remark: string | null; // 备注
  status: string; // 角色状态（0 禁用 / 1 启用）
  createBy?: string;
  updateBy?: string;
  createTime?: string;
  updateTime?: string;
}

/** 角色查询参数（julyRole/v1/selectListByPage） */
export interface JulyRoleQueryVo011 {
  pageIndex: number;
  pageSize: number;
  keyword?: string;
}

/** 角色分配菜单（julyRole/v1/assignMenus） */
export interface JulyRoleAssignMenusVo011 {
  id: string;
  pkMenus: string[];
}
