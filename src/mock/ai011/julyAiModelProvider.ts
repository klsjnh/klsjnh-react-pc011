/** Mock：AI 模型供应商（julyAiModelProvider） - 对齐后端 ai011 模块契约 */
import { ok, fail, delay, pageResult, type Handler } from '@/mock/system011/common';
import type {
  AiModelProviderItem,
  AiModelProviderApiItem,
  AiModelProviderTestResultVo011,
} from '@/types/ai011/aiModelProvider/vo';

/** mock 数据源自增 id */
let nextId = 100;

/** Mock 供应商列表（字段对齐后端 AiModelProviderVo011） */
export const mockProviders: AiModelProviderItem[] = [
  {
    id: 'prov-0001', providerCode: 'openai', providerName: 'OpenAI',
    baseUrl: 'https://api.openai.com/v1', models: 'gpt-4o,gpt-4o-mini,gpt-3.5-turbo',
    sortOrder: 1, status: '1', remark: '官方渠道',
    createTime: '2026-09-15 10:00:00', updateTime: '2026-09-15 10:00:00',
  },
  {
    id: 'prov-0002', providerCode: 'deepseek', providerName: 'DeepSeek',
    baseUrl: 'https://api.deepseek.com/v1', models: 'deepseek-chat,deepseek-reasoner',
    sortOrder: 2, status: '1', remark: '',
    createTime: '2026-09-15 10:01:00', updateTime: '2026-09-15 10:01:00',
  },
  {
    id: 'prov-0003', providerCode: 'qwen', providerName: '通义千问',
    baseUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1', models: 'qwen-max,qwen-plus',
    sortOrder: 3, status: '0', remark: '已停用',
    createTime: '2026-09-15 10:02:00', updateTime: '2026-09-15 10:02:00',
  },
];

/** Mock API 子表（字段对齐后端 AiModelProviderApiVo011） */
export const mockApis: AiModelProviderApiItem[] = [
  { id: 'api-0001', providerCode: 'openai', apiCode: 'key-prod', apiName: '生产密钥', apiKey: 'sk-prod-****', sortOrder: 1, status: '1', remark: '', createTime: '2026-09-15 10:00:00', updateTime: '2026-09-15 10:00:00' },
  { id: 'api-0002', providerCode: 'openai', apiCode: 'key-test', apiName: '测试密钥', apiKey: 'sk-test-****', sortOrder: 2, status: '0', remark: '', createTime: '2026-09-15 10:00:00', updateTime: '2026-09-15 10:00:00' },
  { id: 'api-0003', providerCode: 'deepseek', apiCode: 'key-main', apiName: '主密钥', apiKey: 'sk-ds-****', sortOrder: 1, status: '1', remark: '', createTime: '2026-09-15 10:01:00', updateTime: '2026-09-15 10:01:00' },
];

/** 测试连接判定：baseUrl 走可信域 or provider 启用 → 视为可达 */
function isReachable(provider: AiModelProviderItem | undefined, baseUrl: string): boolean {
  const url = provider?.baseUrl || baseUrl || '';
  return !!(provider?.status === '1') || url.startsWith('https://api.') || url.startsWith('https://dashscope');
}

/** 解析模型列表（兼容逗号分隔 / JSON 串） */
function parseModels(models?: string): string[] {
  if (!models) return [];
  const s = models.trim();
  if (s.startsWith('[')) {
    try { return JSON.parse(s); } catch { return []; }
  }
  return s.split(',').map((m) => m.trim()).filter(Boolean);
}

