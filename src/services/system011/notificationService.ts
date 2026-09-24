/**
 * 通知中心接口（/notification/v1/*）
 *
 * 独立于 system011 模块，走默认 apiBaseUrl；// 信流转收口在此，
 * store（stores/notificationStore.ts）只持状态，不经手 api/request（016 §7）。
 */
import { api, fireApi } from '@/api/request';
import type { NotificationVo } from '@/types/view/notification';

/** 通知 action 路径常量 */
export const NOTIFICATION_ACTIONS = {
  selectListByPage: '/notification/v1/selectListByPage',
  read: '/notification/v1/read',
  readAll: '/notification/v1/readAll',
  logicDelete: '/notification/v1/logicDelete',
} as const;

/** 通知列表查询 */
export function selectNotificationList(): Promise<NotificationVo[]> {
  return api.post<NotificationVo[]>(NOTIFICATION_ACTIONS.selectListByPage, {});
}

/** 标记单条已读（静默写，本地已乐观更新） */
export function markNotificationRead(id: number): void {
  void fireApi(NOTIFICATION_ACTIONS.read, { id });
}

/** 全部标为已读（静默写） */
export function markAllNotificationsRead(): void {
  void fireApi(NOTIFICATION_ACTIONS.readAll);
}

/** 删除通知（静默写） */
export function removeNotification(id: number): void {
  void fireApi(NOTIFICATION_ACTIONS.logicDelete, { id });
}
