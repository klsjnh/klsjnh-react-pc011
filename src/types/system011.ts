/**
 * 后端 klsjnh java17-framework011 契约类型（system011 模块）
 * 来源：docs/swagger-api-docs.json（OpenAPI 3.1.0，springdoc）
 * 路径固定：POST /klsjnh/system011/{julyXxx}/v1/{动作}
 * 响应信封：Response011<T> = { statusCode, message, errorMessage, timestamp, traceId, data }
 */

/**
 * 分页结果（后端 PageResult011<T>）
 * 注意：后端字段是 rows / total / pageIndex / pageSize / totalPages
 * （不是 records / current），查询参数也用 pageIndex / pageSize
 */
export interface PageResult011<T> {
  pageIndex: number;
  pageSize: number;
  total: number;
  totalPages: number;
  rows: T[];
}

/** 登录请求（julyUser/v1/login，任何运行态可用） */
export interface JulyUserLoginVo011 {
  userAccount: string;
  password: string;
}

/** 免密登录请求（julyUser/v1/loginByUserName，仅 debug / development 运行态） */
export interface JulyUserLoginByNameVo011 {
  userAccount: string;
}

/** 登录响应会话（julyUser/v1/login 返回，签名 JWT） */
export interface JulyUserSessionVo011 {
  token: string;
  userAccount: string;
  userName: string;
  roles: string[];
}

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

/** 用户（julyUser 列表/详情）。注意：真实后端 id 为 UUID 字符串，可空字段返回 null */
export interface JulyUserVo011 {
  id: string; // UUID 字符串（非数字）
  userAccount: string;
  userName: string;
  mobile: string | null;
  email: string | null;
  avatar: string | null;
  pkOrg: string | null; // 所属组织 id（UUID），可空
  lastLoginTime: string | null;
  status: string; // 0 禁用 / 1 启用
  createBy?: string | null;
  updateBy?: string | null;
  createTime?: string | null;
  updateTime?: string | null;
}

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

/** 组织（julyOrganization 树/列表） */
export interface JulyOrganizationVo011 {
  id: string; // UUID 字符串
  parentId: string; // 上级组织 id（根为空串）
  orgCode: string; // 组织编码（唯一）
  orgName: string; // 组织名称
  pkUser: string | null; // 负责人（pk_user，可空）
  orgLevel: number; // 组织层级（根为 1）
  sortOrder: number; // 排序（同级内）
  status: string; // 组织状态（0 停用 / 1 启用）
  memberCount: number | null; // 组织人数（可空）
  children?: JulyOrganizationVo011[];
  createBy?: string;
  updateBy?: string;
  createTime?: string;
  updateTime?: string;
}

/** 用户查询参数（julyUser/v1/selectListByPage） */
export interface JulyUserQueryVo011 {
  pageIndex: number;
  pageSize: number;
  userAccount?: string;
  userName?: string;
}

/** 角色查询参数（julyRole/v1/selectListByPage） */
export interface JulyRoleQueryVo011 {
  pageIndex: number;
  pageSize: number;
  keyword?: string;
}

/** 组织查询参数（julyOrganization/v1/selectListByPage） */
export interface JulyOrganizationQueryVo011 {
  pageIndex: number;
  pageSize: number;
  keyword?: string;
}

/** 菜单查询参数（julyMenu/v1/selectListByPage） */
export interface JulyMenuQueryVo011 {
  pageIndex: number;
  pageSize: number;
  keyword?: string;
}

/** 角色分配菜单（julyRole/v1/assignMenus） */
export interface JulyRoleAssignMenusVo011 {
  id: string;
  pkMenus: string[];
}

/** 用户分配角色（julyUser/v1/assignRoles） */
export interface JulyUserAssignRolesVo011 {
  id: string;
  pkRoles: string[];
}
