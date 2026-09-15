/**
 * 数据源管理页面（dataservice011 · julyDatasource）- 对齐后端 JulyDatasourceController
 * 字段：dsCode/dsName/dbType/jdbcUrl/schemaName/username/password/driverClass/remark
 * Toast：insert {id} success ... / update {id} success ... / delete {id} success ...
 * 布局参照老前端：表格每行「测试」+ 弹窗底部「测试连接」，双列表单；表头居中、内容左对齐。
 */
import React, { useEffect, useState } from 'react';
import { ApiOutlined } from '@ant-design/icons';
import { Button, Card, Col, Form, Input, Modal, Popconfirm, Row, Select, Space, Table, Tag } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { useDatasourceState } from '@/stores/dataservice011/julyDatasourceStore';
import { fetchDatasourcePage, saveDatasource, removeDatasource, testDatasourceConnection } from '@/services/dataservice011';
import { toast } from '@/utils/toast';
import { TestFeedbackAlert, type TestFeedback } from '@/components/system011/TestFeedbackAlert';
import type { DataSourceItem, JulyDatasourceTestVo011, JulyDatasourceTestResultVo011 } from '@/types/dataservice011/datasource';
import { DB_TYPE_OPTIONS } from '@/types/dataservice011/datasource';
import { STATUS_LABEL } from '@/config/constants';

/** 表头单元格水平居中 */
const hdrCenter = (): React.HTMLAttributes<HTMLElement> => ({ style: { textAlign: 'center' } });

/** 内容左对齐 + 表头居中（用户要求：表头居中、内容 left） */
const leftCell = { align: 'left' as const, onHeaderCell: hdrCenter };

/** 组装测试反馈（供 TestFeedbackAlert 消费） */
function buildFeedback(res: JulyDatasourceTestResultVo011, startedAt?: number): TestFeedback {
  const elapsedMs = startedAt != null ? Date.now() - startedAt : undefined;
  return {
    ok: res.success,
    message: res.message || (res.success ? '连接成功' : '连接失败'),
    elapsedMs,
    databaseProduct: res.databaseProduct,
    databaseVersion: res.databaseVersion,
  };
}

/** 请求异常（如 HTTP 500）时的失败反馈 -> 用 Alert 展示，而非 toast */
function failureFeedback(e: unknown, startedAt?: number): TestFeedback {
  const elapsedMs = startedAt != null ? Date.now() - startedAt : undefined;
  const msg = (e as Error)?.message || '连接测试请求失败';
  return { ok: false, message: msg, elapsedMs };
}

export const JulyDatasource = () => {
  const { list, total, loading, query } = useDatasourceState();
  const [modal, setModal] = useState<{ open: boolean; node: DataSourceItem | null }>({ open: false, node: null });
  const [form] = Form.useForm();
  const [saving, setSaving] = useState(false);
  const [modalTesting, setModalTesting] = useState(false);
  const [rowTestingId, setRowTestingId] = useState<string | null>(null);
  const [pageTest, setPageTest] = useState<TestFeedback | null>(null);
  const [modalTest, setModalTest] = useState<TestFeedback | null>(null);

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

  /** 弹窗内测试连接（新建草稿态 / 编辑重测），结果展示在弹窗内 Alert */
  const handleModalTest = async () => {
    // 表单校验失败 → toast 提示补全信息（属于校验，不占用 Alert）
    let v: { dsCode: string; dbType: string; jdbcUrl: string; username: string; driverClass?: string; password?: string };
    try {
      v = await form.validateFields();
    } catch {
      toast.warning('请先完善连接信息（编码/名称/类型/JDBC URL/用户名）后再测试');
      return;
    }
    setModalTesting(true);
    setModalTest(null);
    const startedAt = Date.now();
    const payload: JulyDatasourceTestVo011 = {
      id: modal.node?.id,
      dsCode: modal.node?.dsCode || v.dsCode,
      dbType: v.dbType,
      jdbcUrl: v.jdbcUrl,
      username: v.username,
      driverClass: v.driverClass,
      password: v.password || undefined,
    };
    try {
      const res = await testDatasourceConnection(payload);
      setModalTest(buildFeedback(res, startedAt));
    } catch (e) {
      // 请求失败（如 HTTP 500）→ 在 Alert 里明确提示失败
      setModalTest(failureFeedback(e, startedAt));
    } finally {
      setModalTesting(false);
    }
  };

  /** 表格行内测试（对已保存数据源重测），结果展示在页面顶部 Alert */
  const handleRowTest = async (row: DataSourceItem) => {
    setRowTestingId(row.id);
    setPageTest(null);
    const startedAt = Date.now();
    try {
      const res = await testDatasourceConnection({ id: row.id, dsCode: row.dsCode });
      setPageTest(buildFeedback(res, startedAt));
    } catch (e) {
      // 请求失败（如 HTTP 500）→ Alert 提示失败，不再用 toast
      setPageTest(failureFeedback(e, startedAt));
    } finally {
      setRowTestingId(null);
    }
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

  const columns: ColumnsType<DataSourceItem> = [
    { ...leftCell, title: '数据源编码', dataIndex: 'dsCode', width: 150, render: (v) => <code>{v}</code> },
    { ...leftCell, title: '数据源名称', dataIndex: 'dsName', width: 160 },
    { ...leftCell, title: '类型', dataIndex: 'dbType', width: 110, render: (v) => <Tag color="blue">{v}</Tag> },
    { ...leftCell, title: 'JDBC URL', dataIndex: 'jdbcUrl', width: 230, ellipsis: true, render: (v) => <code>{v}</code> },
    { ...leftCell, title: '库名/Schema', dataIndex: 'schemaName', width: 130 },
    { ...leftCell, title: '用户名', dataIndex: 'username', width: 120 },
    { ...leftCell, title: '状态', dataIndex: 'status', width: 90, render: (s) => <Tag color={s === '1' ? 'green' : 'red'}>{STATUS_LABEL[s] || s}</Tag> },
    {
      title: '操作', key: 'action', width: 200, align: 'left',
      render: (_, r) => (
        <Space size="small" wrap>
          <Button type="link" size="small" icon={<ApiOutlined />} loading={rowTestingId === r.id} onClick={() => handleRowTest(r)}>测试</Button>
          <Button type="link" size="small" onClick={() => { setModal({ open: true, node: r }); setModalTest(null); }}>编辑</Button>
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
          <Button type="primary" onClick={() => { form.resetFields(); setModal({ open: true, node: null }); setModalTest(null); }}>+ 新建数据源</Button>
        </div>
      </div>

      {pageTest && <TestFeedbackAlert data={pageTest} />}

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
          <Button key="test" icon={<ApiOutlined />} loading={modalTesting} onClick={handleModalTest}>测试连接</Button>,
          <Button key="cancel" onClick={() => setModal({ open: false, node: null })}>取消</Button>,
          <Button key="ok" type="primary" loading={saving} onClick={handleSave}>保存</Button>,
        ]}
        width={720}
        destroyOnClose
      >
        <Form form={form} layout="vertical" preserve={false} initialValues={formInitialValues}>
          {modalTest && <TestFeedbackAlert data={modalTest} />}
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