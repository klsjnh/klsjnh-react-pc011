/**
 * 通知状态管理（顶栏红点未读数 + 消息通知页共用）
 */
import { useSyncExternalStore } from 'react';

export interface NotificationItem {
  id: number;
  title: string;
  content: string;
  time: string;
  read: boolean;
  type: 'system' | 'user' | 'order';
}

const initialNotifications: NotificationItem[] = [
  { id: 1, title: '系统更新通知', content: '系统将于今晚 22:00-22:30 进行维护升级，升级期间可能无法正常访问。升级内容：优化系统性能、修复已知问题、新增数据导出功能。请提前做好相关准备。', time: '2026-09-12 09:30:00', read: false, type: 'system' },
  { id: 2, title: '新用户注册审核', content: '用户「张三」已完成注册申请，请前往用户管理页面进行审核。注册时间：2026-09-12 09:25:00，注册邮箱：zhangsan@example.com。', time: '2026-09-12 09:25:00', read: false, type: 'user' },
  { id: 3, title: '订单支付成功', content: '订单 #20260912001 已支付成功，金额 ¥299.00。买家：李四，商品：企业管理系统年度会员。请及时处理订单发货。', time: '2026-09-12 09:00:00', read: true, type: 'order' },
  { id: 4, title: '权限变更提醒', content: '您的角色权限已被修改。变更内容：新增「数据报表」查看权限，移除「菜单管理」编辑权限。当前角色：部门经理。', time: '2026-09-12 08:00:00', read: true, type: 'system' },
  { id: 5, title: '数据备份完成', content: '系统数据已于 2026-09-12 06:00 自动备份完成。备份大小：256MB，备份位置：云端存储，保留天数：30天。', time: '2026-09-12 06:00:00', read: true, type: 'system' },
  { id: 6, title: '新订单提醒', content: '您有 3 个新订单待处理。订单号：#20260911001、#20260911002、#20260911003，总金额 ¥1,256.00。', time: '2026-09-11 17:30:00', read: true, type: 'order' },
  { id: 7, title: '用户反馈', content: '用户「王五」提交了新的反馈：系统登录页面加载速度较慢，建议优化。反馈时间：2026-09-11 16:20:00。', time: '2026-09-11 16:20:00', read: true, type: 'user' },
  { id: 8, title: '安全警告', content: '检测到异常登录尝试。IP：45.33.22.11，地点：美国加利福尼亚州，时间：2026-09-11 14:00:00。如非本人操作请立即修改密码。', time: '2026-09-11 14:00:00', read: false, type: 'system' },
];

interface NotificationState {
  notifications: NotificationItem[];
  loaded: boolean;
}

let state: NotificationState = {
  notifications: JSON.parse(JSON.stringify(initialNotifications)),
  loaded: false,
};

const listeners = new Set<() => void>();

function getSnapshot(): NotificationState { return state; }
function subscribe(l: () => void) { listeners.add(l); return () => { listeners.delete(l); }; }
function emit() { state = { ...state }; listeners.forEach((l) => l()); }

export const notificationStore = {
  getSnapshot,
  subscribe,

  /** 初始化 */
  load: () => { if (!state.loaded) { state = { ...state, loaded: true }; emit(); } },

  /** 标记单条已读 */
  markAsRead: (id: number) => {
    state.notifications = state.notifications.map(n => n.id === id ? { ...n, read: true } : n);
    emit();
  },

  /** 全部已读 */
  markAllRead: () => {
    state.notifications = state.notifications.map(n => ({ ...n, read: true }));
    emit();
  },

  /** 删除通知 */
  remove: (id: number) => {
    state.notifications = state.notifications.filter(n => n.id !== id);
    emit();
  },
};

/** 通知原始状态 */
export function useNotificationState(): NotificationState {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}

/** 未读数量（顶栏红点用） */
export function useUnreadCount(): number {
  const { notifications } = useNotificationState();
  return notifications.filter(n => !n.read).length;
}
