/**
 * 个人中心页 - PC 端（antd）
 * 图标统一取自 @ant-design/icons，不再使用 emoji。
 */
import React, { useState } from 'react';
import { Avatar, Button, Card, Col, List, Modal, Row, Switch, Typography } from 'antd';
import {
  ApartmentOutlined,
  AreaChartOutlined,
  BellOutlined,
  FileSearchOutlined,
  InfoCircleOutlined,
  KeyOutlined,
  MenuOutlined,
  MoonOutlined,
  QuestionCircleOutlined,
  SettingOutlined,
  TeamOutlined,
} from '@ant-design/icons';
import { useCurrentUser, authStore } from '@/stores/authStore';
import { SYSTEM011_ROUTES, HOME_ROUTES } from '@/config/routes';
import type { ProfilePageProps } from '@/types/view/page';
import type { NavIcon } from '@/types/view/layout';

export const ProfilePage = ({ onNavigate }: ProfilePageProps) => {
  const user = useCurrentUser();
  const [settings, setSettings] = useState({ notify: true, darkMode: false });

  const navItems: { icon: NavIcon; label: string; path: string }[] = [
    { icon: TeamOutlined, label: '用户管理', path: SYSTEM011_ROUTES.julyUser },
    { icon: KeyOutlined, label: '权限管理', path: SYSTEM011_ROUTES.julyPermission },
    { icon: ApartmentOutlined, label: '组织管理', path: SYSTEM011_ROUTES.julyOrganization },
    { icon: MenuOutlined, label: '菜单管理', path: SYSTEM011_ROUTES.julyMenu },
    { icon: AreaChartOutlined, label: '数据报表', path: '/reports' },
    { icon: BellOutlined, label: '消息通知', path: '/notifications' },
    { icon: FileSearchOutlined, label: '审计日志', path: '/audit' },
    { icon: SettingOutlined, label: '系统设置', path: '/settings' },
    { icon: QuestionCircleOutlined, label: '帮助反馈', path: HOME_ROUTES.help },
    { icon: InfoCircleOutlined, label: '关于我们', path: HOME_ROUTES.about },
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
              <span className="flex-center gap-2"><BellOutlined />消息通知</span>
              <Switch checked={settings.notify} onChange={(v) => setSettings((s) => ({ ...s, notify: v }))} />
            </div>
            <div className="flex-between">
              <span className="flex-center gap-2"><MoonOutlined />深色模式</span>
              <Switch checked={settings.darkMode} onChange={(v) => setSettings((s) => ({ ...s, darkMode: v }))} />
            </div>
          </Card>
        </Col>

        <Col span={16}>
          <Card title="快捷入口">
            <List
              grid={{ gutter: 12, column: 3 }}
              dataSource={navItems}
              renderItem={(item) => {
                const ItemIcon = item.icon;
                return (
                  <List.Item>
                    <Button block className="profile-nav-btn" onClick={() => onNavigate?.(item.path)}>
                      <ItemIcon /> {item.label}
                    </Button>
                  </List.Item>
                );
              }}
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