export const handlers: Record<string, Handler> = {
  // ===== 供应商分页查询（keyword 模糊 code/name/baseUrl，status 过滤） =====
  '/julyAiModelProvider/v1/selectListByPage': async (body) => {
    await delay(300);
    const kw = (body?.keyword || '').trim().toLowerCase();
    const status = body?.status;
    let rows = [...mockProviders];
    if (kw) {
      rows = rows.filter((r) =>
        r.providerCode.toLowerCase().includes(kw) ||
        r.providerName.toLowerCase().includes(kw) ||
        (r.baseUrl || '').toLowerCase().includes(kw));
    }
    if (status) rows = rows.filter((r) => r.status === status);
    rows.sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
    return ok(pageResult(rows, body?.pageIndex || 1, body?.pageSize || 10));
  },

  // ===== 供应商主键查询 =====
  '/julyAiModelProvider/v1/getById': async (body) => {
    await delay(200);
    const item = mockProviders.find((s) => s.id === body?.id);
    if (!item) return fail(`record not found, id=${body?.id}`, 404);
    return ok(structuredClone(item));
  },

  // ===== 供应商新增（providerCode 唯一不可变） =====
  '/julyAiModelProvider/v1/insert': async (body) => {
    await delay(400);
    const providerCode = (body?.providerCode || '').trim();
    const providerName = (body?.providerName || '').trim();
    const baseUrl = (body?.baseUrl || '').trim();
    if (!providerCode) return fail('insert: providerCode is required', 400);
    if (!providerName) return fail('insert: providerName is required', 400);
    if (!baseUrl) return fail('insert: baseUrl is required', 400);
    if (mockProviders.some((s) => s.providerCode === providerCode)) return fail(`insert: providerCode ${providerCode} already exists`, 400);
    const item: AiModelProviderItem = {
      id: String(nextId++),
      providerCode, providerName, baseUrl,
      models: body?.models || '',
      sortOrder: body?.sortOrder ?? mockProviders.length + 1,
      status: '1',
      remark: body?.remark || '',
      createTime: '2026-09-15 10:10:00', updateTime: '2026-09-15 10:10:00',
    };
    mockProviders.unshift(item);
    return ok({ id: item.id });
  },

  // ===== 供应商更新（providerCode 不可变；status 可改） =====
  '/julyAiModelProvider/v1/update': async (body) => {
    await delay(400);
    const item = mockProviders.find((s) => s.id === body?.id);
    if (!item) return fail(`record not found, id=${body?.id}`, 404);
    if (body?.providerName !== undefined) item.providerName = body.providerName;
    if (body?.baseUrl !== undefined) item.baseUrl = body.baseUrl;
    if (body?.models !== undefined) item.models = body.models;
    if (body?.sortOrder !== undefined) item.sortOrder = body.sortOrder;
    if (body?.status !== undefined) item.status = body.status;
    if (body?.remark !== undefined) item.remark = body.remark;
    item.updateTime = '2026-09-15 10:12:00';
    return ok({ id: item.id });
  },

  // ===== 供应商逻辑删除 =====
  '/julyAiModelProvider/v1/logicDelete': async (body) => {
    await delay(300);
    const i = mockProviders.findIndex((s) => s.id === body?.id);
    if (i < 0) return fail(`record not found, id=${body?.id}`, 404);
    const [removed] = mockProviders.splice(i, 1);
    // 级联移除其 API 子表
    for (let j = mockApis.length - 1; j >= 0; j--) {
      if (mockApis[j].providerCode === removed.providerCode) mockApis.splice(j, 1);
    }
    return ok({ id: removed.id });
  },

  // ===== 供应商测试连接（providerCode 必填） =====
  '/julyAiModelProvider/v1/testConnection': async (body) => {
    await delay(800);
    const providerCode = body?.providerCode || '';
    const provider = mockProviders.find((s) => s.providerCode === providerCode) || (body?.id ? mockProviders.find((s) => s.id === body.id) : undefined);
    if (!provider && !providerCode) return ok({ success: false, message: '请填写供应商编码后再测试', models: [] } as AiModelProviderTestResultVo011);
    const reachable = isReachable(provider, body?.baseUrl || '');
    const res: AiModelProviderTestResultVo011 = reachable
      ? { success: true, message: `连接成功，可用模型 ${parseModels(provider?.models).length} 个`, models: parseModels(provider?.models) }
      : { success: false, message: '无法连接到该模型供应商', models: [] };
    return ok(res);
  },

  // ===== API 子表：按供应商编码查询 =====
  '/julyAiModelProvider/v1/selectApiListByProvider': async (body) => {
    await delay(250);
    const providerCode = body?.providerCode || '';
    const status = body?.status;
    let rows = mockApis.filter((a) => a.providerCode === providerCode);
    if (status) rows = rows.filter((a) => a.status === status);
    rows.sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
    return ok(rows);
  },

  // ===== API 子表：新增 =====
  '/julyAiModelProvider/v1/insertApi': async (body) => {
    await delay(350);
    const providerCode = (body?.providerCode || '').trim();
    const apiCode = (body?.apiCode || '').trim();
    const apiName = (body?.apiName || '').trim();
    const apiKey = (body?.apiKey || '').trim();
    if (!providerCode) return fail('insertApi: providerCode is required', 400);
    if (!apiCode) return fail('insertApi: apiCode is required', 400);
    if (!apiName) return fail('insertApi: apiName is required', 400);
    if (!apiKey) return fail('insertApi: apiKey is required', 400);
    if (mockApis.some((a) => a.providerCode === providerCode && a.apiCode === apiCode)) {
      return fail(`insertApi: apiCode ${apiCode} already exists under ${providerCode}`, 400);
    }
    const item: AiModelProviderApiItem = {
      id: String(nextId++),
      providerCode, apiCode, apiName, apiKey,
      sortOrder: body?.sortOrder ?? mockApis.filter((a) => a.providerCode === providerCode).length + 1,
      status: '1', remark: body?.remark || '',
      createTime: '2026-09-15 10:10:00', updateTime: '2026-09-15 10:10:00',
    };
    mockApis.unshift(item);
    return ok({ id: item.id });
  },

  // ===== API 子表：更新 =====
  '/julyAiModelProvider/v1/updateApi': async (body) => {
    await delay(350);
    const item = mockApis.find((a) => a.id === body?.id);
    if (!item) return fail(`record not found, id=${body?.id}`, 404);
    if (body?.apiName !== undefined) item.apiName = body.apiName;
    if (body?.apiKey !== undefined) item.apiKey = body.apiKey;
    if (body?.sortOrder !== undefined) item.sortOrder = body.sortOrder;
    if (body?.status !== undefined) item.status = body.status;
    if (body?.remark !== undefined) item.remark = body.remark;
    item.updateTime = '2026-09-15 10:12:00';
    return ok({ id: item.id });
  },

  // ===== API 子表：逻辑删除 =====
  '/julyAiModelProvider/v1/logicDeleteApi': async (body) => {
    await delay(250);
    const i = mockApis.findIndex((a) => a.id === body?.id);
    if (i < 0) return fail(`record not found, id=${body?.id}`, 404);
    const [removed] = mockApis.splice(i, 1);
    return ok({ id: removed.id });
  },

  // ===== API 子表：测试连接（按 id 定位所属供应商） =====
  '/julyAiModelProvider/v1/testConnectionApi': async (body) => {
    await delay(700);
    const apiItem = mockApis.find((a) => a.id === body?.id);
    if (!apiItem) return ok({ success: false, message: 'API 记录不存在', models: [] } as AiModelProviderTestResultVo011);
    const provider = mockProviders.find((p) => p.providerCode === apiItem.providerCode);
    const reachable = isReachable(provider, provider?.baseUrl || '');
    const res: AiModelProviderTestResultVo011 = reachable
      ? { success: true, message: `API「${apiItem.apiName}」调用成功`, models: parseModels(provider?.models) }
      : { success: false, message: `API「${apiItem.apiName}」调用失败`, models: [] };
    return ok(res);
  },
};
