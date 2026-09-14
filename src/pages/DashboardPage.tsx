/**
 * 仪表盘页 - PC 端（antd）
 */
import React from 'react';
import { Card, Col, Row, Statistic, Table } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import type { RecentLog } from '@/types/view/business';

export const DashboardPage: React.FC = () => {
  const stats = [
    { label: '用户总数', value: '12,480', change: '+12.5%', up: true, color: '#1890ff' },
    { label: '今日活跃', value: '3,256', change: '+8.3%', up: true, color: '#52c41a' },
    { label: '今日订单', value: '186', change: '-2.4%', up: false, color: '#faad14' },
    { label: '系统通知', value: '5', change: '', up: true, color: '#f5222d' },
  ];

  const recentLogs: RecentLog[] = [
    { time: '10:30:15', user: 'admin', action: '登录系统', ip: '192.168.1.100' },
    { time: '10:29:58', user: 'manager', action: '修改用户权限', ip: '192.168.1.101' },
    { time: '10:28:42', user: 'editor01', action: '更新配置', ip: '172.16.0.10' },
    { time: '10:27:20', user: 'admin', action: '创建角色', ip: '192.168.1.100' },
  ];

  const columns: ColumnsType<RecentLog> = [
    { title: '时间', dataIndex: 'time' },
    { title: '用户', dataIndex: 'user' },
    { title: '操作', dataIndex: 'action' },
    { title: 'IP 地址', dataIndex: 'ip' },
  ];

  return (
    <div>
      <div className="page-header"><h2>仪表盘</h2><p>系统运行概览</p></div>
      <Row gutter={[16, 16]} style={{ marginBottom: 20 }}>
        {stats.map((s) => (
          <Col span={6} key={s.label}>
            <Card>
              <Statistic title={s.label} value={s.value} valueStyle={{ color: s.color }} />
              {s.change && (
                <div className="text-sm mt-8" style={{ color: s.up ? '#52c41a' : '#f5222d' }}>
                  {s.up ? '↑' : '↓'} {s.change} 较昨日
                </div>
              )}
            </Card>
          </Col>
        ))}
      </Row>
      <Card title="最近操作日志" className="table-wrapper" styles={{ body: { padding: 0 } }}>
        <Table<RecentLog> rowKey={(r) => `${r.time}-${r.user}`} columns={columns} dataSource={recentLogs} pagination={false} />
      </Card>
    </div>
  );
};
