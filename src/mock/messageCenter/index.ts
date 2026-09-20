/**
 * Mock：messagecenter（出入两套 6 资源，33 端点）
 * 按真实 action 路径分发（相对路径，不带 /klsjnh/messagecenter 前缀，与 service 层一致）。
 * 出站消息 send 会模拟落库（写入 mockOutboundMessages）；入站 receive 按 rawMessage 幂等判重。
 */
import { ok, delay, pageResult, fail, type Handler, type MockEnvelope } from '@/mock/system011/common';

const NOW = '2026-09-20T10:00:00';

/* ---------------- 出站 ---------------- */

let mockOutboundChannels = [
  { id: 'obch001', channelCode: 'email001', channelName: '邮件通道', providerType: 'email', config: '{"smtp":"smtp://localhost:25","from":"noreply@klsjnh.local"}', sortOrder: 1, status: '1', remark: 'SMTP 邮件', createTime: NOW },
  { id: 'obch002', channelCode: 'sms001', channelName: '短信通道', providerType: 'sms', config: '{"provider":"mock"}', sortOrder: 2, status: '1', remark: 'Mock 短信', createTime: NOW },
];

let mockOutboundTemplates = [
  { id: 'obtp001', templateCode: 'captcha', templateName: '验证码模板', channelCode: 'sms001', title: '验证码', content: '您的验证码是 ${code}，5 分钟内有效。', sortOrder: 1, status: '1', createTime: NOW },
];

let mockOutboundMessages: Array<Record<string, unknown>> = [
  { id: 'obmsg001', channelCode: 'sms001', providerType: 'sms', messageType: 'text', msgTo: '22644212509', templateCode: 'captcha', title: '验证码', content: '您的验证码是 123456，5 分钟内有效。', status: '已发送', retryCount: 0, error: '', createTime: NOW },
];

/* ---------------- 入站 ---------------- */

let mockInboundChannels = [
  { id: 'ibch001', channelCode: 'webhook001', channelName: '通用 Webhook', providerType: 'webhook', config: '{"verifyToken":"mock"}', sortOrder: 1, status: '1', createTime: NOW },
];

let mockInboundTemplates = [
  { id: 'ibtp001', templateCode: 'event-notify', templateName: '事件通知模板', channelCode: 'webhook001', title: '事件通知', content: '收到事件：${event}', sortOrder: 1, status: '1', createTime: NOW },
];

let mockInboundMessages: Array<Record<string, unknown>> = [
  { id: 'ibmsg001', channelCode: 'webhook001', providerType: 'webhook', messageType: 'text', fromId: 'user-001', content: '历史回调消息', rawMessageId: 'raw-001', status: '已接收', createTime: NOW },
];

const kwHit = (row: Record<string, unknown>, kw?: string) => {
  if (!kw) return true;
  return Object.values(row).some((v) => String(v ?? '').toLowerCase().includes(kw.toLowerCase()));
};

/* ==================== handlers ==================== */

