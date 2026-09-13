/** Mock 公共：响应信封 / 工具 / handler 类型 */
import type { MockEnvelope } from '@/types/view/mock';
import type { PageResult011 } from '@/types/system011';

export type { MockEnvelope };
export type Handler = (body: any) => Promise<MockEnvelope<any>>;

export function ok<T>(data: T): MockEnvelope<T> {
  return {
    statusCode: 200,
    message: 'success',
    errorMessage: '',
    timestamp: Date.now(),
    traceId: 'mock-' + Math.random().toString(36).slice(2, 12),
    data,
  };
}

export function fail(message: string, statusCode = 401): MockEnvelope<null> {
  return {
    statusCode,
    message: 'error',
    errorMessage: message,
    timestamp: Date.now(),
    traceId: 'mock-' + Math.random().toString(36).slice(2, 12),
    data: null,
  };
}

export function delay(ms = 500): Promise<void> {
  return new Promise((r) => setTimeout(r, ms + Math.random() * 300));
}

export function pageResult<T>(rows: T[], pageIndex: number, pageSize: number): PageResult011<T> {
  const total = rows.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const start = (pageIndex - 1) * pageSize;
  return { pageIndex, pageSize, total, totalPages, rows: rows.slice(start, start + pageSize) };
}
