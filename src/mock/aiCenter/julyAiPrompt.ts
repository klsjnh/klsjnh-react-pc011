/**
 * Mock：AI 提示词（julyAiPrompt）—— 对齐后端 AiPromptController 11 端点
 * ⚠️ selectDetailListByPrompt 为前端约定端点（后端 use case 已有 details(pkMt)，
 *   待补 HTTP 暴露）；mock 先行实现，API 模式待后端就绪后自动生效。
 */
import { ok, fail, delay, pageResult, type Handler } from '@/mock/system011/common';
import type { JulyAiPromptItem, JulyAiPromptDetailItem } from '@/types/aiCenter/aiPrompt/vo';

/** mock 数据源自增 id */
let nextId = 200;

/** Mock 提示词主表（字段对齐后端 JulyAiPromptVo011） */
export const mockPrompts: JulyAiPromptItem[] = [
  { id: 'prm-0001', promptCode: 'chat.table.output', promptName: '表格输出约束', scene: 'inference', status: '1' },
  { id: 'prm-0002', promptCode: 'chat.sql.assistant', promptName: 'SQL 助手', scene: 'inference', status: '1' },
  { id: 'prm-0003', promptCode: 'image.poster.copy', promptName: '海报文案', scene: 'image', status: '0' },
];

/** Mock 业务域明细（字段对齐后端 JulyAiPromptDetailVo011） */
export const mockDetails: JulyAiPromptDetailItem[] = [
  {
    id: 'dtl-0001', domainCode: 'default', contentMode: 'inline',
    content: '你是一个智能助手。当用户要求表格时，必须输出 Markdown 表格（含表头行与分隔行），不得用列表替代。\n当前场景：${scene}',
    variables: 'scene', sortOrder: 1, status: '1',
  },
  {
    id: 'dtl-0002', domainCode: 'finance', contentMode: 'inline',
    content: '你是财务分析助手，请用表格输出 ${subject} 的 ${period} 数据，列：项目 / 金额 / 占比。',
    variables: 'subject,period', sortOrder: 2, status: '1',
  },
  {
    id: 'dtl-0003', domainCode: 'default', contentMode: 'inline',
    content: '你是 SQL 专家。根据用户问题生成可执行 SQL，禁止写操作，必须附执行计划说明。',
    variables: '', sortOrder: 1, status: '1',
  },
];

/** 明细归属（mock 简化处理：按提示词编码段映射，detail 数据带 _promptCode 不可见字段由下方查找表维护） */
const detailOwner: Record<string, string> = {
  'dtl-0001': 'prm-0001', 'dtl-0002': 'prm-0001', 'dtl-0003': 'prm-0002',
};

/** ${var} 替换（未提供的变量保留原样） */
function renderText(text: string, params?: Record<string, string>): string {
  if (!params) return text;
  return text.replace(/\$\{(\w+)\}/g, (m, key: string) => (key in params ? params[key] : m));
}

