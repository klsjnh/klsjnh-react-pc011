/**
 * 登录页 - PC 端（对齐老项目 klsjnh-react-java8-dev011/src/pages/home/Login.tsx）
 *
 * 老项目用 Tabs 两个页签，不是两个按钮：
 *   - 「用户名」     → 免密登录  julyUser/v1/loginByUserName（仅 development 运行态）
 *   - 「用户名密码」 → 密码登录  julyUser/v1/login（任何运行态）
 *
 * 支持开发态快捷登录：URL 带 ?userName=klsjnh 自动预填（见 src/utils/devLogin.ts）。
 * mock / api 两模式共用 authStore 登录方法，解包逻辑一致。
 */
import React, { useState, useEffect, useCallback } from 'react';
import { authStore } from '../stores/authStore';
import { isDevelopment, useAppConfig } from '../config/appConfig';
import { readDevLoginUserName } from '../utils/devLogin';

type LoginTab = 'username' | 'password';

const DEFAULT_USER_NAME = 'klsjnh';

export const LoginPage: React.FC = () => {
  const { dataMode, runState } = useAppConfig();
  const devMode = isDevelopment();

  const [activeTab, setActiveTab] = useState<LoginTab>('username');
  const [loading, setLoading] = useState(false);
  const [userName, setUserName] = useState(
    () => readDevLoginUserName(window.location.search, window.location.hash) || DEFAULT_USER_NAME,
  );
  const [passWord, setPassWord] = useState('');
  const [error, setError] = useState('');

  /** 开发态快捷登录：?userName=xxx */
  useEffect(() => {
    const fromUrl = readDevLoginUserName(window.location.search, window.location.hash);
    if (fromUrl) setUserName(fromUrl);
  }, []);

  /** 免密登录（「用户名」页签；仅 development 运行态） */
  const handleUsernameLogin = useCallback(async () => {
    setError('');
    const name = userName.trim();
    if (!name) { setError('请输入用户名'); return; }
    setLoading(true);
    try {
      await authStore.loginByUserNameApi(name);
    } catch (e: any) {
      setError(e?.message || '免密登录失败（生产态不可用，请切换到「用户名密码」页签）');
    } finally {
      setLoading(false);
    }
  }, [userName]);

  /** 密码登录（「用户名密码」页签；任何运行态） */
  const handlePasswordLogin = useCallback(async () => {
    setError('');
    const name = userName.trim();
    if (!name) { setError('请输入用户名'); return; }
    if (!passWord) { setError('请输入密码'); return; }
    setLoading(true);
    try {
      await authStore.loginWithApi(name, passWord);
    } catch (e: any) {
      setError(e?.message || '登录失败，请检查账号密码');
    } finally {
      setLoading(false);
    }
  }, [userName, passWord]);

  const tabStyle = (active: boolean): React.CSSProperties => ({
    flex: 1,
    padding: '10px 0',
    textAlign: 'center',
    fontSize: '14px',
    cursor: 'pointer',
    color: active ? 'var(--primary, #1677ff)' : 'var(--text-muted)',
    borderBottom: `2px solid ${active ? 'var(--primary, #1677ff)' : 'transparent'}`,
    fontWeight: active ? 600 : 400,
    background: 'transparent',
    border: 'none',
    borderBottomWidth: '2px',
    borderBottomStyle: 'solid',
    borderBottomColor: active ? 'var(--primary, #1677ff)' : 'transparent',
  });

  return (
    <div className="login-page">
      <div className="login-box">
        <h2>🏢 企业管理系统</h2>

        <div style={{ fontSize: '12px', color: 'var(--text-muted)', textAlign: 'center', marginBottom: '16px' }}>
          {dataMode === 'mock' ? 'MOCK' : 'API'}
          {' · '}
          {runState === 'development' ? '开发态' : '生产态'}
        </div>

        {/* 两个页签：用户名（免密） / 用户名密码 */}
        <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', marginBottom: '18px' }}>
          <button type="button" style={tabStyle(activeTab === 'username')} onClick={() => { setActiveTab('username'); setError(''); }}>
            用户名
          </button>
          <button type="button" style={tabStyle(activeTab === 'password')} onClick={() => { setActiveTab('password'); setError(''); }}>
            用户名密码
          </button>
        </div>

        {error && (
          <div style={{ padding: '10px 14px', background: '#fff2f0', border: '1px solid #ffccc7', borderRadius: '8px', marginBottom: '16px', fontSize: '13px', color: 'var(--danger, #d4380d)' }}>
            ⚠ {error}
          </div>
        )}

        <div className="login-form">
          <input
            className="form-input"
            placeholder="用户名"
            value={userName}
            onChange={(e) => setUserName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && (activeTab === 'username' ? handleUsernameLogin() : handlePasswordLogin())}
          />

          {/* 仅「用户名密码」页签显示密码框 */}
          {activeTab === 'password' && (
            <input
              className="form-input"
              type="password"
              placeholder="密码"
              value={passWord}
              onChange={(e) => setPassWord(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handlePasswordLogin()}
            />
          )}

          <button
            className="login-btn"
            onClick={activeTab === 'username' ? handleUsernameLogin : handlePasswordLogin}
            disabled={loading}
          >
            {loading ? '登录中...' : '登录'}
          </button>

          <div style={{ fontSize: '12px', color: 'var(--text-muted)', textAlign: 'center', marginTop: '8px' }}>
            {activeTab === 'username'
              ? (devMode
                  ? '免密登录：只填用户名即可（可用 klsjnh / zhangsan / lisi）'
                  : '免密登录仅开发态可用，请切到「用户名密码」页签')
              : '密码与用户名相同，例如 klsjnh / klsjnh'}
          </div>
        </div>
      </div>
    </div>
  );
};
