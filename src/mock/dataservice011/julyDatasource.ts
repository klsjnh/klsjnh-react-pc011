/** Mock：数据源（julyDatasource） - 对齐后端 dataservice011 模块 */
import { ok, fail, delay, pageResult, type Handler } from '@/mock/system011/common';
import type { DataSourceItem } from '@/types/dataservice011/datasource';

/** mock 数据源自增 id */
let nextId = 100;

/** Mock 数据源列表 */
export const mockDataSources: DataSourceItem[] = [
  { id: 1, name: '主数据库', type: 'MySQL', host: '192.168.1.10:3306', database: 'enterprise_main', status: 'connected', latency: '2ms' },
  { id: 2, name: '缓存数据库', type: 'Redis', host: '192.168.1.12:6379', database: 'db0', status: 'connected', latency: '0.5ms' },
  { id: 3, name: '测试数据库', type: 'MySQL', host: '10.0.0.20:3306', database: 'test_db', status: 'disconnected', latency: '-' },
  { id: 4, name: '分析数据库', type: 'PostgreSQL', host: '192.168.1.15:5432', database: 'analytics', status: 'connected', latency: '5ms' },
];

export const handlers: Record<string, Handler> = {
  // ===== 分页查询（名称模糊过滤） =====
  '/julyDatasource/v1/selectListByPage': async (body) => {
    await delay(300);
    const kw = (body?.name || body?.keyword || '').trim().toLowerCase();
    let rows = [...mockDataSources];
    if (kw) rows = rows.filter((r) => r.name.toLowerCase().includes(kw));
    return ok(pageResult(rows, body?.pageIndex || 1, body?.pageSize || 10));
  },

  // ===== 主键查询 =====
  '/julyDatasource/v1/getById': async (body) => {
    await delay(200);
    const item = mockDataSources.find((s) => s.id === body?.id);
    if (!item) return fail(`record not found, id=${body?.id}`, 404);
    return ok(structuredClone(item));
  },

  // ===== 新增（写入 mock 列表） =====
  '/julyDatasource/v1/insert': async (body) => {
    await delay(400);
    const name = (body?.name || '').trim();
    if (!name) return fail('insert: name is required', 400);
    const item: DataSourceItem = {
      id: nextId++,
      name,
      type: body?.type || 'MySQL',
      host: body?.host || '',
      database: body?.database || '',
      status: 'connected',
      latency: '1ms',
    };
    mockDataSources.unshift(item);
    return ok({ id: item.id });
  },

  // ===== 更新 =====
  '/julyDatasource/v1/update': async (body) => {
    await delay(400);
    const item = mockDataSources.find((s) => s.id === body?.id);
    if (!item) return fail(`record not found, id=${body?.id}`, 404);
    if (body?.name !== undefined) item.name = body.name;
    if (body?.type !== undefined) item.type = body.type;
    if (body?.host !== undefined) item.host = body.host;
    if (body?.database !== undefined) item.database = body.database;
    if (body?.status !== undefined) item.status = body.status;
    return ok({ id: item.id });
  },

  // ===== 逻辑删除（单个，字节从 mock 列表移除） =====
  '/julyDatasource/v1/logicDelete': async (body) => {
    await delay(300);
    const i = mockDataSources.findIndex((s) => s.id === body?.id);
    if (i < 0) return fail(`record not found, id=${body?.id}`, 404);
    const [removed] = mockDataSources.splice(i, 1);
    return ok({ id: removed.id });
  },

  // ===== 逻辑删除（批量） =====
  '/julyDatasource/v1/logicDeleteBatch': async (body) => {
    await delay(500);
    const ids: number[] = body?.ids || [];
    let success = 0;
    const errors: { id: number; message: string }[] = [];
    for (const id of ids) {
      const i = mockDataSources.findIndex((s) => s.id === id);
      if (i < 0) { errors.push({ id, message: 'record not found' }); continue; }
      mockDataSources.splice(i, 1);
      success++;
    }
    return ok({ total: ids.length, success, failed: errors.length, errors });
  },

  // ===== 测试连接 =====
  '/julyDatasource/v1/testConnection': async (body) => {
    await delay(800);
    const source = mockDataSources.find((s) => s.host === body?.host && s.database === body?.database);
    if (source) return ok({ connected: source.status === 'connected', latency: source.latency, message: '连接成功' });
    return ok({ connected: false, message: '无法连接到该数据源' });
  },

  // ===== 重新加载注册表 =====
  '/julyDatasource/v1/reloadRegistry': async () => {
    await delay(600);
    return ok({ message: '注册表已重新加载' });
  },
};