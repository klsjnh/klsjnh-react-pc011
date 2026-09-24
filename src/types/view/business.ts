/** 业务中心演示页 UI 类型（无后端模块，展示数据） */
import type { NavIcon } from '@/types/view/layout';

export interface OnlineUser {
  id: number;
  username: string;
  realName: string;
  ip: string;
  location: string;
  loginTime: string;
  browser: string;
}

export interface CacheItem {
  id: number;
  name: string;
  size: string;
  items: number;
  hitRate: string;
  ttl: string;
}

// ⚠️ DataSourceItem 已迁移到 @/types/dataservice011/datasource，此处不再重复定义

/** 业务中心宫格入口 */
export interface BizEntry {
  icon: NavIcon;
  label: string;
  path: string;
  color: string;
}

/** 系统设置项 */
export interface SettingItem {
  id: number;
  name: string;
  value: string | boolean;
  type: 'text' | 'toggle';
}
