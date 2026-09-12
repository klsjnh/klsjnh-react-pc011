/**
 * 统一 API 请求封装（API 模式使用）
 * 对齐 docs/016.api-contract.md：POST + JSON body + 统一响应信封
 * URL 结构：{apiBaseUrl}/{模块}/{动作}，apiBaseUrl 默认 /api/v1
 */
import { appConfigStore } from '../config/appConfig';

/** 统一响应信封（六字段固定） */
export interface ApiResponse<T> {
  statusCode: number;
  message: string;
  errorMessage: string;
  timestamp: number;
  traceId: string;
  data: T;
}

export class ApiError extends Error {
  constructor(message: string, public statusCode?: number) {
    super(message);
  }
}

async function request<T>(action: string, body?: object, timeoutMs = 8000): Promise<T> {
  const base = appConfigStore.getSnapshot().apiBaseUrl.replace(/\/$/, '');
  const url = `${base}${action}`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body ?? {}),
      signal: controller.signal,
    });
    if (!res.ok) throw new ApiError(`${action} 失败(${res.status})`, res.status);
    const envelope = (await res.json()) as ApiResponse<T>;
    if (envelope.statusCode !== 200) {
      throw new ApiError(envelope.errorMessage || envelope.message || `${action} 业务失败`, envelope.statusCode);
    }
    return envelope.data;
  } catch (e: any) {
    const msg = e?.name === 'AbortError'
      ? `${action} 请求超时`
      : (e?.message || '网络错误');
    appConfigStore.setLastApiError(msg);
    throw e instanceof ApiError ? e : new ApiError(msg, e?.statusCode);
  } finally {
    clearTimeout(timer);
  }
}

export const api = {
  /** 业务查询/操作：POST {apiBaseUrl}/{模块}/{动作}，成功返回信封 data */
  post: <T>(action: string, body?: object) => request<T>(action, body),
};

/**
 * API 模式下的静默写请求：本地先行更新（乐观更新），
 * 请求失败仅记录到 appConfigStore.lastApiError，不打断页面交互
 */
export function fireApi(action: string, body?: object) {
  request(action, body).catch(() => { /* 错误已记录 */ });
}
