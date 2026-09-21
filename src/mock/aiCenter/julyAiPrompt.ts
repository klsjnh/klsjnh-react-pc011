/**
 * Mock：AI 提示词（julyAiDomainPrompt 明细端点）—— 对齐线上新契约（2026-09-21 bundle 模型）
 * 提示词 = 业务域明细子表：pkMt 挂域 id；端点走 /julyAiDomain/v1/*Detail* + render + getContent。
 * 契约口径：Vo 不回传正文（超长）——正文仓 CONTENT_REPO 承载，getContent/render 取用。
 */
import { ok, fail, delay, pageResult, type Handler } from '@/mock/system011/common';
import type { JulyAiDomainPromptVo011 } from '@/types/aiCenter/aiPrompt/vo';

/** mock 数据源自增 id（与 julyAiDomain.ts 序列错开段） */
let nextPromptId = 400;

/** 正文仓（mock：getContent / render 时取用；Vo 本体不回传正文） */
const CONTENT_REPO: Record<string, string> = {
  'prm-0101': '你是一个智能助手。当用户要求表格时，必须输出 Markdown 表格（含表头行与分隔行），不得用列表替代。\n当前场景：${scene}',
  'prm-0102': '你是 SQL 专家。根据用户问题生成可执行 SQL，禁止写操作，必须附执行计划说明。',
  'prm-0103': '你是财务分析助手，请用表格输出 ${subject} 的 ${period} 数据，列：项目 / 金额 / 占比。',
};

/** 正文仓写入（updateDetail / saveWhole mock 落正文用） */
export function appendPromptContent(id: string, content: string): void {
  CONTENT_REPO[id] = content;
}

/** Mock 提示词（域明细子表；pkMt 对应 mockDomains 的 id） */
export const mockPrompts: JulyAiDomainPromptVo011[] = [
  {
    id: 'prm-0101', pkMt: 'dom-0001', promptCode: 'chat.table.output', promptName: '表格输出约束', scene: 'inference',
    contentMode: 'inline', variables: 'scene', sortOrder: 1, status: '1', remark: '通用表格约束',
  },
  {
    id: 'prm-0102', pkMt: 'dom-0001', promptCode: 'chat.sql.assistant', promptName: 'SQL 助手', scene: 'inference',
    contentMode: 'inline', variables: '', sortOrder: 2, status: '1', remark: '',
  },
  {
    id: 'prm-0103', pkMt: 'dom-0002', promptCode: 'finance.report.summary', promptName: '财报摘要', scene: 'inference',
    contentMode: 'inline', variables: 'subject,period', sortOrder: 1, status: '1', remark: '',
  },
  {
    id: 'prm-0104', pkMt: 'dom-0003', promptCode: 'image.poster.copy', promptName: '海报文案', scene: 'image',
    contentMode: 'storage', storageCode: 'default', bucket: 'ai-prompt', objectKey: 'prompts/poster-copy.md', contentHash: 'mock-hash', contentSize: 128,
    variables: '', sortOrder: 1, status: '0', remark: '已停用示例（storage 模式）',
  },
];

/** ${var} 替换（未提供的变量保留原样） */
function renderText(text: string, params?: Record<string, string>): string {
  if (!params) return text;
  return text.replace(/\$\{(\w+)\}/g, (m, key: string) => (key in params ? params[key] : m));
}

