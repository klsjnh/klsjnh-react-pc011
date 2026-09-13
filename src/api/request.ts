/**
 * 统一 API 请求封装（API 模式使用）
 * 对齐 docs/016.api-contract.md：POST + JSON body + 统一响应信封
 * URL 结构：{apiBaseUrl}/{模块}/{动作}，apiBaseUrl 默认 /api/v1
 */
import { appConfigStore, isMockMode } from '../config/appConfig';
import { authStore } from '../stores/authStore';
import { getMockResponse } from '../mock/system011';

/**
 * 鉴权头：登录后携带后端签发的 JWT（klsjnh 约定 Authorization: Bearer <token>）
 * 仅当 token 存在时附加，未登录/ Mock 态不影响。
 */
function authHeaders(): Record<string, string> {
  const token = authStore.getSnapshot().token;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

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
  // ===== Mock 模式：按真实 action 路径分发到统一 mock 后端 =====
  // mock 与 api 共用下方同一套信封解包逻辑，因此拿到的数据结构完全一致。
  if (isMockMode()) {
    const mockResp = getMockResponse(action, body);
    if (mockResp) {
      const env = await mockResp;
      if (env.statusCode !== 200) {
        const msg = env.errorMessage || env.message || `${action} 业务失败`;
        appConfigStore.setLastApiError(msg);
        throw new ApiError(msg, env.statusCode);
      }
      return env.data as T;
    }
    // 该 action 无 mock 数据：明确报错（避免静默打到真实后端）
    const msg = `Mock 模式未实现该接口：${action}`;
    appConfigStore.setLastApiError(msg);
    throw new ApiError(msg, 404);
  }

  const base = appConfigStore.getSnapshot().apiBaseUrl.replace(/\/$/, '');
  const url = `${base}${action}`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
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
