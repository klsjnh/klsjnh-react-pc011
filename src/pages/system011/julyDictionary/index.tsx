/** 字典管理（julyDictionary）- 主子表：上方字典主表，下方选中字典的明细 */
import React, { useEffect, useState } from 'react';
import { Button, Card, Col, Form, Input, InputNumber, Modal, Popconfirm, Row, Space, Table, Tag } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { useDictionaryState } from '@/stores/system011/julyDictionaryStore';
import {
  fetchDictionaryPage, saveDictionary, removeDictionary,
  fetchDictionaryItems, saveDictionaryItem, removeDictionaryItem,
  exportData,
} from '@/services/system011';
import { toast } from '@/utils/toast';
import type { JulyDictionaryVo011, JulyDictionaryItemVo011 } from '@/types/system011';

const STATUS_TAG = (s?: string) => <Tag color={s === '1' ? 'green' : 'red'}>{s === '1' ? '启用' : '停用'}</Tag>;

export const JulyDictionary = () => {
  const { list, total, loading, query, active, items, itemsLoading } = useDictionaryState();

  // 主表编辑弹窗
  const [dictModal, setDictModal] = useState<{ open: boolean; node: JulyDictionaryVo011 | null }>({ open: false, node: null });
  const [dictForm] = Form.useForm();
  const [dictSaving, setDictSaving] = useState(false);

  // 明细编辑弹窗
  const [itemModal, setItemModal] = useState<{ open: boolean; node: JulyDictionaryItemVo011 | null }>({ open: false, node: null });
  const [itemForm] = Form.useForm();
  const [itemSaving, setItemSaving] = useState(false);

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

  useEffect(() => { fetchDictionaryPage({ pageIndex: 1, pageSize: 10 }); }, []);

  const dictInitial = {
    dictionaryCode: dictModal.node?.dictionaryCode || '',
    dictionaryName: dictModal.node?.dictionaryName || '',
    sortOrder: dictModal.node?.sortOrder ?? 0,
    remark: dictModal.node?.remark || '',
  };
  const itemInitial = {
    itemCode: itemModal.node?.itemCode || '',
    itemLabel: itemModal.node?.itemLabel || '',
    sortOrder: itemModal.node?.sortOrder ?? 0,
    remark: itemModal.node?.remark || '',
  };

  const handleSelect = (row: JulyDictionaryVo011) => {
    fetchDictionaryItems(row.dictionaryCode);
  };

  const handleDictSave = async () => {
    try {
      const v = await dictForm.validateFields();
      setDictSaving(true);
      const savedId = await saveDictionary({
        id: dictModal.node?.id, dictionaryCode: v.dictionaryCode, dictionaryName: v.dictionaryName,
        sortOrder: v.sortOrder ?? 0, remark: v.remark,
      });
      toast.success(dictModal.node?.id ? `update ${dictModal.node.id} success ...` : `insert ${savedId} success ...`);
      setDictModal({ open: false, node: null });
    } catch (e) {
      toast.error((e as Error)?.message || '保存失败，请检查输入');
    } finally {
      setDictSaving(false);
    }
  };

  const handleDictRemove = async (id: string) => {
    try {
      await removeDictionary(id);
      toast.success(`delete ${id} success ...`);
    } catch (e) {
      toast.error((e as Error)?.message || '删除失败，请重试');
    }
  };

  const handleItemSave = async () => {
    try {
      const v = await itemForm.validateFields();
      if (!active) return toast.warning('请先选择左侧字典');
      setItemSaving(true);
      const savedId = await saveDictionaryItem({
        id: itemModal.node?.id, dictionaryCode: active.dictionaryCode, itemCode: v.itemCode, itemLabel: v.itemLabel,
        sortOrder: v.sortOrder ?? 0, remark: v.remark,
      });
      toast.success(itemModal.node?.id ? `update item ${itemModal.node.id} success ...` : `insert item ${savedId} success ...`);
      setItemModal({ open: false, node: null });
      await fetchDictionaryItems(active.dictionaryCode);
    } catch (e) {
      toast.error((e as Error)?.message || '保存失败，请检查输入');
    } finally {
      setItemSaving(false);
    }
  };

  const handleItemRemove = async (id: string) => {
    try {
      await removeDictionaryItem(id);
      toast.success(`delete item ${id} success ...`);
      if (active) await fetchDictionaryItems(active.dictionaryCode);
    } catch (e) {
      toast.error((e as Error)?.message || '删除失败，请重试');
    }
  };

  const dictColumns: ColumnsType<JulyDictionaryVo011> = [
    { title: '字典编码', dataIndex: 'dictionaryCode', align: 'center', render: (v) => <code>{v}</code> },
    { title: '字典名称', dataIndex: 'dictionaryName', align: 'center' },
    { title: '排序', dataIndex: 'sortOrder', align: 'center', width: 80 },
    { title: '状态', dataIndex: 'status', align: 'center', width: 80, render: STATUS_TAG },
    {
      title: '操作', key: 'action', width: 160, align: 'center',
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

  const itemColumns: ColumnsType<JulyDictionaryItemVo011> = [
    { title: '项编码', dataIndex: 'itemCode', align: 'center', render: (v) => <code>{v}</code> },
    { title: '项标签', dataIndex: 'itemLabel', align: 'center' },
    { title: '排序', dataIndex: 'sortOrder', align: 'center', width: 80 },
    { title: '状态', dataIndex: 'status', align: 'center', width: 80, render: STATUS_TAG },
    {
      title: '操作', key: 'action', width: 160, align: 'center',
      render: (_, r) => (
        <Space size="small">
          <Button type="link" size="small" onClick={() => setItemModal({ open: true, node: r })}>编辑</Button>
          <Popconfirm title="确定删除这个明细吗？" okText="删除" cancelText="取消" okButtonProps={{ danger: true }} onConfirm={() => handleItemRemove(r.id)}>
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
        <p>共 {total} 个字典 · 当前选中：{active ? <code>{active.dictionaryCode}</code> : '无'} · 接口 /julyDictionary/v1/*</p>
      </div>

      <Card className="table-wrapper" styles={{ body: { padding: 0 } }} title="字典（主表）"
        extra={<Space>
          <Button loading={exporting} onClick={() => handleExport('julyDictionary')}>导出</Button>
          <Button type="primary" onClick={() => { dictForm.resetFields(); setDictModal({ open: true, node: null }); }}>+ 新建字典</Button>
        </Space>}>
        <Table<JulyDictionaryVo011>
          rowKey="id"
          columns={dictColumns}
          dataSource={list}
          loading={loading}
          scroll={{ x: 900 }}
          rowClassName={(r) => (active?.id === r.id ? 'dict-row-selected' : '')}
          onRow={(r) => ({ onClick: () => handleSelect(r), style: { cursor: 'pointer' } })}
          pagination={{
            current: query.pageIndex,
            pageSize: query.pageSize,
            total,
            showSizeChanger: true,
            pageSizeOptions: [10, 50, 100],
            showTotal: (t) => `共 ${t} 条`,
            onChange: (pageIndex, pageSize) => fetchDictionaryPage({ pageIndex, pageSize }),
          }}
        />
      </Card>

      <Card className="table-wrapper" styles={{ body: { padding: 0 } }} style={{ marginTop: 16 }}
        title={`明细（${active ? active.dictionaryCode : '未选中字典'}）`}
        extra={<Space>
          <Button loading={exporting} disabled={!active} onClick={() => handleExport('julyDictionaryItem')}>导出</Button>
          <Button type="primary" disabled={!active} onClick={() => { itemForm.resetFields(); setItemModal({ open: true, node: null }); }}>+ 新建明细</Button>
        </Space>}>
        <Table<JulyDictionaryItemVo011>
          rowKey="id"
          columns={itemColumns}
          dataSource={items}
          loading={itemsLoading}
          scroll={{ x: 800 }}
          locale={{ emptyText: active ? '暂无明细' : '请先在上方选中一个字典' }}
        />
      </Card>

      {/* 主表编辑弹窗 */}
      <Modal title={dictModal.node ? '编辑字典' : '新建字典'} key={dictModal.node?.id ?? 'new'} open={dictModal.open}
        onCancel={() => setDictModal({ open: false, node: null })} onOk={handleDictSave} okText="保存" cancelText="取消"
        confirmLoading={dictSaving} destroyOnClose>
        <Form form={dictForm} layout="vertical" preserve={false} initialValues={dictInitial}>
          <Row gutter={16}>
            <Col span={16}>
              <Form.Item name="dictionaryCode" label="字典编码" rules={[{ required: true, message: '请输入字典编码' }]}>
                <Input disabled={!!dictModal.node} placeholder="唯一，创建后不可修改，如 SYS_USER_STATUS" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="sortOrder" label="排序"><InputNumber style={{ width: '100%' }} min={0} /></Form.Item>
            </Col>
          </Row>
          <Form.Item name="dictionaryName" label="字典名称" rules={[{ required: true, message: '请输入字典名称' }]}>
            <Input placeholder="请输入字典名称" />
          </Form.Item>
          <Form.Item name="remark" label="备注"><Input.TextArea rows={2} placeholder="备注说明" /></Form.Item>
        </Form>
      </Modal>

      {/* 明细编辑弹窗 */}
      <Modal title={itemModal.node ? '编辑明细' : '新建明细'} key={itemModal.node?.id ?? 'new'} open={itemModal.open}
        onCancel={() => setItemModal({ open: false, node: null })} onOk={handleItemSave} okText="保存" cancelText="取消"
        confirmLoading={itemSaving} destroyOnClose>
        <Form form={itemForm} layout="vertical" preserve={false} initialValues={itemInitial}>
          <Row gutter={16}>
            <Col span={16}>
              <Form.Item name="itemCode" label="项编码" rules={[{ required: true, message: '请输入项编码' }]}>
                <Input disabled={!!itemModal.node} placeholder="同一字典内唯一，如 1 / 0 / M" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="sortOrder" label="排序"><InputNumber style={{ width: '100%' }} min={0} /></Form.Item>
            </Col>
          </Row>
          <Form.Item name="itemLabel" label="项标签" rules={[{ required: true, message: '请输入项标签' }]}>
            <Input placeholder="如 启用 / 停用 / 男 / 女" />
          </Form.Item>
          <Form.Item name="remark" label="备注"><Input.TextArea rows={2} placeholder="备注说明" /></Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default JulyDictionary;