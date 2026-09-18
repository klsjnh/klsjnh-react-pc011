/**
 * antd 消息桥：把 App.useApp() 的 message 实例挂到模块级，
 * 供 utils/toast（非组件上下文）调用，避免 antd 静态 message 丢失主题/上下文。
 */
import { useEffect } from 'react';
import { App } from 'antd';
import type { MessageInstance } from 'antd/es/message/interface';

let messageApi: MessageInstance | null = null;

// keep ref-backed message bridge stable for HMR/dev; fast-refresh warning is acceptable here
// eslint-disable-next-line react-refresh/only-export-components
export const getMessageApi = (): MessageInstance | null => messageApi;

export const MessageBridge = () => {
  const { message } = App.useApp();
  useEffect(() => {
    messageApi = message;
  }, [message]);
  return null;
};
