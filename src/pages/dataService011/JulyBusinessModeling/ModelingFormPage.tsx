/**
 * 业务建模（低代码）新建页面（dataservice011 · julyBusinessModeling/new）
 * 由列表页「新建业务模型」按钮路由跳转而来，保存成功后返回列表页。
 * 包含：模型定义（主表 + 字段子表）+ SQL 调试两个 Tab。
 * 拆组件：本页面为路由级组件（用 onNavigate 跳回列表），原 ModelingFormModal 保留用于行内「设计」编辑。
 */
import React, { useEffect, useState } from 'react';
import { PlusOutlined, DeleteOutlined, ThunderboltOutlined, CodeOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import { Alert, Button, Card, Form, Input, Select, Space, Table, Tabs, Spin } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
  saveModeling, probeSql, executeSqlByPage,
} from '@/services/dataservice011';
import { toast } from '@/utils/toast';
import { DATASERVICE011_ROUTES } from '@/config/routes';
import { KlsjnhSql011 } from '@/components/system011';
import { useDatasourceState } from '@/stores/dataservice011/julyDatasourceStore';
import { fetchDatasourcePage } from '@/services/dataservice011';
import type {
  JulyBusinessModelingFieldVo011,
  JulyBusinessModelingSqlResultVo011,
} from '@/types/dataservice011/businessModeling';
import { STATUS_OPTIONS } from '@/config/constants';
import type { PageNavProps } from '@/types/view/page';


/** 字段数据类型选项 */
const DATA_TYPE_OPTIONS = [
  { value: 'varchar', label: 'varchar' },
  { value: 'int', label: 'int' },
  { value: 'bigint', label: 'bigint' },
  { value: 'decimal', label: 'decimal' },
  { value: 'datetime', label: 'datetime' },
  { value: 'date', label: 'date' },
  { value: 'text', label: 'text' },
  { value: 'boolean', label: 'boolean' },
];

/** 是/否 → 1/0 */
const YESNO_OPTIONS = [
  { value: '1', label: '是' },
  { value: '0', label: '否' },
];

/** 探测 / 执行结果展示 */
interface SqlOutcome {
  kind: 'probe' | 'execute' | 'page';
  data?: JulyBusinessModelingSqlResultVo011 & { columns?: { name: string; type: string }[] };
  error?: string;
}

const newField = (): JulyBusinessModelingFieldVo011 => ({
  fieldCode: '', fieldName: '', columnName: '', dataType: 'varchar',
  isPrimaryKey: '0', isNullable: '1', isRequired: '0', sortOrder: 1,
});

