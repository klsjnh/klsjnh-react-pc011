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

/** 新增组织（julyOrganization/v1/insert，层级由上级推导） */
export interface JulyOrganizationInsertVo011 {
  orgCode: string; // 组织编码（唯一）
  orgName: string; // 组织名称
  pkUser?: string; // 负责人（用户 id）
  parentId?: string; // 上级组织 id（无可空/空串 = 顶级）
  sortOrder?: number; // 同级排序
}

/** 修改组织（julyOrganization/v1/update，编码不可改，可移动上级并重排层级） */
export interface JulyOrganizationUpdateVo011 {
  id: string;
  orgName: string;
  pkUser?: string;
  parentId?: string;
  sortOrder?: number;
}

/** 用户查询参数（julyUser/v1/selectListByPage）
 *  注意：后端 userName 为「姓名」精确过滤（实测 'zhang' → 0 条），userAccount 为账号模糊 */
export interface JulyUserQueryVo011 {
  pageIndex: number;
  pageSize: number;
  userAccount?: string;
  userName?: string;
}

/** 主键入参（julyUser/v1/getById 等） */
export interface IdVo011 {
  id: string;
}

/** 新增用户（julyUser/v1/insert）；password/userAccount/userName 必填 */
export interface JulyUserInsertVo011 {
  userAccount: string; // 登录账号（唯一，最长 30，创建后不可修改）
  userName: string; // 用户姓名（最长 60）
  password: string; // 初始密码（明文传输，服务端 bcrypt 存储）
  mobile?: string;
  email?: string;
  avatar?: string;
  pkOrg?: string; // 所属组织 id
}

/** 修改用户资料（julyUser/v1/update，不含账号与密码）；id/userName 必填 */
export interface JulyUserUpdateVo011 {
  id: string;
  userName: string;
  mobile?: string;
  email?: string;
  avatar?: string;
  pkOrg?: string;
}

/** 重置密码（julyUser/v1/resetPassword，管理员动作） */
export interface JulyUserResetPasswordVo011 {
  id: string;
  password: string;
}

/** 本人修改密码（julyUser/v1/changePassword） */
export interface JulyUserChangePasswordVo011 {
  id: string;
  oldPassword: string;
  newPassword: string;
}

/** 批量逻辑删除结果（julyUser/v1/logicDelete 返回 data） */
export interface BatchDeleteResultVo011 {
  total: number;
  success: number;
  failed: number;
  errors: { id: string; message: string }[];
}

/** 逻辑删除入参：主键数组（直接作为 body 发送，非对象包裹） */
export type IdsVo011 = string[];

/** 审计事件类型（julyUserAudit.auditType；取自真实后端实测枚举） */
export type JulyUserAuditType011 =
  | 'LOGIN'
  | 'LOGIN_FAILED'
  | 'LOGOUT'
  | 'CHANGE_PASSWORD'
  | 'EXPORT'
  | (string & {});

/** 审计日志（julyUser 事件流水，julyUserAudit/v1/selectListByPage） */
export interface JulyUserAuditVo011 {
  id: string;
  pkMt: string | null; // 操作者 id（登录失败可空）
  userAccount: string; // 操作者账号（冗余）
  auditType: JulyUserAuditType011; // 事件类型
  objectCode: string; // 对象编码（如 july_user）
  auditContent: string; // 事件描述
  auditIp: string; // 客户端 IP
  createTime: string; // 事件时间
}

/** 审计查询参数（julyUserAudit/v1/selectListByPage） */
export interface JulyUserAuditQueryVo011 {
  pageIndex: number;
  pageSize: number;
  userAccount?: string; // 操作者账号（模糊）
  auditType?: string; // 事件类型（精确）
  beginTime?: string; // 事件时间下界（含）
  endTime?: string; // 事件时间上界（含）
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
