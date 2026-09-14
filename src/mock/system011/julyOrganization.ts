/** Mock：组织（julyOrganization） */
import { ok, fail, delay, pageResult, type Handler } from '@/mock/system011/common';
import { mockUsers } from '@/mock/system011/julyUser';
import type { JulyOrganizationVo011 } from '@/types/system011';

/** 与真实后端一致：单根组织「华信集团」，id 为 UUID 风格字符串，pkUser/memberCount 可空 */
export const mockOrgs: JulyOrganizationVo011[] = [
  {
    id: 'org0001root000000000000000001', parentId: '', orgCode: 'HX', orgName: '华信集团',
    pkUser: null, orgLevel: 1, sortOrder: 9999, status: '1', memberCount: null,
    children: [], createTime: '2026-09-12T23:20:32', updateTime: '2026-09-13T11:36:07',
  },
];

export const orgNameById = new Map<string, string>();
export function reindexOrgs() {
  orgNameById.clear();
  (function indexOrgs(list: JulyOrganizationVo011[]) {
    for (const o of list) { orgNameById.set(o.id, o.orgName); if (o.children) indexOrgs(o.children); }
  })(mockOrgs);
}
reindexOrgs();

/** 深度查找组织节点 */
function findOrg(id?: string): JulyOrganizationVo011 | null {
  if (!id) return null;
  let found: JulyOrganizationVo011 | null = null;
  (function walk(list: JulyOrganizationVo011[]) {
    for (const o of list) {
      if (o.id === id) { found = o; return; }
      if (o.children) walk(o.children);
      if (found) return;
    }
  })(mockOrgs);
  return found;
}

/** 从树上摘除节点并返回 */
function detachOrg(id: string): JulyOrganizationVo011 | null {
  function walk(list: JulyOrganizationVo011[]): JulyOrganizationVo011 | null {
    const i = list.findIndex((o) => o.id === id);
    if (i >= 0) return list.splice(i, 1)[0];
    for (const o of list) {
      if (o.children) { const r = walk(o.children); if (r) return r; }
    }
    return null;
  }
  return walk(mockOrgs);
}

/** 挂到指定上级下（parentId 为空则作为顶级） */
function appendOrg(parentId: string, node: JulyOrganizationVo011) {
  const parent = parentId ? findOrg(parentId) : null;
  if (!parent) { mockOrgs.push(node); return; }
  parent.children = parent.children || [];
  parent.children.push(node);
}

/** 由上级推导层级（根为 1） */
function computeOrgLevel(parentId: string): number {
  const parent = parentId ? findOrg(parentId) : null;
  return parent ? parent.orgLevel + 1 : 1;
}

/** maybeDescendantId 是否为 ancestorId 的后代 */
function isOrgDescendant(ancestorId: string, maybeDescendantId: string): boolean {
  const a = findOrg(ancestorId);
  if (!a || !a.children) return false;
  let yes = false;
  (function walk(list: JulyOrganizationVo011[]) {
    for (const o of list) {
      if (o.id === maybeDescendantId) { yes = true; return; }
      if (o.children) walk(o.children);
    }
  })(a.children);
  return yes;
}

function countOrgUsers(orgId: string): number {
  return mockUsers.filter((u) => u.pkOrg === orgId).length;
}

/** 重算各组织人数角标（用户 pkOrg 归属数） */
function refreshMemberCounts() {
  (function walk(list: JulyOrganizationVo011[]) {
    for (const o of list) { o.memberCount = countOrgUsers(o.id); if (o.children) walk(o.children); }
  })(mockOrgs);
}

