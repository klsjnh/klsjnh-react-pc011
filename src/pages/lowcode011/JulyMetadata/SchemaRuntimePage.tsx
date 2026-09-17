/**
 * 低代码「运行时」页（lowcode011 · /lowcode011/schemaRuntime?objectName=xxx）
 *
 * 形态来源：老项目 `klsjnh-react-dev011_20260909_011/src/pages/july011/SchemaRuntimePage.tsx`
 * + `src/types/schema.ts` 的三个派生函数（listColumns / formFields / queryFields）。
 * 用户口径「老逻辑照搬」，故派生规则整体移植，只把数据结构换成本项目后端契约
 * （`JulyMetadataVo011` 的 fields / displays / services，见 types/lowcode011/julyMetadata/vo.ts）。
 *
 * 参数走 **query** 而不是路径段：objectName 唯一且用户自定义，query 天然支持特殊字符。
 *   /lowcode011/schemaRuntime?objectName=sys_user
 *
 * ★ 分流口径（接口有的对上，没有的说明是 mock）：
 *   - 元数据（列 / 表单 / 查询区 / 服务开关）→ **真实接口** getByObjectName
 *   - 缺 objectName 时的可选对象列表 → **真实接口** listModels（039 一期，2026-09-17 上线）
 *   - 数据 CRUD（分页 / 新增 / 修改 / 删除）→ **PENDING-BACKEND** 占位
 *     （后端 039 三期规划为 /runtime/<objectName>，未实装）
 *     页面上以橙色 Alert 明示，占位实现见 src/mock/lowcode011/pendingRuntime.ts。
 *
 * ⚠️ 老项目的 displays 带 `scene: list|form|query` 三态，本项目后端 `JulyMetadataDisplayVo011`
 *    **没有 scene**（只有 componentType / displayType）。故派生规则改为：
 *      · 列表列 = displays（按 sortOrder），无 displays 时用 fields 兜底（剔主键/审计列）
 *      · 表单域 = fields（按 sortOrder，剔主键/审计列）
 *      · 查询区 = displays 里的文本/状态列前 4 个；无 displays 时用 fields 兜底
 */
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Alert, Button, Card, Form, Input, InputNumber, Modal, Popconfirm, Select, Space, Table, Tag, Typography,
} from 'antd';
import { ArrowLeftOutlined, EditOutlined, PlusOutlined, ReloadOutlined, SearchOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { LOWCODE011_ROUTES } from '@/config/routes';
import { useTableFillHeight } from '@/hooks/useTableFillHeight';
import { loadPageSize, PAGE_SIZE_OPTIONS } from '@/utils/pageSizePref';
import {
  deleteRuntime, getRuntimeMeta, insertRuntime, listMetadataModels, pageRuntime, updateRuntime,
  type RuntimeRow,
} from '@/services/lowcode011';
import { toast } from '@/utils/toast';
import type { JulyMetadataModelRow011, JulyMetadataVo011 } from '@/types/lowcode011';

const { Text } = Typography;

/* ===================================================================== */
/* 派生规则（移植自老项目 types/schema.ts，适配本项目 VO 结构）            */
/* ===================================================================== */

/** 主键 / 审计列：不进表单、不作为查询条件 */
const AUDIT_CODES = ['id', 'create_by', 'update_by', 'create_time', 'update_time', 'dr'];

const norm = (s?: string | null) => (s || '').trim().toLowerCase();
const bySort = (a: { sortOrder?: number }, b: { sortOrder?: number }) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0);

/**
 * 服务开关：把操作名映射到 serviceCode / objectType 的别名。
 * 后端 `ServiceObjectType011` 未展开，示例数据里写的是 query / save，
 * 故这里同时认 serviceCode（insert/update/…）与 objectType（query/save/…）。
 * 无匹配行 = 未配置 → 视为开启（与老项目 `row?.enabled !== false` 行为一致）。
 */
