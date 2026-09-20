/**
 * KlsjnhSelect021 —— 字典下拉选（klsjnh011 组件库）
 * 传 dictionaryCode，挂载时经 julyDictionaryService.selectItemListByType 拉明细：
 * itemCode → value、itemLabel → label（后端按 sortOrder 升序返回）。
 *
 * 数据模式（mock / api）由 appConfig 运行时决定，request 层自动分流，组件无需关心。
 * 缓存：暂不缓存，每次挂载都走接口（开关 DICTIONARY_CACHE_ENABLED 见 config/globals，
 * 启用前需先设计缓存失效策略）。
 */
import { useEffect, useMemo, useState } from 'react';
import type { CSSProperties } from 'react';
import { Select } from 'antd';
import { selectDictionaryItems } from '@/services/system011/julyDictionaryService';
import type { JulyDictionaryItemVo011 } from '@/types/system011';

export interface KlsjnhSelect021Props {
  /** 字典编码（julyDictionary 主表 dictionaryCode，如 SYS_USER_STATUS / SYS_SEX / DATASOURCE_DB_TYPE） */
  dictionaryCode: string;
  value?: string;
  /** 选中回调；allowClear 清空时回 undefined */
  onChange?: (value?: string) => void;
  /** 是否包含停用项（默认 false：只拉启用项 status='1'） */
  includeDisabled?: boolean;
  placeholder?: string;
  allowClear?: boolean;
  disabled?: boolean;
  style?: CSSProperties;
  className?: string;
}

export const KlsjnhSelect021 = ({
  dictionaryCode,
  value,
  onChange,
  includeDisabled = false,
  placeholder = '请选择',
  allowClear = false,
  disabled = false,
  style,
  className,
}: KlsjnhSelect021Props) => {
  const [items, setItems] = useState<JulyDictionaryItemVo011[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    // 挂载即拉字典项：loading 需在请求前同步置位（data-fetching effect 的标准形态）
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    selectDictionaryItems({ dictionaryCode, status: includeDisabled ? undefined : '1' })
      .then((res) => { if (!cancelled) setItems(res || []); })
      .catch(() => { if (!cancelled) setItems([]); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [dictionaryCode, includeDisabled]);

  const options = useMemo(
    () => items.map((it) => ({ value: it.itemCode, label: it.itemLabel })),
    [items],
  );

  return (
    <Select
      options={options}
      value={value}
      onChange={(v) => onChange?.(v)}
      placeholder={placeholder}
      allowClear={allowClear}
      disabled={disabled}
      loading={loading}
      style={style}
      className={className}
    />
  );
};

export default KlsjnhSelect021;