export const handlers: Record<string, Handler> = {
  // ===== 组织：分页（rows 内为组织树） =====
  '/julyOrganization/v1/selectListByPage': async (body) => {
    await delay(300);
    refreshMemberCounts();
    return ok(pageResult(structuredClone(mockOrgs), body?.pageIndex || 1, body?.pageSize || 10));
  },

  // ===== 组织树（含人数角标；返回数组） =====
  '/julyOrganization/v1/selectTree': async () => {
    await delay(300);
    refreshMemberCounts();
    return ok(structuredClone(mockOrgs));
  },

  // ===== 组织详情 =====
  '/julyOrganization/v1/getById': async (body) => {
    await delay(200);
    const o = findOrg(body?.id);
    if (!o) return fail(`record not found, id=${body?.id}`, 404);
    return ok(structuredClone(o));
  },

  // ===== 新增组织（组织编码唯一；层级由上级推导） =====
  '/julyOrganization/v1/insert': async (body) => {
    await delay(400);
    const code = (body?.orgCode || '').trim();
    const name = (body?.orgName || '').trim();
    if (!code) return fail('insert: orgCode is required', 400);
    if (!name) return fail('insert: orgName is required', 400);
    let dup = false;
    (function walk(list: JulyOrganizationVo011[]) {
      for (const o of list) { if (o.orgCode === code) dup = true; if (o.children) walk(o.children); }
    })(mockOrgs);
    if (dup) return fail(`insert: orgCode already exists, ${code}`, 400);
    const parentId = body?.parentId || '';
    if (parentId && !findOrg(parentId)) return fail(`insert: parent not found, ${parentId}`, 400);
    const now = new Date().toISOString().slice(0, 19);
    const no: JulyOrganizationVo011 = {
      id: 'mockorg' + Math.random().toString(36).slice(2, 10).padEnd(8, '0') + '00000000',
      parentId, orgCode: code, orgName: name, pkUser: body.pkUser || null,
      orgLevel: computeOrgLevel(parentId), sortOrder: body.sortOrder ?? 0, status: '1', memberCount: 0,
      children: [], createTime: now, updateTime: now,
    };
    appendOrg(parentId, no);
    reindexOrgs();
    return ok({ id: no.id });
  },

  // ===== 修改组织（编码不可改；可移动上级） =====
  '/julyOrganization/v1/update': async (body) => {
    await delay(350);
    const o = findOrg(body?.id);
    if (!o) return fail(`record not found, id=${body?.id}`, 404);
    const name = (body?.orgName || '').trim();
    if (!name) return fail('update: orgName is required', 400);
    const parentId = body?.parentId || '';
    if (parentId) {
      if (!findOrg(parentId)) return fail(`update: parent not found, ${parentId}`, 400);
      if (parentId === o.id || isOrgDescendant(o.id, parentId)) {
        return fail('update: cannot move under own descendant', 400);
      }
    }
    const now = new Date().toISOString().slice(0, 19);
    if (parentId !== (o.parentId || '')) {
      const detached = detachOrg(o.id);
      if (detached) {
        detached.parentId = parentId;
        detached.orgName = name;
        detached.pkUser = body.pkUser || null;
        detached.orgLevel = computeOrgLevel(parentId);
        if (body.sortOrder !== undefined) detached.sortOrder = body.sortOrder;
        detached.updateTime = now;
        appendOrg(parentId, detached);
      }
    } else {
      o.orgName = name;
      o.pkUser = body.pkUser || null;
      o.parentId = parentId;
      o.orgLevel = computeOrgLevel(parentId);
      if (body.sortOrder !== undefined) o.sortOrder = body.sortOrder;
      o.updateTime = now;
    }
    reindexOrgs();
    return ok({ id: o.id });
  },

  // ===== 逻辑删除（有子组织或挂有用户则拒绝） =====
  '/julyOrganization/v1/logicDelete': async (body) => {
    await delay(350);
    const o = findOrg(body?.id);
    if (!o) return fail(`record not found, id=${body?.id}`, 404);
    if (o.children && o.children.length > 0) return fail('delete: has child organization', 400);
    if (countOrgUsers(o.id) > 0) return fail('delete: organization has users', 400);
    detachOrg(o.id);
    reindexOrgs();
    return ok({ id: o.id });
  },
};
