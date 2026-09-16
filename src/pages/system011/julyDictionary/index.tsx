/**
 * 字典管理（julyDictionary）- 主子表：上方字典主表，下方选中字典的明细。
 * 已抽离：
 *  - 下方明细子表（行编辑草稿模型）→ `DictionaryItemTable`
 *  - 新建 / 编辑字典弹窗 → `DictionaryFormModal`
 * 本页只负责：主表查询与分页、选中字典、导出、以及把两个子组件拼到卡片里。
 */
import React, { useEffect, useState } from 'react';
import { Button, Card, Popconfirm, Space, Table, Tabs, Tag } from 'antd';
import { DownloadOutlined, PlusOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { useDictionaryState } from '@/stores/system011/julyDictionaryStore';
import { fetchDictionaryPage, selectDictionary, removeDictionary, exportData } from '@/services/system011';
import { toast } from '@/utils/toast';
import { PAGE_SIZE_OPTIONS } from '@/utils/pageSizePref';
import { DictionaryItemTable } from '@/pages/system011/julyDictionary/DictionaryItemTable';
import { DictionaryFormModal } from '@/pages/system011/julyDictionary/DictionaryFormModal';
import type { JulyDictionaryVo011 } from '@/types/system011';

const STATUS_TAG = (s?: string) => <Tag color={s === '1' ? 'green' : 'red'}>{s === '1' ? '启用' : '停用'}</Tag>;

/** 表头一律居中（antd 的 align 只管表体，表头要另给 onHeaderCell） */
const hdrCenter = (): React.HTMLAttributes<HTMLElement> => ({ style: { textAlign: 'center' } });
/** 内容左对齐 + 表头居中（编码 / 名称类列） */
const leftCell = { align: 'left' as const, onHeaderCell: hdrCenter };

export const JulyDictionary = () => {
  const { list, total, loading, query, active } = useDictionaryState();

  // 主表新建 / 编辑弹窗（表单与提交逻辑都在 DictionaryFormModal 内）
  const [dictModal, setDictModal] = useState<{ open: boolean; node: JulyDictionaryVo011 | null }>({ open: false, node: null });

  /** 下方明细区页签：items = 明细项（默认） */
  const [detailTab, setDetailTab] = useState('items');

  // 导出（对接 030 /export/v1，objectCode = julyDictionary / julyDictionaryItem）
  const [exporting, setExporting] = useState(false);
  const handleExport = async (objectCode: string) => {
    setExporting(true);
    try {
      const [format] = ['csv', 'json'];
      const content = await exportData({ objectCode, format });
      const blob = new Blob([content], { type: format === 'json' ? 'application/json' : 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${objectCode}.${format}`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success(`export ${objectCode} success ...`);
    } catch (e) {
      toast.error((e as Error)?.message || '导出失败，请重试');
    } finally {
      setExporting(false);
    }
  };

  // 只重置 pageIndex：pageSize 是用户偏好（存在 store 里），传值会把它覆盖回默认值
  useEffect(() => { fetchDictionaryPage({ pageIndex: 1 }); }, []);

  /** 点主表行 → 选中该字典（写 store 的 active）并拉取其明细；子表订阅 store 自动刷新 */
  const handleSelect = (row: JulyDictionaryVo011) => {
    selectDictionary(row);
  };

  const handleDictRemove = async (id: string) => {
    try {
      await removeDictionary(id);
      toast.success(`delete ${id} success ...`);
    } catch (e) {
      toast.error((e as Error)?.message || '删除失败，请重试');
    }
  };

  /* ==================== 列定义（主表） ==================== */

  const dictColumns: ColumnsType<JulyDictionaryVo011> = [
    { title: '字典编码', dataIndex: 'dictionaryCode', ...leftCell, render: (v) => <code>{v}</code> },
    { title: '字典名称', dataIndex: 'dictionaryName', ...leftCell },
    { title: '排序', dataIndex: 'sortOrder', align: 'center', onHeaderCell: hdrCenter, width: 80 },
    { title: '状态', dataIndex: 'status', align: 'center', onHeaderCell: hdrCenter, width: 80, render: STATUS_TAG },
    {
      title: '操作', key: 'action', width: 160, align: 'center', onHeaderCell: hdrCenter,
      render: (_, r) => (
        <Space size="small">
          <Button type="link" size="small" onClick={() => setDictModal({ open: true, node: r })}>编辑</Button>
          <Popconfirm title="删除该字典会同时删除其全部明细，确定吗？" okText="删除" cancelText="取消" okButtonProps={{ danger: true }} onConfirm={() => handleDictRemove(r.id)}>
            <Button type="link" size="small" danger>删除</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div className="page-header">
        <h2>字典管理</h2>
      </div>

      {/* 工具栏：与 julyUser / julyConfig 一致 —— 页头下方、卡片之外，左对齐一行按钮 */}
      <div className="page-toolbar" style={{ display: 'block' }}>
        <div className="toolbar-right">
          {/* 浅底 tonal（variant="filled"）：颜色表达强度、跟随主题 token，不写死色 */}
          <Button color="primary" variant="filled" icon={<PlusOutlined />}
            onClick={() => setDictModal({ open: true, node: null })}>新建字典</Button>
          <Button color="default" variant="filled" icon={<DownloadOutlined />} loading={exporting}
            onClick={() => handleExport('julyDictionary')}>导出</Button>
        </div>
      </div>

      <Card className="table-wrapper" styles={{ body: { padding: 0 } }} title="字典">
        <Table<JulyDictionaryVo011>
          rowKey="id"
          columns={dictColumns}
          dataSource={list}
          loading={loading}
          scroll={{ x: 900 }}
          rowClassName={(r) => (active?.id === r.id ? 'master-row-selected' : '')}
          onRow={(r) => ({ onClick: () => handleSelect(r), style: { cursor: 'pointer' } })}
          pagination={{
            current: query.pageIndex,
            pageSize: query.pageSize,
            total,
            showSizeChanger: true,
            pageSizeOptions: PAGE_SIZE_OPTIONS,
            showTotal: (t) => `共 ${t} 条`,
            onChange: (pageIndex, pageSize) => fetchDictionaryPage({ pageIndex, pageSize }),
          }}
        />
      </Card>

      <Card className="table-wrapper" styles={{ body: { padding: 0 } }} style={{ marginTop: 16 }}>
        <Tabs
          className="detail-tabs"
          activeKey={detailTab}
          onChange={setDetailTab}
          items={[
            {
              key: 'items',
              label: `明细项${active ? `（${active.dictionaryCode}）` : ''}`,
              children: <DictionaryItemTable active={active} />,
            },
          ]}
        />
      </Card>

      {/* 新建 / 编辑字典弹窗 */}
      <DictionaryFormModal
        open={dictModal.open}
        node={dictModal.node}
        onClose={() => setDictModal({ open: false, node: null })}
      />
    </div>
  );
};

export default JulyDictionary;
