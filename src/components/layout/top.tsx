/** 布局顶部：品牌 / 数据模式切换 / 通知铃铛 / 用户下拉（含修改密码弹窗） */
import React, { useState } from 'react';
import { useCurrentUser, authStore } from '@/stores/authStore';
import { useUnreadCount, notificationStore } from '@/stores/notificationStore';
import { appConfigStore, useAppConfig, type DataMode, type RunState } from '@/config/appConfig';
import { menuStore } from '@/stores/system011/julyMenuStore';
import { roleStore } from '@/stores/system011/julyRoleStore';
import { globalConfig } from '@/config/global';
import { Modal } from '@/components/Modal';

interface TopProps {
  onNavigate: (path: string) => void;
}

const menuItemStyle: React.CSSProperties = {
  display: 'block', width: '100%', textAlign: 'left', padding: '9px 14px',
  background: 'none', border: 'none', fontSize: '13px', cursor: 'pointer',
  color: 'var(--text-primary)', borderRadius: '4px',
};

export const Top: React.FC<TopProps> = ({ onNavigate }) => {
  const user = useCurrentUser();
  const unread = useUnreadCount();
  const appCfg = useAppConfig();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [pwdModal, setPwdModal] = useState(false);
  const [pwdForm, setPwdForm] = useState({ oldPwd: '', newPwd: '', confirmPwd: '' });
  const [pwdError, setPwdError] = useState('');
  const [modeOpen, setModeOpen] = useState(false);
  const [apiBaseInput, setApiBaseInput] = useState(appCfg.apiBaseUrl);

  const handleLogout = () => {
    if (window.confirm('确定要退出登录吗？')) authStore.logout();
  };

  const handleSavePwd = () => {
    if (!pwdForm.oldPwd || !pwdForm.newPwd || !pwdForm.confirmPwd) { setPwdError('请填写完整'); return; }
    if (pwdForm.newPwd.length < 6) { setPwdError('新密码至少 6 位'); return; }
    if (pwdForm.newPwd !== pwdForm.confirmPwd) { setPwdError('两次输入的新密码不一致'); return; }
    setPwdModal(false);
    setPwdForm({ oldPwd: '', newPwd: '', confirmPwd: '' });
    setPwdError('');
    window.alert('密码修改成功');
  };

  /** 切换数据模式（mock/api）后重新加载各 store 数据 */
  const handleSwitchMode = async (mode: DataMode) => {
    appConfigStore.setDataMode(mode);
    setModeOpen(false);
    await Promise.all([menuStore.reload(), roleStore.reload(), notificationStore.reload()]);
  };

  return (
    <header className="pc-header">
      <div className="header-left">
        <span className="header-logo">🏢</span>
        <span className="header-title">{globalConfig.appName}</span>
      </div>
      <div className="header-right">
        {/* 数据模式切换（mock / api） */}
        <div style={{ position: 'relative' }}>
          <div
            onClick={() => { setApiBaseInput(appCfg.apiBaseUrl); setModeOpen((o) => !o); }}
            title="数据模式：点击切换 Mock / API"
            style={{
              cursor: 'pointer', fontSize: '11px', fontWeight: 700, letterSpacing: '0.5px',
              padding: '3px 10px', borderRadius: '10px', userSelect: 'none',
              color: appCfg.dataMode === 'mock' ? '#52c41a' : '#1890ff',
              background: appCfg.dataMode === 'mock' ? '#f6ffed' : '#e6f7ff',
              border: '1px solid ' + (appCfg.dataMode === 'mock' ? '#b7eb8f' : '#91caff'),
            }}
          >
            {appCfg.dataMode === 'mock' ? 'MOCK' : 'API'}
          </div>

          {modeOpen && (
            <>
              <div style={{ position: 'fixed', inset: 0, zIndex: 1300 }} onClick={() => setModeOpen(false)} />
              <div style={{
                position: 'absolute', right: 0, top: 'calc(100% + 8px)', zIndex: 1301,
                background: '#fff', border: '1px solid var(--border)', borderRadius: '8px',
                boxShadow: '0 4px 16px rgba(0,0,0,0.15)', width: '270px', padding: '14px',
              }}>
                <div style={{ fontSize: '13px', fontWeight: 600, marginBottom: '8px' }}>数据模式</div>
                {([['mock', 'Mock 模式', '本地内置数据'], ['api', 'API 模式', '请求真实后端']] as const).map(([value, label, desc]) => (
                  <button key={value}
                    onClick={() => handleSwitchMode(value)}
                    style={{
                      display: 'flex', width: '100%', alignItems: 'center', gap: '8px',
                      padding: '8px 10px', marginBottom: '6px', cursor: 'pointer', textAlign: 'left',
                      background: appCfg.dataMode === value ? '#e6f7ff' : '#fafafa',
                      border: '1px solid ' + (appCfg.dataMode === value ? 'var(--primary)' : 'var(--border)'),
                      borderRadius: '6px', fontSize: '13px',
                    }}
                  >
                    <span style={{ fontWeight: 600 }}>{label}</span>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{desc}</span>
                    {appCfg.dataMode === value && <span style={{ marginLeft: 'auto', color: 'var(--primary)', fontWeight: 700 }}>✓</span>}
                  </button>
                ))}

                <div style={{ fontSize: '13px', fontWeight: 600, margin: '12px 0 6px' }}>运行态（登录方式）</div>
                {([['development', '开发态', '可用免密登录'], ['production', '生产态', '仅账号密码登录']] as const).map(([value, label, desc]) => (
                  <button key={value}
                    onClick={() => appConfigStore.setRunState(value as RunState)}
                    style={{
                      display: 'flex', width: '100%', alignItems: 'center', gap: '8px',
                      padding: '8px 10px', marginBottom: '6px', cursor: 'pointer', textAlign: 'left',
                      background: appCfg.runState === value ? '#f6ffed' : '#fafafa',
                      border: '1px solid ' + (appCfg.runState === value ? '#52c41a' : 'var(--border)'),
                      borderRadius: '6px', fontSize: '13px',
                    }}
                  >
                    <span style={{ fontWeight: 600 }}>{label}</span>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{desc}</span>
                    {appCfg.runState === value && <span style={{ marginLeft: 'auto', color: '#52c41a', fontWeight: 700 }}>✓</span>}
                  </button>
                ))}

                <div style={{ fontSize: '13px', fontWeight: 600, margin: '12px 0 6px' }}>API 地址</div>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <input
                    value={apiBaseInput}
                    onChange={(e) => setApiBaseInput(e.target.value)}
                    placeholder="/klsjnh/system011（或 http://host:port/klsjnh/system011）"
                    style={{ flex: 1, height: '30px', padding: '0 8px', border: '1px solid var(--border)', borderRadius: '6px', fontSize: '12px', outline: 'none' }}
                  />
                  <button className="btn btn-primary btn-sm" onClick={() => appConfigStore.setApiBaseUrl(apiBaseInput.trim())}>保存</button>
                </div>

                {appCfg.lastApiError && (
                  <div style={{ marginTop: '10px', fontSize: '11px', color: 'var(--danger)', wordBreak: 'break-all' }}>
                    最近错误：{appCfg.lastApiError}
                  </div>
                )}
                <div style={{ marginTop: '10px', fontSize: '11px', color: 'var(--text-muted)' }}>
                  切换模式后自动重新加载数据；也可用环境变量 VITE_DATA_MODE / VITE_API_BASE_URL 设置默认值
                </div>
              </div>
            </>
          )}
        </div>

        {/* 消息通知铃铛（点击跳转，红点显示未读数） */}
        <div
          onClick={() => onNavigate('/notifications')}
          title="消息通知"
          style={{ position: 'relative', cursor: 'pointer', fontSize: '18px', lineHeight: 1, padding: '4px', userSelect: 'none' }}
        >
          🔔
          {unread > 0 && (
            <span style={{
              position: 'absolute', top: '-6px', right: '-9px', background: '#f5222d', color: '#fff',
              fontSize: '10px', minWidth: '16px', height: '16px', borderRadius: '8px', padding: '0 4px',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600, boxSizing: 'border-box',
            }}>
              {unread > 99 ? '99+' : unread}
            </span>
          )}
        </div>

        <div style={{ position: 'relative' }}>
          <div
            className="header-user"
            onClick={() => setUserMenuOpen((o) => !o)}
            style={{ cursor: 'pointer', userSelect: 'none', display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <img className="header-avatar" src={user?.avatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=default'} alt="" />
            <span className="header-username">{user?.realName || '未登录'}</span>
            <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>▾</span>
          </div>

          {userMenuOpen && (
            <>
              <div style={{ position: 'fixed', inset: 0, zIndex: 1300 }} onClick={() => setUserMenuOpen(false)} />
              <div style={{
                position: 'absolute', right: 0, top: 'calc(100% + 8px)', zIndex: 1301,
                background: '#fff', border: '1px solid var(--border)', borderRadius: '8px',
                boxShadow: '0 4px 16px rgba(0,0,0,0.15)', minWidth: '150px', padding: '4px',
              }}>
                <button style={menuItemStyle} onClick={() => { onNavigate('/profile'); setUserMenuOpen(false); }}>👤 个人信息</button>
                <button style={menuItemStyle}
                  onClick={() => { setPwdForm({ oldPwd: '', newPwd: '', confirmPwd: '' }); setPwdError(''); setPwdModal(true); setUserMenuOpen(false); }}>
                  🔑 修改密码
                </button>
                <div style={{ height: '1px', background: 'var(--border-light)', margin: '4px 0' }} />
                <button style={{ ...menuItemStyle, color: 'var(--danger)' }} onClick={handleLogout}>🚪 退出登录</button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* 修改密码弹窗 */}
      {pwdModal && (
        <Modal title="修改密码" onClose={() => setPwdModal(false)} width={400}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {([['oldPwd', '原密码'], ['newPwd', '新密码（至少 6 位）'], ['confirmPwd', '确认新密码']] as const).map(([key, label]) => (
              <div key={key}>
                <div style={{ fontSize: '13px', marginBottom: '4px' }}>{label}</div>
                <input
                  type="password"
                  style={{ width: '100%', height: '38px', padding: '0 12px', border: '1px solid var(--border)', borderRadius: 'var(--radius)', fontSize: '14px', outline: 'none' }}
                  value={pwdForm[key]}
                  onChange={(e) => setPwdForm((f) => ({ ...f, [key]: e.target.value }))}
                />
              </div>
            ))}
            {pwdError && <div style={{ fontSize: '12px', color: 'var(--danger)' }}>{pwdError}</div>}
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '16px' }}>
            <button className="btn btn-default" onClick={() => setPwdModal(false)}>取消</button>
            <button className="btn btn-primary" onClick={handleSavePwd}>保存</button>
          </div>
        </Modal>
      )}
    </header>
  );
};
