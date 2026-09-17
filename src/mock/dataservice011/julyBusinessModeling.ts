/**
 * Mock：业务建模（低代码，julyBusinessModeling）
 *
 * ★ 契约对齐**后端源码**（`java17-web011/.../dataservice011/vo/julybusinessmodeling/*.java`）：
 *   出参 = 主表裸列 + `metaData`（对象级配置 + 嵌套 `fieldData` 字段定义），
 *   字段项形状 `code / name / fieldType / length / notNull / defaultValue`（FieldType011）。
 * ⚠️ 按 action 路径分发，**不区分 HTTP 方法**（request.ts 的 mock 分支只看 action）——
 *   因此方法错配（GET 写成 POST）在 mock 下永远发现不了，必须对真实后端验。
 */
import { ok, fail, delay, pageResult, type Handler } from '@/mock/system011/common';
import type {
  JulyBusinessModelingVo011,
  JulyBusinessModelingFieldVo011,
  JulyBusinessModelingMetaVo011,
  JulyBusinessModelingProbeResultVo011,
  JulyBusinessModelingResultVo011,
} from '@/types/dataservice011/businessModeling';

let nextId = 100;

/** 公共列（对齐 docs 033 §013 的示例顺序；`dr` 复用 status 类型 —— FieldType011 无独立 dr） */
const LEAD_COMMON: JulyBusinessModelingFieldVo011[] = [
  { code: 'id', name: '主键', fieldType: 'id' },
];

const TAIL_COMMON: JulyBusinessModelingFieldVo011[] = [
  { code: 'status', name: '状态', fieldType: 'status' },
  { code: 'create_by', name: '创建人', fieldType: 'create_by' },
  { code: 'update_by', name: '最后修改人', fieldType: 'update_by' },
  { code: 'create_time', name: '创建日期', fieldType: 'create_time' },
  { code: 'update_time', name: '最后修改日期', fieldType: 'update_time' },
  { code: 'dr', name: '删除标记', fieldType: 'status' },
];

/** 公共列补齐（docs 033 §017：产物 fieldData 自动补 id / status / 审计四列 / dr） */
function withCommonFields(business: JulyBusinessModelingFieldVo011[]): JulyBusinessModelingFieldVo011[] {
  return [...LEAD_COMMON.map((f) => ({ ...f })), ...business, ...TAIL_COMMON.map((f) => ({ ...f }))];
}

/** 业务列（示例） */
const SAMPLE_BUSINESS: JulyBusinessModelingFieldVo011[] = [
  { code: 'code', name: '编码', fieldType: 'string', length: 60, notNull: true },
  { code: 'name', name: '名称', fieldType: 'string', length: 120 },
  { code: 'remark', name: '备注', fieldType: 'string', length: 300 },
];

/** Mock 建模列表 */
export const mockModels: JulyBusinessModelingVo011[] = [
  {
    id: 'bm-0001', modelCode: 'order_main', modelName: '订单主表', objectName: 'ord_order',
    dataSourceCode: 'ds_main', status: '1', remark: '订单业务对象',
    sqlContent: 'SELECT order_no, amount, status FROM ord_order',
    metaData: {
      objectName: 'ord_order', description: '订单业务对象', objectType: 'type011',
      packageName: 'com.klsjnh.business', importField: 'order_no,amount', url: '/business/ord_order',
      fieldData: withCommonFields([
        { code: 'order_no', name: '订单号', fieldType: 'string', length: 64, notNull: true },
        { code: 'amount', name: '金额', fieldType: 'float' },
      ]),
    },
    createTime: '2026-09-15 10:00:00', updateTime: '2026-09-15 10:00:00',
  },
  {
    id: 'bm-0002', modelCode: 'customer', modelName: '客户', objectName: 'bd_customer',
    dataSourceCode: 'ds_main', status: '1', remark: '',
    sqlContent: 'SELECT cust_name FROM bd_customer',
    metaData: {
      objectName: 'bd_customer', description: '客户主数据', objectType: 'type011',
      packageName: 'com.klsjnh.business', importField: 'cust_name', url: '/business/bd_customer',
      fieldData: withCommonFields([
        { code: 'cust_name', name: '客户名称', fieldType: 'string', length: 128, notNull: true },
      ]),
    },
    createTime: '2026-09-15 10:01:00', updateTime: '2026-09-15 10:01:00',
  },
  {
    id: 'bm-0003', modelCode: 'product', modelName: '商品', objectName: 'bd_product',
    dataSourceCode: 'ds_analytics', status: '0', remark: '已停用',
    sqlContent: '',
    metaData: {
      objectName: 'bd_product', description: '商品主数据', objectType: 'type011',
      packageName: 'com.klsjnh.business', importField: '', url: '',
      fieldData: withCommonFields([]),
    },
    createTime: '2026-09-15 10:02:00', updateTime: '2026-09-15 10:02:00',
  },
];

