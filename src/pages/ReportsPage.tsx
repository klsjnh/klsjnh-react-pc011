/**
 * 数据报表页 - PC 端（antd）
 */
import React from 'react';
import { Button, Card, Col, Row, Statistic } from 'antd';

export const ReportsPage = () => {
  const chartData = [
    { label: '周一', value: 65 }, { label: '周二', value: 78 },
    { label: '周三', value: 52 }, { label: '周四', value: 91 },
    { label: '周五', value: 84 }, { label: '周六', value: 45 },
    { label: '周日', value: 38 },
  ];
  const maxValue = Math.max(...chartData.map((d) => d.value));

  const summary = [
    { label: '今日访问', value: '3,256', change: '+12%', up: true },
    { label: '今日订单', value: '186', change: '+8%', up: true },
    { label: '今日收入', value: '¥4.2万', change: '-3%', up: false },
    { label: '转化率', value: '5.7%', change: '+1.2%', up: true },
  ];

  return (
    <div>
      <div className="page-header"><h2>数据报表</h2><p>近 7 天业务数据趋势</p></div>
      <Row gutter={16}>
        <Col span={16}>
          <Card title="访问量趋势">
            <div className="bar-chart" style={{ height: 200 }}>
              {chartData.map((item) => (
                <div className="bar-col" key={item.label}>
                  <div className="bar-label">{item.value}</div>
                  <div className="bar-fill" style={{ height: `${(item.value / maxValue) * 100}%` }} />
                  <div className="bar-label">{item.label}</div>
                </div>
              ))}
            </div>
          </Card>
        </Col>
        <Col span={8}>
          <Card title="数据汇总">
            {summary.map((item) => (
              <div key={item.label} className="mb-4">
                <Statistic title={item.label} value={item.value} />
                <div className="text-xs" style={{ color: item.up ? '#52c41a' : '#f5222d' }}>
                  {item.up ? '↑' : '↓'} {item.change}
                </div>
              </div>
            ))}
          </Card>
        </Col>
      </Row>
      <Button type="primary" className="mt-4">导出报表</Button>
    </div>
  );
};
