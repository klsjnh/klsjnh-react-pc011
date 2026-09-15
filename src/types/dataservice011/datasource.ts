/**
 * 数据源 management UI types（dataservice011 · julyDatasource）
 * 字段严格对齐后端 JulyDatasourceController：
 * 出参无 password（后端类型层剔除了该字段，口令永不出站）。
 */

/**
 * 数据库类型（后端 dbType 枚举值：mysql/oracle/sqlserver/postgresql）。
 */
export type DataSourceDbType = 'mysql' | 'oracle' | 'sqlserver' | 'postgresql';

/** 数据库类型选项（表单下拉用） */
export const DB_TYPE_OPTIONS: { value: DataSourceDbType; label: string }[] = [
  { value: 'mysql', label: 'MySQL' },
  { value: 'oracle', label: 'Oracle' },
  { value: 'sqlserver', label: 'SQL Server' },
  { value: 'postgresql', label: 'PostgreSQL' },
];

/** 状态：0 停用 / 1 启用 */
export type DataSourceStatus = '0' | '1';

/**
 * 数据源条目（对应后端 JulyDatasourceVo011，不含 password）。
 */
export interface DataSourceItem {
  id: string;
  /** 数据源编码（唯一，不可变） */
  dsCode: string;
  /** 数据源名称 */
  dsName: string;
  /** 数据库类型 */
  dbType: DataSourceDbType | string;
  /** JDBC URL */
  jdbcUrl: string;
  /** 库名或 Schema */
  schemaName?: string;
  /** 用户名 */
  username?: string;
  /** 驱动类名（为空按 dbType 取默认值） */
  driverClass?: string;
  /** 连接池配置 JSON（本期预留） */
  poolConfig?: string;
  /** 备注 */
  remark?: string;
  /** 状态：0 停用 / 1 启用 */
  status: string;
  createBy?: string | null;
  updateBy?: string | null;
  createTime?: string | null;
  updateTime?: string | null;
}

/** 数据源分页查询入参 */
export interface JulyDatasourceQueryVo011 {
  pageIndex: number;
  pageSize: number;
  /** 编码 / 名称 / JDBC URL 关键字（模糊） */
  keyword?: string;
  /** 状态过滤：0 停用 / 1 启用；留空为全部 */
  status?: string;
}

/** 数据源新增入参 */
export interface JulyDatasourceInsertVo011 {
  dsCode: string;
  dsName: string;
  dbType: DataSourceDbType | string;
  jdbcUrl: string;
  schemaName?: string;
  username?: string;
  password?: string;
  driverClass?: string;
  remark?: string;
}

/** 数据源修改入参（dsCode 不可变；password 留空保持原值） */
export interface JulyDatasourceUpdateVo011 {
  id: string;
  dsName: string;
  dbType: DataSourceDbType | string;
  jdbcUrl: string;
  schemaName?: string;
  username?: string;
  password?: string;
  driverClass?: string;
  remark?: string;
}

/** 数据源保存入参（有 id = 编辑） */
export interface SaveDatasourceParams {
  id?: string;
  dsCode: string;
  dsName: string;
  dbType: DataSourceDbType | string;
  jdbcUrl: string;
  schemaName?: string;
  username?: string;
  password?: string;
  driverClass?: string;
  remark?: string;
}

/** 测试连接入参（不传 id 为草稿态测试；传 id 为重测已保存数据源） */
export interface JulyDatasourceTestVo011 {
  id?: string;
  dsCode?: string;
  dbType?: DataSourceDbType | string;
  jdbcUrl?: string;
  username?: string;
  password?: string;
  driverClass?: string;
}

/** 测试连接出参（后端恒 200，连通与否看 success） */
export interface JulyDatasourceTestResultVo011 {
  success: boolean;
  message?: string;
  databaseProduct?: string | null;
  databaseVersion?: string | null;
}

/** 分页返回（复用跨模块公共分页信封） */
export type { PageResult011, IdVo011 } from '@/types/common';