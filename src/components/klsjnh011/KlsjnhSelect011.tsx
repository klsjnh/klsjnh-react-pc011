/**
 * KlsjnhSelect011 —— 数组下拉选（klsjnh011 组件库）
 * 传入字符串数组或 {value,label} 数组即可渲染下拉；纯受控展示组件，不发请求。
 */
import { useMemo } from 'react';
import type { CSSProperties } from 'react';
import { Select } from 'antd';

/** 选项：字符串（value 与 label 相同）或 {value,label} 对象 */
export type KlsjnhSelect011Option = string | { value: string; label: string };

export interface KlsjnhSelect011Props {
  /** 下拉选项数组 */
  options: readonly KlsjnhSelect011Option[];
  /** 受控值 */
  value?: string;
  /** 选中回调；allowClear 清空时回 undefined */
  onChange?: (value?: string) => void;
  placeholder?: string;
  allowClear?: boolean;
  disabled?: boolean;
  style?: CSSProperties;
  className?: string;
}

export const KlsjnhSelect011 = ({
  options,
  value,
  onChange,
  placeholder = '请选择',
  allowClear = false,
  disabled = false,
  style,
  className,
}: KlsjnhSelect011Props) => {
  const normalized = useMemo(
    () => options.map((o) => (typeof o === 'string' ? { value: o, label: o } : o)),
    [options],
  );
  return (
    <Select
      options={normalized}
      value={value}
      onChange={(v) => onChange?.(v)}
      placeholder={placeholder}
      allowClear={allowClear}
      disabled={disabled}
      style={style}
      className={className}
    />
  );
};

export default KlsjnhSelect011;
