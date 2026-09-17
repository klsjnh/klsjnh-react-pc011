/**
 * 低代码「运行时」CRUD —— **本地占位实现（PENDING-BACKEND）**
 *
 * 【为什么在这里】老项目运行时页打的是 `/klsjnh/runtime/{objectName}/*`
 * （见老项目 `services/july011/runtimeCrud.ts`），新后端**无此端点** ——
 * 后端 039 分三期，运行时动态 CRUD 属**三期**（⏳ 未实装，规划路径 `/runtime/<objectName>`）。
 * 为让「元数据 → 运行时页」可被演示，前端先落到内存占位。
 *
 * 【状态是内存态】刷新即重置。
 */
import type { PageResult011 } from '@/types/common';

const delay = (ms: number) => new Promise<void>((resolve) => { setTimeout(resolve, ms); });

/** 查询条件（与老项目 runtimeCrud 的 filters 结构一致） */
export interface RuntimeFilter {
  field: string;
  /** eq 精确匹配 / like 模糊匹配 */
  op: string;
  value: unknown;
}

/** 每个对象的数据行（内存态） */
const storeMap = new Map<string, Record<string, unknown>[]>();
let seq = 100;

/** 首次访问时按对象名播一份种子数据 */
function rowsOf(objectName: string): Record<string, unknown>[] {
  let rows = storeMap.get(objectName);
  if (!rows) {
    rows = [];
    for (let i = 1; i <= 23; i += 1) {
      rows.push({
        id: `${objectName}-${1000 + i}`,
        code: `${objectName}_${1000 + i}`,
        name: `示例数据 ${i}`,
        status: i % 3 === 0 ? '0' : '1',
        create_by: 'admin',
        update_by: 'admin',
        create_time: '2026-09-15 10:00:00',
        update_time: '2026-09-15 10:00:00',
        dr: '0',
      });
    }
    storeMap.set(objectName, rows);
  }
  return rows;
}

/** 单行条件匹配（eq 走字符串相等，like 走忽略大小写的包含） */
function matchFilter(row: Record<string, unknown>, f: RuntimeFilter): boolean {
  const raw = row[f.field];
  if (f.value == null || String(f.value).trim() === '') return true;
  if (f.op === 'eq') return String(raw ?? '') === String(f.value);
  return String(raw ?? '').toLowerCase().includes(String(f.value).toLowerCase());
}

/** 分页查询（占位） */
export async function pendingRuntimePage(
  objectName: string,
  query: { pageIndex?: number; pageSize?: number; keyword?: string; filters?: RuntimeFilter[] } = {},
): Promise<PageResult011<Record<string, unknown>>> {
  await delay(300);
  const all = rowsOf(objectName);
  const pageIndex = query.pageIndex || 1;
  const pageSize = query.pageSize || 10;

  let filtered = all;
  const filters = query.filters || [];
  if (filters.length) {
    filtered = filtered.filter((r) => filters.every((f) => matchFilter(r, f)));
  }
  const kw = (query.keyword || '').trim().toLowerCase();
  if (kw) {
    filtered = filtered.filter((r) => Object.values(r).some((v) => String(v ?? '').toLowerCase().includes(kw)));
  }

  const rows = filtered.slice((pageIndex - 1) * pageSize, pageIndex * pageSize);
  // 显式标注返回类型，不靠 as 断言掩盖字段缺失（PageResult011 必填五项）
  const result: PageResult011<Record<string, unknown>> = {
    rows,
    total: filtered.length,
    pageIndex,
    pageSize,
    totalPages: Math.max(1, Math.ceil(filtered.length / pageSize)),
  };
  return result;
}

/** 新增（占位） */
export async function pendingRuntimeInsert(objectName: string, data: Record<string, unknown>): Promise<string> {
  await delay(300);
  const id = `${objectName}-${seq++}`;
  rowsOf(objectName).unshift({
    ...data,
    id,
    create_time: '2026-09-17 09:00:00',
    update_time: '2026-09-17 09:00:00',
    dr: '0',
  });
  return id;
}

/** 修改（占位） */
export async function pendingRuntimeUpdate(objectName: string, data: Record<string, unknown>): Promise<void> {
  await delay(300);
  const rows = rowsOf(objectName);
  const i = rows.findIndex((r) => String(r.id) === String(data.id));
  if (i < 0) throw new Error(`record not found, id=${data.id}`);
  rows[i] = { ...rows[i], ...data, update_time: '2026-09-17 09:00:00' };
}

/** 逻辑删除（占位） */
export async function pendingRuntimeDelete(objectName: string, id: string): Promise<void> {
  await delay(300);
  const rows = rowsOf(objectName);
  const i = rows.findIndex((r) => String(r.id) === String(id));
  if (i < 0) throw new Error(`record not found, id=${id}`);
  rows.splice(i, 1);
}
