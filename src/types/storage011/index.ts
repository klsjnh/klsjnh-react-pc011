/**
 * 存储中心类型契约（storage011 模块）
 * 字段以后端 VO / Java 源码为准：
 *   java17-web011 的 vo/*.java + java17-application011 的 *UseCase.java（2026-09-17 核对）
 * 关键差异（易错点）：
 *   1) provider 取值是 local011/minio011/cos011/tos011/oss011/s3011，不是 S3/LOCAL
 *   2) secure 是 boolean（不是 '0'/'1' 字符串）
 *   3) 列表查询字段是 keyword（不是 storageCode/storageName）
 *   4) bucket/object 的 selectList|selectListByPage 返回的是 **名称/键字符串数组**，
 *      size/lastModified/contentType 必须另调 object/stat 才有
 */
import type { BaseVo011 } from '@/types/common';

/** 存储适配器类型（后端 JulyStorageSaveVo011.provider 注释里的取值） */
export type StorageProvider = 'local011' | 'minio011' | 'cos011' | 'tos011' | 'oss011' | 's3011';

/** 存储实例（存储配置）：对接 /klsjnh/storage011/storage */
export interface JulyStorage extends BaseVo011 {
  /** 实例编码（唯一，新增后不可改） */
  storageCode: string;
  /** 实例名称 */
  storageName: string;
  /** 排序（越小越靠前） */
  sortOrder?: number;
  /** 适配器类型：local011 / minio011 / cos011 / tos011 / oss011 / s3011 */
  provider?: StorageProvider | string;
  /** 本地根目录（local011 必填） */
  basePath?: string;
  /** Endpoint（S3 系必填），如 http://192.168.1.88:12300 */
  endpoint?: string;
  accessKey?: string;
  /** Secret Key：出参不回显；修改时留空表示保持原值 */
  secretKey?: string;
  /** 是否 HTTPS（boolean） */
  secure?: boolean;
  /** 默认桶 */
  defaultBucket?: string;
  /** 预签名 URL 有效期（秒） */
  presignExpirySeconds?: number;
  remark?: string;
  /** 状态：0 停用 / 1 启用 */
  status?: string;
}

/** 存储实例查询（JulyStorageQueryVo011） */
export interface JulyStorageQuery {
  pageIndex?: number;
  pageSize?: number;
  /** 关键字（编码 / 名称 模糊） */
  keyword?: string;
  provider?: string;
  status?: string;
}

/** 实例连接测试入参（JulyStorageConnectVo011：传 id 测已保存，或传草稿字段） */
export interface JulyStorageConnect {
  id?: string;
  provider?: string;
  basePath?: string;
  endpoint?: string;
  accessKey?: string;
  secretKey?: string;
  secure?: boolean;
  defaultBucket?: string;
  presignExpirySeconds?: number;
}

/** 连接测试结果（StorageProbeResult） */
export interface StorageTestResult {
  success: boolean;
  message?: string;
}

/** 存储桶行：后端 bucket/selectList|selectListByPage 只返回桶名字符串，属主实例由请求参数决定 */
export interface StorageBucket {
  bucketName: string;
  storageCode?: string;
}

/** 存储桶查询（StorageBucketQueryVo011） */
export interface StorageBucketQuery {
  pageIndex?: number;
  pageSize?: number;
  storageCode?: string;
  keyword?: string;
}

/**
 * 对象行：后端 object/selectList|selectListByPage 只返回对象键字符串，
 * size/lastModified/contentType 需按需调 object/stat 补（见 storageObjectService.statObject）。
 */
export interface StorageObject {
  objectName: string;
  bucketName?: string;
  storageCode?: string;
  size?: number;
  lastModified?: string;
  contentType?: string;
  /** 仅 mock / 在线文本读写时承载内容 */
  content?: string;
}

/** 对象查询（StorageObjectQueryVo011） */
export interface StorageObjectQuery {
  pageIndex?: number;
  pageSize?: number;
  storageCode?: string;
  bucketName?: string;
  prefix?: string;
  /** 是否递归（后端当前适配器恒递归） */
  recursive?: boolean;
}

/** 对象元数据（object/stat → ObjectStat，走 GET + query） */
export interface ObjectStat {
  bucket: string;
  key: string;
  size: number;
  lastModified?: string;
  contentType?: string;
}

/** 在线编辑读取结果（object/readText → StorageTextContent） */
export interface StorageTextContent {
  storageCode?: string;
  bucketName?: string;
  objectName: string;
  size?: number;
  content: string;
  editorKind?: string;
  contentType?: string;
}
