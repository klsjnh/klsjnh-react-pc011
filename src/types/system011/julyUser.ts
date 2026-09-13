/** julyUser 模块契约类型（/julyUser/v1/*） */

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

/** 用户查询参数（julyUser/v1/selectListByPage）
 *  注意：后端 userName 为「姓名」精确过滤，userAccount 为账号模糊 */
export interface JulyUserQueryVo011 {
  pageIndex: number;
  pageSize: number;
  userAccount?: string;
  userName?: string;
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

/** 用户分配角色（julyUser/v1/assignRoles） */
export interface JulyUserAssignRolesVo011 {
  id: string;
  pkRoles: string[];
}

/** 用户保存入参（service 编排用：有 id = 编辑，无 id = 新增） */
export interface SaveUserParams {
  id?: string;
  userAccount?: string;
  userName: string;
  password?: string;
  mobile?: string;
  email?: string;
  pkOrg?: string;
}
