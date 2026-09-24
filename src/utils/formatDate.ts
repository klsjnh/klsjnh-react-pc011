/**
 * 日期时间工具（016 §11：展示层格式化的唯一入口）
 *
 * 口径（013 契约）：
 *  - 契约格式 = `yyyy-MM-dd HH:mm:ss`（空格分隔，非 ISO `T`）。
 *  - 本工具只做**展示层格式化**（截断 / 补全 / 本地化），**不做格式修复**（017 §C4）：
 *    若后端返回带 `T` 的 ISO，属后端契约缺陷，应记入当日日志并推动后端修
 *    （Jackson 对 LocalDateTime 配 @JsonFormat），前端不靠 `replace('T',' ')` 掩盖。
 *    `formatDateTime` 里的 `T`→空格仅为历史后端数据的**展示兜底**，不作为长期机制。
 */

/** 补零到两位 */
function pad2(n: number): string {
  return String(n).padStart(2, '0');
}

/** 接受 string / number(毫秒时间戳) / Date，归一为「字符串(契约格式) | Date | null」 */
function toDate(v: string | number | Date | null | undefined): string | Date | null {
  if (v == null || v === '') return null;
  if (v instanceof Date) return Number.isNaN(v.getTime()) ? null : v;
  if (typeof v === 'number') { const d = new Date(v); return Number.isNaN(d.getTime()) ? null : d; }
  // 字符串：优先原样（契约格式/ISO），截断小数秒
  const t = v.replace('T', ' ');
  return t.length > 19 ? t.slice(0, 19) : t;
}

/**
 * 归一化任意后端时间串为 `YYYY-MM-DD HH:mm:ss`。
 *
 * 接受：契约格式 `yyyy-MM-dd HH:mm:ss`（原样）、ISO `T` + 可选小数秒（截断到秒）、
 * 毫秒时间戳（number）、Date；空值回落 `-`。
 * 此为**展示兜底**，不改变后端契约事实（017 §C4）。
 */
export function formatDateTime(v?: string | number | Date | null): string {
  const r = toDate(v);
  if (r == null) return '-';
  return typeof r === 'string' ? r : nowStamp(r);
}

/** 同上，但空值回落到「空串」而非 `-`（用于拼 CSV 等不想出现占位符的场景） */
export function formatDateTimeOrEmpty(v?: string | number | Date | null): string {
  const r = toDate(v);
  if (r == null) return '';
  return typeof r === 'string' ? r : nowStamp(r);
}

/** 仅日期 `YYYY-MM-DD` */
export function formatDate(v?: string | number | Date | null): string {
  const r = toDate(v);
  if (r == null) return '-';
  const s = typeof r === 'string' ? r : nowStamp(r);
  return s.slice(0, 10);
}

/**
 * 当前时间戳，格式化为契约口径 `YYYY-MM-DD HH:mm:ss`（本地时区）。
 * mock 后端构造 createTime / updateTime 用；避免各 mock 重复 `toISOString().slice(0,19)`。
 */
export function nowStamp(d: Date = new Date()): string {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())} ${pad2(d.getHours())}:${pad2(d.getMinutes())}:${pad2(d.getSeconds())}`;
}
