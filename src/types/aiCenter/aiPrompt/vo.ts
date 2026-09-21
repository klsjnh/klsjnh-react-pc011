/**
 * AI 提示词类型（aiCenter · julyAiDomainPrompt）
 * 2026-09-21 对齐线上新契约：提示词不再是独立资源，而是业务域的**明细子表**
 * （pkMt 挂域 id，insertDetail/updateDetail/...，详见 021 评估文档）。
 * 旧 julyAiPrompt 主表+明细双层模型废弃 —— 提示词 = 明细行本体。
 */

/** 提示词条目（对应后端 JulyAiDomainPromptVo011 —— 域明细子表行） */
export interface JulyAiDomainPromptVo011 {
  id: string;
  /** 所属业务域 id（外键，insert required） */
  pkMt: string;
  /** 提示词编码（全局唯一，创建后不可修改） */
  promptCode: string;
  /** 提示词名称 */
  promptName: string;
  /** 适用能力（inference / image / tts，仅分类） */
  scene?: string;
  /** 内容模式（inline / storage，默认 inline） */
  contentMode?: string;
  /** 存储实例（storage 模式；缺省=默认实例） */
  storageCode?: string;
  /** 桶（storage 模式；约定 ai-prompt） */
  bucket?: string;
  /** 对象 key（storage 模式，后端生成） */
  objectKey?: string;
  /** 内容 hash（storage 模式） */
  contentHash?: string;
  /** 内容字节数 */
  contentSize?: number;
  /** 变量声明（可空；渲染时按 ${var} 替换） */
  variables?: string;
  sortOrder?: number;
  /** 状态：0 停用 / 1 启用 */
  status?: string;
  remark?: string;
  createBy?: string;
  updateBy?: string;
  createTime?: string;
  updateTime?: string;
}

/** 提示词分页查询入参（对应 JulyAiDomainPromptQueryVo011；selectDetailListByPage 收） */
export interface JulyAiDomainPromptQueryVo011 {
  pageIndex: number;
  pageSize: number;
  /** 编码/名称关键字 */
  keyword?: string;
  /** 业务域 id 过滤 */
  pkMt?: string;
  /** 适用能力过滤 */
  scene?: string;
  /** 状态过滤（0/1） */
  status?: string;
}

/** 新增提示词入参（对应 JulyAiDomainPromptInsertVo011） */
export interface JulyAiDomainPromptInsertVo011 {
  pkMt: string;
  promptCode: string;
  promptName: string;
  scene?: string;
  contentMode?: string;
  /** 正文（inline 直接入库；storage 时作为落对象存储的内容） */
  content?: string;
  storageCode?: string;
  bucket?: string;
  variables?: string;
  sortOrder?: number;
  remark?: string;
  status?: string;
}

/** 修改提示词入参（对应 JulyAiDomainPromptUpdateVo011；promptCode 不可变） */
export interface JulyAiDomainPromptUpdateVo011 {
  id: string;
  promptName: string;
  scene?: string;
  contentMode?: string;
  content?: string;
  storageCode?: string;
  bucket?: string;
  variables?: string;
  sortOrder?: number;
  remark?: string;
  status?: string;
}

/** 提示词保存入参（service 按有无 id 分流 insertDetail/updateDetail） */
export interface JulyAiDomainPromptSaveVo011 {
  /** 提示词主键（update 必传） */
  id?: string;
  /** 所属业务域 id（insert 必传） */
  pkMt?: string;
  promptCode?: string;
  promptName: string;
  scene?: string;
  contentMode?: string;
  content?: string;
  storageCode?: string;
  bucket?: string;
  variables?: string;
  sortOrder?: number;
  remark?: string;
  status?: string;
}

/** 渲染入参（对应 JulyAiDomainPromptRenderVo011；${var} 替换） */
export interface JulyAiDomainPromptRenderVo011 {
  promptCode: string;
  /** 变量值 */
  params?: Record<string, string>;
}
