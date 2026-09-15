/**
 * 关于我们页 - PC 端（antd）
 * 图标统一取自 @ant-design/icons，不再使用 emoji。
 */
import React from 'react';
import { Card, Col, Row, Tag, Typography } from 'antd';
import {
  ApartmentOutlined,
  AppstoreOutlined,
  AreaChartOutlined,
  GlobalOutlined,
  KeyOutlined,
  MailOutlined,
  MenuOutlined,
  PhoneOutlined,
  TeamOutlined,
} from '@ant-design/icons';
import type { NavIcon } from '@/types/view/layout';

export const AboutPage = () => {
  const features: { icon: NavIcon; label: string; desc: string }[] = [
    { icon: TeamOutlined, label: '用户管理', desc: '完整的用户账号管理体系' },
    { icon: KeyOutlined, label: '权限管理', desc: '细粒度的角色与菜单权限控制' },
    { icon: MenuOutlined, label: '菜单管理', desc: '灵活的导航菜单配置' },
    { icon: AppstoreOutlined, label: '业务中心', desc: '配置、数据、工具一站式管理' },
    { icon: AreaChartOutlined, label: '数据报表', desc: '多维度业务数据分析' },
  ];
  const techStack = ['React 19', 'TypeScript', 'Vite 6', 'React Router', 'Zustand', 'Ant Design'];

  return (
    <div>
      <div className="page-header"><h2>关于我们</h2><p>Enterprise Admin Framework</p></div>

      <Card className="table-wrapper text-center mb-4" styles={{ body: { padding: 32 } }}>
        <div className="text-primary" style={{ fontSize: 56 }}><ApartmentOutlined /></div>
        <div style={{ fontSize: 20, fontWeight: 700 }}>企业管理系统</div>
        <Typography.Text type="secondary">Enterprise Admin Framework v1.0.0 (PC 端)</Typography.Text>
      </Card>

      <Row gutter={16}>
        <Col span={12}>
          <Card title="功能特性">
            {features.map((item) => {
              const ItemIcon = item.icon;
              return (
                <div key={item.label} className="flex-center mb-4" style={{ gap: 12 }}>
                  <span className="text-primary" style={{ fontSize: 22 }}><ItemIcon /></span>
                  <div>
                    <div style={{ fontWeight: 500 }}>{item.label}</div>
                    <Typography.Text type="secondary" className="text-xs">{item.desc}</Typography.Text>
                  </div>
                </div>
              );
            })}
          </Card>
        </Col>
        <Col span={12}>
          <Card title="技术栈" className="mb-4">
            <div className="flex-center gap-2" style={{ flexWrap: 'wrap' }}>
              {techStack.map((tech) => <Tag key={tech} color="blue">{tech}</Tag>)}
            </div>
          </Card>
          <Card title="联系我们">
            <div className="text-secondary flex-center gap-2"><MailOutlined />support@enterprise.com</div>
            <div className="text-secondary mt-2 flex-center gap-2"><PhoneOutlined />400-123-4567</div>
            <div className="text-secondary mt-2 flex-center gap-2"><GlobalOutlined />www.enterprise.com</div>
          </Card>
        </Col>
      </Row>

      <div className="text-center text-muted text-xs mt-4">© 2026 Enterprise Admin Framework. All rights reserved.</div>
    </div>
  );
};