const SERVICE_ALIASES: Record<string, string[]> = {
  query: ['query', 'select', 'list', 'page', 'selectlist', 'selectlistbypage'],
  insert: ['insert', 'save', 'add', 'create'],
  update: ['update', 'edit', 'modify'],
  delete: ['delete', 'remove', 'logicdelete'],
};

function isServiceEnabled(meta: JulyMetadataVo011 | null, op: string): boolean {
  const rows = meta?.services || [];
  const aliases = SERVICE_ALIASES[op] || [op];
  const row = rows.find((s) => aliases.includes(norm(s.serviceCode)) || aliases.includes(norm(s.objectType)));
  return row?.enabled !== false;
}

/** 列定义（列表 / 查询区共用） */
interface ColumnDef {
  code: string;
  name: string;
  width?: number;
  align?: string;
  displayType?: string;
}

/** 列表列：displays 优先（用户显式配置），否则 fields 剔主键/审计列 */
function listColumnDefs(meta: JulyMetadataVo011): ColumnDef[] {
  const displays = [...(meta.displays || [])].sort(bySort);
  if (displays.length) {
    return displays.map((d) => ({
      code: d.displayCode,
      name: d.displayName,
      width: d.width || undefined,
      align: d.align || 'left',
      displayType: d.displayType,
    }));
  }
  return [...(meta.fields || [])]
    .sort(bySort)
    .filter((f) => !AUDIT_CODES.includes(f.fieldCode))
    .map((f) => ({ code: f.fieldCode, name: f.fieldName, width: undefined, align: 'left' }));
}

/** 表单域：fields 剔主键/审计列（编辑区按字段类型渲染控件） */
interface FormDef { code: string; name: string; fieldType: string; required: boolean }

function formFieldDefs(meta: JulyMetadataVo011): FormDef[] {
  return [...(meta.fields || [])]
    .sort(bySort)
    .filter((f) => !AUDIT_CODES.includes(f.fieldCode))
    .map((f) => ({
      code: f.fieldCode,
      name: f.fieldName,
      fieldType: f.fieldType,
      required: !!f.requiredField,
    }));
}

/** 查询区：displays 的文本/状态列前 4 个（老项目同样 slice(0,4)），否则 fields 兜底 */
interface QueryDef { code: string; name: string; isStatus: boolean }

function queryFieldDefs(meta: JulyMetadataVo011): QueryDef[] {
  const displays = [...(meta.displays || [])].sort(bySort);
  const toDef = (code: string, name: string, type?: string): QueryDef => ({
    code, name, isStatus: norm(type) === 'status' || code === 'status',
  });
  if (displays.length) {
    const textish = displays.filter((d) => {
      const c = norm(d.componentType);
      const t = norm(d.displayType);
      return c === 'text' || c === 'tag' || t === 'text' || t === 'status';
    });
    return (textish.length ? textish : displays).slice(0, 4)
      .map((d) => toDef(d.displayCode, d.displayName, d.displayType || d.componentType));
  }
  return [...(meta.fields || [])]
    .sort(bySort)
    .filter((f) => !AUDIT_CODES.includes(f.fieldCode) && f.fieldCode !== 'status')
    .slice(0, 4)
    .map((f) => toDef(f.fieldCode, f.fieldName, f.fieldType));
}

/** status 列取值 → 标签（'1' 启用 / '0' 停用 / 其它显示 —） */
const statusCell = (v: unknown): React.ReactNode => {
  if (v === '1' || v === 1 || v === true) return <Tag color="green">启用</Tag>;
  if (v === '0' || v === 0 || v === false) return <Tag color="red">停用</Tag>;
  return <Text type="secondary">—</Text>;
};

/** 通用单元值渲染：空值统一显示 —，便于与「0 / false」区分 */
function renderPlainCell(v: unknown): React.ReactNode {
  if (v == null || v === '') return <Text type="secondary">—</Text>;
  if (typeof v === 'boolean') return v ? '是' : '否';
  return String(v);
}

