/**
 * 个人中心页 - PC 端（antd）
 */
import React, { useState } from 'react';
import { Avatar, Button, Card, Col, List, Modal, Row, Switch, Typography } from 'antd';
import { useCurrentUser, authStore } from '@/stores/authStore';
import { SYSTEM011_ROUTES } from '@/config/routes';
import type { ProfilePageProps } from '@/types/view/page';

export const ProfilePage = ({ onNavigate }: ProfilePageProps) => {
  const user = useCurrentUser();
  const [settings, setSettings] = useState({ notify: true, darkMode: false });

  const navItems = [
    { icon: '👥', label: '用户管理', path: SYSTEM011_ROUTES.julyUser },
    { icon: '🔑', label: '权限管理', path: SYSTEM011_ROUTES.julyPermission },
    { icon: '🏢', label: '组织管理', path: SYSTEM011_ROUTES.julyOrganization },
    { icon: '📋', label: '菜单管理', path: SYSTEM011_ROUTES.julyMenu },
    { icon: '📊', label: '数据报表', path: '/reports' },
    { icon: '🔔', label: '消息通知', path: '/notifications' },
    { icon: '📝', label: '审计日志', path: '/audit' },
    { icon: '⚙️', label: '系统设置', path: '/settings' },
    { icon: '❓', label: '帮助反馈', path: '/help' },
    { icon: 'ℹ️', label: '关于我们', path: '/about' },
  ];

  const confirmLogout = () => {
    Modal.confirm({
      title: '退出登录',
      content: '确定要退出登录吗？',
      okText: '退出',
      okButtonProps: { danger: true },
      cancelText: '取消',
      onOk: () => authStore.logout(),
    });
  };

  return (
    <div>
      <div className="page-header"><h2>个人中心</h2><p>账号信息与快捷入口</p></div>

      <Row gutter={16}>
        <Col span={8}>
          <Card styles={{ body: { padding: 0 } }} className="mb-4">
            <div className="profile-hero">
              <Avatar src={user?.avatar} size={64} />
              <div>
                <div style={{ fontSize: 18, fontWeight: 600 }}>{user?.realName || '未登录'}</div>
                <div style={{ opacity: 0.85, fontSize: 13 }}>@{user?.username || '-'}</div>
                <div style={{ opacity: 0.75, fontSize: 12 }}>{user?.roles?.join(', ') || '-'}</div>
              </div>
            </div>
            <div style={{ padding: '14px 20px' }}>
              <Button danger block onClick={confirmLogout}>退出登录</Button>
            </div>
          </Card>

          <Card title="偏好设置">
            <div className="flex-between mb-2">
              <span>🔔 消息通知</span>
              <Switch checked={settings.notify} onChange={(v) => setSettings((s) => ({ ...s, notify: v }))} />
            </div>
            <div className="flex-between">
              <span>🌙 深色模式</span>
              <Switch checked={settings.darkMode} onChange={(v) => setSettings((s) => ({ ...s, darkMode: v }))} />
            </div>
          </Card>
        </Col>

        <Col span={16}>
          <Card title="快捷入口">
            <List
              grid={{ gutter: 12, column: 3 }}
              dataSource={navItems}
              renderItem={(item) => (
                <List.Item>
                  <Button block className="profile-nav-btn" onClick={() => onNavigate?.(item.path)}>
                    <span style={{ fontSize: 20 }}>{item.icon}</span> {item.label}
                  </Button>
                </List.Item>
              )}
            />
          </Card>
        </Col>
      </Row>

      <div className="text-center text-muted text-xs mt-4">
        <Typography.Text type="secondary">Enterprise Admin Framework v1.0.0 (PC 端)</Typography.Text>
      </div>
    </div>
  );
};
