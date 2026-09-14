/** 页面级 Props / 局部数据类型 */
import type { NodeId } from '@/types/view/common';

export interface PageNavProps {
  onNavigate?: (path: string) => void;
}

export type BusinessPageProps = PageNavProps;
export type ProfilePageProps = PageNavProps;
export type UserListPageProps = PageNavProps;
export type MenuListPageProps = PageNavProps;

/** 帮助反馈分类 */
export type FeedbackCategory = 'bug' | 'feature' | 'other';

/** 帮助反馈项 */
export interface FeedbackItem {
  id: number;
  category: string;
  content: string;
  time: string;
  status: 'pending' | 'replied';
  reply?: string;
}

/** 登录页页签 */
export type LoginTab = 'username' | 'password';

/** 通知筛选类型 */
export type FilterType = 'all' | 'system' | 'user' | 'order';

export type { NodeId };
