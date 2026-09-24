import { Tag } from 'antd';

/**
 * KlsjnhStatusTag011 —— 状态列标签原语（031 §017：width 90 + center，Tag 呈现，禁裸文本 0/1）
 *
 * 内置启用/停用默认映射（'1' 启用 green / '0' 停用 red），数字 0/1 与字符串 '0'/'1' 都认；
 * 语义不同的列（如 已发送/未回复）用 labels + colors 覆写，或直接用 values 完全接管。
 * 未命中映射的**非空原始值原样回显**（如后端直出「已发送 / 待处理」，色 default），仅空值回落 '?' —— 不丢状态语义：
 *
 *   <KlsjnhStatusTag011 value={r.status} />                                    // 启用/停用
 *   <KlsjnhStatusTag011 value={r.status} labels={{ '1': '正常' }} />           // 只改文案
 *   <KlsjnhStatusTag011 value={v} colors={{ [v]: color }} />                   // 原样文案 + 已知状态着色
 *   <KlsjnhStatusTag011 value={v} values={{ true: '开启', false: '关闭' }}
 *       colors={{ '开启': 'green', '关闭': 'red' }} />                          // 布尔语义
 *
 * 列规格（width 90 / align center / onHeaderCell hdrCenter）仍由页面列定义负责 —— 组件只管渲染。
 */

export interface KlsjnhStatusTag011Props {
  /** 状态值：'1'/'0'/1/0 或任意可序化值 */
  value: string | number | boolean | null | undefined;
  /** 值 → 文案映射（默认 { '1': '启用', '0': '停用' }，数字键归一为字符串） */
  labels?: Record<string, string>;
  /** 值 → antd Tag color 映射（默认 { '1': 'green', '0': 'red' }，未命中回落 'default'） */
  colors?: Record<string, string>;
  /** 完全接管：原始值 → 文案（未命中则原样回显原始值，仅空值渲染 '?'） */
  values?: Record<string, string>;
}

export function KlsjnhStatusTag011({ value, labels, colors, values }: KlsjnhStatusTag011Props) {
  const key = value === null || value === undefined ? '' : String(value);
  const text = values?.[key] ?? labels?.[key] ?? (key === '1' ? '启用' : key === '0' ? '停用' : key);
  const color = colors?.[key] ?? (key === '1' ? 'green' : key === '0' ? 'red' : 'default');
  return <Tag color={color}>{text || '?'}</Tag>;
}
