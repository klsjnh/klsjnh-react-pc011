/** Mock：数据源（julyDatasource） - 对齐后端 dataservice011 模块契约 */
import { ok, fail, delay, pageResult, type Handler } from '@/mock/system011/common';
import type { DataSourceItem } from '@/types/dataservice011/datasource';

/** mock 数据源自增 id */
let nextId = 100;

/** Mock 数据源列表（字段对齐后端 VO：dsCode/dsName/dbType/jdbcUrl/schemaName/username/remark/status） */
export const mockDataSources: DataSourceItem[] = [
  {
    id: 'ds-0001', dsCode: 'ds_main', dsName: '主数据库', dbType: 'mysql',
    jdbcUrl: 'jdbc:mysql://192.168.1.10:3306/enterprise_main', schemaName: 'enterprise_main',
    username: 'root', driverClass: '', remark: '业务主库', status: '1',
    createTime: '2026-09-15 10:00:00', updateTime: '2026-09-15 10:00:00',
  },
  {
    id: 'ds-0002', dsCode: 'ds_analytics', dsName: '分析数据库', dbType: 'postgresql',
    jdbcUrl: 'jdbc:postgresql://192.168.1.15:5432/analytics', schemaName: 'analytics',
    username: 'postgres', driverClass: '', remark: '', status: '1',
    createTime: '2026-09-15 10:01:00', updateTime: '2026-09-15 10:01:00',
  },
  {
    id: 'ds-0003', dsCode: 'ds_test', dsName: '测试数据库', dbType: 'mysql',
    jdbcUrl: 'jdbc:mysql://10.0.0.20:3306/test_db', schemaName: 'test_db',
    username: 'test', driverClass: '', remark: '', status: '0',
    createTime: '2026-09-15 10:02:00', updateTime: '2026-09-15 10:02:00',
  },
];

export const handlers: Record<string, Handler> = {
  // ===== 分页查询（keyword 模糊 dsCode/dsName/jdbcUrl，status 过滤） =====
  '/julyDatasource/v1/selectListByPage': async (body) => {
    await delay(300);
    const kw = (body?.keyword || body?.name || '').trim().toLowerCase();
    const status = body?.status;
    let rows = [...mockDataSources];
    if (kw) {
      rows = rows.filter((r) =>
        r.dsCode.toLowerCase().includes(kw) ||
        r.dsName.toLowerCase().includes(kw) ||
        (r.jdbcUrl || '').toLowerCase().includes(kw));
    }
    if (status) rows = rows.filter((r) => r.status === status);
    return ok(pageResult(rows, body?.pageIndex || 1, body?.pageSize || 10));
  },

  // ===== 主键查询（mock 模式下仍按 body.id 匹配） =====
  '/julyDatasource/v1/getById': async (body) => {
    await delay(200);
    const item = mockDataSources.find((s) => s.id === body?.id);
    if (!item) return fail(`record not found, id=${body?.id}`, 404);
    return ok(structuredClone(item));
  },

  // ===== 新增（写入 mock 列表） =====
  '/julyDatasource/v1/insert': async (body) => {
    await delay(400);
    const dsCode = (body?.dsCode || '').trim();
    const dsName = (body?.dsName || '').trim();
    if (!dsCode) return fail('insert: dsCode is required', 400);
    if (!dsName) return fail('insert: dsName is required', 400);
    if (mockDataSources.some((s) => s.dsCode === dsCode)) return fail(`insert: dsCode ${dsCode} already exists`, 400);
    const item: DataSourceItem = {
      id: String(nextId++),
      dsCode,
      dsName,
      dbType: body?.dbType || 'mysql',
      jdbcUrl: body?.jdbcUrl || '',
      schemaName: body?.schemaName || '',
      username: body?.username || '',
      driverClass: body?.driverClass || '',
      remark: body?.remark || '',
      status: '1',
      createTime: '2026-09-15 10:10:00',
      updateTime: '2026-09-15 10:10:00',
    };
    mockDataSources.unshift(item);
    return ok({ id: item.id });
  },

  // ===== 更新（dsCode 不可变） =====
  '/julyDatasource/v1/update': async (body) => {
    await delay(400);
    const item = mockDataSources.find((s) => s.id === body?.id);
    if (!item) return fail(`record not found, id=${body?.id}`, 404);
    if (body?.dsName !== undefined) item.dsName = body.dsName;
    if (body?.dbType !== undefined) item.dbType = body.dbType;
    if (body?.jdbcUrl !== undefined) item.jdbcUrl = body.jdbcUrl;
    if (body?.schemaName !== undefined) item.schemaName = body.schemaName;
    if (body?.username !== undefined) item.username = body.username;
    if (body?.driverClass !== undefined) item.driverClass = body.driverClass;
    if (body?.remark !== undefined) item.remark = body.remark;
    // status 不在 update VO 中（后端 update 不含 status），这里仅记录
    item.updateTime = '2026-09-15 10:12:00';
    return ok({ id: item.id });
  },

  // ===== 逻辑删除（单个） =====
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
    const ids: string[] = body?.ids || [];
    let success = 0;
    const errors: { id: string; message: string }[] = [];
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
    // id 存在 → 重测已保存；否则按草稿 jdbcUrl 判定
    const item = body?.id ? mockDataSources.find((s) => s.id === body.id) : undefined;
    const jdbcUrl = item?.jdbcUrl || body?.jdbcUrl || '';
    const reachable = jdbcUrl.startsWith('jdbc:mysql://192.168.') || jdbcUrl.startsWith('jdbc:postgresql://192.168.') || (item && item.status === '1');
    if (reachable) {
      return ok({ success: true, message: '连接成功', databaseProduct: item?.dbType === 'postgresql' ? 'PostgreSQL' : 'MySQL', databaseVersion: '8.0' });
    }
    return ok({ success: false, message: '无法连接到该数据源', databaseProduct: null, databaseVersion: null });
  },

  // ===== 重新加载注册表 =====
  '/julyDatasource/v1/reloadRegistry': async () => {
    await delay(600);
    return ok({ enabled: mockDataSources.filter((s) => s.status === '1').length, registered: mockDataSources.length, reused: 0, closed: 0, failed: 0 });
  },
};