/**
 * 业务建模（低代码）新建 / 编辑页面（dataservice011 · julyBusinessModeling/new 或 /:id）
 *
 * 流程对齐老项目 `JulyModelEdit`：选数据源 → 写 SQL → ① 探测并生成字段 → ② 保存 → ③ 元数据设计。
 *
 * ★ 契约以**后端源码**为准（`java17-web011/.../vo/julybusinessmodeling/*.java`，Swagger 未建模出参形状）：
 *   - 出参形态 = 主表裸列 + `metaData`，**字段表在 `metaData.fieldData`（嵌套）**；
 *   - 字段项形状 `code / name / fieldType / length / notNull / defaultValue`（FieldType011 12 值）；
 *   - `probe` 后端即 `probeAndInfer`：**直接返回推断好的字段定义（已补齐公共列）**，
 *     前端拿回后灌进子表即可，不需要自己从列名猜类型；
 *   - 领域层 `replaceFields` 是**整体替换**且不做公共列补齐 → 提交时须回传**全量字段**（含公共列）。
 */
import React, { useEffect, useState } from 'react';
import {
  PlusOutlined, DeleteOutlined, ThunderboltOutlined, CodeOutlined, ArrowLeftOutlined,
} from '@ant-design/icons';
import { Alert, Button, Card, Form, Input, InputNumber, Select, Space, Switch, Table, Tabs, Spin } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
  saveModeling, probeSql, executeSql, executeSqlByPage, getModelingById, fetchDatasourcePage,
} from '@/services/dataservice011';
import { useDatasourceState } from '@/stores/dataservice011/julyDatasourceStore';
import { toast } from '@/utils/toast';
import { DATASERVICE011_ROUTES } from '@/config/routes';
import { KlsjnhSql011 } from '@/components/system011';
import { STATUS_OPTIONS } from '@/config/constants';
import {
  FIELD_TYPE_011_OPTIONS, OBJECT_TYPE_011_OPTIONS,
  type JulyBusinessModelingFieldVo011,
} from '@/types/dataservice011/businessModeling';
import type { PageNavProps } from '@/types/view/page';

/** SQL 调试结果 */
interface SqlOutcome {
  kind: 'probe' | 'execute' | 'page';
  /** 探测：后端推断出的字段 */
  probedFields?: JulyBusinessModelingFieldVo011[];
  /** 执行：列名 + 行 */
  columns?: string[];
  rows?: Record<string, unknown>[];
  total?: number;
  message?: string;
  error?: string;
}

/** 新增业务字段的初值（fieldType 取 FieldType011 的 string） */
const newField = (): JulyBusinessModelingFieldVo011 => ({
  code: '', name: '', fieldType: 'string', length: 60, notNull: false, defaultValue: '',
});

/** 从行数据推列名（分页执行不返回 columns） */
const columnsOf = (rows: Record<string, unknown>[] | undefined): string[] =>
  rows && rows.length > 0 ? Object.keys(rows[0]) : [];

interface Props extends PageNavProps {
  /** 编辑时传入 id；新增不传 */
  id?: string;
}

