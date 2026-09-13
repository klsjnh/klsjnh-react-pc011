/** Mock：前端关系数据（仅用于 UI 投影，不属于后端契约） */
import { orgNameById } from './julyOrganization';
import { userNameById, mockUserRoles } from './julyUser';
import { mockRolePermissions } from './julyRole';

export const mockRelations = {
  orgName: (id?: string) => (id ? orgNameById.get(id) || '' : ''),
  userName: (id?: string) => (id ? userNameById.get(id) || '' : ''),
  userRoles: (userAccount: string) => mockUserRoles[userAccount] || [],
  rolePermissions: (roleCode: string) => mockRolePermissions[roleCode] || [],
  roleUserAccounts: (roleCode: string) =>
    Object.entries(mockUserRoles).filter(([, codes]) => codes.includes(roleCode)).map(([acct]) => acct),
};
