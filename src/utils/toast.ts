/**
 * 全局消息提示：委托 antd message（经 MessageBridge 注入实例）。
 * 用法不变：toast.success('保存成功') / toast.error('xxx')
 */
import { message as staticMessage } from 'antd';
import { getMessageApi } from '@/components/MessageBridge';
import type { ToastKind, ToastItem } from '@/types/view/toast';

export type { ToastKind, ToastItem };

const api = () => getMessageApi() ?? staticMessage;

export const toast = {
  success: (content: string) => { api().success(content); },
  error: (content: string) => { api().error(content); },
  info: (content: string) => { api().info(content); },
  warning: (content: string) => { api().warning(content); },
};
