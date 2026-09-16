/** Mock：业务建模（低代码，julyBusinessModeling） - 对齐后端 dataservice011 模块契约 */
import { ok, fail, delay, pageResult, type Handler } from '@/mock/system011/common';
import type {
  JulyBusinessModelingItem,
  JulyBusinessModelingFieldVo011,
  JulyBusinessModelingSqlVo011,
  JulyBusinessModelingProbeResultVo011,
  JulyBusinessModelingSqlResultVo011,
} from '@/types/dataservice011/businessModeling';

let nextId = 100;

/** Mock 业务建模列表（含字段子表） */
export const mockModels: JulyBusinessModelingItem[] = [
  {
    id: 'bm-0001', modelCode: 'order_main', modelName: '订单主表', objectName: 'ord_order',
    dataSourceCode: 'ds_main', status: '1', remark: '订单业务对象',
    fieldData: [
      { id: 'f-1', fieldCode: 'orderId', fieldName: '订单ID', columnName: 'order_id', dataType: 'bigint', isPrimaryKey: '1', isNullable: '0', isRequired: '1', sortOrder: 1 },
      { id: 'f-2', fieldCode: 'orderNo', fieldName: '订单号', columnName: 'order_no', dataType: 'varchar', length: 64, isPrimaryKey: '0', isNullable: '0', isRequired: '1', sortOrder: 2 },
      { id: 'f-3', fieldCode: 'amount', fieldName: '金额', columnName: 'amount', dataType: 'decimal', length: '18,2', isPrimaryKey: '0', isNullable: '1', isRequired: '0', sortOrder: 3 },
    ],
    createTime: '2026-09-15 10:00:00', updateTime: '2026-09-15 10:00:00',
  },
  {
    id: 'bm-0002', modelCode: 'customer', modelName: '客户', objectName: 'bd_customer',
    dataSourceCode: 'ds_main', status: '1', remark: '',
    fieldData: [
      { id: 'f-4', fieldCode: 'custId', fieldName: '客户ID', columnName: 'cust_id', dataType: 'bigint', isPrimaryKey: '1', isNullable: '0', isRequired: '1', sortOrder: 1 },
      { id: 'f-5', fieldCode: 'custName', fieldName: '客户名称', columnName: 'cust_name', dataType: 'varchar', length: 128, isPrimaryKey: '0', isNullable: '0', isRequired: '1', sortOrder: 2 },
    ],
    createTime: '2026-09-15 10:01:00', updateTime: '2026-09-15 10:01:00',
  },
  {
    id: 'bm-0003', modelCode: 'product', modelName: '商品', objectName: 'bd_product',
    dataSourceCode: 'ds_analytics', status: '0', remark: '已停用',
    fieldData: [
      { id: 'f-6', fieldCode: 'prodId', fieldName: '商品ID', columnName: 'prod_id', dataType: 'bigint', isPrimaryKey: '1', isNullable: '0', isRequired: '1', sortOrder: 1 },
    ],
    createTime: '2026-09-15 10:02:00', updateTime: '2026-09-15 10:02:00',
  },
];

/** 根据 objectName 生成 mock 行（用于执行 / 获取模型数据预览） */
function fakeRows(objectName: string, count: number): Record<string, unknown>[] {
  const rows: Record<string, unknown>[] = [];
  for (let i = 1; i <= count; i++) {
    rows.push({
      id: i,
      object_name: objectName,
      code: `${objectName}_${1000 + i}`,
      name: `示例数据 ${i}`,
      status: i % 3 === 0 ? 0 : 1,
      created_at: '2026-09-15 10:00:00',
    });
  }
  return rows;
}

/** SQL 是否看起来合法（简单启发） */
function looksLikeSelect(sql: string): boolean {
  return /^select\s/i.test((sql || '').trim());
}

