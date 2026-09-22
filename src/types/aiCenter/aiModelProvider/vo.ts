/** AI 模型供应商条目（对应后端 AiModelProviderVo011） */
export interface AiModelProviderItem {
  id: string;
  /** 供应商编码（唯一，不可变） */
  providerCode: string;
  /** 供应商名称 */
  providerName: string;
  /** 基础地址（如 https://api.openai.com/v1） */
  baseUrl: string;
  /** 模型列表（逗号分隔或 JSON 字符串） */
  models?: string;
  /** 排序 */
  sortOrder?: number;
  /** 状态：0 停用 / 1 启用 */
  status: string;
  /** 备注 */
  remark?: string;
  createTime?: string | null;
  updateTime?: string | null;
}

/** AI 模型供应商下的 API 条目（对应后端 AiModelProviderApiVo011） */
export interface AiModelProviderApiItem {
  id: string;
  /** 所属供应商编码 */
  providerCode: string;
  /** API 编码（唯一） */
  apiCode: string;
  /** API 名称 */
  apiName: string;
  /** API Key */
  apiKey: string;
  /** 排序 */
  sortOrder?: number;
  /** 状态：0 停用 / 1 启用 */
  status: string;
  /** 备注 */
  remark?: string;
  createTime?: string | null;
  updateTime?: string | null;
}

/** 供应商分页查询入参 */
export interface AiModelProviderQueryVo011 {
  pageIndex: number;
  pageSize: number;
  keyword?: string;
  status?: string;
}

/** 供应商新增入参 */
export interface AiModelProviderInsertVo011 {
  providerCode: string;
  providerName: string;
  baseUrl: string;
  models?: string;
  sortOrder?: number;
  remark?: string;
}

/** 供应商修改入参（providerCode 不可变） */
export interface AiModelProviderUpdateVo011 {
  id: string;
  providerName: string;
  baseUrl: string;
  models?: string;
  sortOrder?: number;
  status?: string;
  remark?: string;
}

/** 供应商保存入参（有 id = 编辑） */
export interface SaveAiModelProviderParams {
  id?: string;
  providerCode: string;
  providerName: string;
  baseUrl: string;
  models?: string;
  sortOrder?: number;
  status?: string;
  remark?: string;
}

/** API 新增入参 */
export interface AiModelProviderApiInsertVo011 {
  providerCode: string;
  apiCode: string;
  apiName: string;
  apiKey: string;
  sortOrder?: number;
  remark?: string;
}

/** API 修改入参 */
export interface AiModelProviderApiUpdateVo011 {
  id: string;
  apiName: string;
  apiKey: string;
  sortOrder?: number;
  status?: string;
  remark?: string;
}

/** API 保存入参（有 id = 编辑；编辑时 providerCode/apiCode 不可变） */
export interface SaveAiModelProviderApiParams {
  id?: string;
  providerCode: string;
  apiCode: string;
  apiName: string;
  apiKey: string;
  sortOrder?: number;
  status?: string;
  remark?: string;
}


/** API 查询入参（按供应商编码） */
export interface AiModelProviderApiQueryVo011 {
  providerCode: string;
  status?: string;
}

/** 测试连接出参：后端仅回 success/message */
export interface AiModelProviderTestResultVo011 {
  success?: boolean;
  message?: string;
  models?: string[];
}

export type { PageResult011, IdVo011 } from '@/types/common';
