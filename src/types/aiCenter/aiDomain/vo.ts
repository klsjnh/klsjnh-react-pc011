/**
 * AI 业务域类型（aiCenter · julyAiDomain）
 * 2026-09-20 前端先行：后端域实体端点未上线（swagger 178 路径已核实），
 * service/mock 按约定路径先行，后端补齐后零改动生效。
 * 域与提示词明细通过 domainCode 关联（明细的 domainCode 即域编码）。
 */

/** 业务域条目（域实体主表） */
export interface JulyAiDomainItem {
  id: string;
  /** 业务域编码（全局唯一；提示词明细的 domainCode 指向它） */
  domainCode: string;
  /** 业务域名称 */
  domainName: string;
  /** 排序 */
  sortOrder?: number;
  /** 状态：0 停用 / 1 启用 */
  status: string;
  /** 备注 */
  remark?: string;
}

/** 业务域分页查询入参 */
export interface JulyAiDomainQueryVo011 {
  pageIndex: number;
  pageSize: number;
  keyword?: string;
  status?: string;
}

/** 新增业务域入参 */
export interface JulyAiDomainInsertVo011 {
  domainCode: string;
  domainName: string;
  sortOrder?: number;
  status?: string;
  remark?: string;
}

/** 修改业务域入参（domainCode 可改——改名需同步明细的 domainCode，service 内级联） */
export interface JulyAiDomainUpdateVo011 {
  id: string;
  domainCode: string;
  domainName: string;
  sortOrder?: number;
  status?: string;
  remark?: string;
}

/** 页面保存参数（service 按有无 id 分流 insert/update） */
export interface SaveJulyAiDomainParams {
  id?: string;
  domainCode: string;
  domainName: string;
  sortOrder?: number;
  status?: string;
  remark?: string;
}

/** 域下的一条明细引用（删域 / 改名级联用：定位到具体明细行） */
export interface JulyAiDomainDetailRef {
  /** 明细主键 */
  detailId: string;
  /** 所属提示词主键 */
  promptId: string;
}
