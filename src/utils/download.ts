/**
 * 浏览器文件下载工具（**纯前端**：只负责「把内容存成文件」，不调任何接口）。
 *
 * 为什么抽出来：导出功能原先在 4 处各写一遍
 * `new Blob → createObjectURL → createElement('a') → click → revokeObjectURL`，
 * 其中「revoke 时机」「<a> 是否要挂进文档」两处最容易写错（见下方注释），复制越多越容易踩。
 *
 * 用法：
 *   downloadText(content, 'julyDictionary.csv', 'csv')   // 接口返回的是文本内容
 *   downloadBlob(new Blob([...]), 'julyUser.json')       // 自己已经拼好 Blob
 *
 * 约定：本文件是**通用**工具，不得 import service / store / 业务类型。
 * 业务相关的序列化（如 system011 的 metaInfo+rows → csv）放 `@/utils/system011/exportFile`。
 */

/** 常见导出格式 → MIME（带 charset，中文本地打开不乱码） */
const MIME_BY_FORMAT: Record<string, string> = {
  json: 'application/json;charset=utf-8',
  csv: 'text/csv;charset=utf-8',
  txt: 'text/plain;charset=utf-8',
  html: 'text/html;charset=utf-8',
  xml: 'application/xml;charset=utf-8',
};

/** 兜底 MIME：未知格式交给浏览器当二进制流处理 */
const DEFAULT_MIME = 'application/octet-stream';

/**
 * objectURL 回收延迟（ms）。
 * ⚠️ 不要改成「click 后立即 revoke」：部分浏览器在下载真正开始前就失效，会得到空文件。
 * 延迟回收只是多占 1 秒内存，无副作用。
 */
const REVOKE_DELAY_MS = 1000;

/** 导出格式 → MIME；未知格式返回 application/octet-stream */
export function mimeOfFormat(format: string): string {
  return MIME_BY_FORMAT[String(format || '').toLowerCase()] || DEFAULT_MIME;
}

/**
 * 触发浏览器保存一个 Blob。
 * @param blob     要保存的内容
 * @param filename 保存的文件名（建议带扩展名，如 `julyUser.csv`）
 */
export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.rel = 'noopener';
  a.style.display = 'none';
  // 部分浏览器要求 <a> 已挂进文档才响应 click()
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.setTimeout(() => URL.revokeObjectURL(url), REVOKE_DELAY_MS);
}

/**
 * 把一段**文本内容**存成文件（接口返回字符串时用这个）。
 * @param content  文件内容
 * @param filename 保存的文件名
 * @param format   导出格式（仅用于推断 MIME，默认 csv）
 */
export function downloadText(content: string, filename: string, format = 'csv'): void {
  downloadBlob(new Blob([content], { type: mimeOfFormat(format) }), filename);
}

/**
 * 导出文件名：`{objectCode}.{format}`（各导出入口命名一致，避免这里 `.csv` 那里 `.txt`）
 */
export function exportFileName(objectCode: string, format = 'csv'): string {
  return `${objectCode}.${format}`;
}
