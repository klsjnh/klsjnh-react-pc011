/**
 * 配置列表页（julyConfig）- antd 版
 * 列表读 julyConfigStore；分页/保存/删除调 julyConfigService。
 * 字段直接对齐后端：code/data/status。
 */
import React, { useEffect, useState } from 'react';
import { Button, Card, Form, Input, Modal, Popconfirm, Space, Table, Tag } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { useConfigState } from '@/stores/system011/julyConfigStore';
import { fetchConfigPage, saveConfig, removeConfig } from '@/services/system011';
import { toast } from '@/utils/toast';
import type { JulyConfigVo011 } from '@/types/system011/julyConfig';

export const JulyConfig = () => {
  const { list, total, loading, query } = useConfigState();
  const [modal, setModal] = useState<{ open: boolean; node: JulyConfigVo011 | null }>({ open: false, node: null });
  const [form] = Form.useForm();
  const [saving, setSaving] = useState(false);

  useEffect(() => { fetchConfigPage({ pageIndex: 1, pageSize: 10 }); }, []);

  // 表单初始值：编辑回填无需 setFieldsValue 副作用（用 key 重挂载保证每次打开都是干净初始值）
  const formInitialValues = {
    code: modal.node?.code || '',
    data: modal.node?.data || '',
  };

  const handleSave = async () => {
    try {
      const v = await form.validateFields();
      setSaving(true);
      const savedId = await saveConfig({ id: modal.node?.id, code: v.code, data: v.data });
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
      await removeConfig(id);
      toast.success(`delete ${id} success ...`);
    } catch (e) {
      toast.error((e as Error)?.message || '删除失败，请重试');
    }
  };

  const columns: ColumnsType<JulyConfigVo011> = [
    { title: '配置键', dataIndex: 'code', align: 'center', render: (v) => <code>{v}</code> },
    { title: '配置值', dataIndex: 'data', align: 'center' },
    { title: '状态', dataIndex: 'status', align: 'center', width: 90, render: (s) => <Tag color={s === '1' ? 'green' : 'red'}>{s === '1' ? '启用' : '停用'}</Tag> },
    {
      title: '操作', key: 'action', width: 140, align: 'center',
      render: (_, r) => (
        <Space size="small">
          <Button type="link" size="small" onClick={() => setModal({ open: true, node: r })}>编辑</Button>
          <Popconfirm title="确定删除这条配置吗？" okText="删除" cancelText="取消" okButtonProps={{ danger: true }} onConfirm={() => handleRemove(r.id)}>
            <Button type="link" size="small" danger>删除</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div className="page-header">
        <h2>配置管理</h2>
        <p>共 {total} 条配置 · 接口 /julyConfig/v1/selectListByPage</p>
      </div>

      <div className="page-toolbar">
        <div className="toolbar-left">
          <Input.Search
            allowClear
            placeholder="搜索 code / data"
            className="search-input"
            onSearch={(v) => fetchConfigPage({ pageIndex: 1, keyword: v || undefined })}
          />
        </div>
        <div className="toolbar-right">
          <Button type="primary" onClick={() => { form.resetFields(); setModal({ open: true, node: null }); }}>+ 新建配置</Button>
        </div>
      </div>

      <Card className="table-wrapper" styles={{ body: { padding: 0 } }}>
        <Table<JulyConfigVo011>
          rowKey="id"
          columns={columns}
          dataSource={list}
          loading={loading}
          scroll={{ x: 800 }}
          pagination={{
            current: query.pageIndex,
            pageSize: query.pageSize,
            total,
            showSizeChanger: true,
            pageSizeOptions: [10, 50, 100],
            showTotal: (t) => `共 ${t} 条`,
            onChange: (pageIndex, pageSize) => fetchConfigPage({ pageIndex, pageSize }),
          }}
        />
      </Card>

      <Modal title={modal.node ? '编辑配置' : '新建配置'} key={modal.node?.id ?? 'new'} open={modal.open} onCancel={() => setModal({ open: false, node: null })}
        onOk={handleSave} okText="保存" cancelText="取消" confirmLoading={saving} destroyOnClose>
        <Form form={form} layout="vertical" preserve={false} initialValues={formInitialValues}>
          <Form.Item name="code" label="配置键" rules={[{ required: true, message: '请输入配置键' }]}>
            <Input disabled={!!modal.node} placeholder="如 site.name" />
          </Form.Item>
          <Form.Item name="data" label="配置值" rules={[{ required: true, message: '请输入配置值' }]}>
            <Input placeholder="请输入配置值" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};