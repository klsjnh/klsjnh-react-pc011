/**
 * 数据源管理页面（dataservice011 · julyDatasource）- 对齐后端 JulyDatasourceController
 * 字段：dsCode/dsName/dbType/jdbcUrl/schemaName/username/password/driverClass/remark
 * Toast：insert {id} success ... / update {id} success ... / delete {id} success ...
 * 表格：表头居中、内容左对齐；弹窗表单双列布局，含「测试连接」。
 */
import React, { useEffect, useState } from 'react';
import { Button, Card, Col, Form, Input, Modal, Popconfirm, Row, Select, Space, Table, Tag } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { useDatasourceState } from '@/stores/dataservice011/julyDatasourceStore';
import { fetchDatasourcePage, saveDatasource, removeDatasource, testDatasourceConnection } from '@/services/dataservice011';
import { toast } from '@/utils/toast';
import type { DataSourceItem } from '@/types/dataservice011/datasource';
import { DB_TYPE_OPTIONS } from '@/types/dataservice011/datasource';
import { STATUS_LABEL } from '@/config/constants';

/** 表头居中、内容左对齐：antd 6 用 titleAlign 控表头、align 控内容 */
const cell = { titleAlign: 'center' as const, align: 'left' as const };

export const JulyDatasource = () => {
  const { list, total, loading, query } = useDatasourceState();
  const [modal, setModal] = useState<{ open: boolean; node: DataSourceItem | null }>({ open: false, node: null });
  const [form] = Form.useForm();
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);

  useEffect(() => { fetchDatasourcePage({ pageIndex: 1, pageSize: 10 }); }, []);

  // 表单初始值：编辑回填用 key 重挂载，避免 setFieldsValue 副作用
  const formInitialValues = {
    dsCode: modal.node?.dsCode || '',
    dsName: modal.node?.dsName || '',
    dbType: modal.node?.dbType || 'mysql',
    jdbcUrl: modal.node?.jdbcUrl || '',
    schemaName: modal.node?.schemaName || '',
    username: modal.node?.username || '',
    driverClass: modal.node?.driverClass || '',
    remark: modal.node?.remark || '',
  };

  const handleSave = async () => {
    try {
      const v = await form.validateFields();
      setSaving(true);
      const savedId = await saveDatasource({ id: modal.node?.id, ...v });
      toast.success(modal.node?.id ? `update ${modal.node.id} success ...` : `insert ${savedId} success ...`);
      setModal({ open: false, node: null });
    } catch (e) {
      toast.error((e as Error)?.message || '保存失败，请检查输入');
    } finally {
      setSaving(false);
    }
  };

  const handleRemove = async (id: string) => {
    try {
      await removeDatasource(id);
      toast.success(`delete ${id} success ...`);
    } catch (e) {
      toast.error((e as Error)?.message || '删除失败，请重试');
    }
  };

  const handleTestConnection = async () => {
    try {
      const v = await form.validateFields();
      setTesting(true);
      const res = await testDatasourceConnection({ id: modal.node?.id, ...v });
      if (res.success) {
        toast.success(res.message || '连接成功');
      } else {
        toast.error(res.message || '连接失败');
      }
    } catch (e) {
      toast.error((e as Error)?.message || '请完善连接信息后再测试');
    } finally {
      setTesting(false);
    }
  };

  const columns: ColumnsType<DataSourceItem> = [
    { ...cell, title: '数据源编码', dataIndex: 'dsCode', width: 150, render: (v) => <code>{v}</code> },
    { ...cell, title: '数据源名称', dataIndex: 'dsName', width: 160 },
    { ...cell, title: '类型', dataIndex: 'dbType', width: 120, render: (v) => <Tag color="blue">{v}</Tag> },
    { ...cell, title: 'JDBC URL', dataIndex: 'jdbcUrl', ellipsis: true, render: (v) => <code>{v}</code> },
    { ...cell, title: '库名/Schema', dataIndex: 'schemaName', width: 140 },
    { ...cell, title: '用户名', dataIndex: 'username', width: 120 },
    { ...cell, title: '状态', dataIndex: 'status', width: 90, render: (s) => <Tag color={s === '1' ? 'green' : 'red'}>{STATUS_LABEL[s] || s}</Tag> },
    {
      title: '操作', key: 'action', width: 140, titleAlign: 'center', align: 'left',
      render: (_, r) => (
        <Space size="small">
          <Button type="link" size="small" onClick={() => setModal({ open: true, node: r })}>编辑</Button>
          <Popconfirm title="确定删除这个数据源吗？" okText="删除" cancelText="取消" okButtonProps={{ danger: true }} onConfirm={() => handleRemove(r.id)}>
            <Button type="link" size="small" danger>删除</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div className="page-header">
        <h2>数据源</h2>
        <p>共 {total} 个数据源 · 接口 /julyDatasource/v1/selectListByPage</p>
      </div>

      <div className="page-toolbar">
        <div className="toolbar-left">
          <Input.Search
            allowClear
            placeholder="搜索编码 / 名称 / JDBC URL"
            className="search-input"
            onSearch={(v) => fetchDatasourcePage({ pageIndex: 1, keyword: v || undefined })}
          />
        </div>
        <div className="toolbar-right">
          <Button type="primary" onClick={() => { form.resetFields(); setModal({ open: true, node: null }); }}>+ 新建数据源</Button>
        </div>
      </div>

      <Card className="table-wrapper" styles={{ body: { padding: 0 } }}>
        <Table<DataSourceItem>
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
            onChange: (pageIndex, pageSize) => fetchDatasourcePage({ pageIndex, pageSize }),
          }}
        />
      </Card>

      <Modal
        title={modal.node ? '编辑数据源' : '新建数据源'}
        key={modal.node?.id ?? 'new'}
        open={modal.open}
        onCancel={() => setModal({ open: false, node: null })}
        footer={[
          <Button key="test" loading={testing} onClick={handleTestConnection}>测试连接</Button>,
          <Button key="cancel" onClick={() => setModal({ open: false, node: null })}>取消</Button>,
          <Button key="ok" type="primary" loading={saving} onClick={handleSave}>保存</Button>,
        ]}
        width={720}
        destroyOnClose
      >
        <Form form={form} layout="vertical" preserve={false} initialValues={formInitialValues}>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="dsCode" label="数据源编码" rules={[{ required: true, message: '请输入数据源编码' }]}>
                <Input disabled={!!modal.node} placeholder="唯一，创建后不可修改，如 ds_main" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="dsName" label="数据源名称" rules={[{ required: true, message: '请输入数据源名称' }]}>
                <Input placeholder="请输入数据源名称" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="dbType" label="数据库类型" rules={[{ required: true, message: '请选择数据库类型' }]}>
                <Select placeholder="请选择数据库类型" options={DB_TYPE_OPTIONS} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="schemaName" label="库名 / Schema">
                <Input placeholder="请输入库名或 Schema" />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="jdbcUrl" label="JDBC URL" rules={[
            { required: true, message: '请输入 JDBC URL' },
            { pattern: /^jdbc:/, message: 'JDBC URL 须以 jdbc: 开头' },
          ]}>
            <Input placeholder="如 jdbc:mysql://192.168.1.10:3306/xxx" />
          </Form.Item>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="username" label="用户名">
                <Input placeholder="请输入用户名" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="password" label="密码" extra={modal.node ? '留空表示保持原密码' : undefined}>
                <Input.Password placeholder="请输入密码" autoComplete="new-password" />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="driverClass" label="驱动类名" extra="留空按数据库类型取默认驱动">
            <Input placeholder="如 com.mysql.cj.jdbc.Driver" />
          </Form.Item>
          <Form.Item name="remark" label="备注">
            <Input.TextArea rows={2} placeholder="备注说明" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default JulyDatasource;