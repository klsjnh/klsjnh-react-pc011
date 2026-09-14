/** Mock：配置（julyConfig） */
import { ok, fail, delay, pageResult, type Handler } from './common';
import type { JulyConfigVo011 } from '@/types/system011';

export const mockConfigs: JulyConfigVo011[] = [
  { id: 'cfg0000000000000000000000000001', code: 'site.name', data: '企业管理系统', status: '1', createTime: '2026-09-12T09:00:00' },
  { id: 'cfg0000000000000000000000000002', code: 'site.url', data: 'https://admin.example.com', status: '1', createTime: '2026-09-12T09:00:00' },
  { id: 'cfg0000000000000000000000000003', code: 'security.passwordMinLength', data: '6', status: '1', createTime: '2026-09-12T09:00:00' },
  { id: 'cfg0000000000000000000000000004', code: 'security.tokenExpire', data: '30', status: '1', createTime: '2026-09-12T09:00:00' },
  { id: 'cfg0000000000000000000000000005', code: 'upload.maxSize', data: '10MB', status: '0', createTime: '2026-09-12T09:00:00' },
];

export const handlers: Record<string, Handler> = {
  '/julyConfig/v1/selectListByPage': async (body) => {
    await delay(300);
    let rows = [...mockConfigs];
    const kw = (body?.keyword || '').trim().toLowerCase();
    if (kw) rows = rows.filter((c) => c.code.toLowerCase().includes(kw) || c.data.toLowerCase().includes(kw));
    return ok(pageResult(rows, body?.pageIndex || 1, body?.pageSize || 10));
  },
  '/julyConfig/v1/insert': async (body) => {
    await delay(350);
    const code = (body?.code || '').trim();
    if (!code) return fail('insert: code is required', 400);
    if (mockConfigs.some((c) => c.code === code)) return fail(`insert: code already exists, ${code}`, 400);
    const item: JulyConfigVo011 = {
      id: 'cfg' + Math.random().toString(36).slice(2, 12),
      code, data: body?.data || '', status: '1',
      createTime: new Date().toISOString().slice(0, 19),
    };
    mockConfigs.unshift(item);
    return ok({ id: item.id });
  },
  '/julyConfig/v1/update': async (body) => {
    await delay(300);
    const item = mockConfigs.find((c) => c.id === body?.id);
    if (!item) return fail(`record not found, id=${body?.id}`, 404);
    if (body?.data !== undefined) item.data = body.data;
    item.updateTime = new Date().toISOString().slice(0, 19);
    return ok({ id: item.id });
  },
  '/julyConfig/v1/logicDelete': async (body) => {
    await delay(300);
    const i = mockConfigs.findIndex((c) => c.id === body?.id);
    if (i < 0) return fail(`record not found, id=${body?.id}`, 404);
    const [removed] = mockConfigs.splice(i, 1);
    return ok({ id: removed.id });
  },
};
