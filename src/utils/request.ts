/**
 * 统一 API 请求封装
 * 对齐 docs/016.api-contract.md 规范
 */

export interface ApiResponse<T> {
  statusCode: number;
  message: string;
  errorMessage: string;
  timestamp: number;
  traceId: string;
  data: T;
}

const BASE = 'http://localhost:11171';

export async function request<T>(
  path: string,
  body?: Record<string, unknown>,
): Promise<ApiResponse<T>> {
  const response = await fetch(`${BASE}/api/v1${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json; charset=UTF-8' },
    body: body ? JSON.stringify(body) : undefined,
  });
  return response.json();
}

/** 标准 CRUD 方法 */
export const api = {
  selectOne: (path: string, body: Record<string, unknown>) => request(`${path}/selectOne`, body),
  selectList: (path: string, body?: Record<string, unknown>) => request(`${path}/selectList`, body),
  selectListByPage: (path: string, body?: Record<string, unknown>) => request(`${path}/selectListByPage`, body),
  insert: (path: string, body: Record<string, unknown>) => request(`${path}/insert`, body),
  update: (path: string, body: Record<string, unknown>) => request(`${path}/update`, body),
  logicDelete: (path: string, body: Record<string, unknown>) => request(`${path}/logicDelete`, body),
};
