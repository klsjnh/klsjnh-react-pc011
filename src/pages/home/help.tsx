/**
 * 帮助与反馈页 - PC 端（antd：FAQ 折叠 + 反馈表单 + 反馈历史）
 * 位置：src/pages/home/help.tsx
 */
import React, { useState } from 'react';
import { Button, Card, Col, Collapse, Form, Input, Modal, Row, Segmented, Table, Tag } from 'antd';
import { ClockCircleOutlined, MailOutlined, MessageOutlined, PhoneOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import type { FeedbackItem } from '@/types/view/page';

export const HelpPage = () => {
  const [category, setCategory] = useState('问题反馈');
  const [form] = Form.useForm();
  const [feedbackHistory, setFeedbackHistory] = useState<FeedbackItem[]>([
    { id: 1, category: '功能建议', content: '希望增加深色模式支持', time: '2026-09-10 14:30', status: 'replied', reply: '感谢您的建议，深色模式已在开发计划中。' },
    { id: 2, category: '问题反馈', content: '用户列表页面加载较慢', time: '2026-09-08 09:15', status: 'pending' },
  ]);

  const faqs = [
    { q: '如何创建新用户？', a: '进入「用户管理」→ 点击「+ 新建用户」→ 填写用户名、姓名、邮箱、手机号、组织、角色、密码 → 保存。' },
    { q: '如何修改用户权限？', a: '进入「权限管理」→ 左侧选择角色 → 在「菜单权限」页签勾选 → 保存。' },
    { q: '如何调整菜单结构？', a: '进入「菜单管理」→ 左侧树右键新建子菜单/编辑/删除 → 拖拽调整层级。' },
    { q: '如何导出数据？', a: '进入「业务中心 → 数据导出」→ 选择对象与格式（CSV/JSON）→ 导出，文件自动下载。' },
  ];

  const columns: ColumnsType<FeedbackItem> = [
    { title: '分类', dataIndex: 'category', width: 100, render: (v) => <Tag color="blue">{v}</Tag> },
    { title: '反馈内容', dataIndex: 'content' },
    { title: '状态', dataIndex: 'status', width: 90, render: (s) => <Tag color={s === 'replied' ? 'green' : 'orange'}>{s === 'replied' ? '已回复' : '待处理'}</Tag> },
    { title: '官方回复', dataIndex: 'reply', render: (v) => v || '—' },
    { title: '时间', dataIndex: 'time', width: 160 },
  ];

  const onFinish = (values: { content: string; contact?: string }) => {
    setFeedbackHistory((prev) => [{
      id: Date.now(),
      category,
      content: values.content,
      time: new Date().toLocaleString('zh-CN'),
      status: 'pending',
    }, ...prev]);
    form.resetFields();
    Modal.success({ title: '提交成功', content: '您的反馈已提交，我们会尽快处理并回复您！' });
  };

  return (
    <div>
      <div className="page-header"><h2>帮助与反馈</h2><p>常见问题与意见反馈</p></div>

      <Row gutter={16}>
        <Col span={14}>
          <Card title={`常见问题 (${faqs.length})`}>
            <Collapse
              accordion
              items={faqs.map((faq, i) => ({ key: String(i), label: faq.q, children: <span className="text-secondary">{faq.a}</span> }))}
            />
          </Card>
        </Col>
        <Col span={10}>
          <Card title="意见反馈" className="mb-4">
            <Segmented
              block
              value={category}
              onChange={(v) => setCategory(String(v))}
              options={['问题反馈', '功能建议', '其他']}
              className="mb-4"
            />
            <Form form={form} layout="vertical" onFinish={onFinish}>
              <Form.Item name="content" rules={[{ required: true, message: '请描述您的问题或建议' }]}>
                <Input.TextArea rows={4} placeholder="请详细描述您的问题或建议..." />
              </Form.Item>
              <Form.Item name="contact">
                <Input placeholder="选填：手机号/邮箱，方便我们联系您" />
              </Form.Item>
              <Button type="primary" htmlType="submit" block>提交反馈</Button>
            </Form>
          </Card>
          <Card title="其他联系方式">
            <div className="text-secondary mb-2 flex-center gap-2"><MailOutlined />support@enterprise.com</div>
            <div className="text-secondary mb-2 flex-center gap-2"><PhoneOutlined />400-123-4567</div>
            <div className="text-secondary mb-2 flex-center gap-2"><MessageOutlined />EnterpriseAdmin</div>
            <div className="text-secondary flex-center gap-2"><ClockCircleOutlined />工作日 9:00-18:00</div>
          </Card>
        </Col>
      </Row>

      <Card title="反馈历史" className="table-wrapper mt-4" styles={{ body: { padding: 0 } }}>
        <Table<FeedbackItem> rowKey="id" columns={columns} dataSource={feedbackHistory} pagination={false} />
      </Card>
    </div>
  );
};
