/**
 * 存储中心模块 API 根路径与真实基址推导。
 * 默认数据模式走 vite proxy（/klsjnh 转发），baseOverride 固定为 /klsjnh/storagecenter，
 * 与 system011 / dataservice011 同构（详见 services/dataservice011/julyDatasourceService.ts）。
 */
import { appConfigStore } from '@/config/appConfig';

/** storagecenter 模块前缀（请求 URL = STORAGECENTER_BASE + action） */
export const STORAGECENTER_BASE = '/klsjnh/storagecenter';

/**
 * 上传 / 下载走 multipart / blob，绕过 api.post 的 JSON 信封封装，需拼出完整基址。
 * 把 appConfig 里的 apiBaseUrl（默认 /klsjnh/system011）末段替换为 storagecenter，兼容完整 URL 配置。
 */
export function resolveStorageBase(): string {
  const base = appConfigStore.getSnapshot().apiBaseUrl || '/klsjnh/system011';
  return base.replace(/\/system011$/, '/storagecenter');
}
