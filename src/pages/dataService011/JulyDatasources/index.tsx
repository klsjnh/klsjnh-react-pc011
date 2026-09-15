/**
 * 数据源管理页面（dataservice011 · julyDatasource）- 标准 CRUD
 */
import React, { useState, useEffect } from 'react';
import { Button, Card, Form, Input, Modal, Popconfirm, Select, Space, Table, Tag } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { useDatasourceState } from '@/stores/dataservice011/julyDatasourceStore';
import { fetchDatasourcePage, saveDatasource, removeDatasource } from '@/services/dataservice011';
import { toast } from '@/utils/toast';
import type { DataSourceItem } from '@/types/dataservice011/datasource';

/** 数据源类型选项 */
const TYPE_OPTIONS = [
  { value: 'MySQL', label: 'MySQL' },
  { value: 'PostgreSQL', label: 'PostgreSQL' },
  { value: 'Redis', label: 'Redis' },
  { value: 'MongoDB', label: 'MongoDB' },
];

export const JulyDatasource = () => {
  const { list, total, loading, query } = useDatasourceState();
  const [modal, setModal] = useState<{ open: boolean; node: DataSourceItem | null }>({ open: false, node: null });
  const [form] = Form.useForm();

  useEffect(() => { fetchDatasourcePage({ pageIndex: 1, pageSize: 10 }); }, []);
  useEffect(() => {
    if (!modal.open) return;
    form.setFieldsValue({
      name: modal.node?.name || '',
      type: modal.node?.type || 'MySQL',
      host: modal.node?.host || '',
      database: modal.node?.database || '',
    });
  }, [modal, form]);

  const handleSave = async () => {
    const v = await form.validateFields();
    await saveDatasource({ id: modal.node?.id, ...v });
    toast.success('保存成功');
    setModal({ open: false, node: null });
  };

  const columns: ColumnsType<DataSourceItem> = [
    { title: '数据源名称', dataIndex: 'name', width: 160 },
    { title: '类型', dataIndex: 'type', width: 120, render: (v) => <Tag color="blue">{v}</Tag> },
    { title: '主机地址', dataIndex: 'host', render: (v) => <code>{v}</code> },
    { title: '数据库', dataIndex: 'database' },
    { title: '延迟', dataIndex: 'latency', width: 90, render: (v) => <span style={{ color: '#52c41a' }}>{v}</span> },
    { title: '状态', dataIndex: 'status', width: 90, render: (s) => <Tag color={s === 'connected' ? 'green' : 'red'}>{s === 'connected' ? '已连接' : '未连接'}</Tag> },
    {
      title: '操作', key: 'action', width: 140,
      render: (_, r) => (
        <Space size="small">
          <Button type="link" size="small" onClick={() => setModal({ open: true, node: r })}>编辑</Button>
          <Popconfirm title="确定删除这个数据源吗？" okText="删除" cancelText="取消" okButtonProps={{ danger: true }} onConfirm={() => removeDatasource(r.id)}>
            <Button type="link" size="small" danger>删除</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div className="page-header"><h2>数据源</h2><p>共 {total} 个数据源</p></div>
      <div className="page-toolbar">
        <div className="toolbar-left">
          <Input.Search allowClear placeholder="搜索数据源名称" className="search-input"
            onSearch={(v) => fetchDatasourcePage({ pageIndex: 1, name: v || undefined })} />
        </div>
        <div className="toolbar-right">
          <Button type="primary" onClick={() => { form.resetFields(); setModal({ open: true, node: null }); }}>+ 新建数据源</Button>
        </div>
      </div>
      <Card className="table-wrapper" styles={{ body: { padding: 0 } }}>
        <Table<DataSourceItem>
          rowKey="id" columns={columns} dataSource={list} loading={loading} scroll={{ x: 1000 }}
          pagination={{
            current: query.pageIndex, pageSize: query.pageSize, total,
            showSizeChanger: true, pageSizeOptions: [10, 50, 100], showTotal: (t) => `共 ${t} 条`,
            onChange: (pageIndex, pageSize) => fetchDatasourcePage({ pageIndex, pageSize }),
          }}
        />
      </Card>
      <Modal title={modal.node ? '编辑数据源' : '新建数据源'} open={modal.open} onCancel={() => setModal({ open: false, node: null })}
        onOk={handleSave} okText="保存" cancelText="取消" destroyOnClose>
        <Form form={form} layout="vertical" preserve={false}>
          <Form.Item name="name" label="数据源名称" rules={[{ required: true, message: '请输入数据源名称' }]}>
            <Input placeholder="请输入数据源名称" />
          </Form.Item>
          <Form.Item name="type" label="数据源类型" rules={[{ required: true, message: '请选择数据源类型' }]}>
            <Select placeholder="请选择数据源类型" options={TYPE_OPTIONS} />
          </Form.Item>
          <Form.Item name="host" label="主机地址" rules={[{ required: true, message: '请输入主机地址' }]}>
            <Input placeholder="例如：192.168.1.10:3306" />
          </Form.Item>
          <Form.Item name="database" label="数据库名" rules={[{ required: true, message: '请输入数据库名' }]}>
            <Input placeholder="请输入数据库名" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default JulyDatasource;