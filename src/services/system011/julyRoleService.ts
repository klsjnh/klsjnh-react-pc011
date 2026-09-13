/** 角色服务（julyRole/v1/*） */
import { api } from '@/api/request';
import { SYSTEM011_ACTIONS } from './actions';
import type { JulyRoleVo011, PageResult011 } from '@/types/system011';

/** 角色分页查询 */
export function selectRoleListByPage(body: object = {}): Promise<PageResult011<JulyRoleVo011>> {
  return api.post<PageResult011<JulyRoleVo011>>(SYSTEM011_ACTIONS.role.selectListByPage, body);
}