export const handlers: Record<string, Handler> = {
  // ===== 分页查询 =====
  '/julyBusinessModeling/v1/selectListByPage': async (body) => {
    await delay(300);
    const kw = (body?.keyword || '').trim().toLowerCase();
    const status = body?.status;
    const ds = body?.dataSourceCode;
    let rows = [...mockModels];
    if (kw) rows = rows.filter((r) => r.modelCode.toLowerCase().includes(kw) || r.modelName.toLowerCase().includes(kw) || r.objectName.toLowerCase().includes(kw));
    if (status) rows = rows.filter((r) => r.status === status);
    if (ds) rows = rows.filter((r) => r.dataSourceCode === ds);
    rows.sort((a, b) => (a.modelCode || '').localeCompare(b.modelCode || ''));
    return ok(pageResult(rows, body?.pageIndex || 1, body?.pageSize || 10));
  },

  // ===== 主键查询 =====
  '/julyBusinessModeling/v1/getById': async (body) => {
    await delay(200);
    const item = mockModels.find((s) => s.id === body?.id);
    if (!item) return fail(`record not found, id=${body?.id}`, 404);
    return ok(structuredClone(item));
  },

  // ===== 新增（modelCode 唯一不可变；objectName 必填） =====
  '/julyBusinessModeling/v1/insert': async (body) => {
    await delay(400);
    const modelCode = (body?.modelCode || '').trim();
    const objectName = (body?.objectName || '').trim();
    const modelName = (body?.modelName || '').trim();
    if (!modelCode) return fail('insert: modelCode is required', 400);
    if (!modelName) return fail('insert: modelName is required', 400);
    if (!objectName) return fail('insert: objectName is required', 400);
    if (mockModels.some((s) => s.modelCode === modelCode)) return fail(`insert: modelCode ${modelCode} already exists`, 400);
    const fieldData: JulyBusinessModelingFieldVo011[] = (body?.fieldData || []).map((f: JulyBusinessModelingFieldVo011, i: number) => ({ ...f, id: `f-${nextId + i}`, sortOrder: f.sortOrder ?? i + 1 }));
    const item: JulyBusinessModelingItem = {
      id: String(nextId++),
      modelCode, modelName, objectName,
      dataSourceCode: body?.dataSourceCode || '',
      status: '1', remark: body?.remark || '',
      fieldData,
      createTime: '2026-09-15 10:10:00', updateTime: '2026-09-15 10:10:00',
    };
    mockModels.unshift(item);
    return ok({ id: item.id });
  },

  // ===== 更新（modelCode / objectName 不可变；整表替换 fieldData） =====
  '/julyBusinessModeling/v1/update': async (body) => {
    await delay(400);
    const item = mockModels.find((s) => s.id === body?.id);
    if (!item) return fail(`record not found, id=${body?.id}`, 404);
    if (body?.modelName !== undefined) item.modelName = body.modelName;
    if (body?.dataSourceCode !== undefined) item.dataSourceCode = body.dataSourceCode;
    if (body?.remark !== undefined) item.remark = body.remark;
    if (body?.status !== undefined) item.status = body.status;
    if (body?.fieldData !== undefined) {
      item.fieldData = body.fieldData.map((f: JulyBusinessModelingFieldVo011, i: number) => ({ ...f, id: f.id || `f-${nextId + i}`, sortOrder: f.sortOrder ?? i + 1 }));
    }
    item.updateTime = '2026-09-15 10:12:00';
    return ok({ id: item.id });
  },

  // ===== 逻辑删除 =====
  '/julyBusinessModeling/v1/logicDelete': async (body) => {
    await delay(300);
    const i = mockModels.findIndex((s) => s.id === body?.id);
    if (i < 0) return fail(`record not found, id=${body?.id}`, 404);
    const [removed] = mockModels.splice(i, 1);
    return ok({ id: removed.id });
  },

  // ===== SQL 探测（返回列结构） =====
  '/julyBusinessModeling/v1/probe': async (body) => {
    await delay(600);
    const b = body as JulyBusinessModelingSqlVo011;
    if (!b?.dataSourceCode) return ok({ success: false, message: '请选择数据源', columns: [] } as JulyBusinessModelingProbeResultVo011);
    if (!looksLikeSelect(b?.sqlContent || '')) return ok({ success: false, message: '仅支持 SELECT 语句探测', columns: [] } as JulyBusinessModelingProbeResultVo011);
    const res: JulyBusinessModelingProbeResultVo011 = {
      success: true,
      message: '探测成功',
      columns: [
        { name: 'id', type: 'bigint' },
        { name: 'object_name', type: 'varchar(64)' },
        { name: 'code', type: 'varchar(64)' },
        { name: 'name', type: 'varchar(128)' },
        { name: 'status', type: 'tinyint' },
        { name: 'created_at', type: 'datetime' },
      ],
    };
    return ok(res);
  },

  // ===== SQL 执行（不分页，按 pageSize 返回示例行，默认 10） =====
  '/julyBusinessModeling/v1/executeSql': async (body) => {
    await delay(700);
    const b = body as JulyBusinessModelingSqlVo011;
    if (!b?.dataSourceCode) return ok({ success: false, message: '请选择数据源' } as JulyBusinessModelingSqlResultVo011);
    if (!looksLikeSelect(b?.sqlContent || '')) return ok({ success: false, message: '仅支持 SELECT 查询' } as JulyBusinessModelingSqlResultVo011);
    const rows = fakeRows(b.objectName || 'tbl', b.pageSize || 10);
    const res: JulyBusinessModelingSqlResultVo011 = {
      success: true,
      message: `执行成功，返回 ${rows.length} 行`,
      columns: Object.keys(rows[0] || {}),
      rows,
      elapsedMs: 120 + Math.floor(Math.random() * 80),
    };
    return ok(res);
  },

  // ===== SQL 执行（分页） =====
  '/julyBusinessModeling/v1/executeSqlByPage': async (body) => {
    await delay(700);
    const b = body as JulyBusinessModelingSqlVo011;
    if (!b?.dataSourceCode) return ok({ success: false, message: '请选择数据源' } as JulyBusinessModelingSqlResultVo011);
    if (!looksLikeSelect(b?.sqlContent || '')) return ok({ success: false, message: '仅支持 SELECT 查询' } as JulyBusinessModelingSqlResultVo011);
    const all = fakeRows(b.objectName || 'tbl', 23);
    const pageIndex = b.pageIndex || 1;
    const pageSize = b.pageSize || 10;
    const slice = all.slice((pageIndex - 1) * pageSize, pageIndex * pageSize);
    const res: JulyBusinessModelingSqlResultVo011 = {
      success: true,
      message: `执行成功`,
      columns: Object.keys(all[0] || {}),
      rows: slice as Record<string, unknown>[],
      elapsedMs: 150 + Math.floor(Math.random() * 90),
    };
    // 用分页信封返回，便于页面复用 PageResult011 解析
    return ok({ ...res, pageIndex, pageSize, total: all.length, totalPages: Math.ceil(all.length / pageSize), rows: slice });
  },

  // ===== 获取模型数据（按模型编码回填示例数据） =====
  '/julyBusinessModeling/v1/getModelData': async (body) => {
    await delay(500);
    const modelCode = body?.modelCode || '';
    const item = mockModels.find((s) => s.modelCode === modelCode) || (body?.id ? mockModels.find((s) => s.id === body.id) : undefined);
    if (!item) return ok({ success: false, message: `模型 ${modelCode} 不存在` } as JulyBusinessModelingSqlResultVo011);
    const rows = fakeRows(item.objectName, 5);
    const res: JulyBusinessModelingSqlResultVo011 = {
      success: true,
      message: `模型 ${item.modelName} 数据`,
      columns: Object.keys(rows[0] || {}),
      rows,
      elapsedMs: 90 + Math.floor(Math.random() * 60),
    };
    return ok(res);
  },
};
