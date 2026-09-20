/**
 * KlsjnhSelect031 —— 联动双选下拉（klsjnh011 组件库 · 公共组件）
 *
 * 标准形态：一级下拉 + 二级下拉，二级选项随一级当前值联动。
 * 与业务域完全解耦——存储实例→桶、分类→属性、省→市等父子两级场景通用。
 *
 * 二级数据两种取法（二选一）：
 *   - childrenMap：静态映射 Record<父值, 选项[]>（同步，适合死数据）
 *   - loadChildren：按父值动态取（同步返回数组或 Promise，适合每次走接口的场景）
 *
 * 联动语义（标准行为）：
 *   1. 用户切换一级 → 二级值自动清空并回调（旧值在新选项里大概率失效，避免脏数据）；
 *   2. 未选一级时二级禁用；二级加载中出 loading 态；
 *   3. 首次挂载带入受控值（parentValue + childValue）时只加载选项、不清空二级值——保证回显
 *      （回显不经过 onChange 路径，天然不与「切换即清空」冲突）。
 */
import { useCallback, useEffect, useMemo, useState } from 'react';
import type { CSSProperties } from 'react';
import { Select } from 'antd';

/** 选项：字符串（value 与 label 相同）或 {value,label} 对象 */
export type KlsjnhSelect031Option = string | { value: string; label: string };

/** 父值 → 二级选项 的静态映射 */
export type KlsjnhSelect031ChildrenMap = Record<string, readonly KlsjnhSelect031Option[]>;

export interface KlsjnhSelect031Props {
  /** 一级选项 */
  parentOptions: readonly KlsjnhSelect031Option[];
  /** 一级当前值（受控） */
  parentValue?: string;
  /** 一级变更；allowClear 清空时回 undefined */
  onParentChange?: (value?: string) => void;
  /** 二级选项静态映射（与 loadChildren 二选一，同时传入时 loadChildren 优先） */
  childrenMap?: KlsjnhSelect031ChildrenMap;
  /** 二级选项按父值动态获取：可同步返回数组或返回 Promise */
  loadChildren?: (parentValue: string) => readonly KlsjnhSelect031Option[] | Promise<readonly KlsjnhSelect031Option[]>;
  /** 二级当前值（受控） */
  childValue?: string;
  /** 二级变更；一级切换导致的清空也会回调（value 为 undefined，parentValue 为新值） */
  onChildChange?: (value?: string, parentValue?: string) => void;
  parentPlaceholder?: string;
  childPlaceholder?: string;
  parentAllowClear?: boolean;
  childAllowClear?: boolean;
  disabled?: boolean;
  /** 两个下拉之间的间距（默认 8） */
  gap?: number;
  style?: CSSProperties;
  className?: string;
}

function toOptions(options: readonly KlsjnhSelect031Option[]): { value: string; label: string }[] {
  return options.map((o) => (typeof o === 'string' ? { value: o, label: o } : o));
}

export const KlsjnhSelect031 = ({
  parentOptions,
  parentValue,
  onParentChange,
  childrenMap,
  loadChildren,
  childValue,
  onChildChange,
  parentPlaceholder = '请选择',
  childPlaceholder = '请选择',
  parentAllowClear = false,
  childAllowClear = false,
  disabled = false,
  gap = 8,
  style,
  className,
}: KlsjnhSelect031Props) => {
  const [childOptions, setChildOptions] = useState<{ value: string; label: string }[]>([]);
  const [childLoading, setChildLoading] = useState(false);

  // 父值 → 二级选项：loadChildren 支持同步/Promise（带取防护）；否则走 childrenMap 同步映射
  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect -- 联动重置 / 同步映射需在 effect 内同步写 state */
    if (!parentValue) {
      setChildOptions([]);
      return;
    }
    if (loadChildren) {
      let cancelled = false;
      setChildLoading(true);
      const result = loadChildren(parentValue);
      void Promise.resolve(result)
        .then((opts) => { if (!cancelled) setChildOptions(toOptions(opts || [])); })
        .catch(() => { if (!cancelled) setChildOptions([]); })
        .finally(() => { if (!cancelled) setChildLoading(false); });
      return () => { cancelled = true; };
    }
    setChildOptions(toOptions(childrenMap?.[parentValue] || []));
  }, [parentValue, childrenMap, loadChildren]);

  const handleParentChange = useCallback((value?: string) => {
    onParentChange?.(value);
    // 用户切换一级：二级现值在新选项里大概率失效 → 一并清空并回调，成对上报新父值
    if (childValue !== undefined) onChildChange?.(undefined, value);
  }, [childValue, onChildChange, onParentChange]);

  const handleChildChange = useCallback((value?: string) => {
    onChildChange?.(value, parentValue);
  }, [onChildChange, parentValue]);

  const parentNormalized = useMemo(() => toOptions(parentOptions), [parentOptions]);
  const childDisabled = disabled || !parentValue;

  return (
    <span className={className} style={{ display: 'inline-flex', alignItems: 'center', gap, ...style }}>
      <Select
        options={parentNormalized}
        value={parentValue}
        onChange={(v) => handleParentChange(v)}
        placeholder={parentPlaceholder}
        allowClear={parentAllowClear}
        disabled={disabled}
      />
      <Select
        options={childOptions}
        value={childValue}
        onChange={(v) => handleChildChange(v)}
        placeholder={childPlaceholder}
        allowClear={childAllowClear}
        disabled={childDisabled}
        loading={childLoading}
      />
    </span>
  );
};

export default KlsjnhSelect031;
