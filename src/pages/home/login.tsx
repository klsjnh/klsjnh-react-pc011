/**
 * 登录页（antd 版）
 *  - 「用户名」页签：免密登录 julyUser/v1/loginByUserName（仅 development）
 *  - 「用户名密码」页签：密码登录 julyUser/v1/login（任何运行态）
 *  - 支持 ?userName=klsjnh 预填（见 utils/devLogin）
 */
import React, { useState } from 'react';
import { Button, Card, Form, Input, Tabs, Typography } from 'antd';
import { ApartmentOutlined, UserOutlined, LockOutlined } from '@ant-design/icons';
import { authStore } from '@/stores/authStore';
import { isDevelopment, useAppConfig } from '@/config/appConfig';
import { readDevLoginUserName } from '@/utils/devLogin';
import { globalConfig } from '@/config/global';
import { toast } from '@/utils/toast';
import type { LoginTab } from '@/types/view/page';

const DEFAULT_USER_NAME = 'klsjnh';

export const LoginPage = () => {
  const { dataMode, runState } = useAppConfig();
  const devMode = isDevelopment();
  const [activeTab, setActiveTab] = useState<LoginTab>('username');
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();

  const initialUserName =
    readDevLoginUserName(window.location.search, window.location.hash) || DEFAULT_USER_NAME;

  const handleUsernameLogin = async () => {
    const { userName } = await form.validateFields(['userName']);
    setLoading(true);
    try {
      await authStore.loginByUserNameApi(String(userName).trim());
    } catch (e) {
      toast.error((e as Error)?.message || '免密登录失败（生产态不可用，请用「用户名密码」）');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordLogin = async () => {
    const { userName, password } = await form.validateFields();
    setLoading(true);
    try {
      await authStore.loginWithApi(String(userName).trim(), String(password));
    } catch (e) {
      toast.error((e as Error)?.message || '登录失败，请检查账号密码');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <Card className="login-card" styles={{ body: { padding: 32 } }}>
        <div className="login-brand">
          <div className="login-brand-title text-primary"><ApartmentOutlined /> {globalConfig.appName}</div>
          <Typography.Text type="secondary" className="text-xs">
            {dataMode === 'mock' ? 'MOCK' : 'API'} · {runState === 'development' ? '开发态' : '生产态'}
          </Typography.Text>
        </div>

        <Tabs
          activeKey={activeTab}
          onChange={(k) => setActiveTab(k as LoginTab)}
          centered
          items={[
            { key: 'username', label: '用户名' },
            { key: 'password', label: '用户名密码' },
          ]}
        />

        <Form form={form} layout="vertical" initialValues={{ userName: initialUserName }}>
          <Form.Item name="userName" rules={[{ required: true, message: '请输入用户名' }]}>
            <Input prefix={<UserOutlined />} placeholder="用户名" size="large" autoComplete="username" />
          </Form.Item>
          {activeTab === 'password' && (
            <Form.Item name="password" rules={[{ required: true, message: '请输入密码' }]}>
              <Input.Password prefix={<LockOutlined />} placeholder="密码" size="large" autoComplete="current-password" />
            </Form.Item>
          )}
          <Button
            type="primary"
            size="large"
            block
            loading={loading}
            onClick={activeTab === 'username' ? handleUsernameLogin : handlePasswordLogin}
          >
            登录
          </Button>
        </Form>

        <div className="login-tip">
          {activeTab === 'username'
            ? devMode
              ? '免密登录：只填用户名（klsjnh / zhangsan / lisi）'
              : '免密登录仅开发态可用，请切到「用户名密码」'
            : '密码与用户名相同，例如 klsjnh / klsjnh'}
        </div>
      </Card>
    </div>
  );
};
