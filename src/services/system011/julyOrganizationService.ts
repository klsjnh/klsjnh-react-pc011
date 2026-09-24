/** 组织服务（julyOrganization/v1/*）
 * 2026-09-24 后端换版·二：organization 从 system011 迁至 iam → 统一传 baseOverride = IAM_BASE
 */
import { api } from '@/api/request';
import { IAM_BASE, SYSTEM011_ACTIONS } from '@/services/system011/actions';
import { julyOrganizationStore } from '@/stores/system011/julyOrganizationStore';
import type {
  JulyOrganizationVo011,
  JulyOrganizationInsertVo011,
  JulyOrganizationUpdateVo011,
  SaveOrganizationParams,
  IdVo011,
} from '@/types/system011';

export type { SaveOrganizationParams };

/** 组织树（含人数角标；返回数组，非分页） */
export function selectOrganizationTree(): Promise<JulyOrganizationVo011[]> {
  return api.get<JulyOrganizationVo011[]>(SYSTEM011_ACTIONS.organization.selectTree, undefined, IAM_BASE);
}

/** 新增组织（层级由上级推导；返回新组织 id） */
export function insertOrganization(data: JulyOrganizationInsertVo011): Promise<IdVo011> {
  return api.post<IdVo011>(SYSTEM011_ACTIONS.organization.insert, data, IAM_BASE);
}

/** 修改组织（编码不可改，可移动上级；返回 id） */
export function updateOrganization(data: JulyOrganizationUpdateVo011): Promise<IdVo011> {
  return api.post<IdVo011>(SYSTEM011_ACTIONS.organization.update, data, IAM_BASE);
}

/** 逻辑删除组织（有子组织或挂有用户会被后端拒绝；body 为 {id}） */
export function deleteOrganization(id: string): Promise<IdVo011> {
  return api.post<IdVo011>(SYSTEM011_ACTIONS.organization.logicDelete, { id } as IdVo011, IAM_BASE);
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
