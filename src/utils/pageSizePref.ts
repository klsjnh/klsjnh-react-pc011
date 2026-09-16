/**
 * 列表页「每页条数」用户偏好（跨页通用）
 *
 * 为什么单独抽：表格每页条数是**用户偏好**，不该每次进页面被重置回默认值。
 * 用法（各列表页 store）：
 *   1. 取初值：`const DEFAULT_QUERY = { pageIndex: 1, pageSize: loadPageSize('julyConfig') }`
 *   2. 落盘：`persistPageSize(base, 'julyConfig')`（订阅 query.pageSize 变化）
 *
 * ⚠️ 配套约定：**页面挂载时只重置 pageIndex，不要再传 pageSize**。
 * 形如 `fetchXxxPage({ pageIndex: 1, pageSize: 10 })` 会把用户偏好覆盖回 10。
 */
import type { StoreController } from '@/types/store';

/** 每页条数可选项（表格 pageSizeOptions 与本工具同源） */
export const PAGE_SIZE_OPTIONS = [10, 50, 100];

/** 默认每页条数 */
export const DEFAULT_PAGE_SIZE = PAGE_SIZE_OPTIONS[0];

/** store 需具备的结构：query.pageSize */
type HasPageSize = { query?: { pageSize?: number } };

const storageKey = (scope: string) => `pc011-${scope}-pageSize`;

/** 读取某列表页的每页条数偏好；非法值或存储不可用时回退默认值 */
export function loadPageSize(scope: string): number {
  try {
    const raw = Number(localStorage.getItem(storageKey(scope)));
    if (PAGE_SIZE_OPTIONS.includes(raw)) return raw;
  } catch { /* 存储不可用 → 用默认值 */ }
  return DEFAULT_PAGE_SIZE;
}

/** 订阅 store：query.pageSize 变化时写入 localStorage（store 其余状态不落盘） */
export function persistPageSize<T extends HasPageSize>(
  store: Pick<StoreController<T>, 'getSnapshot' | 'subscribe'>,
  scope: string,
): void {
  const key = storageKey(scope);
  let last = store.getSnapshot()?.query?.pageSize;
  store.subscribe((state) => {
    const size = state?.query?.pageSize;
    if (typeof size === 'number' && size > 0 && size !== last) {
      last = size;
      try { localStorage.setItem(key, String(size)); } catch { /* 仅内存生效 */ }
    }
  });
}
