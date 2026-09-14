/** Mock：数据导出（/export/v1） */
import { ok, delay, type Handler } from './common';

export const handlers: Record<string, Handler> = {
  '/export/v1': async (body) => {
    await delay(400);
    const objectCode = body?.objectCode || 'data';
    const format = (body?.format || 'csv').toLowerCase();
    const content = format === 'json'
      ? JSON.stringify({ objectCode, rows: [], exportedAt: new Date().toISOString() }, null, 2)
      : `id,objectCode,note\n1,${objectCode},mock export`;
    return ok(content);
  },
};
