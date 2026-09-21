/**
 * AI 提示词类型（aiCenter · julyAiPrompt）
 * 字段对齐后端 AiPromptController（2026-09-20 线上 11160 实测 11 端点）：
 *   主表 prompt：promptCode/promptName/scene/sortOrder/remark/status
 *   子表 detail（业务域明细）：domainCode/contentMode/content/storageCode/bucket/variables/sortOrder/remark/status
 * ⚠️ 后端无「按提示词查明细列表」HTTP 端点（use case 的 details(pkMt) 已存在，
 *   待用户补 controller）——前端 service 按约定路径 selectDetailListByPrompt 先行实现。
 */

/** 内容模式：inline 正文入库 / storage 正文写对象存储（约定桶 ai-prompt） */
export type AiPromptContentMode = 'inline' | 'storage';

/** 提示词条目（对应后端 JulyAiPromptVo011） */
export interface JulyAiPromptItem {
  id: string;
  /** 提示词编码（全局唯一，不可变） */
  promptCode: string;
  /** 提示词名称 */
  promptName: string;
  /** 适用能力（inference / image / tts） */
  scene?: string;
  /** 状态：0 停用 / 1 启用 */
  status: string;
}

/** 提示词业务域明细（对应后端 JulyAiPromptDetailVo011；domainCode 必填） */
export interface JulyAiPromptDetailItem {
  /** 明细主键（编辑态必传；新增时后端生成） */
  id?: string;
  /** 业务域编码（同一提示词下唯一） */
  domainCode: string;
  /** 内容模式（inline / storage，默认 inline） */
  contentMode?: string;
  /** 正文（inline 模式；TEXT 上限约 2.1 万汉字） */
  content?: string;
  /** 存储实例编码（storage 模式；缺省 = 默认实例） */
  storageCode?: string;
  /** 桶（storage 模式；约定 ai-prompt） */
  bucket?: string;
  /** 变量声明（可空；渲染时按 ${var} 替换） */
  variables?: string;
  /** 排序 */
  sortOrder?: number;
  /** 备注 */
  remark?: string;
  /** 状态：0 停用 / 1 启用 */
  status?: string;
}

/** 提示词分页查询入参 */
export interface JulyAiPromptQueryVo011 {
  pageIndex: number;
  pageSize: number;
  /** 编码 / 名称关键字 */
  keyword?: string;
  /** 适用能力过滤 */
  scene?: string;
  /** 状态过滤 */
  status?: string;
}

/** 新增提示词入参（含业务域明细；promptCode/promptName/details 必填） */
export interface JulyAiPromptInsertVo011 {
  promptCode: string;
  promptName: string;
  scene?: string;
  sortOrder?: number;
  remark?: string;
  details: JulyAiPromptDetailItem[];
}

/** 修改提示词入参（promptCode 不可变；不含明细，明细走 detail 端点） */
export interface JulyAiPromptUpdateVo011 {
  id: string;
  promptName: string;
  scene?: string;
  sortOrder?: number;
  remark?: string;
  status?: string;
}

/** 明细保存入参（insertDetail 带 promptId；updateDetail 带 id） */
export interface JulyAiPromptDetailSaveVo011 {
  /** 明细主键（updateDetail 必传） */
  id?: string;
  /** 所属提示词主键（insertDetail 必传） */
  promptId?: string;
  domainCode: string;
  contentMode?: string;
  content?: string;
  storageCode?: string;
  bucket?: string;
  variables?: string;
  sortOrder?: number;
  remark?: string;
  status?: string;
}

/** 渲染入参（${var} 替换；domainCode 留空用默认域） */
export interface JulyAiPromptRenderVo011 {
  promptCode: string;
  domainCode?: string;
  /** 变量值 */
  params?: Record<string, string>;
}

/** 页面保存提示词参数（service 内按有无 id 分流 insert/update） */
export interface SaveJulyAiPromptParams {
  id?: string;
  promptCode: string;
  promptName: string;
  scene?: string;
  sortOrder?: number;
  remark?: string;
  /** 仅新增时下发（后端 insert 含明细；update 不含） */
  details?: JulyAiPromptDetailItem[];
  /** 仅编辑时下发（后端 update 收 status） */
  status?: string;
}
