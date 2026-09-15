/** Mock：字典（julyDictionary） - 主表 + 明细 */
import { ok, fail, delay, pageResult, type Handler } from '@/mock/system011/common';
import type { JulyDictionaryVo011, JulyDictionaryItemVo011 } from '@/types/system011';

export const mockDictionaries: JulyDictionaryVo011[] = [
  {
    id: 'dict0000000000000000000000000001', dictionaryCode: 'SYS_USER_STATUS', dictionaryName: '用户状态',
    sortOrder: 1, status: '1', createTime: '2026-09-12T09:00:00',
    items: [
      { id: 'dictitm00000000000000000000000001', dictionaryCode: 'SYS_USER_STATUS', itemCode: '1', itemLabel: '启用', sortOrder: 1, status: '1', createTime: '2026-09-12T09:00:00' },
      { id: 'dictitm00000000000000000000000002', dictionaryCode: 'SYS_USER_STATUS', itemCode: '0', itemLabel: '停用', sortOrder: 2, status: '1', createTime: '2026-09-12T09:00:00' },
    ],
  },
  {
    id: 'dict0000000000000000000000000002', dictionaryCode: 'SYS_SEX', dictionaryName: '性别',
    sortOrder: 2, status: '1', createTime: '2026-09-12T09:00:00',
    items: [
      { id: 'dictitm00000000000000000000000003', dictionaryCode: 'SYS_SEX', itemCode: 'M', itemLabel: '男', sortOrder: 1, status: '1', createTime: '2026-09-12T09:00:00' },
      { id: 'dictitm00000000000000000000000004', dictionaryCode: 'SYS_SEX', itemCode: 'F', itemLabel: '女', sortOrder: 2, status: '1', createTime: '2026-09-12T09:00:00' },
    ],
  },
  {
    id: 'dict0000000000000000000000000003', dictionaryCode: 'DATASOURCE_DB_TYPE', dictionaryName: '数据库类型',
    sortOrder: 3, status: '1', createTime: '2026-09-12T09:00:00',
    items: [
      { id: 'dictitm00000000000000000000000005', dictionaryCode: 'DATASOURCE_DB_TYPE', itemCode: 'mysql', itemLabel: 'MySQL', sortOrder: 1, status: '1', createTime: '2026-09-12T09:00:00' },
      { id: 'dictitm00000000000000000000000006', dictionaryCode: 'DATASOURCE_DB_TYPE', itemCode: 'oracle', itemLabel: 'Oracle', sortOrder: 2, status: '1', createTime: '2026-09-12T09:00:00' },
      { id: 'dictitm00000000000000000000000007', dictionaryCode: 'DATASOURCE_DB_TYPE', itemCode: 'postgresql', itemLabel: 'PostgreSQL', sortOrder: 3, status: '1', createTime: '2026-09-12T09:00:00' },
    ],
  },
];

