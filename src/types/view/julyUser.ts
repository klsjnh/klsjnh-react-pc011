/** 用户管理页 UI 视图类型（前端展示用，非后端契约） */

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
