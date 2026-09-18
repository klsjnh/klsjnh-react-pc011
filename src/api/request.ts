/**
 * 统一 API 请求封装（API 模式使用）
 * 对齐 docs/013.api-contract.md：POST + JSON body + 统一响应信封
 * URL 结构：{apiBaseUrl}/{模块}/{动作}，apiBaseUrl 默认 /klsjnh/system011
 *
 * 【收口职责】
 * - 信封六键解析（红线 C5 / 016 §7）
 * - **401 处置**（红线 C5 / 016 §7）：清除本地会话 → 由路由守卫跳登录
 *   权威口径见 docs/013.api-contract.md §015：失效处置 = 清会话 → 跳登录，不做静默重试
 */
import { appConfigStore, isMockMode } from '@/config/appConfig';
import { authStore } from '@/stores/authStore';
import { toast } from '@/utils/toast';
import type { Response011 } from '@/types/api';

export type { Response011 };

/**
 * 鉴权头：登录后携带后端签发的 JWT（klsjnh 约定 Authorization: Bearer <token>）
 * 仅当 token 存在时附加，未登录/ Mock 态不影响。
 */
function authHeaders(): Record<string, string> {
  const token = authStore.getSnapshot().token;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export class ApiError extends Error {
  constructor(message: string, public statusCode?: number) {
    super(message);
  }
}

/**
 * 「凭据类」接口白名单：它们的 401 语义是**凭据错误**而非**会话失效**，不得触发全局登出。
 * 依据 docs/013.api-contract.md §015 关键口径：
 * 「登录失败返回 401（账号密码错误 / 账号禁用 / production 下免密被拒）——
 *   前端登录页须把 401 当『凭据错误』处理，而非『会话失效』」
 */
const CREDENTIAL_ACTIONS = [
  '/julyUser/v1/login',
  '/julyUser/v1/loginByUserName',
  '/julyUser/v1/logout',
];

/** 会话失效处置节流窗口：并发请求同时 401 时只清一次、只提示一次 */
let sessionExpiredAt = 0;
const SESSION_EXPIRED_THROTTLE_MS = 2000;

/**
 * 401 统一处置（红线 C5）：清除本地会话 → 由路由守卫跳登录。
 * 刻意**不直接操作 URL**：App 的守卫订阅 authStore（`useIsAuthenticated`），
 * token 清空后守卫自动 `Navigate to="/login"`，避免与守卫逻辑双写、产生竞态。
 */
function handleSessionExpired(): void {
  const now = Date.now();
  if (now - sessionExpiredAt < SESSION_EXPIRED_THROTTLE_MS) return;
  sessionExpiredAt = now;
  authStore.clearSession();
  toast.warning('登录状态已失效，请重新登录');
}

/** 统一失败出口：按状态码分流（401 → 会话失效处置）+ 记录最近错误 */
function buildError(action: string, message: string, statusCode?: number): ApiError {
  const isCredential = CREDENTIAL_ACTIONS.some((a) => action.startsWith(a));
  if (statusCode === 401 && !isCredential) {
    handleSessionExpired();
  }
  appConfigStore.setLastApiError(message);
  return new ApiError(message, statusCode);
}

async function request<T>(
  action: string,
  body?: object,
  timeoutMs = 8000,
  method: 'GET' | 'POST' = 'POST',
  baseOverride?: string,
): Promise<T> {
  // ===== Mock 模式：按真实 action 路径分发到统一 mock 后端 =====
  // mock 与 api 共用下方同一套信封解包逻辑，因此拿到的数据结构完全一致。
  if (isMockMode()) {
    let getMockResponse: typeof import('@/mock/system011').getMockResponse;
    try {
      const mod = await import('@/mock/system011');
      getMockResponse = mod.getMockResponse;
    } catch {
      throw buildError(action, `Mock 模式无法加载 mock 模块`, 500);
    }
    const mockResp = getMockResponse(action, body);
    if (mockResp) {
      const env = await mockResp;
      if (env.statusCode !== 200) {
        const msg = env.errorMessage || env.message || `${action} 业务失败`;
        throw buildError(action, msg, env.statusCode);
      }
      return env.data as T;
    }
    throw buildError(action, `Mock 模式未实现该接口：${action}`, 404);
  }

  const base = (baseOverride || appConfigStore.getSnapshot().apiBaseUrl).replace(/\/$/, '');
  let url = `${base}${action}`;
  // GET 查询：把 body 序列化为 query string（真实后端按 ?id=xxx 收参）
  if (method === 'GET' && body) {
    const qs = new URLSearchParams(body as Record<string, string>).toString();
    if (qs) url += (url.includes('?') ? '&' : '?') + qs;
  }
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const fetchInit: RequestInit = {
      method,
      headers: { ...authHeaders() },
      signal: controller.signal,
    };
    if (method === 'POST') {
      fetchInit.headers = { ...fetchInit.headers, 'Content-Type': 'application/json' };
      fetchInit.body = JSON.stringify(body ?? {});
    }
    const res = await fetch(url, fetchInit);
    // 后端错误响应同样是标准信封（401 由 GlobalAuthFilter 直接写出），优先取其 message
    let envelope: Response011<T> | null = null;
    try {
      envelope = (await res.json()) as Response011<T>;
    } catch {
      envelope = null;
    }
    const statusCode = envelope?.statusCode ?? res.status;
    if (!res.ok || (envelope && envelope.statusCode !== 200)) {
      const msg = envelope?.errorMessage || envelope?.message || `${action} 失败(${statusCode})`;
      throw buildError(action, msg, statusCode);
    }
    if (!envelope) {
      throw buildError(action, `${action} 响应解析失败：非 JSON 信封`, res.status);
    }
    return envelope.data;
  } catch (e) {
    if (e instanceof ApiError) throw e;
    const err = e as Error;
    const msg = err?.name === 'AbortError'
      ? `${action} 请求超时`
      : (err?.message || '网络错误');
    appConfigStore.setLastApiError(msg);
    throw new ApiError(msg);
  } finally {
    clearTimeout(timer);
  }
}

export const api = {
  /** POST 业务查询/操作 */
  post: <T>(action: string, body?: object, baseOverride?: string) => request<T>(action, body, 8000, 'POST', baseOverride),
  /** GET 业务查询（主键查、树查等无参/少参查询） */
  get: <T>(action: string, body?: object, baseOverride?: string) => request<T>(action, body, 8000, 'GET', baseOverride),
};

/**
 * API 模式下的静默写请求：本地先行更新（乐观更新），
 * 请求失败仅记录到 appConfigStore.lastApiError，不打断页面交互。
 * 返回 promise 以便调用方按序等待后端落库后再 reload。
 */
export function fireApi(action: string, body?: object) {
  return request(action, body).catch(() => { /* 错误已记录 */ });
}