export const ModelingFormPage = ({ onNavigate }: PageNavProps) => {
  const [form] = Form.useForm();
  const [saving, setSaving] = useState(false);

  // 数据源列表：从数据源 store 拉取（走接口，非 mock 硬编码）
  const { list: datasourceList } = useDatasourceState();
  const DS_OPTIONS = datasourceList.map((d) => ({ value: d.dsCode, label: `${d.dsName} (${d.dsCode})` }));

  // SQL 调试
  const [sqlDs, setSqlDs] = useState<string>('');
  const [sqlText, setSqlText] = useState<string>('SELECT * FROM ord_order LIMIT 10');
  const [sqlLoading, setSqlLoading] = useState(false);
  const [sqlOutcome, setSqlOutcome] = useState<SqlOutcome | null>(null);
  const [sqlTotal, setSqlTotal] = useState(0);
  const [sqlPage, setSqlPage] = useState({ pageIndex: 1, pageSize: 10 });

  useEffect(() => {
    form.setFieldsValue({ status: '1', fieldData: [newField()] });
    // 拉取数据源列表（若 store 为空）
    if (datasourceList.length === 0) {
      fetchDatasourcePage({ pageIndex: 1, pageSize: 50 });
    }
  }, [form, datasourceList.length]);

  // 数据源加载后自动选中第一条
  useEffect(() => {
    if (!sqlDs && datasourceList.length > 0) {
      setSqlDs(datasourceList[0].dsCode);
    }
  }, [datasourceList, sqlDs]);

  /** 保存 → 成功后跳回列表页 */
  const handleSave = async () => {
    try {
      const v = await form.validateFields();
      setSaving(true);
      const fieldData: JulyBusinessModelingFieldVo011[] = (v.fieldData || []).map((f: JulyBusinessModelingFieldVo011, i: number) => ({
        ...f, sortOrder: f.sortOrder ?? i + 1,
      }));
      const savedId = await saveModeling({ ...v, fieldData });
      toast.success(`insert ${savedId} success ...`);
      onNavigate?.(DATASERVICE011_ROUTES.julyBusinessModeling);
    } catch (e) {
      if ((e as any)?.errorFields) return;
      toast.error((e as Error)?.message || '保存失败，请检查输入');
    } finally { setSaving(false); }
  };

  // ===== SQL 调试动作 =====
  const runSql = async (kind: SqlOutcome['kind']) => {
    if (!sqlDs) { toast.warning('请选择数据源'); return; }
    if (!sqlText.trim()) { toast.warning('请输入 SQL'); return; }
    setSqlLoading(true);
    setSqlOutcome(null);
    try {
      if (kind === 'probe') {
        const res = await probeSql({ dataSourceCode: sqlDs, sqlContent: sqlText });
        setSqlOutcome({ kind, data: { ...res, columns: res.columns } as any });
      } else if (kind === 'execute') {
        const res = await executeSqlByPage({ dataSourceCode: sqlDs, sqlContent: sqlText, pageIndex: 1, pageSize: 10 });
        setSqlTotal(res.total || (res.rows?.length ?? 0));
        setSqlOutcome({ kind, data: res });
      } else {
        const res = await executeSqlByPage({ dataSourceCode: sqlDs, sqlContent: sqlText, pageIndex: sqlPage.pageIndex, pageSize: sqlPage.pageSize });
        setSqlTotal(res.total || (res.rows?.length ?? 0));
        setSqlOutcome({ kind, data: res });
      }
    } catch (e) {
      setSqlOutcome({ kind, error: (e as Error)?.message || '请求失败' });
    } finally {
      setSqlLoading(false);
    }
  };

  const renderOutcome = () => {
    if (!sqlOutcome) return null;
    if (sqlOutcome.error) return <Alert type="error" showIcon message="执行失败" description={sqlOutcome.error} style={{ marginTop: 12 }} />;
    const d = sqlOutcome.data;
    if (sqlOutcome.kind === 'probe') {
      return (
        <div style={{ marginTop: 12 }}>
          <Alert type="success" showIcon message={d?.message || '探测成功'} style={{ marginBottom: 8 }} />
          <Table
            size="small" rowKey="name" pagination={false}
            columns={[{ title: '列名', dataIndex: 'name' }, { title: '类型', dataIndex: 'type' }]}
            dataSource={d?.columns as { name: string; type: string }[] || []}
          />
        </div>
      );
    }
    const cols = (d?.columns as string[] | undefined) || [];
    const rows = (d?.rows as Record<string, unknown>[] | undefined) || [];
    return (
      <div style={{ marginTop: 12 }}>
        <Alert type="success" showIcon message={`${d?.message || '执行成功'}${d?.elapsedMs ? ` · ${d.elapsedMs}ms` : ''}`} style={{ marginBottom: 8 }} />
        <Table
          size="small" rowKey={(_, i) => String(i)} scroll={{ x: 'max-content' }}
          columns={cols.map((c) => ({ title: c, dataIndex: c, key: c, render: (v: unknown) => <code>{v == null ? '' : String(v)}</code> }))}
          dataSource={rows}
          pagination={sqlOutcome.kind === 'execute' || sqlOutcome.kind === 'page' ? {
            current: sqlPage.pageIndex, pageSize: sqlPage.pageSize, total: sqlTotal,
            showTotal: (t) => `共 ${t} 条`,
            onChange: (pi, ps) => { setSqlPage({ pageIndex: pi, pageSize: ps }); runSql('page'); },
          } : false}
        />
      </div>
    );
  };

  return (
    <div className="page-fill">
      <div className="page-header">
        <Space>
          <Button icon={<ArrowLeftOutlined />} onClick={() => onNavigate?.(DATASERVICE011_ROUTES.julyBusinessModeling)}>返回列表</Button>
          <h2 style={{ margin: 0 }}>新建业务模型</h2>
        </Space>
        <p>接口 /julyBusinessModeling/v1/insert</p>
      </div>

      <Card>
        <Tabs
          items={[
            {
              key: 'def',
              label: '模型定义',
              children: (
                <Form form={form} layout="vertical" preserve={false} initialValues={{ status: '1' }}>
                  <Space size="large" wrap>
                    <Form.Item name="modelCode" label="模型编码" rules={[{ required: true, message: '请输入模型编码' }]} style={{ width: 240 }}>
                      <Input placeholder="唯一，如 order_main" />
                    </Form.Item>
                    <Form.Item name="modelName" label="模型名称" rules={[{ required: true, message: '请输入模型名称' }]} style={{ width: 240 }}>
                      <Input placeholder="如 订单主表" />
                    </Form.Item>
                    <Form.Item name="objectName" label="业务对象名" rules={[{ required: true, message: '请输入对象名' }]} style={{ width: 240 }}>
                      <Input placeholder="物理表名，如 ord_order" />
                    </Form.Item>
                  </Space>
                  <Space size="large" wrap>
                    <Form.Item name="dataSourceCode" label="关联数据源" style={{ width: 240 }}>
                      <Select placeholder="选择数据源" options={DS_OPTIONS} allowClear />
                    </Form.Item>
                    <Form.Item name="status" label="状态" rules={[{ required: true }]} style={{ width: 240 }}>
                      <Select options={STATUS_OPTIONS} />
                    </Form.Item>
                  </Space>
                  <Form.Item name="remark" label="备注">
                    <Input.TextArea rows={2} placeholder="备注说明" />
                  </Form.Item>

                  <div className="sub-table-title">
                    <CodeOutlined /> <span>字段子表 (fieldData)</span>
                    <Button type="primary" size="small" icon={<PlusOutlined />} style={{ marginLeft: 'auto' }}
                      onClick={() => {
                        const list = (form.getFieldValue('fieldData') || []) as JulyBusinessModelingFieldVo011[];
                        form.setFieldsValue({ fieldData: [...list, newField()] });
                      }}>新增字段</Button>
                  </div>

                  <Form.List name="fieldData">
                    {(fields, { remove }) => {
                      const columns: ColumnsType<any> = [
                        { title: '字段编码', width: 150, render: (_: any, __: any, idx: number) => <Form.Item name={[idx, 'fieldCode']} rules={[{ required: true, message: '必填' }]} style={{ margin: 0 }}><Input placeholder="fieldCode" /></Form.Item> },
                        { title: '字段名称', width: 130, render: (_: any, __: any, idx: number) => <Form.Item name={[idx, 'fieldName']} rules={[{ required: true, message: '必填' }]} style={{ margin: 0 }}><Input placeholder="名称" /></Form.Item> },
                        { title: '列名', width: 130, render: (_: any, __: any, idx: number) => <Form.Item name={[idx, 'columnName']} rules={[{ required: true, message: '必填' }]} style={{ margin: 0 }}><Input placeholder="col_name" /></Form.Item> },
                        { title: '类型', width: 120, render: (_: any, __: any, idx: number) => <Form.Item name={[idx, 'dataType']} style={{ margin: 0 }}><Select options={DATA_TYPE_OPTIONS} /></Form.Item> },
                        { title: '长度', width: 90, render: (_: any, __: any, idx: number) => <Form.Item name={[idx, 'length']} style={{ margin: 0 }}><Input placeholder="如 64" /></Form.Item> },
                        { title: '主键', width: 80, render: (_: any, __: any, idx: number) => <Form.Item name={[idx, 'isPrimaryKey']} style={{ margin: 0 }}><Select options={YESNO_OPTIONS} /></Form.Item> },
                        { title: '可空', width: 80, render: (_: any, __: any, idx: number) => <Form.Item name={[idx, 'isNullable']} style={{ margin: 0 }}><Select options={YESNO_OPTIONS} /></Form.Item> },
                        { title: '必填', width: 80, render: (_: any, __: any, idx: number) => <Form.Item name={[idx, 'isRequired']} style={{ margin: 0 }}><Select options={YESNO_OPTIONS} /></Form.Item> },
                        { title: '操作', key: 'op', width: 60, render: (_: any, __: any, idx: number) => <Button type="link" size="small" danger icon={<DeleteOutlined />} onClick={() => remove(idx)} /> },
                      ];
                      return (
                        <Table
                          rowKey={(_, i) => String(i)}
                          size="small"
                          columns={columns}
                          dataSource={fields}
                          pagination={false}
                          scroll={{ x: 1080 }}
                          locale={{ emptyText: '请新增字段' }}
                        />
                      );
                    }}
                  </Form.List>

                  <div style={{ marginTop: 24, textAlign: 'right' }}>
                    <Space>
                      <Button onClick={() => onNavigate?.(DATASERVICE011_ROUTES.julyBusinessModeling)}>取消</Button>
                      <Button type="primary" loading={saving} onClick={handleSave}>保存</Button>
                    </Space>
                  </div>
                </Form>
              ),
            },
            {
              key: 'sql',
              label: 'SQL 调试',
              children: (
                <div>
                  <Space wrap style={{ marginBottom: 8 }}>
                    <Select value={sqlDs} style={{ width: 260 }} options={DS_OPTIONS} onChange={setSqlDs} placeholder="选择数据源" />
                    <Button icon={<ThunderboltOutlined />} loading={sqlLoading} onClick={() => runSql('probe')}>探测结构</Button>
                    <Button type="primary" icon={<ThunderboltOutlined />} loading={sqlLoading} onClick={() => runSql('execute')}>执行</Button>
                    <Button loading={sqlLoading} onClick={() => runSql('page')}>分页执行</Button>
                  </Space>
                  <KlsjnhSql011
                    value={sqlText}
                    onChange={setSqlText}
                    onExecute={() => runSql('execute')}
                    height={230}
                    placeholder="输入 SQL，如 SELECT * FROM ord_order LIMIT 10"
                    cacheKey="julyBusinessModeling-sql"
                  />
                  <Spin spinning={sqlLoading}>{renderOutcome()}</Spin>
                </div>
              ),
            },
          ]}
        />
      </Card>
    </div>
  );
};

export default ModelingFormPage;
