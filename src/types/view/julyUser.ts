/** 用户管理 UI / 表单类型（前端展示用，非后端契约） */
import type { JulyUserVo011, JulyUserQueryVo011 } from '../system011';

/** 用户列表行视图（由 JulyUserVo011 投影：组织名/角色为关联数据） */
export interface JulyUserView {
  id: string;
  username: string;
  realName: string;
  email: string;
  phone: string;
  department: string;
  departmentId: string | null;
  roles: string[];
  status: 'active' | 'inactive';
  createdAt: string;
  lastLoginTime: string;
}

/** 用户 store 状态 */
export interface UserState {
  list: JulyUserVo011[];
  total: number;
  totalPages: number;
  loading: boolean;
  query: JulyUserQueryVo011;
}

/** 用户新增/编辑表单值 */
export interface JulyUserFormValues {
  username: string;
  realName: string;
  email: string;
  phone: string;
  password: string;
}

/** 用户表单校验上下文 */
export interface JulyUserFormContext {
  /** 是否编辑（编辑时不校验账号/密码） */
  isEdit: boolean;
  /** 已选组织名（空 = 未选） */
  department: string;
  /** 已选角色 id */
  roleIds: string[];
}
