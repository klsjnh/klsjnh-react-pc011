/**
 * 配置列表页（julyConfig）- antd 版
 * 列表读 julyConfigStore；分页/保存/删除调 julyConfigService。
 * 字段直接对齐后端：code/data/status。
 */
import React, { useEffect, useState } from 'react';
import { DatabaseOutlined, DownloadOutlined, DownOutlined, PlusOutlined } from '@ant-design/icons';
import { Button, Card, Dropdown, Form, Input, Modal, Popconfirm, Space, Table, Tag } from 'antd';
import type { MenuProps } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { useConfigState } from '@/stores/system011/julyConfigStore';
import { fetchConfigPage, saveConfig, removeConfig, exportConfig, backupConfig011 } from '@/services/system011';
import { toast } from '@/utils/toast';
import type { JulyConfigVo011 } from '@/types/system011/julyConfig';
import type { ExportResult011 } from '@/types/system011/julyConfig/vo';

/** 表头单元格水平居中 */
const hdrCenter = (): React.HTMLAttributes<HTMLElement> => ({ style: { textAlign: 'center' } });

/** 数据内容左对齐 + 表头居中 */
const leftCell = { align: 'left' as const, onHeaderCell: hdrCenter };

export const JulyConfig = () => {
  const { list, total, loading, query } = useConfigState();
  const [modal, setModal] = useState<{ open: boolean; node: JulyConfigVo011 | null }>({ open: false, node: null });
  const [form] = Form.useForm();
  const [saving, setSaving] = useState(false);
  const [actionLoading, setActionLoading] = useState<'export' | 'backup' | null>(null);

  useEffect(() => { fetchConfigPage({ pageIndex: 1, pageSize: 10 }); }, []);

  // 导出全部配置 -> 按格式下载（后端 /julyConfig/v1/export 返回结构化 ExportResult，前端按 json/csv 渲染）
  const handleExport = async (format: 'json' | 'csv' = 'csv') => {
    setActionLoading('export');
    try {
      const res: ExportResult011 = await exportConfig();
      const meta = res?.metaInfo;
      const rows = res?.rows || [];
      const cols = meta?.columns || [];
      if (!cols.length) return toast.success('export complete, 0 rows');
      let blob: Blob;
      let ext = format;
      if (format === 'json') {
        blob = new Blob([JSON.stringify(meta ? { metaInfo: meta, rows } : { rows }, null, 2)],
          { type: 'application/json' });
      } else {
        const header = cols.map((c) => c.name).join(',');
        const body = rows
          .map((r) => cols.map((c) => `${(r[c.code] ?? '') as string}`.replace(/,/g, '，')).join(','))
          .join('\n');
        blob = new Blob(['\uFEFF' + `${header}\n${body}`], { type: 'text/csv' });
      }
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${meta?.objectCode || 'julyConfig'}.${ext}`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success(`export julyConfig success, ${rows.length} rows (${format})`);
    } catch (e) {
      toast.error((e as Error)?.message || '导出失败，请重试');
    } finally {
      setActionLoading(null);
    }
  };

  // 备份全部配置到存储中心 -> 返回 object key
  const handleBackup = async () => {
    setActionLoading('backup');
    try {
      const key = await backupConfig011();
      toast.success(`backup julyConfig success, key=${key}`);
    } catch (e) {
      toast.error((e as Error)?.message || '备份失败，请重试');
    } finally {
      setActionLoading(null);
    }
  };

  // 导出格式下拉（json / csv）
  const exportMenu: MenuProps = {
    items: [
      { key: 'json', label: 'JSON (.json)' },
      { key: 'csv', label: 'CSV (.csv)' },
    ],
    onClick: ({ key }) => handleExport(key as 'json' | 'csv'),
  };

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
    { ...leftCell, title: '配置键', dataIndex: 'code', width: 160, render: (v) => <code>{v}</code> },
    { ...leftCell, title: '配置值', dataIndex: 'data' },
    { title: '状态', dataIndex: 'status', align: 'center', onHeaderCell: hdrCenter, width: 130, render: (s) => <Tag color={s === '1' ? 'green' : 'red'}>{s === '1' ? '启用' : '停用'}</Tag> },
    {
      title: '操作', key: 'action', width: 140, align: 'center', onHeaderCell: hdrCenter,
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

      <div className="page-toolbar" style={{ display: 'block' }}>
        <div className="toolbar-row-search" style={{ display: 'flex', alignItems: 'center', marginBottom: 12 }}>
          <Input.Search
            allowClear
            placeholder="搜索 code / data"
            style={{ width: 320 }}
            onSearch={(v) => fetchConfigPage({ pageIndex: 1, keyword: v || undefined })}
          />
        </div>
        <div className="toolbar-right">
          <Button icon={<PlusOutlined />} onClick={() => { form.resetFields(); setModal({ open: true, node: null }); }}
            style={{ background: '#52c41a', borderColor: '#52c41a', color: '#fff' }}>新建配置</Button>
          <Button icon={<DatabaseOutlined />} loading={actionLoading === 'backup'} onClick={handleBackup}
            style={{ background: '#faad14', borderColor: '#faad14', color: '#fff' }}>备份011</Button>
          <Dropdown menu={exportMenu} trigger={['click']}>
            <Button icon={<DownloadOutlined />} loading={actionLoading === 'export'}
              style={{ background: '#1677ff', borderColor: '#1677ff', color: '#fff' }}>
              导出 <DownOutlined />
            </Button>
          </Dropdown>
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