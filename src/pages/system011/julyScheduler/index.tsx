/**
 * 定时任务列表页（julyScheduler）- antd 版
 * 列表读 julySchedulerStore；分页/保存/启停调 julySchedulerService。
 * 字段直接对齐后端：schedulerCode/schedulerName/schedulerHandler/schedulerCron/status。
 */
import React, { useEffect, useRef, useState } from 'react';
import { Button, Card, Col, Form, Input, Modal, Popconfirm, Row, Select, Space, Table, Tag } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { useSchedulerState } from '@/stores/system011/julySchedulerStore';
import {
  fetchSchedulerPage, saveScheduler, runSchedulerOnce, removeSchedulers,
} from '@/services/system011';
import { STATUS_OPTIONS } from '@/config/constants';
import { useTableFillHeight } from '@/hooks/useTableFillHeight';
import { PAGE_SIZE_OPTIONS } from '@/utils/pageSizePref';
import { toast } from '@/utils/toast';
import type { JulySchedulerVo011 } from '@/types/system011/julyScheduler';

export const JulyScheduler = () => {
  const { list, total, loading, query } = useSchedulerState();
  const [modal, setModal] = useState<{ open: boolean; node: JulySchedulerVo011 | null }>({ open: false, node: null });
  const [form] = Form.useForm();
  const cardRef = useRef<HTMLDivElement>(null);
  const tableBodyHeight = useTableFillHeight(cardRef, `${total}-${loading}`);

  // 只重置 pageIndex：pageSize 是用户偏好（存在 store 里），传值会把它覆盖回默认值
  useEffect(() => { fetchSchedulerPage({ pageIndex: 1 }); }, []);

  // 表单初始值：编辑回填无需 setFieldsValue 副作用（用 key 重挂载保证每次打开都是干净初始值）
  const formInitialValues = {
    schedulerCode: modal.node?.schedulerCode || '',
    schedulerName: modal.node?.schedulerName || '',
    schedulerHandler: modal.node?.schedulerHandler || '',
    schedulerCron: modal.node?.schedulerCron || '',
    status: modal.node?.status || '0',
  };

  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    try {
      const v = await form.validateFields();
      setSaving(true);
      const savedId = await saveScheduler({ id: modal.node?.id, schedulerCode: v.schedulerCode, schedulerName: v.schedulerName, schedulerHandler: v.schedulerHandler, schedulerCron: v.schedulerCron, status: v.status });
      toast.success(modal.node?.id ? `update ${modal.node.id} success ...` : `insert ${savedId} success ...`);
      setModal({ open: false, node: null });
    } catch (e) {
      toast.error((e as Error)?.message || '保存失败，请检查输入');
    } finally {
      setSaving(false);
    }
  };

  const handleRunOnce = async (id: string) => {
    try {
      await runSchedulerOnce(id);
      toast.success(`run once ${id} success ...`);
      await fetchSchedulerPage(query);
    } catch (e) {
      toast.error((e as Error)?.message || '执行失败，请重试');
    }
  };

  const handleRemove = async (id: string) => {
    try {
      await removeSchedulers([id]);
      toast.success(`delete ${id} success ...`);
    } catch (e) {
      toast.error((e as Error)?.message || '删除失败，请重试');
    }
  };

  const columns: ColumnsType<JulySchedulerVo011> = [
    { title: '任务编码', dataIndex: 'schedulerCode', width: 140, align: 'center' },
    { title: '任务名称', dataIndex: 'schedulerName', width: 230, align: 'center' },
    { title: '处理器', dataIndex: 'schedulerHandler', width: 260, align: 'center' },
    { title: 'Cron', dataIndex: 'schedulerCron', width: 160, align: 'center', render: (v) => <code>{v}</code> },
    { title: '执行次数', dataIndex: 'executeTimes', width: 90, align: 'center' },
    { title: '状态', dataIndex: 'status', width: 90, align: 'center', render: (s) => <Tag color={s === '1' ? 'green' : 'default'}>{s === '1' ? '运行中' : '已停止'}</Tag> },
    {
      title: '操作', key: 'action', width: 200, fixed: 'right', align: 'center',
      render: (_, r) => (
        <Space size="small">
          <Button type="link" size="small" onClick={() => setModal({ open: true, node: r })}>编辑</Button>
          <Button type="link" size="small" onClick={() => handleRunOnce(r.id)}>执行一次</Button>
          <Popconfirm title="确定删除这个定时任务吗？" okText="删除" cancelText="取消" okButtonProps={{ danger: true }} onConfirm={() => handleRemove(r.id)}>
            <Button type="link" size="small" danger>删除</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div className="page-fill">
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
          <Button color="primary" variant="filled" onClick={() => { form.resetFields(); setModal({ open: true, node: null }); }}>+ 新建任务</Button>
        </div>
      </div>

      <Card className="table-wrapper" ref={cardRef} styles={{ body: { padding: 0 } }}>
        <Table<JulySchedulerVo011>
          rowKey="id"
          columns={columns}
          dataSource={list}
          loading={loading}
          scroll={{ x: 1100, y: tableBodyHeight }}
          pagination={{
            current: query.pageIndex,
            pageSize: query.pageSize,
            total,
            showSizeChanger: true,
            pageSizeOptions: PAGE_SIZE_OPTIONS,
            showTotal: (t) => `共 ${t} 条`,
            onChange: (pageIndex, pageSize) => fetchSchedulerPage({ pageIndex, pageSize }),
          }}
        />
      </Card>

      <Modal title={modal.node ? '编辑任务' : '新建任务'} key={modal.node?.id ?? 'new'} open={modal.open} onCancel={() => setModal({ open: false, node: null })}
        onOk={handleSave} okText="保存" cancelText="取消" confirmLoading={saving} destroyOnHidden>
        <Form form={form} layout="vertical" preserve={false} initialValues={formInitialValues}>
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