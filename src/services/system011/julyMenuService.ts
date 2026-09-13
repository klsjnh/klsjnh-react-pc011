/** 菜单服务（julyMenu/v1/*） */
import { api } from '@/api/request';
import { SYSTEM011_ACTIONS } from './actions';
import type { JulyMenuVo011, PageResult011 } from '@/types/system011';

/** 当前登录人的菜单树（RBAC 侧边栏数据源；内置角色走全量旁路） */
export function selectUserMenuTree(): Promise<JulyMenuVo011[]> {
  return api.post<JulyMenuVo011[]>(SYSTEM011_ACTIONS.menu.selectUserMenuTree, {});
}

/** 全量菜单树 */
export function selectMenuTree(): Promise<JulyMenuVo011[]> {
  return api.post<JulyMenuVo011[]>(SYSTEM011_ACTIONS.menu.selectTree, {});
}

/** 菜单分页查询 */
export function selectMenuListByPage(body: object = {}): Promise<PageResult011<JulyMenuVo011>> {
  return api.post<PageResult011<JulyMenuVo011>>(SYSTEM011_ACTIONS.menu.selectListByPage, body);
}
