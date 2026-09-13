/**
 * PC 端应用根组件：登录态分流（登录页 / 主界面）
 *  - 未登录 → pages/home/login
 *  - 已登录 → pages/home（侧边栏布局 + hash 路由分发）
 */
import React from 'react';
import { Toaster } from '@/components/Toaster';
import { Home } from '@/pages/home';
import { LoginPage } from '@/pages/home/login';
import { useIsAuthenticated } from '@/stores/authStore';

export const App: React.FC = () => {
  const isAuthenticated = useIsAuthenticated();
  return (
    <>
      {/* 全局 Toast 浮层（对齐老项目 MessageBridge 的职责，业务侧用 toast.xxx() 调用） */}
      <Toaster />
      {isAuthenticated ? <Home /> : <LoginPage />}
    </>
  );
};
