/**
 * 定时任务列表页（julyScheduler）- antd 版
 * 列表读 julySchedulerStore；分页/保存/启停调 julySchedulerService。
 * 字段直接对齐后端：schedulerCode/schedulerName/schedulerHandler/schedulerCron/status。
 */
import React, { useEffect, useState } from 'react';
import { Button, Card, Col, Form, Input, Modal, Popconfirm, Row, Select, Space, Table, Tag } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { useSchedulerState } from '@/stores/system011/julySchedulerStore';
import {
  fetchSchedulerPage, saveScheduler, startScheduler, stopScheduler, runSchedulerOnce, removeSchedulers,
} from '@/services/system011';
import { STATUS_OPTIONS } from '@/config/constants';
import { toast } from '@/utils/toast';
import type { JulySchedulerVo011 } from '@/types/system011/julyScheduler';

export const JulyScheduler = () => {
  const { list, total, loading, query } = useSchedulerState();
  const [modal, setModal] = useState<{ open: boolean; node: JulySchedulerVo011 | null }>({ open: false, node: null });
  const [form] = Form.useForm();

  useEffect(() => { fetchSchedulerPage({ pageIndex: 1, pageSize: 10 }); }, []);
  useEffect(() => {
    if (!modal.open) return;
    form.setFieldsValue({
      schedulerCode: modal.node?.schedulerCode || '',
      schedulerName: modal.node?.schedulerName || '',
      schedulerHandler: modal.node?.schedulerHandler || '',
      schedulerCron: modal.node?.schedulerCron || '',
      status: modal.node?.status || '0',
    });
  }, [modal, form]);

  const handleSave = async () => {
    const v = await form.validateFields();
    await saveScheduler({ id: modal.node?.id, schedulerCode: v.schedulerCode, schedulerName: v.schedulerName, schedulerHandler: v.schedulerHandler, schedulerCron: v.schedulerCron, status: v.status });
    toast.success('保存成功');
    setModal({ open: false, node: null });
  };

  const columns: ColumnsType<JulySchedulerVo011> = [
    { title: '任务编码', dataIndex: 'schedulerCode', width: 140 },
    { title: '任务名称', dataIndex: 'schedulerName', width: 230 },
    { title: '处理器', dataIndex: 'schedulerHandler', width: 260 },
    { title: 'Cron', dataIndex: 'schedulerCron', width: 160, render: (v) => <code>{v}</code> },
    { title: '执行次数', dataIndex: 'executeTimes', width: 90 },
    { title: '状态', dataIndex: 'status', width: 90, render: (s) => <Tag color={s === '1' ? 'green' : 'default'}>{s === '1' ? '运行中' : '已停止'}</Tag> },
    {
      title: '操作', key: 'action', width: 240, fixed: 'right',
      render: (_, r) => (
        <Space size="small">
          <Button type="link" size="small" onClick={() => setModal({ open: true, node: r })}>编辑</Button>
          {r.status === '1'
            ? <Button type="link" size="small" onClick={() => stopScheduler(r.id)}>停止</Button>
            : <Button type="link" size="small" onClick={() => startScheduler(r.id)}>启动</Button>}
          <Button type="link" size="small" onClick={() => runSchedulerOnce(r.id)}>执行一次</Button>
          <Popconfirm title="确定删除这个定时任务吗？" okText="删除" cancelText="取消" okButtonProps={{ danger: true }} onConfirm={() => removeSchedulers([r.id])}>
            <Button type="link" size="small" danger>删除</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div className="page-header">
        <h2>定时任务</h2>
        <p>共 {total} 个任务 · 接口 /julyScheduler/v1/selectListByPage</p>
      </div>

      <div className="page-toolbar">
        <div className="toolbar-left">
          <Input.Search
            allowClear
            placeholder="搜索编码 / 名称"
            className="search-input"
            onSearch={(v) => fetchSchedulerPage({ pageIndex: 1, schedulerName: v || undefined })}
          />
        </div>
        <div className="toolbar-right">
          <Button type="primary" onClick={() => { form.resetFields(); setModal({ open: true, node: null }); }}>+ 新建任务</Button>
        </div>
      </div>

      <Card className="table-wrapper" styles={{ body: { padding: 0 } }}>
        <Table<JulySchedulerVo011>
          rowKey="id"
          columns={columns}
          dataSource={list}
          loading={loading}
          scroll={{ x: 1100 }}
          pagination={{
            current: query.pageIndex,
            pageSize: query.pageSize,
            total,
            showSizeChanger: true,
            pageSizeOptions: [10, 50, 100],
            showTotal: (t) => `共 ${t} 条`,
            onChange: (pageIndex, pageSize) => fetchSchedulerPage({ pageIndex, pageSize }),
          }}
        />
      </Card>

      <Modal title={modal.node ? '编辑任务' : '新建任务'} open={modal.open} onCancel={() => setModal({ open: false, node: null })}
        onOk={handleSave} okText="保存" cancelText="取消" destroyOnClose>
        <Form form={form} layout="vertical" preserve={false}>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="schedulerCode" label="任务编码" rules={[{ required: true, message: '请输入任务编码' }]}>
                <Input disabled={!!modal.node} placeholder="如 dataBackup" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="schedulerName" label="任务名称" rules={[{ required: true, message: '请输入任务名称' }]}><Input /></Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="schedulerHandler" label="处理器" rules={[{ required: true, message: '请输入处理器' }]}><Input placeholder="后端 bean/方法名" /></Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="schedulerCron" label="Cron 表达式" rules={[{ required: true, message: '请输入 Cron' }]}><Input placeholder="如 0 2 * * *" /></Form.Item>
            </Col>
          </Row>
          <Form.Item name="status" label="状态" rules={[{ required: true, message: '请选择状态' }]}>
            <Select options={STATUS_OPTIONS} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};