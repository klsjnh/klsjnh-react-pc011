/** 通知 UI / 契约类型 */

export interface NotificationItem {
  id: number;
  title: string;
  content: string;
  time: string;
  read: boolean;
  type: 'system' | 'user' | 'order';
}

/** 真实后端 JulyNotificationVo011（mock 与 api 同形） */
export interface NotificationVo {
  id: number;
  title: string;
  content: string;
  type: 'system' | 'user' | 'order';
  read: boolean;
  createTime: string;
}

export interface NotificationState {
  notifications: NotificationItem[];
  loaded: boolean;
}
