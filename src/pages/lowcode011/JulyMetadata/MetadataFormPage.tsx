/**
 * 元数据（低代码）设计器页（lowcode011 · JulyMetadata/new 或 /JulyMetadata/:id）
 *
 * 结构对齐老项目 `MetadataDesigner`（6 Tab + 顶部动作条），按本项目约定重排：
 *   ① 字段定义 ② 显示列 ③ 服务        —— 真实接口（一主三子整体提交）
 *   ④ 数据初始化 / 同步 ⑤ 开放 API ⑥ JSON
 *   顶部动作：保存 / 发布建表（DDL 预览 + 真执行）/ 发布菜单 / 运行时页
 *
 * ★ 分流口径（用户要求：接口有的对上，没有的说明是 mock）
 *   - ①②③ + 保存：真实接口 `lowcode011/julyMetadata/v1/*`（038 CRUD）
 *   - **DDL 预览**：真实接口 `v1/previewDdl`（039 一期，2026-09-17 后端上线）
 *   - **发布建表 / 数据初始化同步**：真实接口 `v1/publish` `v1/importStatus` `v1/importDataFromSql`
 *     （039 二期，2026-09-17 后端上线）—— `publish` 会**真正执行 DDL**，受服务端开关
 *     `krt.lowcode.ddl-execute.enabled` 控制（关闭时 → 400 `ddl execute disabled ...`）
 *   - 发布菜单 / 运行时菜单 / 开放 API：**PENDING-BACKEND**（039 三期未实装；
 *     占位见 `src/mock/lowcode011/pendingBackend.ts`，界面以 🧪 角标提示）
 *
 * ⚠️ 发布态（是否已发布）**只能**取自 `importStatus`：`listModels` / `load` 里的
 * publishStatus 是后端硬编码的 `draft`，不可用于判断。
 */
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Alert, App, Button, Card, Checkbox, Form, Input, InputNumber, Modal, Radio, Select, Space, Switch,
  Tabs, Tag, Typography,
} from 'antd';
import {
  ArrowLeftOutlined, CloudUploadOutlined, CopyOutlined, KeyOutlined, MenuOutlined,
  PlayCircleOutlined, ReloadOutlined, RocketOutlined, SaveOutlined, SyncOutlined,
} from '@ant-design/icons';
import { FieldTable, type SubTableHandle } from '@/pages/lowcode011/JulyMetadata/FieldTable';
import { DisplayTable } from '@/pages/lowcode011/JulyMetadata/DisplayTable';
import { ServiceTable } from '@/pages/lowcode011/JulyMetadata/ServiceTable';
import {
  getMetadataById, saveMetadata,
  publish, previewDdl, publishMenu, importStatus, importDataFromSql,
  getOpenApiConfig, saveOpenApiConfig, rotateApiKey,
} from '@/services/lowcode011';
import { toast } from '@/utils/toast';
import { LOWCODE011_ROUTES } from '@/config/routes';
import type { PageNavProps } from '@/types/view/page';
import type {
  JulyMetadataDisplayVo011, JulyMetadataFieldVo011, JulyMetadataSaveVo011,
  JulyMetadataServiceVo011, JulyMetadataVo011,
} from '@/types/lowcode011';
import type {
  ImportStatusResult, OpenApiAuthMode, OpenApiConfigResult,
} from '@/types/lowcode011/metadataDesigner';

const { Paragraph, Text } = Typography;

const OBJECT_TYPE_OPTIONS = [
  { value: 'type011', label: 'type011（普通对象）' },
  { value: 'type013', label: 'type013' },
  { value: 'type_tree', label: 'type_tree（树形）' },
  { value: 'type_tree011', label: 'type_tree011' },
  { value: 'type021', label: 'type021' },
];

/** 开放 API 允许的操作 */
const OPEN_API_OPS = [
  { label: '查询 query', value: 'query' },
  { label: '新增 insert', value: 'insert' },
  { label: '修改 update', value: 'update' },
  { label: '删除 delete', value: 'delete' },
];

