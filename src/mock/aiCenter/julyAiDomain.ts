/**
 * Mock：AI 业务域（julyAiDomain）—— 对齐线上新契约（2026-09-21 bundle 模型，17 端点）
 * 域为树（parentId/children）；提示词为域明细子表（mock 于 julyAiPrompt.ts）。
 * saveWhole = 域 + prompts 整存替换（旧子表逻辑删 + 新列表插入）。
 */
import { ok, fail, delay, pageResult, type Handler } from '@/mock/system011/common';
import type { JulyAiDomainItem, JulyAiDomainSaveWholeVo011 } from '@/types/aiCenter/aiDomain/vo';
import { mockPrompts, appendPromptContent } from '@/mock/aiCenter/julyAiPrompt';

/** mock 数据源自增 id */
let nextId = 300;

/** Mock 业务域树（parentId：根为空串；与提示词明细 pkMt 对应） */
export const mockDomains: JulyAiDomainItem[] = [
  { id: 'dom-0001', domainCode: 'default', domainName: '默认域', parentId: '', sortOrder: 1, status: '1', remark: '通用场景' },
  { id: 'dom-0002', domainCode: 'finance', domainName: '财务域', parentId: '', sortOrder: 2, status: '1', remark: '' },
  { id: 'dom-0003', domainCode: 'marketing', domainName: '营销域', parentId: '', sortOrder: 3, status: '0', remark: '已停用' },
  { id: 'dom-0004', domainCode: 'finance.report', domainName: '报表子域', parentId: 'dom-0002', sortOrder: 1, status: '1', remark: '财务/报表细分' },
];

/** 平铺 → 树（按 parentId 组装、sortOrder 排序） */
export function buildDomainTree(list: JulyAiDomainItem[]): JulyAiDomainItem[] {
  const byParent = new Map<string, JulyAiDomainItem[]>();
  for (const n of list) {
    const key = n.parentId || '';
    if (!byParent.has(key)) byParent.set(key, []);
    byParent.get(key)!.push(n);
  }
  const attach = (parentId: string): JulyAiDomainItem[] =>
    (byParent.get(parentId) || [])
      .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
      .map((n) => {
        const children = attach(n.id);
        return children.length ? { ...n, children } : { ...n };
      });
  return attach('');
}

/** id → 节点（含子树判定用平铺） */
const findDomain = (id: string) => mockDomains.find((d) => d.id === id);

