/**
 * PC 端应用根组件：antd 主题/语言 Provider + 路由（登录态分流）
 *  - /login  → 登录页（已登录则跳首页）
 *  - /*      → 主界面（未登录则跳登录页）
 */
import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ConfigProvider, App as AntdApp } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import { antdTheme } from '@/config/theme';
import { MessageBridge } from '@/components/MessageBridge';
import { Home } from '@/pages/home';
import { LoginPage } from '@/pages/home/login';
import { useIsAuthenticated } from '@/stores/authStore';
import { DEFAULT_ROUTE } from '@/config/routes';

export const App = () => {
  const isAuthenticated = useIsAuthenticated();
  return (
    <ConfigProvider locale={zhCN} theme={antdTheme}>
      <AntdApp>
        <MessageBridge />
        <Routes>
          <Route path="/login" element={isAuthenticated ? <Navigate to={DEFAULT_ROUTE} replace /> : <LoginPage />} />
          <Route path="/*" element={isAuthenticated ? <Home /> : <Navigate to="/login" replace />} />
        </Routes>
      </AntdApp>
    </ConfigProvider>
  );
};
