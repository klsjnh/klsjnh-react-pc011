/**
 * 仪表盘页 - PC 端
 */
import React from 'react';

export const DashboardPage: React.FC = () => {
  const stats = [
    { label: '用户总数', value: '12,480', change: '+12.5%', up: true, icon: '👥', color: '#1890ff' },
    { label: '今日活跃', value: '3,256', change: '+8.3%', up: true, icon: '⚡', color: '#52c41a' },
    { label: '今日订单', value: '186', change: '-2.4%', up: false, icon: '📦', color: '#faad14' },
    { label: '系统通知', value: '5', change: '', up: true, icon: '🔔', color: '#f5222d' },
  ];

  const recentLogs = [
    { time: '10:30:15', user: 'admin', action: '登录系统', ip: '192.168.1.100' },
    { time: '10:29:58', user: 'manager', action: '修改用户权限', ip: '192.168.1.101' },
    { time: '10:28:42', user: 'editor01', action: '更新配置', ip: '172.16.0.10' },
    { time: '10:27:20', user: 'admin', action: '创建角色', ip: '192.168.1.100' },
    { time: '10:25:15', user: 'viewer01', action: '查看报表', ip: '192.168.1.200' },
  ];

  return (
    <div>
      <div className="page-header">
        <h2>仪表盘</h2>
        <p>系统运行概览</p>
      </div>

      {/* 统计卡片 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '20px' }}>
        {stats.map(s => (
          <div key={s.label} style={{ background: 'var(--bg-card)', borderRadius: 'var(--radius)', padding: '20px', boxShadow: 'var(--shadow)', borderTop: `3px solid ${s.color}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{s.label}</div>
                <div style={{ fontSize: '28px', fontWeight: 700, marginTop: '4px' }}>{s.value}</div>
              </div>
              <div style={{ fontSize: '32px' }}>{s.icon}</div>
            </div>
            {s.change && (
              <div style={{ fontSize: '12px', color: s.up ? '#52c41a' : '#f5222d', marginTop: '8px' }}>
                {s.up ? '↑' : '↓'} {s.change} 较昨日
              </div>
            )}
          </div>
        ))}
      </div>

      {/* 最近日志 */}
      <div className="table-wrapper">
        <div style={{ padding: '16px', fontWeight: 600, borderBottom: '1px solid var(--border-light)' }}>最近操作日志</div>
        <table className="data-table">
          <thead>
            <tr><th>时间</th><th>用户</th><th>操作</th><th>IP 地址</th></tr>
          </thead>
          <tbody>
            {recentLogs.map((log, i) => (
              <tr key={i}>
                <td style={{ color: 'var(--text-muted)' }}>{log.time}</td>
                <td style={{ fontWeight: 500 }}>{log.user}</td>
                <td>{log.action}</td>
                <td style={{ color: 'var(--text-muted)' }}>{log.ip}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