export const handlers: Record<string, Handler> = {
  // ===== 提示词分页查询（keyword 模糊 code/name，scene/status 过滤） =====
  '/julyAiPrompt/v1/selectListByPage': async (body) => {
    await delay(300);
    const kw = (body?.keyword || '').trim().toLowerCase();
    const scene = body?.scene;
    const status = body?.status;
    let rows = [...mockPrompts];
    if (kw) {
      rows = rows.filter((r) =>
        r.promptCode.toLowerCase().includes(kw) ||
        r.promptName.toLowerCase().includes(kw));
    }
    if (scene) rows = rows.filter((r) => r.scene === scene);
    if (status) rows = rows.filter((r) => r.status === status);
    rows.sort((a, b) => a.promptCode.localeCompare(b.promptCode));
    return ok(pageResult(rows, body?.pageIndex || 1, body?.pageSize || 10));
  },

  // ===== 主键 / 编码点查 =====
  '/julyAiPrompt/v1/getById': async (body) => {
    await delay(200);
    const item = mockPrompts.find((p) => p.id === body?.id);
    if (!item) return fail(`record not found, id=${body?.id}`, 404);
    return ok(structuredClone(item));
  },
  '/julyAiPrompt/v1/getByCode': async (body) => {
    await delay(200);
    const item = mockPrompts.find((p) => p.promptCode === body?.promptCode);
    if (!item) return fail(`record not found, promptCode=${body?.promptCode}`, 404);
    return ok(structuredClone(item));
  },

  // ===== 新增提示词（含业务域明细） =====
  '/julyAiPrompt/v1/insert': async (body) => {
    await delay(400);
    const promptCode = (body?.promptCode || '').trim();
    const promptName = (body?.promptName || '').trim();
    if (!promptCode) return fail('insert: promptCode is required', 400);
    if (!promptName) return fail('insert: promptName is required', 400);
    if (mockPrompts.some((p) => p.promptCode === promptCode)) return fail(`insert: promptCode ${promptCode} already exists`, 400);
    const id = `prm-${String(nextId++)}`;
    const item: JulyAiPromptItem = { id, promptCode, promptName, scene: body?.scene || '', status: '1' };
    mockPrompts.unshift(item);
    // 明细随主表单次下发（对齐后端 insert 语义）
    let order = 1;
    for (const d of body?.details || []) {
      if (!d?.domainCode) return fail('insert: detail domainCode is required', 400);
      const detailId = `dtl-${String(nextId++)}`;
      detailOwner[detailId] = id;
      mockDetails.push({
        id: detailId, domainCode: d.domainCode, contentMode: d.contentMode || 'inline',
        content: d.content || '', storageCode: d.storageCode, bucket: d.bucket,
        variables: d.variables || '', sortOrder: d.sortOrder ?? order, status: d.status || '1',
      });
      order++;
    }
    return ok({ id });
  },

  // ===== 修改提示词（promptCode 不可变；不含明细） =====
  '/julyAiPrompt/v1/update': async (body) => {
    await delay(400);
    const item = mockPrompts.find((p) => p.id === body?.id);
    if (!item) return fail(`record not found, id=${body?.id}`, 404);
    if (body?.promptName !== undefined) item.promptName = body.promptName;
    if (body?.scene !== undefined) item.scene = body.scene;
    if (body?.status !== undefined) item.status = body.status;
    return ok({ id: item.id });
  },

  // ===== 逻辑删除提示词（级联清理业务域明细） =====
  '/julyAiPrompt/v1/logicDelete': async (body) => {
    await delay(300);
    const i = mockPrompts.findIndex((p) => p.id === body?.id);
    if (i < 0) return fail(`record not found, id=${body?.id}`, 404);
    const [removed] = mockPrompts.splice(i, 1);
    for (let j = mockDetails.length - 1; j >= 0; j--) {
      if (detailOwner[mockDetails[j].id || ''] === removed.id) mockDetails.splice(j, 1);
    }
    return ok({ id: removed.id });
  },

  // ===== 业务域明细：按提示词查询（⚠️ 前端约定端点，后端待补） =====
  '/julyAiPrompt/v1/selectDetailListByPrompt': async (body) => {
    await delay(250);
    const promptId = body?.promptId || '';
    const rows = mockDetails
      .filter((d) => detailOwner[d.id || ''] === promptId)
      .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
    return ok(rows.map((r) => ({ ...r })));
  },

  // ===== 业务域明细：新增 =====
  '/julyAiPrompt/v1/insertDetail': async (body) => {
    await delay(350);
    const domainCode = (body?.domainCode || '').trim();
    if (!domainCode) return fail('insertDetail: domainCode is required', 400);
    if (!mockPrompts.some((p) => p.id === body?.promptId)) return fail(`prompt not found, id=${body?.promptId}`, 404);
    if (mockDetails.some((d) => detailOwner[d.id || ''] === body?.promptId && d.domainCode === domainCode)) {
      return fail(`insertDetail: domainCode ${domainCode} already exists`, 400);
    }
    const id = `dtl-${String(nextId++)}`;
    detailOwner[id] = body.promptId;
    mockDetails.push({
      id, domainCode, contentMode: body?.contentMode || 'inline',
      content: body?.content || '', storageCode: body?.storageCode, bucket: body?.bucket,
      variables: body?.variables || '', sortOrder: body?.sortOrder ?? mockDetails.length + 1,
      status: '1', remark: body?.remark || '',
    });
    return ok({ id });
  },

  // ===== 业务域明细：修改 =====
  '/julyAiPrompt/v1/updateDetail': async (body) => {
    await delay(350);
    const item = mockDetails.find((d) => d.id === body?.id);
    if (!item) return fail(`record not found, id=${body?.id}`, 404);
    if (body?.domainCode !== undefined) item.domainCode = body.domainCode;
    if (body?.contentMode !== undefined) item.contentMode = body.contentMode;
    if (body?.content !== undefined) item.content = body.content;
    if (body?.variables !== undefined) item.variables = body.variables;
    if (body?.sortOrder !== undefined) item.sortOrder = body.sortOrder;
    if (body?.remark !== undefined) item.remark = body.remark;
    if (body?.status !== undefined) item.status = body.status;
    return ok({ id: item.id });
  },

  // ===== 业务域明细：逻辑删除 =====
  '/julyAiPrompt/v1/logicDeleteDetail': async (body) => {
    await delay(250);
    const i = mockDetails.findIndex((d) => d.id === body?.id);
    if (i < 0) return fail(`record not found, id=${body?.id}`, 404);
    const [removed] = mockDetails.splice(i, 1);
    return ok({ id: removed.id });
  },

  // ===== 渲染提示词（${var} 替换；domainCode 留空取默认域） =====
  '/julyAiPrompt/v1/render': async (body) => {
    await delay(300);
    const prompt = mockPrompts.find((p) => p.promptCode === body?.promptCode);
    if (!prompt) return fail(`prompt not found, promptCode=${body?.promptCode}`, 404);
    const own = mockDetails.filter((d) => detailOwner[d.id || ''] === prompt.id);
    const detail = body?.domainCode
      ? own.find((d) => d.domainCode === body.domainCode)
      : own.find((d) => d.domainCode === 'default') ?? own[0];
    if (!detail) return fail(`no detail for promptCode=${body.promptCode}`, 404);
    return ok(renderText(detail.content || '', body?.params));
  },
};