/** 按字段类型选编辑控件（id / 审计列不在表单内） */
function renderFormControl(fieldType: string): React.ReactNode {
  switch (norm(fieldType)) {
    case 'status':
      return <Select options={[{ value: '1', label: '启用' }, { value: '0', label: '停用' }]} />;
    case 'boolean':
      return <Select options={[{ value: 'true', label: '是' }, { value: 'false', label: '否' }]} />;
    case 'int':
    case 'float':
    case 'decimal':
    case 'number':
      return <InputNumber style={{ width: '100%' }} />;
    case 'text':
      return <Input.TextArea rows={3} />;
    default:
      return <Input />;
  }
}

/* ===================================================================== */
/* 页面                                                                  */
/* ===================================================================== */

/** 每页条数偏好 scope（key 约定同 utils/pageSizePref：pc011-<scope>-pageSize） */
const PAGE_SIZE_SCOPE = 'schemaRuntime';

const PENDING_TEXT = '运行时动态 CRUD 属后端 039 三期（未实装，后端规划为 /runtime/<objectName>）；'
  + '下方列表数据为内存占位、刷新即重置。对象元数据与模型列表走真实接口（getByObjectName / listModels）。';

export const SchemaRuntimePage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const objectName = useMemo(
    () => new URLSearchParams(location.search).get('objectName') || '',
    [location.search],
  );

  const [meta, setMeta] = useState<JulyMetadataVo011 | null>(null);
  const [metaLoading, setMetaLoading] = useState(!!objectName);

  // 缺 objectName 时用它列出可选模型（真实接口 listModels）
  const [models, setModels] = useState<JulyMetadataModelRow011[]>([]);
  const [modelsLoading, setModelsLoading] = useState(!objectName);

  const [rows, setRows] = useState<RuntimeRow[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [pageIndex, setPageIndex] = useState(1);
  const [pageSize, setPageSize] = useState(() => loadPageSize(PAGE_SIZE_SCOPE));

  const [editing, setEditing] = useState<RuntimeRow | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form] = Form.useForm();
  const [queryForm] = Form.useForm();

  const cardRef = useRef<HTMLDivElement>(null);
  const tableBodyHeight = useTableFillHeight(cardRef, `${total}-${loading}`);

  /* ---------------- 元数据（真实接口） ---------------- */
  useEffect(() => {
    if (!objectName) { setMetaLoading(false); return; }
    setMetaLoading(true);
    getRuntimeMeta(objectName)
      .then(setMeta)
      .catch((e) => toast.error((e as Error)?.message || '加载对象元数据失败'))
      .finally(() => setMetaLoading(false));
  }, [objectName]);

  /* ---------------- 模型列表（真实接口 listModels；仅缺 objectName 时取） ---------------- */
  useEffect(() => {
    if (objectName) return;
    setModelsLoading(true);
    listMetadataModels()
      .then(setModels)
      .catch((e) => toast.error((e as Error)?.message || '加载模型列表失败'))
      .finally(() => setModelsLoading(false));
  }, [objectName]);

  /* ---------------- 查询条件 → filters ---------------- */
  const buildQuery = useCallback((page: number, size: number) => {
    const values = queryForm.getFieldsValue() as Record<string, unknown>;
    const filters = Object.entries(values)
      .filter(([, v]) => v != null && String(v).trim() !== '')
      .map(([field, value]) => {
        const def = meta?.fields?.find((f) => f.fieldCode === field);
        const t = norm(def?.fieldType);
        return { field, op: t === 'id' || t === 'status' ? 'eq' : 'like', value };
      });
    return { pageIndex: page, pageSize: size, ...(filters.length ? { filters } : {}) };
  }, [queryForm, meta]);

  /* ---------------- 数据（PENDING-BACKEND 占位） ---------------- */
  const fetchPage = useCallback(async (page: number, size: number) => {
    if (!objectName) return;
    setLoading(true);
    try {
      const res = await pageRuntime(objectName, buildQuery(page, size));
      setRows(res.rows || []);
      setTotal(res.total || 0);
      setPageIndex(res.pageIndex || page);
      setPageSize(res.pageSize || size);
    } catch (e) {
      toast.error((e as Error)?.message || '加载数据失败');
    } finally {
      setLoading(false);
    }
  }, [objectName, buildQuery]);

  // 进入对象（或切对象）时重置查询条件并回第一页
  useEffect(() => {
    if (!objectName) return;
    queryForm.resetFields();
    void fetchPage(1, loadPageSize(PAGE_SIZE_SCOPE));
  }, [objectName]); // eslint-disable-line react-hooks/exhaustive-deps

  /* ---------------- 能力开关 & 列派生 ---------------- */
  const canQuery = isServiceEnabled(meta, 'query');
  const canInsert = isServiceEnabled(meta, 'insert');
  const canUpdate = isServiceEnabled(meta, 'update');
  const canDelete = isServiceEnabled(meta, 'delete');

  const columnDefs = useMemo(() => (meta ? listColumnDefs(meta) : []), [meta]);
  const formDefs = useMemo(() => (meta ? formFieldDefs(meta) : []), [meta]);
  const queryDefs = useMemo(() => (meta ? queryFieldDefs(meta) : []), [meta]);

  const actionWidth = (canUpdate ? 72 : 0) + (canDelete ? 72 : 0) + (canUpdate || canDelete ? 24 : 0);
  const tableWidth = useMemo(
    () => columnDefs.reduce((sum, c) => sum + (c.width || 160), 0) + actionWidth,
    [columnDefs, actionWidth],
  );

  /* ---------------- 增删改 ---------------- */
  const handleDelete = useCallback(async (id: string) => {
    if (!objectName) return;
    try {
      await deleteRuntime(objectName, id);
      toast.success('删除成功');
      await fetchPage(pageIndex, pageSize);
    } catch (e) {
      toast.error((e as Error)?.message || '删除失败');
    }
  }, [objectName, fetchPage, pageIndex, pageSize]);

  /** 切对象走 query（保留在同一路由，避免页面重挂载丢偏好） */
  const enterModel = useCallback((name: string) => {
    navigate(`${LOWCODE011_ROUTES.schemaRuntime}?objectName=${encodeURIComponent(name)}`);
  }, [navigate]);

  const openAdd = useCallback(() => { setEditing(null); setModalOpen(true); }, []);
  const openEdit = useCallback((record: RuntimeRow) => { setEditing(record); setModalOpen(true); }, []);

  const handleOk = async () => {
    if (!objectName) return;
    let values: Record<string, unknown>;
    try {
      values = await form.validateFields();
    } catch {
      return; // 校验失败：antd 已在字段下方给出提示
    }
    setSaving(true);
    try {
      if (editing?.id) {
        await updateRuntime(objectName, { ...values, id: editing.id });
        toast.success('修改成功');
      } else {
        // 新增不传 id（占位实现自行生成；真实后端同样不接受前端传 id）
        await insertRuntime(objectName, values);
        toast.success('新增成功');
      }
      setModalOpen(false);
      await fetchPage(editing?.id ? pageIndex : 1, pageSize);
    } catch (e) {
      toast.error((e as Error)?.message || '保存失败');
    } finally {
      setSaving(false);
    }
  };

  const onQuery = () => { void fetchPage(1, pageSize); };
  const onResetQuery = () => { queryForm.resetFields(); void fetchPage(1, pageSize); };

  const onPageChange = (nextPage: number, nextSize: number) => {
    // pageSize 是用户偏好：换页大小时落盘（key 约定与 utils/pageSizePref 一致）
    if (nextSize !== pageSize) {
      try { localStorage.setItem(`pc011-${PAGE_SIZE_SCOPE}-pageSize`, String(nextSize)); } catch { /* 仅内存生效 */ }
    }
    void fetchPage(nextPage, nextSize);
  };

  /* ---------------- 列 ---------------- */
  const columns: ColumnsType<RuntimeRow> = useMemo(() => {
    const cols: ColumnsType<RuntimeRow> = columnDefs.map((def) => {
      const isStatus = norm(def.displayType) === 'status' || def.code === 'status';
      return {
        title: def.name || def.code,
        dataIndex: def.code,
        key: def.code,
        width: def.width || 160,
        align: def.align === 'center' || def.align === 'right' ? def.align : 'left',
        render: (v: unknown) => (isStatus ? statusCell(v) : renderPlainCell(v)),
      };
    });
    if (actionWidth > 0) {
      cols.push({
        title: '操作', key: 'action', width: actionWidth, align: 'center', fixed: 'right',
        render: (_: unknown, record: RuntimeRow) => (
          <Space size="small">
            {canUpdate && (
              <Button type="link" size="small" icon={<EditOutlined />} onClick={() => openEdit(record)}>编辑</Button>
            )}
            {canDelete && (
              <Popconfirm
                title="确定删除这条数据吗？" okText="删除" cancelText="取消" okButtonProps={{ danger: true }}
                onConfirm={() => handleDelete(String(record.id))}
              >
                <Button type="link" size="small" danger>删除</Button>
              </Popconfirm>
            )}
          </Space>
        ),
      });
    }
    return cols;
  }, [columnDefs, actionWidth, canUpdate, canDelete, openEdit, handleDelete]);

  /* ---------------- 缺参兜底：用真实接口 listModels 列出可选对象 ---------------- */
  if (!objectName) {
    const modelColumns: ColumnsType<JulyMetadataModelRow011> = [
      {
        title: '对象名', dataIndex: 'objectName', key: 'objectName', width: 280,
        render: (v: string) => <Button type="link" size="small" onClick={() => enterModel(v)}>{v}</Button>,
      },
      {
        title: '描述', dataIndex: 'description', key: 'description',
        render: (v: string | null) => v || <Text type="secondary">—</Text>,
      },
      {
        title: '对象类型', dataIndex: 'objectType', key: 'objectType', width: 150,
        render: (v: string | null) => v || <Text type="secondary">—</Text>,
      },
      {
        title: '操作', key: 'action', width: 120, align: 'center', fixed: 'right',
        render: (_: unknown, r: JulyMetadataModelRow011) => (
          <Button type="link" size="small" onClick={() => enterModel(r.objectName)}>进入运行时</Button>
        ),
      },
    ];
    return (
      <div className="page-fill">
        <div className="page-header">
          <h2>运行时页</h2>
          <p>未指定对象：从下方模型列表选一个进入（数据来自 /julyMetadata/v1/listModels）。</p>
        </div>
        <div className="page-toolbar">
          <div className="toolbar-left">
            <Text type="secondary">共 {models.length} 个模型</Text>
          </div>
          <div className="toolbar-right">
            <Button
              color="default" variant="filled" icon={<ReloadOutlined />}
              onClick={() => {
                setModelsLoading(true);
                listMetadataModels()
                  .then(setModels)
                  .catch((e) => toast.error((e as Error)?.message || '加载模型列表失败'))
                  .finally(() => setModelsLoading(false));
              }}
            >
              刷新
            </Button>
            <Button color="primary" variant="filled" onClick={() => navigate(LOWCODE011_ROUTES.julyMetadata)}>
              去元数据管理
            </Button>
          </div>
        </div>
        <Card className="table-wrapper" styles={{ body: { padding: 0 } }}>
          <Table<JulyMetadataModelRow011>
            rowKey="objectName"
            columns={modelColumns}
            dataSource={models}
            loading={modelsLoading}
            pagination={false}
            locale={{ emptyText: '暂无模型，请先在「元数据管理」中新建' }}
            onRow={(r) => ({ onClick: () => enterModel(r.objectName), style: { cursor: 'pointer' } })}
          />
        </Card>
      </div>
    );
  }

  const backPath = meta?.id ? `${LOWCODE011_ROUTES.julyMetadata}/${meta.id}` : LOWCODE011_ROUTES.julyMetadata;

  return (
    <div className="page-fill">
      <div className="page-header">
        <Space>
          <Button icon={<ArrowLeftOutlined />} onClick={() => navigate(backPath)}>返回设计器</Button>
          <h2 style={{ margin: 0 }}>{meta?.description || objectName}</h2>
          <Tag color="blue">{objectName}</Tag>
          {meta?.objectType ? <Tag color="geekblue">{meta.objectType}</Tag> : null}
        </Space>
        <p>按元数据动态渲染：列 / 表单 / 查询区 / 服务开关均来自 /julyMetadata/v1/getByObjectName</p>
      </div>

      {/* 工具栏：卡片之外、右对齐一行按钮 */}
      <div className="page-toolbar">
        <div className="toolbar-left">
          <Text type="secondary">
            共 {total} 条 · 服务开关：查询 {canQuery ? '开' : '关'} / 新增 {canInsert ? '开' : '关'} /
            修改 {canUpdate ? '开' : '关'} / 删除 {canDelete ? '开' : '关'}
          </Text>
        </div>
        <div className="toolbar-right">
          <Button color="primary" variant="filled" icon={<PlusOutlined />} disabled={!canInsert} onClick={openAdd}>新增</Button>
          <Button color="default" variant="filled" icon={<ReloadOutlined />} onClick={() => fetchPage(pageIndex, pageSize)}>刷新</Button>
        </div>
      </div>

      <Alert
        type="warning" showIcon style={{ marginBottom: 16, flex: '0 0 auto' }}
        message="数据 CRUD 为前端占位实现（PENDING-BACKEND）"
        description={PENDING_TEXT}
      />

      {canQuery && queryDefs.length > 0 && (
        <Card size="small" style={{ marginBottom: 16, flex: '0 0 auto' }}>
          <Form form={queryForm} layout="inline" onFinish={onQuery}>
            {queryDefs.map((def) => (
              <Form.Item key={def.code} name={def.code} label={def.name || def.code}>
                {def.isStatus ? (
                  <Select
                    allowClear style={{ width: 120 }}
                    options={[{ label: '启用', value: '1' }, { label: '停用', value: '0' }]}
                  />
                ) : (
                  <Input allowClear placeholder={def.name || def.code} style={{ width: 170 }} />
                )}
              </Form.Item>
            ))}
            <Form.Item>
              <Space>
                <Button color="primary" variant="filled" htmlType="submit" icon={<SearchOutlined />}>查询</Button>
                <Button color="default" variant="filled" onClick={onResetQuery}>重置</Button>
              </Space>
            </Form.Item>
          </Form>
        </Card>
      )}

      <Card className="table-wrapper" ref={cardRef} styles={{ body: { padding: 0 } }}>
        <Table<RuntimeRow>
          rowKey={(r) => String(r.id)}
          columns={columns}
          dataSource={rows}
          loading={loading || metaLoading}
          scroll={{ x: tableWidth, y: tableBodyHeight }}
          pagination={{
            current: pageIndex,
            pageSize,
            total,
            showSizeChanger: true,
            pageSizeOptions: PAGE_SIZE_OPTIONS,
            showTotal: (t) => `共 ${t} 条`,
            onChange: onPageChange,
          }}
          locale={{ emptyText: '暂无数据' }}
        />
      </Card>

      <Modal
        title={editing ? `编辑 · ${objectName}` : `新增 · ${objectName}`}
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        onOk={handleOk}
        confirmLoading={saving}
        destroyOnHidden
        width={560}
      >
        <Form form={form} key={editing?.id ?? 'new'} layout="vertical" initialValues={editing ?? {}}>
          {formDefs.length === 0 ? (
            <Alert type="info" showIcon message="该对象未配置字段定义，无法录入数据（请先在设计器里维护「字段定义」）" />
          ) : formDefs.map((def) => (
            <Form.Item
              key={def.code}
              name={def.code}
              label={def.name || def.code}
              rules={def.required ? [{ required: true, message: `请输入${def.name || def.code}` }] : undefined}
            >
              {renderFormControl(def.fieldType)}
            </Form.Item>
          ))}
        </Form>
      </Modal>
    </div>
  );
};

export default SchemaRuntimePage;
