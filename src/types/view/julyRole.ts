/** 角色 / 权限管理 UI 类型 */
import type { OrgTreeNode } from './organization';

/** UI 投影：角色（id 为后端 UUID 字符串，禁止数字化） */
export interface RoleDetail {
  id: string;
  name: string;            // roleCode
  label: string;           // roleName
  description: string;     // remark
  status: 'active' | 'inactive';
  isBuiltin: boolean;
  permissions: string[];
  userIds: string[];
}

/** UI 投影：用户（username/realName/department 来自 JulyUserVo011；id 为 UUID 字符串） */
export interface UserInfo {
  id: string;
  username: string;        // userAccount
  realName: string;        // userName
  department: string;      // 组织名称（orgName(pkOrg)）
  departmentId: string;    // 组织 id（pkOrg，UUID 字符串）
}

/** 角色 store 状态 */
export interface RoleState {
  roles: RoleDetail[];
  users: UserInfo[];
  orgTree: OrgTreeNode[];
  loaded: boolean;
  loading: boolean;
}
