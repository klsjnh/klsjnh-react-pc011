/** 组织服务（julyOrganization/v1/*） */
import { api } from '../../api/request';
import { SYSTEM011_ACTIONS } from './actions';
import { julyOrganizationStore } from '../../stores/system011/julyOrganizationStore';
import type {
  JulyOrganizationVo011,
  JulyOrganizationInsertVo011,
  JulyOrganizationUpdateVo011,
  PageResult011,
  IdVo011,
} from '../../types/system011';

/** 组织分页查询（真实后端返回 PageResult011，rows 内为组织树） */
export function selectOrganizationListByPage(body: object = {}): Promise<PageResult011<JulyOrganizationVo011>> {
  return api.post<PageResult011<JulyOrganizationVo011>>(SYSTEM011_ACTIONS.organization.selectListByPage, body);
}

/** 组织树（含人数角标；返回数组，非分页） */
export function selectOrganizationTree(): Promise<JulyOrganizationVo011[]> {
  return api.post<JulyOrganizationVo011[]>(SYSTEM011_ACTIONS.organization.selectTree, {});
}

/** 组织详情（主键查询） */
export function getOrganizationById(id: string): Promise<JulyOrganizationVo011> {
  return api.post<JulyOrganizationVo011>(SYSTEM011_ACTIONS.organization.getById, { id } as IdVo011);
}

/** 新增组织（层级由上级推导；返回新组织 id） */
export function insertOrganization(data: JulyOrganizationInsertVo011): Promise<IdVo011> {
  return api.post<IdVo011>(SYSTEM011_ACTIONS.organization.insert, data);
}

/** 修改组织（编码不可改，可移动上级；返回 id） */
export function updateOrganization(data: JulyOrganizationUpdateVo011): Promise<IdVo011> {
  return api.post<IdVo011>(SYSTEM011_ACTIONS.organization.update, data);
}

/** 逻辑删除组织（有子组织或挂有用户会被后端拒绝；body 为 {id}） */
export function deleteOrganization(id: string): Promise<IdVo011> {
  return api.post<IdVo011>(SYSTEM011_ACTIONS.organization.logicDelete, { id } as IdVo011);
}

// ==================== 业务编排（写 store 状态） ====================

function buildOrgNameMap(tree: JulyOrganizationVo011[]): Map<string, string> {
  const map = new Map<string, string>();
  (function walk(list: JulyOrganizationVo011[]) {
    for (const o of list) {
      map.set(o.id, o.orgName);
      if (o.children) walk(o.children);
    }
  })(tree);
  return map;
}

/** 拉取组织树并写入 store（含 id→名称 映射） */
export async function fetchOrganizationTree(): Promise<void> {
  julyOrganizationStore.setState({ loading: true });
  try {
    const tree = await selectOrganizationTree();
    julyOrganizationStore.setState({ tree, orgNameById: buildOrgNameMap(tree), loading: false });
  } catch {
    julyOrganizationStore.setState({ tree: [], orgNameById: new Map(), loading: false });
  }
}

/** 组织保存入参（有 id = 编辑，无 id = 新增） */
export interface SaveOrganizationParams {
  id?: string;
  orgCode?: string;
  orgName: string;
  pkUser?: string;
  parentId?: string;
  sortOrder?: number;
}

/** 新增 / 修改组织，成功后刷新组织树（返回 id） */
export async function saveOrganization(params: SaveOrganizationParams): Promise<string> {
  const { id, orgCode, orgName, pkUser, parentId, sortOrder } = params;
  let savedId: string;
  if (id) {
    ({ id: savedId } = await updateOrganization({ id, orgName, pkUser, parentId, sortOrder }));
  } else {
    ({ id: savedId } = await insertOrganization({ orgCode: orgCode || '', orgName, pkUser, parentId, sortOrder }));
  }
  await fetchOrganizationTree();
  return savedId;
}

/** 逻辑删除组织 + 刷新组织树（返回被删 id） */
export async function removeOrganization(id: string): Promise<string> {
  const res = await deleteOrganization(id);
  await fetchOrganizationTree();
  return res.id;
}
