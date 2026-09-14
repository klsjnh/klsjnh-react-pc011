/** 业务中心演示页 UI 类型（无后端模块，展示数据） */

export interface DictItem {
  id: number;
  type: string;
  label: string;
  items: { value: string; label: string }[];
}

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

export interface DataSourceItem {
  id: number;
  name: string;
  type: string;
  host: string;
  database: string;
  status: string;
  latency: string;
}

/** 仪表盘最近操作日志 */
export interface RecentLog {
  time: string;
  user: string;
  action: string;
  ip: string;
}

/** 业务中心宫格入口 */
export interface BizEntry {
  icon: string;
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
