/** Mock：定时任务（julyScheduler） */
import { ok, fail, delay, pageResult, type Handler } from '@/mock/system011/common';
import type { JulySchedulerVo011 } from '@/types/system011';

export const mockSchedulers: JulySchedulerVo011[] = [
  { id: 'sch0000000000000000000000000001', schedulerCode: 'dataBackup', schedulerName: '数据备份', schedulerHandler: 'backupJob.run', schedulerCron: '0 2 * * *', executeTimes: 12, status: '1', createTime: '2026-09-12T09:00:00' },
  { id: 'sch0000000000000000000000000002', schedulerCode: 'logClean', schedulerName: '日志清理', schedulerHandler: 'logCleanJob.run', schedulerCron: '0 3 * * *', executeTimes: 8, status: '1', createTime: '2026-09-12T09:00:00' },
  { id: 'sch0000000000000000000000000003', schedulerCode: 'reportGen', schedulerName: '报表生成', schedulerHandler: 'reportJob.run', schedulerCron: '0 8 * * 1', executeTimes: 3, status: '0', createTime: '2026-09-12T09:00:00' },
];

export const handlers: Record<string, Handler> = {
  '/julyScheduler/v1/selectListByPage': async (body) => {
    await delay(300);
    let rows = [...mockSchedulers];
    const code = (body?.schedulerCode || '').trim().toLowerCase();
    const name = (body?.schedulerName || '').trim().toLowerCase();
    if (code) rows = rows.filter((s) => s.schedulerCode.toLowerCase().includes(code));
    if (name) rows = rows.filter((s) => s.schedulerName.toLowerCase().includes(name));
    const status = (body?.status || '').trim();
    if (status) rows = rows.filter((s) => s.status === status);
    return ok(pageResult(rows, body?.pageIndex || 1, body?.pageSize || 10));
  },
  '/julyScheduler/v1/insert': async (body) => {
    await delay(350);
    const code = (body?.schedulerCode || '').trim();
    if (!code) return fail('insert: schedulerCode is required', 400);
    if (mockSchedulers.some((s) => s.schedulerCode === code)) return fail(`insert: schedulerCode already exists, ${code}`, 400);
    const item: JulySchedulerVo011 = {
      id: 'sch' + Math.random().toString(36).slice(2, 12),
      schedulerCode: code,
      schedulerName: body?.schedulerName || '',
      schedulerHandler: body?.schedulerHandler || '',
      schedulerCron: body?.schedulerCron || '',
      executeTimes: 0, status: body?.status || '0', remark: body?.remark || '',
      createTime: new Date().toISOString().slice(0, 19),
    };
    mockSchedulers.unshift(item);
    return ok({ id: item.id });
  },
  '/julyScheduler/v1/update': async (body) => {
    await delay(300);
    const item = mockSchedulers.find((s) => s.id === body?.id);
    if (!item) return fail(`record not found, id=${body?.id}`, 404);
    if (body?.schedulerName !== undefined) item.schedulerName = body.schedulerName;
    if (body?.schedulerHandler !== undefined) item.schedulerHandler = body.schedulerHandler;
    if (body?.schedulerCron !== undefined) item.schedulerCron = body.schedulerCron;
    if (body?.status !== undefined) item.status = body.status;
    if (body?.remark !== undefined) item.remark = body.remark;
    item.updateTime = new Date().toISOString().slice(0, 19);
    return ok({ id: item.id });
  },
  '/julyScheduler/v1/start': async (body) => {
    await delay(200);
    const item = mockSchedulers.find((s) => s.id === body?.id);
    if (item) item.status = '1';
    return ok(null);
  },
  '/julyScheduler/v1/stop': async (body) => {
    await delay(200);
    const item = mockSchedulers.find((s) => s.id === body?.id);
    if (item) item.status = '0';
    return ok(null);
  },
  '/julyScheduler/v1/runOnce': async (body) => {
    await delay(300);
    const item = mockSchedulers.find((s) => s.id === body?.id);
    if (item) item.executeTimes = (item.executeTimes || 0) + 1;
    return ok(null);
  },
  '/julyScheduler/v1/logicDelete': async (body) => {
    await delay(300);
    // 契约口径：body 为 IdVo011 {id}（容忍历史裸数组形态）
    const id = Array.isArray(body) ? body[0] : body?.id;
    const i = mockSchedulers.findIndex((s) => s.id === id);
    if (i < 0) return fail(`record not found, id=${id}`, 404);
    mockSchedulers.splice(i, 1);
    return ok({ id });
  },
  '/julyScheduler/v1/logicDeleteBatch': async (body) => {
    await delay(300);
    const ids: string[] = body?.ids || [];
    let success = 0;
    const errors: string[] = [];
    for (const id of ids) {
      const i = mockSchedulers.findIndex((s) => s.id === id);
      if (i >= 0) { mockSchedulers.splice(i, 1); success += 1; } else { errors.push(id); }
    }
    return ok({ total: ids.length, success, failed: errors.length, errors });
  },
};
