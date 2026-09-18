/**
 * 业务中心页 - PC 端（antd，分组宫格入口）
 * 图标统一取自 @ant-design/icons（组件引用，类型可校验），不再使用 emoji。
 */
import React from 'react';
import { Card, Col, Row } from 'antd';
import {
  AreaChartOutlined,
  BarChartOutlined,
  BellOutlined,
  BookOutlined,
  CalculatorOutlined,
  ClearOutlined,
  ControlOutlined,
  DatabaseOutlined,
  DesktopOutlined,
  ExportOutlined,
  FieldTimeOutlined,
  FileSearchOutlined,
  HddOutlined,
  InfoCircleOutlined,
  LineChartOutlined,
  MailOutlined,
  MonitorOutlined,
  NotificationOutlined,
  PieChartOutlined,
  QuestionCircleOutlined,
  SettingOutlined,
  SyncOutlined,
  ToolOutlined,
  UserSwitchOutlined,
} from '@ant-design/icons';
import type { BusinessPageProps } from '@/types/view/page';
import type { BizEntry } from '@/types/view/business';
import type { NavIcon } from '@/types/view/layout';

export const BusinessPage = ({ onNavigate }: BusinessPageProps) => {
  const groups: { icon: NavIcon; title: string; items: BizEntry[] }[] = [
    {
      icon: SettingOutlined,
      title: '配置管理',
      items: [
        { icon: SettingOutlined, label: '配置管理', path: '/business/config', color: '#e6f7ff' },
        { icon: FieldTimeOutlined, label: '定时任务', path: '/business/scheduler', color: '#f6ffed' },
        { icon: DatabaseOutlined, label: '数据源', path: '/business/datasource', color: '#fff7e6' },
        { icon: HddOutlined, label: '存储中心', path: '/business/storage', color: '#f9f0ff' },
        { icon: ControlOutlined, label: '参数设置', path: '/business/params', color: '#e6fffb' },
        { icon: BookOutlined, label: '字典管理', path: '/business/dict', color: '#fff1f0' },
        { icon: MailOutlined, label: '通知模板', path: '/business/template', color: '#fffbe6' },
        { icon: NotificationOutlined, label: '消息推送', path: '/business/push', color: '#f0f5ff' },
      ],
    },
    {
      icon: BarChartOutlined,
      title: '数据分析',
      items: [
        { icon: AreaChartOutlined, label: '数据报表', path: '/reports', color: '#f6ffed' },
        { icon: BarChartOutlined, label: '数据统计', path: '/business/stats', color: '#e6f7ff' },
        { icon: LineChartOutlined, label: '趋势分析', path: '/business/trend', color: '#fff7e6' },
        { icon: PieChartOutlined, label: '图表展示', path: '/business/charts', color: '#f9f0ff' },
        { icon: ExportOutlined, label: '数据导出', path: '/business/export', color: '#e6fffb' },
        { icon: DesktopOutlined, label: '数据大屏', path: '/business/dashboard', color: '#fff1f0' },
        { icon: CalculatorOutlined, label: '数据计算', path: '/business/calc', color: '#fffbe6' },
      ],
    },
    {
      icon: ToolOutlined,
      title: '系统工具',
      items: [
        { icon: BellOutlined, label: '消息通知', path: '/notifications', color: '#fff7e6' },
        { icon: FileSearchOutlined, label: '审计日志', path: '/audit', color: '#f5f5f5' },
        { icon: QuestionCircleOutlined, label: '帮助反馈', path: '/help', color: '#e6f7ff' },
        { icon: InfoCircleOutlined, label: '关于系统', path: '/about', color: '#f6ffed' },
        { icon: MonitorOutlined, label: '系统监控', path: '/business/monitor', color: '#fff1f0' },
        { icon: UserSwitchOutlined, label: '在线用户', path: '/business/online', color: '#e6fffb' },
        { icon: ClearOutlined, label: '缓存管理', path: '/business/cache', color: '#fffbe6' },
        { icon: SyncOutlined, label: '服务日志', path: '/business/servicelog', color: '#f0f5ff' },
      ],
    },
  ];

  return (
    <div>
      <div className="page-header"><h2>业务中心</h2><p>配置 · 数据 · 工具</p></div>
      {groups.map((group) => {
        const GroupIcon = group.icon;
        return (
          <Card
            key={group.title}
            title={<span className="flex-center gap-2"><GroupIcon />{group.title}</span>}
            className="mb-4"
          >
            <Row gutter={[16, 16]}>
              {group.items.map((item) => {
                const ItemIcon = item.icon;
                return (
                  <Col span={3} key={item.label}>
                    <div className="biz-entry" onClick={() => onNavigate?.(item.path)}>
                      <div className="biz-entry-icon" style={{ background: item.color }}><ItemIcon /></div>
                      <span className="text-secondary text-xs">{item.label}</span>
                    </div>
                  </Col>
                );
              })}
            </Row>
          </Card>
        );
      })}
    </div>
  );
};
