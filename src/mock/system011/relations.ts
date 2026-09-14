/** Mock：前端关系数据（仅用于 UI 投影，不属于后端契约） */
import { orgNameById } from '@/mock/system011/julyOrganization';
import { userNameById, mockUserRoles } from '@/mock/system011/julyUser';
import { mockRolePermissions } from '@/mock/system011/julyRole';

export const mockRelations = {
  orgName: (id?: string) => (id ? orgNameById.get(id) || '' : ''),
  userName: (id?: string) => (id ? userNameById.get(id) || '' : ''),
  userRoles: (userAccount: string) => mockUserRoles[userAccount] || [],
  rolePermissions: (roleCode: string) => mockRolePermissions[roleCode] || [],
  roleUserAccounts: (roleCode: string) =>
    Object.entries(mockUserRoles).filter(([, codes]) => codes.includes(roleCode)).map(([acct]) => acct),
};
