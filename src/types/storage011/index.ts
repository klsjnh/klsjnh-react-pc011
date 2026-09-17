/**
 * 存储中心类型契约（storagecenter 模块）
 * 字段以后端 VO / Java 源码 + 实时 OpenAPI 为准（2026-09-17 复核）。
 * 关键差异（易错点）：
 *   1) provider 取值是 local011/minio011/cos011/tos011/oss011/s3011，不是 S3/LOCAL
 *   2) secure 是 boolean（不是 '0'/'1' 字符串）
 *   3) 列表查询字段是 keyword（不是 storageCode/storageName）
 *   4) 桶列表回 `BucketInfo{bucketName, creationDate}` —— **对象数组**，不是桶名字符串数组
 *      （曾按 string[] 解析，导致整行 bucketName 变成对象 → React 抛「Objects are not valid as a React child」）
 *   5) 对象分页回 `PageResult011<ObjectStat>` = `{bucket, key, size, lastModified, contentType}`
 *      （size/lastModified/contentType 已随列表返回，**无需再逐个 stat 补齐**）
 *   6) 对象列表（不分页的 selectObjectList）仍回 `List<String>`，只有键
 */
import type { BaseVo011 } from '@/types/common';

/** 存储适配器类型（后端 JulyStorageSaveVo011.provider 注释里的取值） */
export type StorageProvider = 'local011' | 'minio011' | 'cos011' | 'tos011' | 'oss011' | 's3011';

/** 存储实例（存储配置）：对接 /klsjnh/storagecenter/julyStorage/v1 */
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

/**
 * 连接测试结果（StorageProbeVo011）。
 * testConnection / testBucketConnection 共用：除连通与否外还回桶数量与接入点。
 */
export interface StorageTestResult {
  success: boolean;
  /** 桶数量（探测时统计到的桶个数） */
  bucketCount?: number;
  /** 本地根目录（local011） */
  basePath?: string;
  /** Endpoint（S3/MinIO） */
  endpoint?: string;
  /** 说明（ok / 失败原因） */
  message?: string;
}

/** 桶信息（BucketInfo）：桶列表 / 分页接口每行的真实形状 */
export interface BucketInfo {
  bucketName: string;
  /** 创建时间：LocalDateTime 序列化（如 2026-09-15T20:48:36.1933758，展示前需归一化） */
  creationDate?: string;
}

/** 桶是否存在（StorageBucketExists，GET getBucket 出参；不存在时后端 404） */
export interface StorageBucketExists {
  bucketName: string;
  exists: boolean;
}

/** 存储桶行：后端回 BucketInfo（含创建时间），归属实例由请求参数决定并回填 */
export interface StorageBucket {
  bucketName: string;
  /** 创建时间（归一化后展示） */
  creationDate?: string;
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
 * 对象行：对齐后端 ObjectStat（分页接口已带 size/lastModified/contentType）。
 * objectName ← ObjectStat.key，bucketName ← ObjectStat.bucket，storageCode 由请求参数回填。
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