export const handlers: Record<string, Handler> = {
  // ===== 提示词分页查询（明细端点：pkMt 精确过滤 + keyword/scene/status） =====
  '/julyAiDomain/v1/selectDetailListByPage': async (body) => {
    await delay(250);
    const kw = (body?.keyword || '').trim().toLowerCase();
    const pkMt = body?.pkMt;
    const scene = body?.scene;
    const status = body?.status;
    let rows = [...mockPrompts];
    if (pkMt) rows = rows.filter((r) => r.pkMt === pkMt);
    if (kw) {
      rows = rows.filter((r) =>
        r.promptCode.toLowerCase().includes(kw) ||
        r.promptName.toLowerCase().includes(kw));
    }
    if (scene) rows = rows.filter((r) => r.scene === scene);
    if (status) rows = rows.filter((r) => r.status === status);
    rows.sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
    return ok(pageResult(rows, body?.pageIndex || 1, body?.pageSize || 10));
  },

  // ===== 明细点查（getDetailById / getDetailByCode） =====
  '/julyAiDomain/v1/getDetailById': async (body) => {
    await delay(200);
    const hit = mockPrompts.find((p) => p.id === body?.id);
    if (!hit) return fail(`record not found, id=${body?.id}`, 404);
    return ok({ ...hit });
  },

  '/julyAiDomain/v1/getDetailByCode': async (body) => {
    await delay(200);
    const hit = mockPrompts.find((p) => p.promptCode === body?.code);
    if (!hit) return fail(`record not found, code=${body?.code}`, 404);
    return ok({ ...hit });
  },

  // ===== 正文读取（inline 回正文仓；storage 回存储模拟内容） =====
  '/julyAiDomain/v1/getContent': async (body) => {
    await delay(200);
    const hit = mockPrompts.find((p) => p.id === body?.id);
    if (!hit) return fail(`record not found, id=${body?.id}`, 404);
    if (hit.contentMode === 'storage') {
      return ok(`（对象存储正文 · ${hit.bucket || 'ai-prompt'}/${hit.objectKey || 'mock.md'}）\n存储模式正文内容由后端从对象存储取回。`);
    }
    return ok(CONTENT_REPO[hit.id] || '');
  },

  // ===== 新增提示词（pkMt 必传；promptCode 全局唯一） =====
  '/julyAiDomain/v1/insertDetail': async (body) => {
    await delay(350);
    const pkMt = body?.pkMt;
    const promptCode = (body?.promptCode || '').trim();
    const promptName = (body?.promptName || '').trim();
    if (!pkMt) return fail('insertDetail: pkMt is required', 400);
    if (!promptCode) return fail('insertDetail: promptCode is required', 400);
    if (!promptName) return fail('insertDetail: promptName is required', 400);
    if (mockPrompts.some((p) => p.promptCode === promptCode)) return fail(`insertDetail: promptCode ${promptCode} already exists`, 400);
    const id = `prm-${String(nextPromptId++)}`;
    mockPrompts.push({
      id,
      pkMt, promptCode, promptName,
      scene: body?.scene,
      contentMode: body?.contentMode || 'inline',
      storageCode: body?.storageCode,
      bucket: body?.bucket,
      objectKey: body?.contentMode === 'storage' ? `prompts/${promptCode}.md` : undefined,
      contentHash: body?.contentMode === 'storage' ? 'mock-hash' : undefined,
      contentSize: body?.content ? body.content.length : undefined,
      variables: body?.variables || '',
      sortOrder: body?.sortOrder ?? 1,
      status: body?.status || '1',
      remark: body?.remark || '',
    });
    if (body?.content !== undefined) appendPromptContent(id, body.content);
    return ok({ id });
  },

  // ===== 修改提示词（promptCode/pkMt 不可变） =====
  '/julyAiDomain/v1/updateDetail': async (body) => {
    await delay(350);
    const item = mockPrompts.find((p) => p.id === body?.id);
    if (!item) return fail(`record not found, id=${body?.id}`, 404);
    if (body?.promptCode !== undefined && String(body.promptCode).trim() !== item.promptCode) {
      return fail('updateDetail: promptCode is immutable', 400);
    }
    if (body?.pkMt !== undefined && body.pkMt !== item.pkMt) {
      return fail('updateDetail: pkMt is immutable', 400);
    }
    if (body?.promptName !== undefined) item.promptName = body.promptName;
    if (body?.scene !== undefined) item.scene = body.scene;
    if (body?.contentMode !== undefined) item.contentMode = body.contentMode;
    if (body?.content !== undefined) {
      if (item.contentMode === 'storage') {
        item.contentHash = 'mock-hash';
        item.contentSize = body.content?.length ?? 0;
      } else {
        appendPromptContent(item.id, body.content);
      }
    }
    if (body?.storageCode !== undefined) item.storageCode = body.storageCode;
    if (body?.bucket !== undefined) item.bucket = body.bucket;
    if (body?.variables !== undefined) item.variables = body.variables;
    if (body?.sortOrder !== undefined) item.sortOrder = body.sortOrder;
    if (body?.remark !== undefined) item.remark = body.remark;
    if (body?.status !== undefined) item.status = body.status;
    return ok({ id: item.id });
  },

  // ===== 删除提示词 =====
  '/julyAiDomain/v1/logicDeleteDetail': async (body) => {
    await delay(300);
    const i = mockPrompts.findIndex((p) => p.id === body?.id);
    if (i < 0) return fail(`record not found, id=${body?.id}`, 404);
    const [removed] = mockPrompts.splice(i, 1);
    return ok({ id: removed.id });
  },

  // ===== 渲染（promptCode 全局唯一；${var} 替换） =====
  '/julyAiDomain/v1/render': async (body) => {
    await delay(300);
    const hit = mockPrompts.find((p) => p.promptCode === body?.promptCode);
    if (!hit) return fail(`render: prompt not found, code=${body?.promptCode}`, 404);
    if (hit.status !== '1') return fail(`render: prompt ${hit.promptCode} is disabled`, 400);
    if (hit.contentMode === 'storage') {
      return ok(`（对象存储正文渲染 · ${hit.bucket || 'ai-prompt'}）\n变量：${JSON.stringify(body?.params || {})}`);
    }
    return ok(renderText(CONTENT_REPO[hit.id] || '', body?.params));
  },
};