export const ModelingFormPage = ({ id, onNavigate }: Props) => {
  const [form] = Form.useForm();
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(!!id);

  // 数据源列表：从数据源 store 拉取（走接口，非 mock 硬编码）
  const { list: datasourceList } = useDatasourceState();
  const DS_OPTIONS = datasourceList.map((d) => ({ value: d.dsCode, label: `${d.dsName} (${d.dsCode})` }));

  // SQL 调试
  const [sqlDs, setSqlDs] = useState<string>('');
  const [sqlText, setSqlText] = useState<string>('SELECT * FROM ord_order LIMIT 10');
  const [sqlLoading, setSqlLoading] = useState(false);
  const [outcome, setOutcome] = useState<SqlOutcome | null>(null);
  const [sqlPage, setSqlPage] = useState({ pageIndex: 1, pageSize: 10 });

  // data-loading effect: load depends on id/form/datasourceList
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (id) {
      setLoading(true);
      getModelingById(id)
        .then((node) => {
          const meta = node.metaData || {};
          form.setFieldsValue({
            modelCode: node.modelCode,
            modelName: node.modelName,
            objectName: node.objectName,
            dataSourceCode: node.dataSourceCode || undefined,
            status: node.status || '1',
            remark: node.remark || '',
            // 产物 metaData 回显：注意 description ↔ objectDescription、importField ↔ businessField、url ↔ routerPath
            objectType: meta.objectType || 'type011',
            objectDescription: meta.description || '',
            packageName: meta.packageName || '',
            businessField: meta.importField || '',
            routerPath: meta.url || '',
            fieldData: meta.fieldData || [],
          });
          if (node.dataSourceCode) setSqlDs(node.dataSourceCode);
          if (node.sqlContent) setSqlText(node.sqlContent);
        })
        .catch((e) => toast.error((e as Error)?.message || '加载详情失败'))
        .finally(() => setLoading(false));
    } else {
      form.setFieldsValue({ status: '1', objectType: 'type011', fieldData: [] });
    }
    if (datasourceList.length === 0) {
      fetchDatasourcePage({ pageIndex: 1, pageSize: 50 });
    }
  }, [id, form, datasourceList.length]);

  // 数据源加载后自动选中第一条（仅新增且未选时）
  // default datasource selection when creating new modeling
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (!sqlDs && datasourceList.length > 0 && !id) {
      setSqlDs(datasourceList[0].dsCode);
    }
  }, [datasourceList, sqlDs, id]);

  /** 当前字段子表（用于「新增字段」与探测器回填） */
  const getFields = (): JulyBusinessModelingFieldVo011[] =>
    (form.getFieldValue('fieldData') || []) as JulyBusinessModelingFieldVo011[];

  const handleAddField = () => {
    form.setFieldsValue({ fieldData: [...getFields(), newField()] });
  };

  /** 保存 → 成功后跳回列表页 */
  const handleSave = async () => {
    let v: Record<string, unknown>;
    try {
      v = await form.validateFields();
    } catch (e) {
      if (e && typeof e === 'object' && 'errorFields' in e) return;
      return;
    }
    setSaving(true);
    try {
      const savedId = await saveModeling({
        id,
        modelCode: String(v.modelCode || '').trim(),
        modelName: String(v.modelName || '').trim(),
        objectName: String(v.objectName || '').trim(),
        dataSourceCode: String(v.dataSourceCode || ''),
        // 产物字段随 SQL 一起提交，避免 update 时丢失
        sqlContent: sqlText,
        objectType: v.objectType as string,
        objectDescription: (v.objectDescription as string) || '',
        packageName: (v.packageName as string) || '',
        businessField: (v.businessField as string) || '',
        routerPath: (v.routerPath as string) || '',
        remark: (v.remark as string) || '',
        status: (v.status as string) || '1',
        fieldData: (v.fieldData || []) as JulyBusinessModelingFieldVo011[],
      });
      toast.success(`${id ? 'update' : 'insert'} ${savedId} success ...`);
      onNavigate?.(DATASERVICE011_ROUTES.julyBusinessModeling);
    } catch (e) {
      toast.error((e as Error)?.message || '保存失败，请检查输入');
    } finally {
      setSaving(false);
    }
  };

  // ===== SQL 调试动作 =====
  const runSql = async (kind: SqlOutcome['kind'], pageIndex?: number) => {
    if (!sqlDs) { toast.warning('请选择数据源'); return; }
    if (!sqlText.trim()) { toast.warning('请输入 SQL'); return; }
    setSqlLoading(true);
    setOutcome(null);
    try {
      if (kind === 'probe') {
        const res = await probeSql({
          dataSourceCode: sqlDs,
          sqlContent: sqlText,
          objectName: String(form.getFieldValue('objectName') || '') || undefined,
        });
        if (!res.success) {
          setOutcome({ kind, error: res.message || '探测失败' });
          return;
        }
        const inferred = res.fieldData || [];
        setOutcome({ kind, probedFields: inferred, message: res.message });
        toast.success(`已推断 ${inferred.length} 个字段，点「应用到字段子表」写入`);
      } else if (kind === 'execute') {
        const res = await executeSql({ dataSourceCode: sqlDs, sqlContent: sqlText });
        setOutcome({ kind, columns: res.columns, rows: res.rows, message: '执行成功' });
      } else {
        const res = await executeSqlByPage({
          dataSourceCode: sqlDs, sqlContent: sqlText,
          pageIndex: pageIndex || sqlPage.pageIndex, pageSize: sqlPage.pageSize,
        });
        setOutcome({
          kind, rows: res.rows, total: res.total,
          columns: columnsOf(res.rows), message: '分页执行成功',
        });
      }
    } catch (e) {
      setOutcome({ kind, error: (e as Error)?.message || '请求失败' });
    } finally {
      setSqlLoading(false);
    }
  };

  /** 把探测出的字段写入字段子表（对齐老项目 probeAndInfer 的体验） */
  const applyProbedFields = () => {
    const fields = outcome?.probedFields || [];
    if (!fields.length) { toast.warning('没有可应用的字段'); return; }
    form.setFieldsValue({ fieldData: fields.map((f) => ({ ...f })) });
    toast.success(`已写入 ${fields.length} 个字段`);
  };

  const renderOutcome = () => {
    if (!outcome) return null;
    if (outcome.error) {
      return <Alert type="error" showIcon message="执行失败" description={outcome.error} style={{ marginTop: 12 }} />;
    }
    if (outcome.kind === 'probe') {
      const fields = outcome.probedFields || [];
      return (
        <div style={{ marginTop: 12 }}>
          <Alert
            type="success" showIcon style={{ marginBottom: 8 }}
            message={outcome.message || '探测成功'}
            description="后端已按 FieldType011 推断类型并补齐公共列（id / status / 审计四列 / dr）。"
            action={<Button size="small" type="primary" onClick={applyProbedFields}>应用到字段子表</Button>}
          />
          <Table
            size="small" rowKey="code" pagination={false} scroll={{ x: 640 }}
            columns={[
              { title: '字段编码', dataIndex: 'code', width: 160 },
              { title: '字段名称', dataIndex: 'name', width: 140 },
              { title: '字段类型', dataIndex: 'fieldType', width: 130 },
              { title: '长度', dataIndex: 'length', width: 80 },
              { title: '必填', dataIndex: 'notNull', width: 80, render: (v: boolean) => (v ? '是' : '') },
            ]}
            dataSource={fields}
          />
        </div>
      );
    }
    const cols = outcome.columns || [];
    const rows = outcome.rows || [];
    return (
      <div style={{ marginTop: 12 }}>
        <Alert type="success" showIcon message={outcome.message || '执行成功'} style={{ marginBottom: 8 }} />
        <Table
          size="small" rowKey={(_, i) => String(i)} scroll={{ x: 'max-content' }}
          columns={cols.map((c) => ({
            title: c, dataIndex: c, key: c,
            render: (v: unknown) => <code>{v == null ? '' : String(v)}</code>,
          }))}
          dataSource={rows}
          pagination={outcome.kind === 'page' ? {
            current: sqlPage.pageIndex, pageSize: sqlPage.pageSize, total: outcome.total || 0,
            showTotal: (t) => `共 ${t} 条`,
            onChange: (pi, ps) => { setSqlPage({ pageIndex: pi, pageSize: ps }); runSql('page', pi); },
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
          <h2 style={{ margin: 0 }}>{id ? '编辑业务模型' : '新建业务模型'}</h2>
        </Space>
        <p>{id ? `接口 /julyBusinessModeling/v1/update（id=${id}）` : '接口 /julyBusinessModeling/v1/insert'}</p>
      </div>

      <Card loading={loading}>
        <Tabs
          items={[
            {
              key: 'def',
              label: '模型定义',
              children: (
                <Form form={form} layout="vertical" preserve={false} initialValues={{ status: '1', objectType: 'type011' }}>
                  <Space size="large" wrap>
                    <Form.Item name="modelCode" label="模型编码" rules={[{ required: true, message: '请输入模型编码' }]} style={{ width: 240 }}>
                      <Input placeholder="唯一，如 order_main" disabled={!!id} />
                    </Form.Item>
                    <Form.Item name="modelName" label="模型名称" rules={[{ required: true, message: '请输入模型名称' }]} style={{ width: 240 }}>
                      <Input placeholder="如 订单主表" />
                    </Form.Item>
                    <Form.Item name="objectName" label="业务对象名" rules={[{ required: true, message: '请输入对象名' }]} style={{ width: 240 }}>
                      <Input placeholder="物理表名，如 ord_order" disabled={!!id} />
                    </Form.Item>
                  </Space>
                  <Space size="large" wrap>
                    <Form.Item name="dataSourceCode" label="关联数据源" rules={[{ required: true, message: '请选择数据源' }]} style={{ width: 240 }}>
                      <Select placeholder="选择数据源" options={DS_OPTIONS} allowClear />
                    </Form.Item>
                    <Form.Item name="status" label="状态" rules={[{ required: true }]} style={{ width: 240 }}>
                      <Select options={STATUS_OPTIONS} />
                    </Form.Item>
                    <Form.Item name="objectType" label="对象类型" style={{ width: 240 }}>
                      <Select options={OBJECT_TYPE_011_OPTIONS.map((o) => ({ value: o.value, label: o.label }))} />
                    </Form.Item>
                  </Space>
                  <Space size="large" wrap>
                    <Form.Item name="objectDescription" label="对象描述" style={{ width: 240 }}>
                      <Input placeholder="如 订单业务对象" />
                    </Form.Item>
                    <Form.Item name="packageName" label="目标包名" style={{ width: 240 }}>
                      <Input placeholder="如 com.klsjnh.business" />
                    </Form.Item>
                    <Form.Item name="businessField" label="导入导出字段" style={{ width: 240 }}>
                      <Input placeholder="逗号分隔，如 code,name" />
                    </Form.Item>
                    <Form.Item name="routerPath" label="前端路由" style={{ width: 240 }}>
                      <Input placeholder="如 /business/ord_order" />
                    </Form.Item>
                  </Space>
                  <Form.Item name="remark" label="备注">
                    <Input.TextArea rows={2} placeholder="备注说明" />
                  </Form.Item>

                  <div className="sub-table-title">
                    <CodeOutlined /> <span>字段子表（metaData.fieldData，FieldType011）</span>
                    <Button type="primary" size="small" icon={<PlusOutlined />} style={{ marginLeft: 'auto' }} onClick={handleAddField}>
                      新增字段
                    </Button>
                  </div>
                  <Alert
                    type="info" showIcon style={{ marginBottom: 8 }}
                    message="公共列（id / status / create_by / update_by / create_time / update_time / dr）由探针自动补齐。"
                    description="领域层为「整体替换」，保存时会把本表全量提交 —— 请勿手工删除公共列。"
                  />

                  <Form.List name="fieldData">
                    {(fields, { remove }) => {
                      const columns: ColumnsType<{ key: number }> = [
                        { title: '字段编码', width: 160, render: (_: unknown, __: unknown, idx: number) => <Form.Item name={[idx, 'code']} rules={[{ required: true, message: '必填' }]} style={{ margin: 0 }}><Input placeholder="snake_case" /></Form.Item> },
                        { title: '字段名称', width: 140, render: (_: unknown, __: unknown, idx: number) => <Form.Item name={[idx, 'name']} rules={[{ required: true, message: '必填' }]} style={{ margin: 0 }}><Input placeholder="中文名" /></Form.Item> },
                        { title: '字段类型', width: 170, render: (_: unknown, __: unknown, idx: number) => <Form.Item name={[idx, 'fieldType']} style={{ margin: 0 }}><Select options={FIELD_TYPE_011_OPTIONS.map((o) => ({ value: o.value, label: o.label }))} /></Form.Item> },
                        { title: '长度', width: 100, render: (_: unknown, __: unknown, idx: number) => <Form.Item name={[idx, 'length']} style={{ margin: 0 }}><InputNumber style={{ width: '100%' }} min={0} placeholder="0" /></Form.Item> },
                        { title: '必填', width: 80, render: (_: unknown, __: unknown, idx: number) => <Form.Item name={[idx, 'notNull']} valuePropName="checked" style={{ margin: 0 }}><Switch size="small" /></Form.Item> },
                        { title: '默认值', width: 140, render: (_: unknown, __: unknown, idx: number) => <Form.Item name={[idx, 'defaultValue']} style={{ margin: 0 }}><Input placeholder="可选" /></Form.Item> },
                        { title: '操作', key: 'op', width: 60, render: (_: unknown, __: unknown, idx: number) => <Button type="link" size="small" danger icon={<DeleteOutlined />} onClick={() => remove(idx)} /> },
                      ];
                      return (
                        <Table
                          rowKey={(_, i) => String(i)}
                          size="small"
                          columns={columns}
                          dataSource={fields}
                          pagination={false}
                          scroll={{ x: 940 }}
                          locale={{ emptyText: '请到「SQL 调试」探测生成字段，或手工新增' }}
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
                    <Button icon={<ThunderboltOutlined />} loading={sqlLoading} onClick={() => runSql('probe')}>探测并推断字段</Button>
                    <Button type="primary" icon={<ThunderboltOutlined />} loading={sqlLoading} onClick={() => runSql('execute')}>执行</Button>
                    <Button loading={sqlLoading} onClick={() => runSql('page')}>分页执行</Button>
                  </Space>
                  <KlsjnhSql011
                    value={sqlText}
                    onChange={setSqlText}
                    onExecute={() => runSql('execute')}
                    height={230}
                    placeholder="输入只读 SELECT 语句，如 SELECT * FROM ord_order LIMIT 10"
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
