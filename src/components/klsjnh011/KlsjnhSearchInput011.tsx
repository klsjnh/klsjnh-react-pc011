import { Input } from 'antd';
import type { InputProps } from 'antd';
import type { SearchProps } from 'antd/es/input';

/**
 * KlsjnhSearchInput011 —— 搜索框原语（031 §015：宽 260 + allowClear + onSearch 必回第一页）
 *
 * 宽度从 SCSS 类出（.klsjnh-search-input011 → 260px），页面不再写 style={{ width: 260 }}。
 * onSearch 语义（回第一页）由页面负责，组件注释即契约。
 */

export interface KlsjnhSearchInput011Props extends InputProps, Pick<SearchProps, 'onSearch' | 'enterButton' | 'loading'> {
  /** placeholder 语义化：「搜索××」（搜索账号 / 搜索编码 / 名称） */
  placeholder?: string;
}

export function KlsjnhSearchInput011({ className, ...rest }: KlsjnhSearchInput011Props) {
  return <Input.Search allowClear className={`klsjnh-search-input011${className ? ` ${className}` : ''}`} {...rest} />;
}
