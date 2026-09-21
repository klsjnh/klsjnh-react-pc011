/**
 * AI 业务域类型（aiCenter · julyAiDomain）
 * 2026-09-21 对齐线上新契约（bundle 模型，11160 实测 17 端点）：
 *   域主表（树：parentId/children）+ 提示词明细（pkMt 挂域）+ saveWhole/getWithChildren 打包。
 * 明细子表 = 提示词本体（promptCode 全局唯一、contentMode inline/storage），
 * 类型见 aiPrompt/vo.ts（JulyAiDomainPromptVo011）。
 */

import type { JulyAiDomainPromptSaveVo011 } from '@/types/aiCenter/aiPrompt/vo';

/** 业务域条目（对应后端 JulyAiDomainVo011；树节点） */
export interface JulyAiDomainItem {
  id: string;
  /** 域编码（全局唯一，创建后不可修改） */
  domainCode: string;
  /** 域名称 */
  domainName: string;
  /** 上级域 id（根为空串） */
  parentId?: string;
  /** 排序（越小越靠前） */
  sortOrder?: number;
  /** 状态：0 停用 / 1 启用 */
  status: string;
  /** 备注 */
  remark?: string;
  /** 子域（selectTree / getWithChildren 返回；按排序） */
  children?: JulyAiDomainItem[];
  createBy?: string;
  updateBy?: string;
  createTime?: string;
  updateTime?: string;
}

/** 业务域分页查询入参（对应 JulyAiDomainQueryVo011） */
export interface JulyAiDomainQueryVo011 {
  pageIndex: number;
  pageSize: number;
  /** 编码/名称关键字 */
  keyword?: string;
  /** 上级域 id 过滤 */
  parentId?: string;
  /** 状态过滤（0/1） */
  status?: string;
}

/** 新增业务域入参（对应 JulyAiDomainInsertVo011；不收 status，默认启用） */
export interface JulyAiDomainInsertVo011 {
  domainCode: string;
  domainName: string;
  /** 上级域 id（根传空串） */
  parentId?: string;
  sortOrder?: number;
  remark?: string;
}

/** 修改业务域入参（对应 JulyAiDomainUpdateVo011；status/remark 留空保持） */
export interface JulyAiDomainUpdateVo011 {
  id: string;
  domainName: string;
  /** 移动挂载点（根传空串） */
  parentId?: string;
  sortOrder?: number;
  remark?: string;
  status?: string;
}

/** 页面保存参数（service 按有无 id 分流 insert/update） */
export interface SaveJulyAiDomainParams {
  id?: string;
  domainCode: string;
  domainName: string;
  /** 上级域 id（空串=顶级） */
  parentId?: string;
  sortOrder?: number;
  status?: string;
  remark?: string;
}

/** 域 + 提示词整存入参（对应 JulyAiDomainSaveWholeVo011；prompts 整存替换：旧子表逻辑删 + 新列表插入） */
export interface JulyAiDomainSaveWholeVo011 {
  /** 域主键（留空=新增；非空=修改） */
  id?: string;
  /** 域编码（仅新增时用，不可变） */
  domainCode?: string;
  domainName: string;
  parentId?: string;
  sortOrder?: number;
  remark?: string;
  status?: string;
  /** 提示词列表（整存替换） */
  prompts?: JulyAiDomainPromptSaveVo011[];
}
