/** 表单校验工具 */

/** 邮箱格式 */
export const isEmail = (v: string): boolean => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);

/** 手机号格式（中国大陆） */
export const isMobile = (v: string): boolean => /^1[3-9]\d{9}$/.test(v);

export interface JulyUserFormValues {
  username: string;
  realName: string;
  email: string;
  phone: string;
  password: string;
}

export interface JulyUserFormContext {
  /** 是否编辑（编辑时不校验账号/密码） */
  isEdit: boolean;
  /** 已选组织名（空 = 未选） */
  department: string;
  /** 已选角色 id */
  roleIds: string[];
}

/** 用户新增/编辑表单校验，返回字段错误表（空 = 通过） */
export function validateJulyUserForm(
  values: JulyUserFormValues,
  ctx: JulyUserFormContext,
): Record<string, string> {
  const e: Record<string, string> = {};
  if (!ctx.isEdit && !values.username.trim()) e.username = '请输入用户名';
  if (!values.realName.trim()) e.realName = '请输入姓名';
  if (!values.email.trim()) e.email = '请输入邮箱';
  else if (!isEmail(values.email)) e.email = '邮箱格式不正确';
  if (!values.phone.trim()) e.phone = '请输入手机号';
  else if (!isMobile(values.phone)) e.phone = '手机号格式不正确';
  if (!ctx.department) e.department = '请选择组织';
  if (ctx.roleIds.length === 0) e.roles = '请至少选择一个角色';
  if (!ctx.isEdit) {
    if (!values.password.trim()) e.password = '请输入密码';
    else if (values.password.length < 6) e.password = '密码至少6位';
  }
  return e;
}
