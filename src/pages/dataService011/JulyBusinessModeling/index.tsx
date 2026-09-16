/**
 * 业务建模（低代码）管理页面（dataservice011 · julyBusinessModeling）- 对齐后端 JulyBusinessModelingController
 * 字段：modelCode/modelName/objectName/dataSourceCode/status/remark + 字段子表 fieldData
 * 新增 / 设计走路由跳转。表头居中、内容左对齐。
 */
import React, { useEffect, useRef } from 'react';
import { CodeOutlined, PlusOutlined } from '@ant-design/icons';
import { Button, Card, Input, Popconfirm, Space, Table, Tag } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { useBusinessModelingState } from '@/stores/dataservice011/julyBusinessModelingStore';
import { fetchModelingPage, removeModeling } from '@/services/dataservice011';
import { toast } from '@/utils/toast';
import type { JulyBusinessModelingItem } from '@/types/dataservice011/businessModeling';
import { STATUS_LABEL } from '@/config/constants';
import { useTableFillHeight } from '@/hooks/useTableFillHeight';
import { PAGE_SIZE_OPTIONS } from '@/utils/pageSizePref';
import { DATASERVICE011_ROUTES } from '@/config/routes';
import type { PageNavProps } from '@/types/view/page';

const hdrCenter = (): React.HTMLAttributes<HTMLElement> => ({ style: { textAlign: 'center' } });
const leftCell = { align: 'left' as const, onHeaderCell: hdrCenter };

export const JulyBusinessModeling = ({ onNavigate }: PageNavProps) => {
  const { list, total, loading, query } = useBusinessModelingState();
  const cardRef = useRef<HTMLDivElement>(null);
  const tableBodyHeight = useTableFillHeight(cardRef, `${total}-${loading}`);

  // 只重置 pageIndex：pageSize 是用户偏好（存在 store 里），传值会把它覆盖回默认值
  useEffect(() => { fetchModelingPage({ pageIndex: 1 }); }, []);

  const handleRemove = async (id: string) => {
    try { await removeModeling(id); toast.success(`delete ${id} success ...`); }
    catch (e) { toast.error((e as Error)?.message || '删除失败，请重试'); }
  };

  const columns: ColumnsType<JulyBusinessModelingItem> = [
    { ...leftCell, title: '模型编码', dataIndex: 'modelCode', width: 150, render: (v) => <code>{v}</code> },
    { ...leftCell, title: '模型名称', dataIndex: 'modelName', width: 150 },
    { ...leftCell, title: '对象名', dataIndex: 'objectName', width: 150, render: (v) => <code>{v}</code> },
    { ...leftCell, title: '数据源', dataIndex: 'dataSourceCode', width: 130, render: (v) => v ? <Tag color="blue">{v}</Tag> : <span style={{ color: '#9ca3af' }}>—</span> },
    { ...leftCell, title: '字段数', dataIndex: 'fieldData', width: 90, render: (v: JulyBusinessModelingItem['fieldData']) => <Tag color="geekblue">{v?.length || 0}</Tag> },
    { ...leftCell, title: '状态', dataIndex: 'status', width: 90, render: (s) => <Tag color={s === '1' ? 'green' : 'red'}>{STATUS_LABEL[s] || s}</Tag> },
    { ...leftCell, title: '备注', dataIndex: 'remark', width: 160, ellipsis: true },
    {
      title: '操作', key: 'action', width: 160, align: 'left',
      render: (_, r) => (
        <Space size="small" wrap>
          <Button type="link" size="small" icon={<CodeOutlined />} onClick={() => onNavigate?.(`${DATASERVICE011_ROUTES.julyBusinessModeling}/${r.id}`)}>设计</Button>
          <Popconfirm title="确定删除该业务模型吗？" okText="删除" cancelText="取消" okButtonProps={{ danger: true }} onConfirm={() => handleRemove(r.id)}>
            <Button type="link" size="small" danger>删除</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div className="page-fill">
      <div className="page-header">
        <h2>业务建模（低代码）</h2>
      </div>

      <div className="page-toolbar">
        <div className="toolbar-left">
          <Input.Search
            allowClear
            placeholder="搜索模型编码 / 名称 / 对象名"
            className="search-input"
            onSearch={(v) => fetchModelingPage({ pageIndex: 1, keyword: v || undefined })}
          />
        </div>
        <div className="toolbar-right">
          <Button type="primary" icon={<PlusOutlined />} onClick={() => onNavigate?.(DATASERVICE011_ROUTES.julyBusinessModelingNew)}>新建业务模型</Button>
        </div>
      </div>

      <Card className="table-wrapper" ref={cardRef} styles={{ body: { padding: 0 } }}>
        <Table<JulyBusinessModelingItem>
          rowKey="id"
          columns={columns}
          dataSource={list}
          loading={loading}
          scroll={{ x: 1040, y: tableBodyHeight }}
          pagination={{
            current: query.pageIndex,
            pageSize: query.pageSize,
            total,
            showSizeChanger: true,
            pageSizeOptions: PAGE_SIZE_OPTIONS,
            showTotal: (t) => `共 ${t} 条`,
            onChange: (pageIndex, pageSize) => fetchModelingPage({ pageIndex, pageSize }),
          }}
        />
      </Card>
    </div>
  );
};

export default JulyBusinessModeling;