export const handlers: Record<string, Handler> = {
  // ==================== 主表 ====================
  '/julyDictionary/v1/selectListByPage': async (body) => {
    await delay(300);
    let rows = [...mockDictionaries];
    const kw = (body?.keyword || '').trim().toLowerCase();
    if (kw) rows = rows.filter((d) => d.dictionaryCode.toLowerCase().includes(kw) || d.dictionaryName.toLowerCase().includes(kw));
    if (body?.status) rows = rows.filter((d) => d.status === body.status);
    return ok(pageResult(rows, body?.pageIndex || 1, body?.pageSize || 10));
  },
  '/julyDictionary/v1/getById': async (body) => {
    await delay(200);
    const item = mockDictionaries.find((d) => d.id === body?.id);
    if (!item) return fail(`record not found, id=${body?.id}`, 404);
    return ok({ ...item, items: [...(item.items || [])].sort((a, b) => a.sortOrder - b.sortOrder) });
  },
  '/julyDictionary/v1/insert': async (body) => {
    await delay(350);
    const code = (body?.dictionaryCode || '').trim();
    if (!code) return fail('insert: dictionaryCode is required', 400);
    if (mockDictionaries.some((d) => d.dictionaryCode === code)) return fail(`insert: dictionaryCode already exists, ${code}`, 400);
    const item: JulyDictionaryVo011 = {
      id: 'dict' + Math.random().toString(36).slice(2, 12),
      dictionaryCode: code, dictionaryName: body?.dictionaryName || '', sortOrder: body?.sortOrder ?? 0,
      status: '1', createTime: new Date().toISOString().slice(0, 19), items: [],
    };
    mockDictionaries.push(item);
    return ok({ id: item.id });
  },
  '/julyDictionary/v1/update': async (body) => {
    await delay(300);
    const item = mockDictionaries.find((d) => d.id === body?.id);
    if (!item) return fail(`record not found, id=${body?.id}`, 404);
    if (body?.dictionaryName !== undefined) item.dictionaryName = body.dictionaryName;
    if (body?.sortOrder !== undefined) item.sortOrder = body.sortOrder;
    if (body?.status !== undefined) item.status = body.status;
    if (body?.remark !== undefined) item.remark = body.remark;
    item.updateTime = new Date().toISOString().slice(0, 19);
    return ok({ id: item.id });
  },
  '/julyDictionary/v1/logicDelete': async (body) => {
    await delay(300);
    const i = mockDictionaries.findIndex((d) => d.id === body?.id);
    if (i < 0) return fail(`record not found, id=${body?.id}`, 404);
    const [removed] = mockDictionaries.splice(i, 1);
    return ok({ id: removed.id });
  },

  // ==================== 明细 ====================
  '/julyDictionary/v1/selectItemListByType': async (body) => {
    await delay(250);
    const dict = mockDictionaries.find((d) => d.dictionaryCode === body?.dictionaryCode);
    if (!dict) return ok([]);
    let items = [...(dict.items || [])];
    if (body?.status) items = items.filter((it) => it.status === body.status);
    const kw = (body?.keyword || '').trim().toLowerCase();
    if (kw) items = items.filter((it) => it.itemLabel.toLowerCase().includes(kw) || it.itemCode.toLowerCase().includes(kw));
    items.sort((a, b) => a.sortOrder - b.sortOrder);
    return ok(items);
  },
  '/julyDictionary/v1/insertItem': async (body) => {
    await delay(300);
    const dict = mockDictionaries.find((d) => d.dictionaryCode === body?.dictionaryCode);
    if (!dict) return fail(`dictionary not found, code=${body?.dictionaryCode}`, 404);
    const code = (body?.itemCode || '').trim();
    if (!code) return fail('insertItem: itemCode is required', 400);
    if ((dict.items || []).some((it) => it.itemCode === code)) return fail(`insertItem: itemCode already exists, ${code}`, 400);
    const item: JulyDictionaryItemVo011 = {
      id: 'dictitm' + Math.random().toString(36).slice(2, 12),
      dictionaryCode: body.dictionaryCode, itemCode: code, itemLabel: body?.itemLabel || '',
      sortOrder: body?.sortOrder ?? 0, status: '1', createTime: new Date().toISOString().slice(0, 19),
    };
    dict.items = dict.items || [];
    dict.items.push(item);
    return ok({ id: item.id });
  },
  '/julyDictionary/v1/updateItem': async (body) => {
    await delay(300);
    for (const dict of mockDictionaries) {
      const it = (dict.items || []).find((x) => x.id === body?.id);
      if (it) {
        if (body?.itemLabel !== undefined) it.itemLabel = body.itemLabel;
        if (body?.sortOrder !== undefined) it.sortOrder = body.sortOrder;
        if (body?.status !== undefined) it.status = body.status;
        if (body?.remark !== undefined) it.remark = body.remark;
        it.updateTime = new Date().toISOString().slice(0, 19);
        return ok({ id: it.id });
      }
    }
    return fail(`record not found, id=${body?.id}`, 404);
  },
  '/julyDictionary/v1/logicDeleteItem': async (body) => {
    await delay(300);
    for (const dict of mockDictionaries) {
      const idx = (dict.items || []).findIndex((x) => x.id === body?.id);
      if (idx >= 0) {
        const [removed] = (dict.items as JulyDictionaryItemVo011[]).splice(idx, 1);
        return ok({ id: removed.id });
      }
    }
    return fail(`record not found, id=${body?.id}`, 404);
  },
};