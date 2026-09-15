/** 布局顶部：antd Header + 数据模式切换 / 通知铃铛 / 用户下拉 / 修改密码弹窗 */
import React, { useState } from 'react';
import { Layout, Dropdown, Avatar, Badge, Modal, Form, Input, Button } from 'antd';
import { ApartmentOutlined, BellOutlined, LogoutOutlined, UserOutlined, LockOutlined } from '@ant-design/icons';
import { useCurrentUser, authStore } from '@/stores/authStore';
import { useUnreadCount, notificationStore } from '@/stores/notificationStore';
import { appConfigStore, useAppConfig, type DataMode } from '@/config/appConfig';
import { reloadMenus, reloadRoles, changePassword } from '@/services/system011';
import { globalConfig } from '@/config/constants';
import { toast } from '@/utils/toast';
import type { TopProps } from '@/types/view/layout';

const { Header } = Layout;

export const Top = ({ onNavigate }: TopProps) => {
  const user = useCurrentUser();
  const unread = useUnreadCount();
  const appCfg = useAppConfig();
  const [pwdOpen, setPwdOpen] = useState(false);
  const [form] = Form.useForm();

  const switchMode = async (mode: DataMode) => {
    appConfigStore.setDataMode(mode);
    await Promise.all([reloadMenus(), reloadRoles(), notificationStore.reload()]);
  };

  const userMenu = {
    items: [
      { key: 'profile', icon: <UserOutlined />, label: '个人信息' },
      { key: 'password', icon: <LockOutlined />, label: '修改密码' },
      { type: 'divider' as const },
      { key: 'logout', icon: <LogoutOutlined />, label: '退出登录', danger: true },
    ],
    onClick: ({ key }: { key: string }) => {
      if (key === 'profile') onNavigate('/profile');
      if (key === 'password') { form.resetFields(); setPwdOpen(true); }
      if (key === 'logout') { if (window.confirm('确定要退出登录吗？')) authStore.logout(); }
    },
  };

  const modeMenu = {
    items: [
      { key: 'mock', label: 'Mock 模式（本地数据）' },
      { key: 'api', label: 'API 模式（真实后端）' },
    ],
    onClick: ({ key }: { key: string }) => switchMode(key as DataMode),
  };

  const savePwd = async () => {
    const v = await form.validateFields();
    if (v.newPwd !== v.confirmPwd) { toast.error('两次输入的新密码不一致'); return; }
    try {
      await changePassword({
        userAccount: user?.username || '',
        oldPassword: v.oldPwd,
        newPassword: v.newPwd,
      });
      setPwdOpen(false);
      form.resetFields();
      toast.success('密码修改成功');
    } catch (e) {
      toast.error((e as Error)?.message || '密码修改失败');
    }
  };

  return (
    <Header className="app-header">
      <div className="app-brand">
        <ApartmentOutlined className="app-brand-logo" />
        <span>{globalConfig.appName}</span>
      </div>

      <div className="app-header-actions">
        <Dropdown menu={modeMenu} trigger={['click']}>
          <Button size="small" type={appCfg.dataMode === 'api' ? 'primary' : 'default'}>
            {appCfg.dataMode === 'mock' ? 'MOCK' : 'API'}
          </Button>
        </Dropdown>

        <Badge count={unread} size="small" overflowCount={99}>
          <BellOutlined className="app-header-bell" onClick={() => onNavigate('/notifications')} />
        </Badge>

        <Dropdown menu={userMenu} trigger={['click']}>
          <span className="app-header-user">
            <Avatar src={user?.avatar || undefined} icon={<UserOutlined />} size="small" />
            <span>{user?.realName || '未登录'}</span>
          </span>
        </Dropdown>
      </div>

      <Modal
        title="修改密码"
        open={pwdOpen}
        onCancel={() => setPwdOpen(false)}
        onOk={savePwd}
        okText="保存"
        cancelText="取消"
        destroyOnClose
      >
        <Form form={form} layout="vertical">
          <Form.Item name="oldPwd" label="原密码" rules={[{ required: true, message: '请输入原密码' }]}>
            <Input.Password placeholder="请输入原密码" />
          </Form.Item>
          <Form.Item name="newPwd" label="新密码" rules={[{ required: true, message: '请输入新密码' }, { min: 6, message: '至少 6 位' }]}>
            <Input.Password placeholder="至少 6 位" />
          </Form.Item>
          <Form.Item name="confirmPwd" label="确认新密码" rules={[{ required: true, message: '请确认新密码' }]}>
            <Input.Password placeholder="再次输入新密码" />
          </Form.Item>
        </Form>
      </Modal>
    </Header>
  );
};