/** 生成示例行 */
function fakeRows(objectName: string, count: number): Record<string, unknown>[] {
  const rows: Record<string, unknown>[] = [];
  for (let i = 1; i <= count; i++) {
    rows.push({
      id: i,
      code: `${objectName}_${1000 + i}`,
      name: `示例数据 ${i}`,
      status: i % 3 === 0 ? 0 : 1,
      create_time: '2026-09-15 10:00:00',
    });
  }
  return rows;
}

/** SQL 是否看起来合法（简单启发） */
function looksLikeSelect(sql: string): boolean {
  return /^select\s/i.test((sql || '').trim());
}

/** 从建模取 SQL / 数据源（executeSql 支持三选一 SQL 源与二选一数据源） */
function resolveModeling(body: Record<string, unknown> | undefined): JulyBusinessModelingVo011 | undefined {
  if (!body) return undefined;
  if (body.modelId) return mockModels.find((m) => m.id === body.modelId);
  if (body.modelCode) return mockModels.find((m) => m.modelCode === body.modelCode);
  return undefined;
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

  // ===== 主键点查（GET 走 query，mock 不区分方法） =====
  '/julyBusinessModeling/v1/getById': async (body) => {
    await delay(200);
    const item = mockModels.find((s) => s.id === body?.id);
    if (!item) return fail(`record not found, id=${body?.id}`, 404);
    return ok(structuredClone(item));
  },

  // ===== 按建模编码点查 =====
  '/julyBusinessModeling/v1/getByCode': async (body) => {
    await delay(200);
    const item = mockModels.find((s) => s.modelCode === body?.modelCode);
    if (!item) return fail(`record not found, modelCode=${body?.modelCode}`, 404);
    return ok(structuredClone(item));
  },

  // ===== 交接产物（仅收 id；返回 metaData + fieldData） =====
  '/julyBusinessModeling/v1/getModelData': async (body) => {
    await delay(300);
    const item = mockModels.find((s) => s.id === body?.id);
    if (!item) return fail(`record not found, id=${body?.id}`, 404);
    return ok(structuredClone(item));
  },

  // ===== 新增（modelCode / modelName / dataSourceCode / objectName 必填） =====
  '/julyBusinessModeling/v1/insert': async (body) => {
    await delay(400);
    const modelCode = (body?.modelCode || '').trim();
    const objectName = (body?.objectName || '').trim();
    const modelName = (body?.modelName || '').trim();
    const dataSourceCode = (body?.dataSourceCode || '').trim();
    if (!modelCode) return fail('insert: modelCode is required', 400);
    if (!modelName) return fail('insert: modelName is required', 400);
    if (!dataSourceCode) return fail('insert: dataSourceCode is required', 400);
    if (!objectName) return fail('insert: objectName is required', 400);
    if (mockModels.some((s) => s.modelCode === modelCode)) return fail(`insert: modelCode ${modelCode} already exists`, 400);

    const fieldData: JulyBusinessModelingFieldVo011[] = body?.fieldData || [];
    const metaData: JulyBusinessModelingMetaVo011 = {
      objectName,
      description: body?.objectDescription || '',
      objectType: body?.objectType || 'type011',
      packageName: body?.packageName || '',
      importField: body?.businessField || '',
      url: body?.routerPath || '',
      fieldData: withCommonFields(fieldData.filter((f: JulyBusinessModelingFieldVo011) => !LEAD_COMMON.concat(TAIL_COMMON).some((c) => c.code === f.code))),
    };
    const item: JulyBusinessModelingVo011 = {
      id: String(nextId++),
      modelCode, modelName, objectName, dataSourceCode,
      sqlContent: body?.sqlContent || '',
      status: '1', remark: body?.remark || '',
      metaData,
      createTime: '2026-09-15 10:10:00', updateTime: '2026-09-15 10:10:00',
    };
    mockModels.unshift(item);
    return ok({ id: item.id });
  },

  // ===== 更新（modelName / dataSourceCode 必填；modelCode 与 objectName 不可变；fieldData 整体替换） =====
  '/julyBusinessModeling/v1/update': async (body) => {
    await delay(400);
    const item = mockModels.find((s) => s.id === body?.id);
    if (!item) return fail(`record not found, id=${body?.id}`, 404);
    const modelName = (body?.modelName || '').trim();
    const dataSourceCode = (body?.dataSourceCode || '').trim();
    if (!modelName) return fail('update: modelName is required', 400);
    if (!dataSourceCode) return fail('update: dataSourceCode is required', 400);
    item.modelName = modelName;
    item.dataSourceCode = dataSourceCode;
    if (body?.sqlContent !== undefined) item.sqlContent = body.sqlContent;
    if (body?.remark !== undefined) item.remark = body.remark;
    if (body?.status !== undefined) item.status = body.status;
    const meta: JulyBusinessModelingMetaVo011 = { ...(item.metaData || {}) };
    if (body?.objectType !== undefined) meta.objectType = body.objectType;
    if (body?.objectDescription !== undefined) meta.description = body.objectDescription;
    if (body?.packageName !== undefined) meta.packageName = body.packageName;
    if (body?.businessField !== undefined) meta.importField = body.businessField;
    if (body?.routerPath !== undefined) meta.url = body.routerPath;
    if (body?.fieldData !== undefined) {
      const business = (body.fieldData as JulyBusinessModelingFieldVo011[])
        .filter((f) => !LEAD_COMMON.concat(TAIL_COMMON).some((c) => c.code === f.code));
      meta.fieldData = withCommonFields(business);
    }
    item.metaData = meta;
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

  // ===== 逻辑删除（批量） =====
  '/julyBusinessModeling/v1/logicDeleteBatch': async (body) => {
    await delay(300);
    const ids: string[] = body?.ids || [];
    const removed: string[] = [];
    for (const id of ids) {
      const i = mockModels.findIndex((s) => s.id === id);
      if (i >= 0) removed.push(mockModels.splice(i, 1)[0].id);
    }
    return ok({ ids: removed });
  },

  // ===== SQL 探针（★ 后端 probeAndInfer：直接返回推断好的 fieldData，含公共列补齐） =====
  '/julyBusinessModeling/v1/probe': async (body) => {
    await delay(300);
    if (!body?.dataSourceCode) return ok<JulyBusinessModelingProbeResultVo011>({ success: false, message: '请选择数据源', fieldData: [] });
    if (!looksLikeSelect(body?.sqlContent || '')) return ok<JulyBusinessModelingProbeResultVo011>({ success: false, message: '仅支持只读 SELECT 语句', fieldData: [] });
    const business = SAMPLE_BUSINESS.map((f) => ({ ...f, notNull: f.notNull ?? false }));
    return ok<JulyBusinessModelingProbeResultVo011>({
      success: true,
      message: `推断出 ${business.length} 个业务字段（已补齐公共列）`,
      fieldData: withCommonFields(business),
    });
  },

  // ===== SQL 执行（不分页；返回 columns + rows） =====
  '/julyBusinessModeling/v1/executeSql': async (body) => {
    await delay(700);
    const modeling = resolveModeling(body);
    const sql = body?.sqlContent || modeling?.sqlContent || '';
    if (!looksLikeSelect(sql)) return fail('仅支持只读 SELECT 语句', 400);
    const rows = fakeRows(modeling?.objectName || 'tbl', 10);
    return ok<JulyBusinessModelingResultVo011>({ columns: Object.keys(rows[0] || {}), rows });
  },

  // ===== SQL 分页执行（返回 PageResult011；★ 无 columns，列名需从行数据推） =====
  '/julyBusinessModeling/v1/executeSqlByPage': async (body) => {
    await delay(400);
    const modeling = resolveModeling(body);
    const sql = body?.sqlContent || modeling?.sqlContent || '';
    if (!looksLikeSelect(sql)) return fail('仅支持只读 SELECT 语句', 400);
    const all = fakeRows(modeling?.objectName || 'tbl', 23);
    return ok(pageResult(all, body?.pageIndex || 1, body?.pageSize || 10));
  },
};
