/**
 * 数据报表页 - PC 端
 */
import React from 'react';

export const ReportsPage: React.FC = () => {
  const chartData = [
    { label: '周一', value: 65 }, { label: '周二', value: 78 },
    { label: '周三', value: 52 }, { label: '周四', value: 91 },
    { label: '周五', value: 84 }, { label: '周六', value: 45 },
    { label: '周日', value: 38 },
  ];
  const maxValue = Math.max(...chartData.map(d => d.value));

  return (
    <div>
      <div className="page-header"><h2>数据报表</h2><p>近7天业务数据趋势</p></div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '16px' }}>
        {/* 柱状图 */}
        <div className="table-wrapper" style={{ padding: '20px' }}>
          <div style={{ fontSize: '14px', fontWeight: 600, marginBottom: '16px' }}>访问量趋势</div>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: '12px', height: '200px' }}>
            {chartData.map((item) => (
              <div key={item.label} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{item.value}</div>
                <div style={{ width: '100%', height: `${(item.value / maxValue) * 100}%`, background: 'linear-gradient(180deg, #1890ff 0%, #69c0ff 100%)', borderRadius: '4px 4px 0 0', minHeight: '8px' }} />
                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{item.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* 数据汇总 */}
        <div className="table-wrapper" style={{ padding: '20px' }}>
          <div style={{ fontSize: '14px', fontWeight: 600, marginBottom: '16px' }}>数据汇总</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {[
              { label: '今日访问', value: '3,256', change: '+12%', up: true },
              { label: '今日订单', value: '186', change: '+8%', up: true },
              { label: '今日收入', value: '¥4.2万', change: '-3%', up: false },
              { label: '转化率', value: '5.7%', change: '+1.2%', up: true },
            ].map(item => (
              <div key={item.label} style={{ padding: '12px', background: '#f5f7fa', borderRadius: '8px' }}>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{item.label}</div>
                <div style={{ fontSize: '20px', fontWeight: 700, marginTop: '2px' }}>{item.value}</div>
                <div style={{ fontSize: '11px', color: item.up ? '#52c41a' : '#f5222d' }}>
                  {item.up ? '↑' : '↓'} {item.change}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={{ marginTop: '16px' }}>
        <button className="btn btn-primary">📥 导出报表</button>
      </div>
    </div>
  );
};
