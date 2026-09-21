/**
 * Mock：AI 业务域（julyAiDomain）—— 前端约定端点（后端域实体未上线，待补齐）
 * 域与提示词明细通过 domainCode 关联；删域 / 改名的明细级联在 service 编排。
 */
import { ok, fail, delay, pageResult, type Handler } from '@/mock/system011/common';
import type { JulyAiDomainItem } from '@/types/aiCenter/aiDomain/vo';

/** mock 数据源自增 id */
let nextId = 300;

/** Mock 业务域（与提示词明细里的 domainCode 对应：default / finance） */
export const mockDomains: JulyAiDomainItem[] = [
  { id: 'dom-0001', domainCode: 'default', domainName: '默认域', sortOrder: 1, status: '1', remark: '通用场景' },
  { id: 'dom-0002', domainCode: 'finance', domainName: '财务域', sortOrder: 2, status: '1', remark: '' },
  { id: 'dom-0003', domainCode: 'marketing', domainName: '营销域', sortOrder: 3, status: '0', remark: '已停用' },
];

export const handlers: Record<string, Handler> = {
  // ===== 业务域分页查询（keyword 模糊 code/name，status 过滤） =====
  '/julyAiDomain/v1/selectListByPage': async (body) => {
    await delay(250);
    const kw = (body?.keyword || '').trim().toLowerCase();
    const status = body?.status;
    let rows = [...mockDomains];
    if (kw) {
      rows = rows.filter((r) =>
        r.domainCode.toLowerCase().includes(kw) ||
        r.domainName.toLowerCase().includes(kw));
    }
    if (status) rows = rows.filter((r) => r.status === status);
    rows.sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
    return ok(pageResult(rows, body?.pageIndex || 1, body?.pageSize || 10));
  },

  // ===== 新增业务域（domainCode 唯一） =====
  '/julyAiDomain/v1/insert': async (body) => {
    await delay(350);
    const domainCode = (body?.domainCode || '').trim();
    const domainName = (body?.domainName || '').trim();
    if (!domainCode) return fail('insert: domainCode is required', 400);
    if (!domainName) return fail('insert: domainName is required', 400);
    if (mockDomains.some((d) => d.domainCode === domainCode)) return fail(`insert: domainCode ${domainCode} already exists`, 400);
    const item: JulyAiDomainItem = {
      id: `dom-${String(nextId++)}`,
      domainCode, domainName,
      sortOrder: body?.sortOrder ?? mockDomains.length + 1,
      status: body?.status || '1',
      remark: body?.remark || '',
    };
    mockDomains.unshift(item);
    return ok({ id: item.id });
  },

  // ===== 修改业务域（domainCode 可改；明细级联在 service） =====
  '/julyAiDomain/v1/update': async (body) => {
    await delay(350);
    const item = mockDomains.find((d) => d.id === body?.id);
    if (!item) return fail(`record not found, id=${body?.id}`, 404);
    if (body?.domainCode !== undefined) {
      const code = String(body.domainCode).trim();
      if (!code) return fail('update: domainCode is required', 400);
      if (mockDomains.some((d) => d.domainCode === code && d.id !== item.id)) return fail(`update: domainCode ${code} already exists`, 400);
      item.domainCode = code;
    }
    if (body?.domainName !== undefined) item.domainName = body.domainName;
    if (body?.sortOrder !== undefined) item.sortOrder = body.sortOrder;
    if (body?.status !== undefined) item.status = body.status;
    if (body?.remark !== undefined) item.remark = body.remark;
    return ok({ id: item.id });
  },

  // ===== 逻辑删除业务域（明细级联在 service） =====
  '/julyAiDomain/v1/logicDelete': async (body) => {
    await delay(300);
    const i = mockDomains.findIndex((d) => d.id === body?.id);
    if (i < 0) return fail(`record not found, id=${body?.id}`, 404);
    const [removed] = mockDomains.splice(i, 1);
    return ok({ id: removed.id });
  },
};
