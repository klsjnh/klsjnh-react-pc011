/** 数据源 management UI types */

/**
 * 数据源连接状态。
 */
export type DataSourceStatus = 'connected' | 'disconnected';

/**
 * 数据源类型。
 */
export type DataSourceType = 'MySQL' | 'Redis' | 'PostgreSQL' | 'MongoDB';

/**
 * 数据源条目（对应后端 julyDatasource 记录）。
 */
export interface DataSourceItem {
  id: number;
  name: string;
  type: DataSourceType | string;
  host: string;
  database: string;
  status: DataSourceStatus | string;
  latency: string;
}

/** 数据源分页查询入参 */
export interface JulyDatasourceQueryVo011 {
  pageIndex: number;
  pageSize: number;
  name?: string;
}

/** 数据源新增入参 */
export interface JulyDatasourceInsertVo011 {
  name: string;
  type: string;
  host: string;
  database: string;
}

/** 数据源修改入参 */
export interface JulyDatasourceUpdateVo011 {
  id: number;
  name: string;
  type: string;
  host: string;
  database: string;
  status: string;
}

/** 数据源保存入参（有 id = 编辑） */
export interface SaveDatasourceParams {
  id?: number;
  name: string;
  type: string;
  host: string;
  database: string;
  status?: string;
}

/** 数据库分页返回（对齐后端 pageResult 信封） */
export interface PageResult011<T> {
  rows: T[];
  total: number;
  totalPages: number;
}

/** 主键返回 */
export interface IdVo011 {
  id: number;
}