/** 后端未实现的能力统一角标 */
const PendingTag = () => (
  <Tag color="orange" style={{ marginLeft: 6 }} title="后端尚未实现，当前为前端占位实现（PENDING-BACKEND）">
    🧪 占位
  </Tag>
);

interface Props extends PageNavProps {
  /** 编辑时传入 id；新增为 null */
  id?: string;
}

export const MetadataFormPage = ({ id, onNavigate }: Props) => {
  const { message } = App.useApp();
  const [form] = Form.useForm();
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(!!id);
  const [node, setNode] = useState<JulyMetadataVo011 | null>(null);
  const [nodeKey, setNodeKey] = useState<string>(id || 'new');

  const fieldRef = useRef<SubTableHandle<JulyMetadataFieldVo011>>(null);
  const displayRef = useRef<SubTableHandle<JulyMetadataDisplayVo011>>(null);
  const serviceRef = useRef<SubTableHandle<JulyMetadataServiceVo011>>(null);

  /** 当前对象名（新增态为空 —— 依赖发布的能力此时不可用） */
  const objectName = node?.objectName || '';

  // ===== 发布 / 同步（039 二期，真实接口）/ 开放 API（三期，占位） =====
  const [publishStatus, setPublishStatus] = useState<'draft' | 'published'>('draft');
  const [publishOpen, setPublishOpen] = useState(false);
  const [migrateData, setMigrateData] = useState(true);
  const [ddlPreview, setDdlPreview] = useState('');
  /** 发布后后端实际执行的 DDL（表已存在且无新增列时为 null） */
  const [publishedDdl, setPublishedDdl] = useState<string | null>(null);
  const [publishing, setPublishing] = useState(false);
  const [importState, setImportState] = useState<ImportStatusResult | null>(null);
  const [importRunning, setImportRunning] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [importLog, setImportLog] = useState<string[]>([]);
  /** 数据同步源（后端 importDataFromSql 的 dataSourceCode + sqlCode 三个必填之二） */
  const [syncDataSource, setSyncDataSource] = useState('');
  const [syncSql, setSyncSql] = useState('');
  const [openApiConfig, setOpenApiConfig] = useState<OpenApiConfigResult | null>(null);
  const [openApiSaving, setOpenApiSaving] = useState(false);
  const [apiKeyModal, setApiKeyModal] = useState<{ open: boolean; apiKey: string }>({ open: false, apiKey: '' });

  const applyNode = useCallback((n: JulyMetadataVo011) => {
    setNode(n);
    form.setFieldsValue({
      objectName: n.objectName,
      objectType: n.objectType,
      description: n.description || '',
      businessField: n.businessField || '',
      packageName: n.packageName || '',
      routerPath: n.routerPath || '',
      sortOrder: n.sortOrder,
      status: n.status || '1',
      remark: n.remark || '',
    });
    setNodeKey(n.id);
  }, [form]);

  /**
   * 拉取发布 / 同步 / 开放 API 状态。
   * `importStatus` = **真实接口**（042 二期），是**唯一**可信的发布态来源；
   * `getOpenApiConfig` = 三期占位（内存态）。任一失败不阻断页面。
   */
  const refreshDesignerState = useCallback(async (name: string) => {
    if (!name) return;
    try {
      const [st, cfg] = await Promise.all([importStatus(name), getOpenApiConfig(name)]);
      setImportState(st);
      setPublishStatus(st.publishStatus === 'published' ? 'published' : 'draft');
      setOpenApiConfig(cfg);
    } catch {
      // 状态拉取失败不应阻断编辑主流程
    }
  }, []);

  useEffect(() => {
    if (id) {
      setLoading(true);
      getMetadataById(id)
        .then((n) => {
          applyNode(n);
          void refreshDesignerState(n.objectName);
        })
        .catch((e) => toast.error((e as Error)?.message || '加载详情失败'))
        .finally(() => setLoading(false));
    } else {
      form.resetFields();
      form.setFieldsValue({ status: '1', sortOrder: 9999 });
      setNode(null);
      setNodeKey('new');
      setPublishStatus('draft');
      setImportState(null);
      setPublishedDdl(null);
      setOpenApiConfig(null);
    }
  }, [id, form, applyNode, refreshDesignerState]);

  /** 汇总三子 + 主表 → 保存入参 */
  const collectPayload = async (): Promise<JulyMetadataSaveVo011 | null> => {
    let v: Record<string, unknown>;
    try {
      v = await form.validateFields();
    } catch (e) {
      if (e && typeof e === 'object' && 'errorFields' in e) return null;
      return null;
    }
    const fields = fieldRef.current?.getSaveData() || [];
    const displays = displayRef.current?.getSaveData() || [];
    const services = serviceRef.current?.getSaveData() || [];

    const fCodes = fields.map((f) => (f.fieldCode || '').trim()).filter(Boolean);
    if (new Set(fCodes).size !== fCodes.length) { toast.warning('字段编码在同一对象内不能重复'); return null; }
    const dCodes = displays.map((d) => (d.displayCode || '').trim()).filter(Boolean);
    if (new Set(dCodes).size !== dCodes.length) { toast.warning('显示列编码在同一对象内不能重复'); return null; }
    const sCodes = services.map((s) => (s.serviceCode || '').trim()).filter(Boolean);
    if (new Set(sCodes).size !== sCodes.length) { toast.warning('服务编码在同一对象内不能重复'); return null; }

    return {
      id: id || undefined,
      objectName: String(v.objectName || '').trim(),
      sortOrder: Number(v.sortOrder) || 9999,
      objectType: v.objectType as string,
      description: (v.description as string) || null,
      businessField: (v.businessField as string) || null,
      packageName: (v.packageName as string) || null,
      routerPath: (v.routerPath as string) || null,
      remark: (v.remark as string) || null,
      status: (v.status as string) || '1',
      fields, displays, services,
    };
  };

  const handleSave = async () => {
    const payload = await collectPayload();
    if (!payload) return;
    setSaving(true);
    try {
      const savedId = await saveMetadata(payload);
      toast.success(`${id ? 'update' : 'insert'} success ...`);
      if (!id && savedId && savedId !== 'new') {
        // 新增：留在本页继续完善（切到编辑态），方便接着发布
        onNavigate?.(`${LOWCODE011_ROUTES.julyMetadata}/${savedId}`);
        return;
      }
      onNavigate?.(LOWCODE011_ROUTES.julyMetadata);
    } catch (e) {
      toast.error((e as Error)?.message || '保存失败，请重试');
    } finally {
      setSaving(false);
    }
  };

  /** 保存但不跳走（发布前需要先落库） */
  const handleSaveStay = async () => {
    const payload = await collectPayload();
    if (!payload) return null;
    setSaving(true);
    try {
      const savedId = await saveMetadata(payload);
      toast.success('已保存');
      if (!id && savedId && savedId !== 'new') {
        onNavigate?.(`${LOWCODE011_ROUTES.julyMetadata}/${savedId}`);
      }
      return savedId;
    } catch (e) {
      toast.error((e as Error)?.message || '保存失败，请重试');
      return null;
    } finally {
      setSaving(false);
    }
  };

  // ===== 发布建表（039 二期，真实接口 → 真正执行 DDL） =====
  const openPublish = async () => {
    if (!objectName) { toast.warning('请先保存，生成对象名'); return; }
    const savedId = await handleSaveStay();
    if (!savedId) return;
    try {
      setDdlPreview(await previewDdl(objectName));
      setPublishedDdl(null);
      setPublishOpen(true);
    } catch (e) {
      toast.error((e as Error)?.message || '预览 DDL 失败');
    }
  };

  const handlePublish = async () => {
    if (!objectName) return;
    setPublishing(true);
    try {
      const res = await publish(objectName, migrateData);
      setPublishedDdl(res.ddl ?? null);
      setPublishOpen(false);
      setPublishStatus('published');
      if (res.ddl === null) {
        // 表已存在且无新增列 → 后端无操作，返回 ddl=null
        toast.success(`${objectName} 结构已是最新，无新增列（版本 ${res.version || '-'}）`);
      } else {
        toast.success(`发布成功：版本 ${res.version || '-'}，物理表 ${res.physicalTable || '-'}`);
      }
      await refreshDesignerState(objectName);
    } catch (e) {
      toast.error((e as Error)?.message || '发布失败');
    } finally {
      setPublishing(false);
    }
  };

  // ===== 发布菜单（PENDING-BACKEND） =====
  const handlePublishMenu = async () => {
    if (!objectName) { toast.warning('请先保存，生成对象名'); return; }
    try {
      const res = await publishMenu(objectName, 'business011');
      toast.success(`菜单已挂载：${res.menuCode}`);
    } catch (e) {
      toast.error((e as Error)?.message || '发布菜单失败');
    }
  };

  // ===== 数据初始化 / 同步（039 二期，真实接口；分页循环 + 进度 + 日志） =====
  const runImportBatch = async (forceInit = false) => {
    if (!objectName) { toast.warning('请先保存，生成对象名'); return; }
    if (publishStatus !== 'published') { toast.warning('请先「发布建表」，物理表存在后才能同步数据'); return; }
    if (!syncDataSource.trim()) { toast.warning('请填写源数据源编码（dataSourceCode）'); return; }
    if (!syncSql.trim()) { toast.warning('请填写源 SQL'); return; }
    setImportRunning(true);
    setImportProgress(0);
    setImportLog([]);
    let pageNum = 1;
    let hasMore = true;
    const totals = { inserted: 0, updated: 0, unchanged: 0, skipped: 0 };
    try {
      while (hasMore) {
        const res = await importDataFromSql({
          objectName,
          dataSourceCode: syncDataSource.trim(),
          // ⚠️ 后端参数名叫 sqlCode，实际语义是 **SQL 文本**（BusinessModelingExecuteCommand.sqlContent）
          sqlCode: syncSql.trim(),
          pageNum,
          pageSize: 100,
          forceInit,
        });
        totals.inserted += res.inserted;
        totals.updated += res.updated;
        totals.unchanged += res.unchanged;
        totals.skipped += res.skipped;
        setImportLog((prev) => [
          ...prev,
          `第 ${res.pageNum} 页 [${res.mode}] 写入 ${res.inserted} 行`
            + `（后端 updated=${res.updated} / unchanged=${res.unchanged} / skipped=${res.skipped} 暂恒为 0）`,
        ]);
        hasMore = res.hasMore;
        pageNum = res.nextPageNum || pageNum + 1;
        setImportProgress(hasMore ? Math.min(95, pageNum * 20) : 100);
      }
      toast.success(`同步完成，共写入 ${totals.inserted} 行`);
      await refreshDesignerState(objectName);
    } catch (e) {
      toast.error((e as Error)?.message || '数据同步失败');
    } finally {
      setImportRunning(false);
      setImportProgress(100);
    }
  };

  // ===== 开放 API（PENDING-BACKEND） =====
  const handleSaveOpenApi = async () => {
    if (!objectName || !openApiConfig) return;
    setOpenApiSaving(true);
    try {
      const result = await saveOpenApiConfig({
        objectName,
        enabled: openApiConfig.enabled && openApiConfig.authMode !== 'closed',
        authMode: openApiConfig.authMode,
        allowedOps: openApiConfig.allowedOps,
      });
      setOpenApiConfig(result);
      if (result.apiKey) setApiKeyModal({ open: true, apiKey: result.apiKey });
      toast.success('开放 API 配置已保存');
    } catch (e) {
      toast.error((e as Error)?.message || '保存开放 API 失败');
    } finally {
      setOpenApiSaving(false);
    }
  };

  const handleRotateApiKey = async () => {
    if (!objectName) return;
    try {
      const result = await rotateApiKey(objectName);
      setOpenApiConfig(result);
      if (result.apiKey) setApiKeyModal({ open: true, apiKey: result.apiKey });
      toast.success('apiKey 已重新生成');
    } catch (e) {
      toast.error((e as Error)?.message || '重新生成 apiKey 失败');
    }
  };

  const copyApiKey = async () => {
    try {
      await navigator.clipboard.writeText(apiKeyModal.apiKey);
      toast.success('已复制 apiKey');
    } catch {
      toast.warning('复制失败，请手动选择复制');
    }
  };

  /** JSON 直编：解析后回填主表表单 */
  const handleJsonChange = (text: string) => {
    try {
      const parsed = JSON.parse(text) as JulyMetadataSaveVo011;
      form.setFieldsValue({
        objectName: parsed.objectName,
        objectType: parsed.objectType,
        description: parsed.description || '',
        businessField: parsed.businessField || '',
        packageName: parsed.packageName || '',
        routerPath: parsed.routerPath || '',
        status: parsed.status || '1',
        remark: parsed.remark || '',
      });
    } catch {
      // 输入过程中非法 JSON：忽略，不打断编辑
    }
  };

  const pendingDisabled = !objectName;

  return (
    <div className="page-fill">
      <div className="page-header">
        <Space>
          <Button icon={<ArrowLeftOutlined />} onClick={() => onNavigate?.(LOWCODE011_ROUTES.julyMetadata)}>返回列表</Button>
          <h2 style={{ margin: 0 }}>{id ? '编辑元数据' : '新建元数据'}</h2>
          {objectName ? <Tag color="blue">{objectName}</Tag> : null}
          {publishStatus === 'published'
            ? <Tag color="green">已发布</Tag>
            : <Tag color="orange">待发版</Tag>}
        </Space>
        <p>{id ? `接口 /julyMetadata/v1/update（id=${id}）` : '接口 /julyMetadata/v1/insert'}</p>
      </div>

      {/* 顶部动作条：保存 / 发布建表 / 发布菜单 / 运行时 */}
      <div className="page-toolbar">
        <div className="toolbar-right">
          <Button color="primary" variant="filled" icon={<SaveOutlined />} loading={saving} onClick={handleSave}>保存并返回</Button>
          <Button color="default" variant="filled" icon={<RocketOutlined />} loading={publishing} disabled={pendingDisabled} onClick={openPublish}>
            发布建表
          </Button>
          <Button color="default" variant="filled" icon={<MenuOutlined />} disabled={pendingDisabled} onClick={handlePublishMenu}>
            发布菜单<PendingTag />
          </Button>
          <Button
            color="default" variant="filled" icon={<PlayCircleOutlined />} disabled={pendingDisabled}
            onClick={() => onNavigate?.(`${LOWCODE011_ROUTES.schemaRuntime}?objectName=${encodeURIComponent(objectName)}`)}
          >
            运行时页
          </Button>
        </div>
      </div>

      <Card loading={loading}>
        <Form form={form} layout="vertical" requiredMark>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0 16px' }}>
            <Form.Item label="对象名（objectName）" name="objectName" rules={[{ required: true, message: '请输入对象名' }]}>
              <Input placeholder="唯一且不可变，如 sys_user" disabled={!!id} />
            </Form.Item>
            <Form.Item label="对象类型" name="objectType" rules={[{ required: true, message: '请选择对象类型' }]}>
              <Select options={OBJECT_TYPE_OPTIONS} placeholder="请选择" />
            </Form.Item>
            <Form.Item label="对象描述" name="description" rules={[{ required: true, message: '请输入对象描述' }]}>
              <Input placeholder="如 系统用户" />
            </Form.Item>
            <Form.Item label="业务字段清单" name="businessField">
              <Input placeholder="如 id,username,status" />
            </Form.Item>
            <Form.Item label="目标包名" name="packageName">
              <Input placeholder="如 com.klsjnh.sys" />
            </Form.Item>
            <Form.Item label="前端路由" name="routerPath">
              <Input placeholder="如 /system011/julyUser" />
            </Form.Item>
            <Form.Item label="排序" name="sortOrder">
              <InputNumber style={{ width: '100%' }} placeholder="9999" />
            </Form.Item>
            <Form.Item label="备注" name="remark" style={{ gridColumn: 'span 2' }}>
              <Input placeholder="可选" />
            </Form.Item>
            <Form.Item label="状态" name="status" rules={[{ required: true, message: '请选择状态' }]} style={{ gridColumn: '1 / -1' }}>
              <Select options={[{ value: '1', label: '启用' }, { value: '0', label: '停用' }]} />
            </Form.Item>
          </div>
        </Form>

        <Tabs
          className="detail-tabs"
          defaultActiveKey="fields"
          items={[
            {
              key: 'fields',
              label: `字段定义（${node?.fields?.length ?? 0}）`,
              children: <FieldTable key={`f-${nodeKey}`} initial={node?.fields || []} saving={saving} ref={fieldRef} />,
            },
            {
              key: 'displays',
              label: `显示列（${node?.displays?.length ?? 0}）`,
              children: <DisplayTable key={`d-${nodeKey}`} initial={node?.displays || []} saving={saving} ref={displayRef} />,
            },
            {
              key: 'services',
              label: `服务（${node?.services?.length ?? 0}）`,
              children: <ServiceTable key={`s-${nodeKey}`} initial={node?.services || []} saving={saving} ref={serviceRef} />,
            },
            {
              key: 'data',
              label: '数据初始化 / 同步',
              children: (
                <Card size="small">
                  <Alert
                    type={publishStatus === 'published' ? 'info' : 'warning'} showIcon style={{ marginBottom: 12 }}
                    message={publishStatus !== 'published'
                      ? '尚未发布：请先「发布建表」落物理表，否则后端会拒绝同步（400 object not published）'
                      : (importState?.dataInitialized ? '已初始化：可继续增量同步' : '未初始化：首次按 SQL 分页(100) 拉取并写入物理表')}
                    description="真实接口 v1/importDataFromSql（039 二期）：源 SQL 走业务建模分页执行器，目标表取最新发布快照。⚠️ 后端 updated / unchanged / skipped 暂恒为 0，只有写入行数可信。"
                  />
                  <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: '0 12px' }}>
                    <div>
                      <Text type="secondary">源数据源编码（dataSourceCode）</Text>
                      <Input
                        style={{ marginTop: 4 }} placeholder="如 ds20260913001"
                        value={syncDataSource} onChange={(e) => setSyncDataSource(e.target.value)}
                      />
                    </div>
                    <div>
                      <Text type="secondary">源 SQL</Text>
                      <Input.TextArea
                        style={{ marginTop: 4, fontFamily: 'monospace' }} rows={3} autoSize={{ minRows: 3, maxRows: 6 }}
                        placeholder="SELECT id, username, status FROM sys_user WHERE status = 1"
                        value={syncSql} onChange={(e) => setSyncSql(e.target.value)}
                      />
                    </div>
                  </div>
                  <Space wrap style={{ margin: '12px 0' }}>
                    <Tag color={publishStatus === 'published' ? 'green' : 'orange'}>
                      {publishStatus === 'published' ? '已发布' : '待发布'}
                    </Tag>
                    <Tag color={importState?.dataInitialized ? 'green' : 'blue'}>
                      {importState?.dataInitialized ? '已初始化' : '未初始化'}
                    </Tag>
                    {importState?.physicalTable ? <Text type="secondary">物理表：{importState.physicalTable}</Text> : null}
                  </Space>
                  <div>
                    <Space wrap>
                      <Button
                        color="primary" variant="filled" icon={<CloudUploadOutlined />} loading={importRunning} disabled={pendingDisabled}
                        onClick={() => runImportBatch(false)}
                      >
                        {importState?.dataInitialized ? '增量同步' : '首次初始化'}
                      </Button>
                      <Button icon={<SyncOutlined />} disabled={importRunning || pendingDisabled} onClick={() => runImportBatch(true)}>
                        强制全量
                      </Button>
                      <Button icon={<ReloadOutlined />} disabled={pendingDisabled} onClick={() => objectName && refreshDesignerState(objectName)}>
                        刷新状态
                      </Button>
                    </Space>
                  </div>
                  {importRunning && (
                    <div style={{ marginTop: 12 }}>
                      <Text type="secondary">同步进度 {importProgress}%</Text>
                    </div>
                  )}
                  {importLog.length > 0 && (
                    <pre style={{ marginTop: 12, background: 'var(--bg-hover)', padding: 8, maxHeight: 160, overflow: 'auto' }}>
                      {importLog.join('\n')}
                    </pre>
                  )}
                </Card>
              ),
            },
            {
              key: 'openapi',
              label: '开放 API',
              children: (
                <Card size="small">
                  <Alert
                    type="warning" showIcon style={{ marginBottom: 16 }}
                    message="对外 REST 入口，与内部 /klsjnh/runtime 分离"
                    description="authMode=none 时仅允许查询；authMode=apiKey 时 Header 携带 X-Api-Key。后端尚未实现，当前为前端占位。"
                  />
                  <Space direction="vertical" style={{ width: '100%' }} size="middle">
                    <Space wrap>
                      <span>启用</span>
                      <Switch
                        checked={Boolean(openApiConfig?.enabled && openApiConfig.authMode !== 'closed')}
                        disabled={publishStatus !== 'published' || !openApiConfig}
                        onChange={(checked) => setOpenApiConfig((prev) => (prev ? {
                          ...prev,
                          enabled: checked,
                          authMode: checked ? (prev.authMode === 'closed' ? 'apiKey' : prev.authMode) : 'closed',
                        } : prev))}
                      />
                      {publishStatus !== 'published' && <Tag color="orange">需先发布建表</Tag>}
                    </Space>
                    <Radio.Group
                      value={openApiConfig?.authMode}
                      disabled={!openApiConfig?.enabled || publishStatus !== 'published'}
                      onChange={(e) => {
                        const authMode = e.target.value as OpenApiAuthMode;
                        setOpenApiConfig((prev) => (prev ? {
                          ...prev, authMode,
                          allowedOps: authMode === 'none' ? ['query'] : prev.allowedOps,
                        } : prev));
                      }}
                    >
                      <Radio value="closed">关闭 closed</Radio>
                      <Radio value="none">公开只读 none</Radio>
                      <Radio value="apiKey">apiKey 鉴权</Radio>
                    </Radio.Group>
                    <div>
                      <Text type="secondary">允许的操作（none 模式固定为 query）</Text>
                      <div style={{ marginTop: 8 }}>
                        <Checkbox.Group
                          options={OPEN_API_OPS}
                          value={openApiConfig?.allowedOps || ['query']}
                          disabled={!openApiConfig?.enabled || openApiConfig?.authMode === 'none' || publishStatus !== 'published'}
                          onChange={(values) => setOpenApiConfig((prev) => (prev ? { ...prev, allowedOps: values as string[] } : prev))}
                        />
                      </div>
                    </div>
                    <Paragraph copyable={{ text: openApiConfig?.openApiBasePath || `${objectName}` }}>
                      基础路径：{openApiConfig?.openApiBasePath || `/klsjnh/open/v1/${objectName}`}
                    </Paragraph>
                    {openApiConfig?.apiKeyConfigured && (
                      <Text type="secondary">
                        当前 apiKey 尾号：{openApiConfig.apiKeyHint || '****'}
                        {openApiConfig.apiKeyUpdatedAt ? ` · 更新于 ${new Date(openApiConfig.apiKeyUpdatedAt).toLocaleString()}` : ''}
                      </Text>
                    )}
                    <Space wrap>
                      <Button color="primary" variant="filled" loading={openApiSaving} disabled={pendingDisabled || publishStatus !== 'published'} onClick={handleSaveOpenApi}>
                        保存开放 API
                      </Button>
                      <Button
                        icon={<KeyOutlined />}
                        disabled={pendingDisabled || publishStatus !== 'published' || openApiConfig?.authMode !== 'apiKey'}
                        onClick={handleRotateApiKey}
                      >
                        重新生成 apiKey
                      </Button>
                      <PendingTag />
                    </Space>
                  </Space>
                </Card>
              ),
            },
            {
              key: 'json',
              label: 'JSON',
              children: (
                <Input.TextArea
                  rows={16}
                  defaultValue={node ? JSON.stringify(node, null, 2) : ''}
                  onChange={(e) => handleJsonChange(e.target.value)}
                  placeholder="直接编辑对象 JSON（主表 + 三子）；合法 JSON 会自动回填上方表单，保存仍以三子表为准"
                />
              ),
            },
          ]}
        />
      </Card>

      {/* 发布建表：DDL 预览 + 迁移开关（039 二期，真实执行） */}
      <Modal
        title={`发布建表 ${objectName}`}
        open={publishOpen}
        onCancel={() => setPublishOpen(false)}
        onOk={handlePublish}
        okText="确认发布"
        confirmLoading={publishing}
        okButtonProps={{ danger: true }}
        width={720}
      >
        <Alert
          type="warning" showIcon style={{ marginBottom: 12 }}
          message="确认后将**真正执行** DDL（首次建表；已存在则只补新增列，永不删列）"
          description={`下方 DDL 由后端生成（与发布共用同一生成器），所见即发布将执行的语句。生成规则：表名统一 lc_ 前缀 + IF NOT EXISTS；首个 id 类型字段作主键，缺失时自动补 \`id VARCHAR(33)\`；非法标识符或无字段会报错。受服务端开关 krt.lowcode.ddl-execute.enabled 控制，关闭时返回 400 ddl execute disabled。`}
        />
        <Checkbox checked={migrateData} onChange={(e) => setMigrateData(e.target.checked)}>
          迁移数据
        </Checkbox>
        <Paragraph type="secondary" style={{ marginTop: 8 }}>
          ⚠️ 后端 039 二期把 migrateData 定为**预留参数**（接收但未使用），因此改名备份旧表（lc_{objectName}_bak_*）与数据迁移**当前不会发生**，
          接口返回的 backupTable 恒为 null。
        </Paragraph>
        <pre style={{ background: 'var(--bg-hover)', padding: 12, maxHeight: 320, overflow: 'auto' }}>{ddlPreview}</pre>
        {publishedDdl !== null && (
          <>
            <Paragraph strong style={{ marginTop: 12 }}>上次发布实际执行的 DDL</Paragraph>
            <pre style={{ background: 'var(--bg-hover)', padding: 12, maxHeight: 200, overflow: 'auto' }}>{publishedDdl}</pre>
          </>
        )}
      </Modal>

      {/* apiKey 仅显示一次 */}
      <Modal
        title="apiKey（仅显示一次，请立即保存）"
        open={apiKeyModal.open}
        onCancel={() => setApiKeyModal({ open: false, apiKey: '' })}
        footer={[
          <Button key="copy" icon={<CopyOutlined />} onClick={copyApiKey}>复制</Button>,
          <Button key="ok" type="primary" onClick={() => setApiKeyModal({ open: false, apiKey: '' })}>已保存</Button>,
        ]}
      >
        <Input.TextArea rows={3} value={apiKeyModal.apiKey} readOnly />
        <Paragraph type="secondary" style={{ marginTop: 8, marginBottom: 0 }}>
          请求 Header：X-Api-Key: &lt;apiKey&gt;
        </Paragraph>
      </Modal>
    </div>
  );
};

export default MetadataFormPage;
