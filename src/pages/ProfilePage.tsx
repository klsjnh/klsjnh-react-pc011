/**
 * 个人中心页 - PC 端（账号信息 + 快捷入口 + 偏好设置）
 */
import React, { useState } from 'react';
import { useCurrentUser, authStore } from '@/stores/authStore';
import { SYSTEM011_ROUTES } from '@/config/routes';
import { ConfirmDialog } from '../components';

interface ProfilePageProps {
  onNavigate?: (path: string) => void;
}

export const ProfilePage: React.FC<ProfilePageProps> = ({ onNavigate }) => {
  const user = useCurrentUser();
  const [dialog, setDialog] = useState<{ visible: boolean; onConfirm: () => void }>({
    visible: false,
    onConfirm: () => {},
  });
  const [settings, setSettings] = useState({
    notify: true,
    darkMode: false,
  });

  const handleLogout = () => {
    setDialog({
      visible: true,
      onConfirm: () => {
        authStore.logout();
        setDialog(d => ({ ...d, visible: false }));
      },
    });
  };

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

  const settingItems = [
    { icon: '🔔', label: '消息通知', key: 'notify' as const },
    { icon: '🌙', label: '深色模式', key: 'darkMode' as const },
  ];

  return (
    <div>
      <div className="page-header">
        <h2>个人中心</h2>
        <p>账号信息与快捷入口</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: '16px', alignItems: 'start' }}>
        {/* ===== 左列：账号信息 + 偏好设置 + 退出 ===== */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="table-wrapper" style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{
              background: 'linear-gradient(135deg, #1890ff 0%, #096dd9 100%)',
              padding: '28px 24px', color: '#fff',
              display: 'flex', alignItems: 'center', gap: '16px',
            }}>
              <img
                src={user?.avatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=default'}
                alt=""
                style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'rgba(255,255,255,0.2)' }}
              />
              <div>
                <div style={{ fontSize: '18px', fontWeight: 600 }}>{user?.realName || '未登录'}</div>
                <div style={{ fontSize: '13px', opacity: 0.85, marginTop: '3px' }}>
                  @{user?.username || '-'}
                </div>
                <div style={{ fontSize: '12px', opacity: 0.75, marginTop: '3px' }}>
                  {user?.roles?.join(', ') || '-'}
                </div>
              </div>
            </div>
            <div style={{ padding: '14px 20px' }}>
              <button
                onClick={handleLogout}
                className="btn btn-default"
                style={{ width: '100%', color: 'var(--danger)', borderColor: 'var(--danger)' }}
              >
                🚪 退出登录
              </button>
            </div>
          </div>

          <div className="table-wrapper" style={{ padding: '20px' }}>
            <div style={{ fontSize: '14px', fontWeight: 600, marginBottom: '14px' }}>偏好设置</div>
            {settingItems.map((item, index, arr) => (
              <div
                key={item.label}
                onClick={() => setSettings(s => ({ ...s, [item.key]: !s[item.key] }))}
                style={{
                  display: 'flex', alignItems: 'center', gap: '12px',
                  padding: '12px 0',
                  borderBottom: index < arr.length - 1 ? '1px solid var(--border-light)' : 'none',
                  cursor: 'pointer',
                }}
              >
                <span style={{ fontSize: '18px' }}>{item.icon}</span>
                <span style={{ flex: 1, fontSize: '14px' }}>{item.label}</span>
                <div style={{
                  width: '36px', height: '20px', borderRadius: '10px', flexShrink: 0,
                  background: settings[item.key] ? '#52c41a' : '#d9d9d9',
                  position: 'relative', transition: 'background 0.2s',
                }}>
                  <div style={{
                    width: '16px', height: '16px', borderRadius: '50%', background: '#fff',
                    position: 'absolute', top: '2px',
                    left: settings[item.key] ? '18px' : '2px',
                    transition: 'left 0.2s', boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
                  }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ===== 右列：快捷入口 ===== */}
        <div className="table-wrapper" style={{ padding: '20px' }}>
          <div style={{ fontSize: '14px', fontWeight: 600, marginBottom: '16px' }}>快捷入口</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '12px' }}>
            {navItems.map((item) => (
              <div
                key={item.label}
                onClick={() => onNavigate?.(item.path)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '10px',
                  padding: '16px 14px',
                  border: '1px solid var(--border-light)', borderRadius: 'var(--radius)',
                  cursor: 'pointer', transition: 'border-color 0.2s, box-shadow 0.2s',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--primary)'; e.currentTarget.style.boxShadow = '0 2px 8px rgba(24,144,255,0.12)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border-light)'; e.currentTarget.style.boxShadow = 'none'; }}
              >
                <span style={{ fontSize: '24px' }}>{item.icon}</span>
                <span style={{ fontSize: '13px', fontWeight: 500 }}>{item.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={{ textAlign: 'center', fontSize: '12px', color: 'var(--text-muted)', marginTop: '20px' }}>
        Enterprise Admin Framework v1.0.0 (PC 端)
      </div>

      <ConfirmDialog
        visible={dialog.visible}
        title="退出登录"
        content="确定要退出登录吗？"
        onConfirm={dialog.onConfirm}
        onCancel={() => setDialog(d => ({ ...d, visible: false }))}
      />
    </div>
  );
};
