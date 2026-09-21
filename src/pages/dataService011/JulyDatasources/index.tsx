/**
 * 数据源管理页面（dataservice011 · julyDatasource）- 对齐后端 JulyDatasourceController
 * 字段：dsCode/dsName/dbType/jdbcUrl/schemaName/username/password/driverClass/remark
 * Toast：insert {id} success ... / update {id} success ... / delete {id} success ...
 * 布局参照老前端：表格每行「测试」+ 弹窗底部「测试连接」，双列表单；表头居中、内容左对齐。
 */
import React, { useEffect, useRef, useState } from 'react';
import { ApiOutlined, PlusOutlined } from '@ant-design/icons';
import { Button, Card, Input, Popconfirm, Space, Table, Tag } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { useDatasourceState } from '@/stores/dataservice011/julyDatasourceStore';
import { fetchDatasourcePage, removeDatasource, testDatasourceConnection } from '@/services/dataservice011';
import { toast } from '@/utils/toast';
import { TestFeedbackAlert, type TestFeedback } from '@/components/system011/TestFeedbackAlert';
import { DatasourceFormModal } from '@/pages/dataService011/JulyDatasources/DatasourceFormModal';
import type { DataSourceItem, JulyDatasourceTestResultVo011 } from '@/types/dataservice011/datasource';
import { STATUS_LABEL } from '@/config/constants';
import { useTableFillHeight } from '@/hooks/useTableFillHeight';
import { PAGE_SIZE_OPTIONS } from '@/utils/pageSizePref';

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
  const [rowTestingId, setRowTestingId] = useState<string | null>(null);
  const [pageTest, setPageTest] = useState<TestFeedback | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const tableBodyHeight = useTableFillHeight(cardRef, `${total}-${loading}`);

  // 只重置 pageIndex：pageSize 是用户偏好（存在 store 里），传值会把它覆盖回默认值
  useEffect(() => { fetchDatasourcePage({ pageIndex: 1 }); }, []);

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
          <Button type="link" size="small" onClick={() => setModal({ open: true, node: r })}>编辑</Button>
          <Popconfirm title="确定删除这个数据源吗？" okText="删除" cancelText="取消" okButtonProps={{ danger: true }} onConfirm={() => handleRemove(r.id)}>
            <Button type="link" size="small" danger>删除</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div className="page-fill">
      <div className="page-header">
        <h2>数据源</h2>
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
          <Button color="primary" variant="filled" icon={<PlusOutlined />} onClick={() => setModal({ open: true, node: null })}>新建数据源</Button>
        </div>
      </div>

      {pageTest && <TestFeedbackAlert data={pageTest} />}

      <Card className="table-wrapper" ref={cardRef} styles={{ body: { padding: 0 } }}>
        <Table<DataSourceItem>
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
            onChange: (pageIndex, pageSize) => fetchDatasourcePage({ pageIndex, pageSize }),
          }}
        />
      </Card>

      <DatasourceFormModal
        open={modal.open}
        node={modal.node}
        onClose={() => setModal({ open: false, node: null })}
        onSaved={() => { }}
      />
    </div>
  );
};

export default JulyDatasource;