export const handlers: Record<string, Handler> = {
  /* ---- 出站模板 ---- */
  '/julyOutboundTemplate/v1/selectListByPage': async (body) => {
    await delay(200);
    let rows = [...mockOutboundTemplates];
    if (body?.channelCode) rows = rows.filter((r) => r.channelCode === body.channelCode);
    if (body?.keyword) rows = rows.filter((r) => kwHit(r as unknown as Record<string, unknown>, body.keyword));
    return ok(pageResult(rows, body?.pageIndex || 1, body?.pageSize || 10));
  },
  '/julyOutboundTemplate/v1/getById': async (body) => {
    await delay(150);
    const row = mockOutboundTemplates.find((r) => r.id === body?.id);
    return row ? ok(row) : fail('template not found', 404);
  },
  '/julyOutboundTemplate/v1/insert': async (body) => {
    await delay(200);
    const row = { id: `obtp${Date.now()}`, createTime: NOW, status: '1', ...body };
    mockOutboundTemplates.push(row);
    return ok({ id: row.id });
  },
  '/julyOutboundTemplate/v1/update': async (body) => {
    await delay(200);
    mockOutboundTemplates = mockOutboundTemplates.map((r) => (r.id === body?.id ? { ...r, ...body } : r));
    return ok({ id: body?.id });
  },
  '/julyOutboundTemplate/v1/logicDelete': async (body) => {
    await delay(150);
    mockOutboundTemplates = mockOutboundTemplates.filter((r) => r.id !== body?.id);
    return ok({ id: body?.id });
  },
  '/julyOutboundTemplate/v1/logicDeleteBatch': async (body) => {
    await delay(150);
    const ids: string[] = body?.ids || [];
    mockOutboundTemplates = mockOutboundTemplates.filter((r) => !ids.includes(r.id));
    return ok({ count: ids.length });
  },

  /* ---- 出站通道 ---- */
  '/julyOutboundChannel/v1/selectListByPage': async (body) => {
    await delay(200);
    let rows = [...mockOutboundChannels];
    if (body?.keyword) rows = rows.filter((r) => kwHit(r as unknown as Record<string, unknown>, body.keyword));
    return ok(pageResult(rows, body?.pageIndex || 1, body?.pageSize || 10));
  },
  '/julyOutboundChannel/v1/getById': async (body) => {
    await delay(150);
    const row = mockOutboundChannels.find((r) => r.id === body?.id);
    return row ? ok(row) : fail('channel not found', 404);
  },
  '/julyOutboundChannel/v1/insert': async (body) => {
    await delay(200);
    const row = { id: `obch${Date.now()}`, createTime: NOW, status: '1', ...body };
    mockOutboundChannels.push(row);
    return ok({ id: row.id });
  },
  '/julyOutboundChannel/v1/update': async (body) => {
    await delay(200);
    mockOutboundChannels = mockOutboundChannels.map((r) => (r.id === body?.id ? { ...r, ...body } : r));
    return ok({ id: body?.id });
  },
  '/julyOutboundChannel/v1/logicDelete': async (body) => {
    await delay(150);
    mockOutboundChannels = mockOutboundChannels.filter((r) => r.id !== body?.id);
    return ok({ id: body?.id });
  },
  '/julyOutboundChannel/v1/logicDeleteBatch': async (body) => {
    await delay(150);
    const ids: string[] = body?.ids || [];
    mockOutboundChannels = mockOutboundChannels.filter((r) => !ids.includes(r.id));
    return ok({ count: ids.length });
  },

  /* ---- 出站消息 ---- */
  '/julyOutboundMessage/v1/selectListByPage': async (body) => {
    await delay(200);
    let rows = [...mockOutboundMessages].reverse();
    if (body?.channelCode) rows = rows.filter((r) => r.channelCode === body.channelCode);
    if (body?.keyword) rows = rows.filter((r) => kwHit(r, body.keyword));
    return ok(pageResult(rows, body?.pageIndex || 1, body?.pageSize || 10));
  },
  '/julyOutboundMessage/v1/send': async (body) => {
    await delay(300);
    if (!body?.channelCode) return fail('channelCode is required', 400);
    const row = {
      id: `obmsg${Date.now()}`, createTime: NOW, status: '已发送', retryCount: 0, error: null,
      providerType: mockOutboundChannels.find((c) => c.channelCode === body.channelCode)?.providerType,
      ...body,
      // 入参 to → 出参 VO 字段 msgTo（后端同样做此映射，mock 须对齐）
      msgTo: body.to,
      to: undefined,
    };
    mockOutboundMessages.push(row);
    return ok({ messageId: row.id, success: true, channelMessageId: `mock-${Date.now()}`, error: null });
  },
  '/julyOutboundMessage/v1/resend': async (body) => {
    await delay(300);
    const src = mockOutboundMessages.find((m) => m.id === body?.id);
    if (!src) return fail('message not found', 404);
    const row = { ...src, id: `obmsg${Date.now()}`, createTime: NOW, retryCount: 0, status: '已发送' };
    mockOutboundMessages.push(row);
    return ok({ messageId: row.id, success: true, channelMessageId: `mock-${Date.now()}`, error: null });
  },
  '/julyOutboundMessage/v1/logicDelete': async (body) => {
    await delay(150);
    mockOutboundMessages = mockOutboundMessages.filter((m) => m.id !== body?.id);
    return ok({ id: body?.id });
  },
  '/julyOutboundMessage/v1/logicDeleteBatch': async (body) => {
    await delay(150);
    const ids: string[] = body?.ids || [];
    mockOutboundMessages = mockOutboundMessages.filter((m) => !ids.includes(String(m.id)));
    return ok({ count: ids.length });
  },

  /* ---- 入站模板 ---- */
  '/julyInboundTemplate/v1/selectListByPage': async (body) => {
    await delay(200);
    let rows = [...mockInboundTemplates];
    if (body?.channelCode) rows = rows.filter((r) => r.channelCode === body.channelCode);
    if (body?.keyword) rows = rows.filter((r) => kwHit(r as unknown as Record<string, unknown>, body.keyword));
    return ok(pageResult(rows, body?.pageIndex || 1, body?.pageSize || 10));
  },
  '/julyInboundTemplate/v1/getById': async (body) => {
    await delay(150);
    const row = mockInboundTemplates.find((r) => r.id === body?.id);
    return row ? ok(row) : fail('template not found', 404);
  },
  '/julyInboundTemplate/v1/insert': async (body) => {
    await delay(200);
    const row = { id: `ibtp${Date.now()}`, createTime: NOW, status: '1', ...body };
    mockInboundTemplates.push(row);
    return ok({ id: row.id });
  },
  '/julyInboundTemplate/v1/update': async (body) => {
    await delay(200);
    mockInboundTemplates = mockInboundTemplates.map((r) => (r.id === body?.id ? { ...r, ...body } : r));
    return ok({ id: body?.id });
  },
  '/julyInboundTemplate/v1/logicDelete': async (body) => {
    await delay(150);
    mockInboundTemplates = mockInboundTemplates.filter((r) => r.id !== body?.id);
    return ok({ id: body?.id });
  },
  '/julyInboundTemplate/v1/logicDeleteBatch': async (body) => {
    await delay(150);
    const ids: string[] = body?.ids || [];
    mockInboundTemplates = mockInboundTemplates.filter((r) => !ids.includes(r.id));
    return ok({ count: ids.length });
  },

  /* ---- 入站通道 ---- */
  '/julyInboundChannel/v1/selectListByPage': async (body) => {
    await delay(200);
    let rows = [...mockInboundChannels];
    if (body?.keyword) rows = rows.filter((r) => kwHit(r as unknown as Record<string, unknown>, body.keyword));
    return ok(pageResult(rows, body?.pageIndex || 1, body?.pageSize || 10));
  },
  '/julyInboundChannel/v1/getById': async (body) => {
    await delay(150);
    const row = mockInboundChannels.find((r) => r.id === body?.id);
    return row ? ok(row) : fail('channel not found', 404);
  },
  '/julyInboundChannel/v1/insert': async (body) => {
    await delay(200);
    const row = { id: `ibch${Date.now()}`, createTime: NOW, status: '1', ...body };
    mockInboundChannels.push(row);
    return ok({ id: row.id });
  },
  '/julyInboundChannel/v1/update': async (body) => {
    await delay(200);
    mockInboundChannels = mockInboundChannels.map((r) => (r.id === body?.id ? { ...r, ...body } : r));
    return ok({ id: body?.id });
  },
  '/julyInboundChannel/v1/logicDelete': async (body) => {
    await delay(150);
    mockInboundChannels = mockInboundChannels.filter((r) => r.id !== body?.id);
    return ok({ id: body?.id });
  },
  '/julyInboundChannel/v1/logicDeleteBatch': async (body) => {
    await delay(150);
    const ids: string[] = body?.ids || [];
    mockInboundChannels = mockInboundChannels.filter((r) => !ids.includes(r.id));
    return ok({ count: ids.length });
  },

  /* ---- 入站消息 ---- */
  '/julyInboundMessage/v1/selectListByPage': async (body) => {
    await delay(200);
    let rows = [...mockInboundMessages].reverse();
    if (body?.channelCode) rows = rows.filter((r) => r.channelCode === body.channelCode);
    if (body?.keyword) rows = rows.filter((r) => kwHit(r, body.keyword));
    return ok(pageResult(rows, body?.pageIndex || 1, body?.pageSize || 10));
  },
  '/julyInboundMessage/v1/receive': async (body) => {
    await delay(300);
    if (!body?.rawBody) return fail('rawBody is required', 400);
    // 模拟幂等：相同 rawBody 判重
    const dup = mockInboundMessages.find((m) => String(m._rawBody ?? '') === body.rawBody);
    if (dup) return ok({ messageId: String(dup.id), duplicate: true, responseBody: null });
    let parsed: Record<string, unknown> = {};
    try { parsed = JSON.parse(body.rawBody) as Record<string, unknown>; } catch { /* 兼容非 JSON 原文 */ }
    const row = {
      id: `ibmsg${Date.now()}`, createTime: NOW, status: '已接收',
      channelCode: 'webhook001',
      providerType: 'webhook',
      messageType: String(parsed.messageType ?? 'text'),
      fromId: String(parsed.fromId ?? ''),
      content: String(parsed.content ?? body.rawBody),
      rawMessageId: String(parsed.rawMessageId ?? `raw-${Date.now()}`),
      _rawBody: body.rawBody,
    };
    mockInboundMessages.push(row);
    return ok({ messageId: row.id, duplicate: false, responseBody: null });
  },
  '/julyInboundMessage/v1/logicDelete': async (body) => {
    await delay(150);
    mockInboundMessages = mockInboundMessages.filter((m) => m.id !== body?.id);
    return ok({ id: body?.id });
  },
  '/julyInboundMessage/v1/logicDeleteBatch': async (body) => {
    await delay(150);
    const ids: string[] = body?.ids || [];
    mockInboundMessages = mockInboundMessages.filter((m) => !ids.includes(String(m.id)));
    return ok({ count: ids.length });
  },
};

export type { MockEnvelope };