export const handlers: Record<string, Handler> = {
  // ===== 业务域分页查询（keyword 模糊 code/name，parentId/status 过滤） =====
  '/julyAiDomain/v1/selectListByPage': async (body) => {
    await delay(250);
    const kw = (body?.keyword || '').trim().toLowerCase();
    const status = body?.status;
    const parentId = body?.parentId;
    let rows = [...mockDomains];
    if (kw) {
      rows = rows.filter((r) =>
        r.domainCode.toLowerCase().includes(kw) ||
        r.domainName.toLowerCase().includes(kw));
    }
    if (status) rows = rows.filter((r) => r.status === status);
    if (parentId !== undefined && parentId !== '') rows = rows.filter((r) => (r.parentId || '') === parentId);
    rows.sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
    return ok(pageResult(rows, body?.pageIndex || 1, body?.pageSize || 10));
  },

  // ===== 业务域树查询（selectTree） =====
  '/julyAiDomain/v1/selectTree': async (body) => {
    await delay(250);
    const status = body?.status;
    const list = status ? mockDomains.filter((r) => r.status === status) : mockDomains;
    return ok(buildDomainTree(list));
  },

  // ===== 域 + 提示词打包查询（getWithChildren） =====
  '/julyAiDomain/v1/getWithChildren': async (body) => {
    await delay(250);
    const domain = findDomain(body?.id);
    if (!domain) return fail(`record not found, id=${body?.id}`, 404);
    const prompts = mockPrompts.filter((p) => p.pkMt === domain.id)
      .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
      .map((p) => ({ ...p }));
    return ok({ domain: { ...domain }, prompts });
  },

  // ===== 新增业务域（domainCode 唯一；不收 status，默认启用） =====
  '/julyAiDomain/v1/insert': async (body) => {
    await delay(350);
    const domainCode = (body?.domainCode || '').trim();
    const domainName = (body?.domainName || '').trim();
    if (!domainCode) return fail('insert: domainCode is required', 400);
    if (!domainName) return fail('insert: domainName is required', 400);
    if (mockDomains.some((d) => d.domainCode === domainCode)) return fail(`insert: domainCode ${domainCode} already exists`, 400);
    const parentId = body?.parentId || '';
    if (parentId && !findDomain(parentId)) return fail(`insert: parent domain not found, id=${parentId}`, 400);
    const item: JulyAiDomainItem = {
      id: `dom-${String(nextId++)}`,
      domainCode, domainName,
      parentId,
      sortOrder: body?.sortOrder ?? mockDomains.length + 1,
      status: '1',
      remark: body?.remark || '',
    };
    mockDomains.push(item);
    return ok({ id: item.id });
  },

  // ===== 修改业务域（domainCode 不可变；parentId 可移动挂载点；防环） =====
  '/julyAiDomain/v1/update': async (body) => {
    await delay(350);
    const item = findDomain(body?.id);
    if (!item) return fail(`record not found, id=${body?.id}`, 404);
    if (body?.parentId !== undefined) {
      const parentId = body.parentId || '';
      if (parentId) {
        if (parentId === item.id) return fail('update: parent cannot be itself', 400);
        // 防环：新父不能在自己的子树里（沿 children 链向下找）
        const subtree = (buildDomainTree([item])[0]?.children) || [];
        const inSubtree = (nodes: JulyAiDomainItem[]): boolean =>
          nodes.some((n) => n.id === parentId || inSubtree(n.children || []));
        if (inSubtree(subtree)) return fail('update: cannot move domain into its own subtree', 400);
        if (!findDomain(parentId)) return fail(`update: parent domain not found, id=${parentId}`, 400);
      }
      item.parentId = parentId;
    }
    if (body?.domainName !== undefined) item.domainName = body.domainName;
    if (body?.sortOrder !== undefined) item.sortOrder = body.sortOrder;
    if (body?.status !== undefined) item.status = body.status;
    if (body?.remark !== undefined) item.remark = body.remark;
    return ok({ id: item.id });
  },

  // ===== 逻辑删除业务域（子域与明细级联删除） =====
  '/julyAiDomain/v1/logicDelete': async (body) => {
    await delay(300);
    const item = findDomain(body?.id);
    if (!item) return fail(`record not found, id=${body?.id}`, 404);
    // 收集子树 id
    const subtreeIds: string[] = [item.id];
    let grew = true;
    while (grew) {
      grew = false;
      for (const d of mockDomains) {
        if (subtreeIds.includes(d.id)) continue;
        if (d.parentId && subtreeIds.includes(d.parentId)) { subtreeIds.push(d.id); grew = true; }
      }
    }
    for (const id of subtreeIds) {
      const i = mockDomains.findIndex((d) => d.id === id);
      if (i >= 0) mockDomains.splice(i, 1);
    }
    // 级联清理明细（pkMt 挂域）
    for (let i = mockPrompts.length - 1; i >= 0; i--) {
      if (subtreeIds.includes(mockPrompts[i].pkMt)) mockPrompts.splice(i, 1);
    }
    return ok({ id: item.id });
  },

  // ===== 域 + 提示词整存替换（saveWhole） =====
  '/julyAiDomain/v1/saveWhole': async (body) => {
    await delay(400);
    const vo = body as JulyAiDomainSaveWholeVo011;
    if (!vo?.domainName) return fail('saveWhole: domainName is required', 400);
    let domainId = vo.id || '';
    if (domainId) {
      const item = findDomain(domainId);
      if (!item) return fail(`saveWhole: domain not found, id=${domainId}`, 404);
      if (vo.domainCode !== undefined && String(vo.domainCode).trim() !== item.domainCode) {
        return fail('saveWhole: domainCode is immutable', 400);
      }
      if (vo.parentId !== undefined) item.parentId = vo.parentId || '';
      if (vo.domainName !== undefined) item.domainName = vo.domainName;
      if (vo.sortOrder !== undefined) item.sortOrder = vo.sortOrder;
      if (vo.status !== undefined) item.status = vo.status;
      if (vo.remark !== undefined) item.remark = vo.remark;
    } else {
      const domainCode = (vo.domainCode || '').trim();
      if (!domainCode) return fail('saveWhole: domainCode is required for insert', 400);
      if (mockDomains.some((d) => d.domainCode === domainCode)) return fail(`saveWhole: domainCode ${domainCode} already exists`, 400);
      const item: JulyAiDomainItem = {
        id: `dom-${String(nextId++)}`,
        domainCode, domainName: vo.domainName,
        parentId: vo.parentId || '',
        sortOrder: vo.sortOrder ?? mockDomains.length + 1,
        status: vo.status || '1',
        remark: vo.remark || '',
      };
      mockDomains.push(item);
      domainId = item.id;
    }
    // 整存替换：旧子表逻辑删 + 新列表插入（promptCode 已存在且属于其他域则报错）
    for (let i = mockPrompts.length - 1; i >= 0; i--) {
      if (mockPrompts[i].pkMt === domainId) mockPrompts.splice(i, 1);
    }
    for (const p of vo.prompts || []) {
      const code = (p.promptCode || '').trim();
      if (!code) return fail('saveWhole: promptCode is required', 400);
      if (mockPrompts.some((x) => x.promptCode === code)) return fail(`saveWhole: promptCode ${code} already exists`, 400);
      const promptId = `prm-${String(nextId++)}`;
      mockPrompts.push({
        id: promptId,
        pkMt: domainId,
        promptCode: code,
        promptName: p.promptName,
        scene: p.scene,
        contentMode: p.contentMode || 'inline',
        storageCode: p.storageCode,
        bucket: p.bucket,
        variables: p.variables,
        sortOrder: p.sortOrder ?? 1,
        status: p.status || '1',
        remark: p.remark || '',
      });
      if (p.content !== undefined) appendPromptContent(promptId, p.content);
    }
    return ok({ id: domainId });
  },
};
