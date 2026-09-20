/**
 * messagecenter 契约类型（2026-09-19 后端全新模块，33 端点，出入两套 6 资源）
 * 字段逐字对齐 docs/contracts/2026-09-20-openapi.json 的 July*Vo011。
 * 出站（outbound）：模板 / 通道 / 消息（send+resend）；
 * 入站（inbound）：模板 / 通道 / 消息（receive，rawBody 为第三方回调原文）。
 */

/* ==================== 出站模板 ==================== */

export interface JulyOutboundTemplateVo011 {
  id: string;
  templateCode: string;
  templateName: string;
  /** 关联出站通道编码（julyOutboundChannel.channelCode） */
  channelCode: string;
  title?: string;
  content?: string;
  sortOrder?: number;
  status?: string;
  remark?: string;
  createBy?: string;
  updateBy?: string;
  createTime?: string;
  updateTime?: string;
}

export interface JulyOutboundTemplateInsertVo011 {
  templateCode: string;
  templateName: string;
  channelCode: string;
  content: string;
  title?: string;
  sortOrder?: number;
  remark?: string;
}

export interface JulyOutboundTemplateUpdateVo011 {
  id: string;
  templateName: string;
  channelCode: string;
  content: string;
  title?: string;
  sortOrder?: number;
  status?: string;
  remark?: string;
}

export interface JulyOutboundTemplateQueryVo011 {
  pageIndex: number;
  pageSize: number;
  keyword?: string;
  channelCode?: string;
  status?: string;
}

/* ==================== 出站通道 ==================== */

export interface JulyOutboundChannelVo011 {
  id: string;
  channelCode: string;
  channelName: string;
  /** 供应商类型（providerType，如 email / sms / webhook…） */
  providerType: string;
  /** 通道配置（JSON 字符串，含 endpoint / 密钥等，按 providerType 解释） */
  config?: string;
  sortOrder?: number;
  status?: string;
  remark?: string;
  createBy?: string;
  updateBy?: string;
  createTime?: string;
  updateTime?: string;
}

export interface JulyOutboundChannelInsertVo011 {
  channelCode: string;
  channelName: string;
  providerType: string;
  config?: string;
  sortOrder?: number;
  remark?: string;
}

export interface JulyOutboundChannelUpdateVo011 {
  id: string;
  channelName: string;
  providerType: string;
  config?: string;
  sortOrder?: number;
  status?: string;
  remark?: string;
}

export interface JulyOutboundChannelQueryVo011 {
  pageIndex: number;
  pageSize: number;
  keyword?: string;
  status?: string;
}

/* ==================== 出站消息 ==================== */

export interface JulyOutboundMessageVo011 {
  id: string;
  channelCode: string;
  providerType?: string;
  messageType?: string;
  payload?: string;
  /** 接收方（msgTo：邮箱 / 手机号 / URL…，按通道类型解释） */
  msgTo?: string;
  templateCode?: string;
  title?: string;
  content?: string;
  status?: string;
  retryCount?: number;
  error?: string;
  remark?: string;
  createBy?: string;
  updateBy?: string;
  createTime?: string;
  updateTime?: string;
}

/** 出站发送入参（channelCode 必传；templateCode + params 或直接 content 二选一） */
export interface JulyOutboundMessageSendVo011 {
  channelCode: string;
  to?: string;
  messageType?: string;
  payload?: string;
  templateCode?: string;
  params?: string;
  title?: string;
  content?: string;
  remark?: string;
}

export interface JulyOutboundMessageSendResultVo011 {
  messageId?: string;
  success: boolean;
  channelMessageId?: string;
  error?: string;
}

export interface JulyOutboundMessageQueryVo011 {
  pageIndex: number;
  pageSize: number;
  channelCode?: string;
  status?: string;
  keyword?: string;
}

/* ==================== 入站模板（结构与出站对称） ==================== */

export interface JulyInboundTemplateVo011 {
  id: string;
  templateCode: string;
  templateName: string;
  channelCode: string;
  title?: string;
  content?: string;
  sortOrder?: number;
  status?: string;
  remark?: string;
  createBy?: string;
  updateBy?: string;
  createTime?: string;
  updateTime?: string;
}

export interface JulyInboundTemplateInsertVo011 {
  templateCode: string;
  templateName: string;
  channelCode: string;
  content: string;
  title?: string;
  sortOrder?: number;
  remark?: string;
}

export interface JulyInboundTemplateUpdateVo011 {
  id: string;
  templateName: string;
  channelCode: string;
  content: string;
  title?: string;
  sortOrder?: number;
  status?: string;
  remark?: string;
}

export interface JulyInboundTemplateQueryVo011 {
  pageIndex: number;
  pageSize: number;
  keyword?: string;
  channelCode?: string;
  status?: string;
}

/* ==================== 入站通道 ==================== */

export interface JulyInboundChannelVo011 {
  id: string;
  channelCode: string;
  channelName: string;
  providerType: string;
  config?: string;
  sortOrder?: number;
  status?: string;
  remark?: string;
  createBy?: string;
  updateBy?: string;
  createTime?: string;
  updateTime?: string;
}

export interface JulyInboundChannelInsertVo011 {
  channelCode: string;
  channelName: string;
  providerType: string;
  config?: string;
  sortOrder?: number;
  remark?: string;
}

export interface JulyInboundChannelUpdateVo011 {
  id: string;
  channelName: string;
  providerType: string;
  config?: string;
  sortOrder?: number;
  status?: string;
  remark?: string;
}

export interface JulyInboundChannelQueryVo011 {
  pageIndex: number;
  pageSize: number;
  keyword?: string;
  status?: string;
}

/* ==================== 入站消息 ==================== */

export interface JulyInboundMessageVo011 {
  id: string;
  channelCode: string;
  providerType?: string;
  messageType?: string;
  payload?: string;
  /** 来源标识（fromId：发送方 openId / 手机号 / 邮箱…） */
  fromId?: string;
  content?: string;
  rawMessageId?: string;
  error?: string;
  remark?: string;
  status?: string;
  createBy?: string;
  updateBy?: string;
  createTime?: string;
  updateTime?: string;
}

/** 入站接收入参：rawBody 为第三方回调原文（JSON 字符串），后端解析落库 */
export interface JulyInboundReceiveVo011 {
  rawBody: string;
}

export interface JulyInboundReceiveResultVo011 {
  messageId?: string;
  duplicate: boolean;
  responseBody?: string;
}

export interface JulyInboundMessageQueryVo011 {
  pageIndex: number;
  pageSize: number;
  channelCode?: string;
  status?: string;
  keyword?: string;
}
