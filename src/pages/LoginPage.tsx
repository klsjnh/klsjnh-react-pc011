/**
 * 登录页 - PC 端
 */
import React, { useState, useCallback } from 'react';
import { authStore } from '../stores/authStore';

export const LoginPage: React.FC = () => {
  const [form, setForm] = useState({ username: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = useCallback(async () => {
    setError('');
    if (!form.username.trim()) { setError('请输入用户名'); return; }
    if (!form.password.trim()) { setError('请输入密码'); return; }

    setLoading(true);
    try {
      // Mock 登录
      await new Promise(r => setTimeout(r, 800));
      const users: Record<string, string> = { admin: 'admin123', manager: 'manager123' };
      if (users[form.username] === form.password) {
        authStore.login(`token-${Date.now()}`, {
          id: 1, username: form.username,
          realName: form.username === 'admin' ? '超级管理员' : '部门经理',
          avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${form.username}`,
          roles: [form.username],
        });
      } else {
        setError('用户名或密码错误');
      }
    } finally {
      setLoading(false);
    }
  }, [form]);

  return (
    <div className="login-page">
      <div className="login-box">
        <h2>🏢 企业管理系统</h2>
        {error && (
          <div style={{ padding: '10px 14px', background: '#fff2f0', border: '1px solid #ffccc7', borderRadius: '8px', marginBottom: '16px', fontSize: '13px', color: 'var(--danger)' }}>
            ⚠ {error}
          </div>
        )}
        <div className="login-form">
          <input className="form-input" placeholder="用户名" value={form.username}
            onChange={(e) => setForm(f => ({ ...f, username: e.target.value }))} />
          <input className="form-input" type="password" placeholder="密码" value={form.password}
            onChange={(e) => setForm(f => ({ ...f, password: e.target.value }))}
            onKeyDown={(e) => e.key === 'Enter' && handleLogin()} />
          <button className="login-btn" onClick={handleLogin} disabled={loading}>
            {loading ? '登录中...' : '登 录'}
          </button>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', textAlign: 'center' }}>
            测试账号: admin / admin123
          </div>
        </div>
      </div>
    </div>
  );
};
