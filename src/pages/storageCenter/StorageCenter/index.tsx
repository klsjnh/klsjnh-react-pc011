/**
 * 存储中心（storage011）
 * 三视图：存储实例(storage) / 存储桶(bucket) / 对象(object)，覆盖后端 24 个动作。
 *
 * 分层：page 调 service + 读 store；service 编排业务并写 store（store 不调 service）。
 * 布局：页面根 .page-fill（flex 列），工具栏与 Card.table-wrapper 均为其**直接子元素**
 *       → 卡片吃满剩余高度，表格体高度由 useTableFillHeight 实测后喂 antd scroll.y
 *       （故三个 pane 都用 Fragment 返回「工具栏 + 卡片」，不额外包一层 div）。
 * 视图切换只渲染当前 pane：pane 是新组件实例 → cardRef 重新绑定、实测高度不失效，
 *       也避免隐藏面板 clientHeight=0 把实测高度算成兜底值。
 *
 * ⚠️ 默认选中（存储实例 / 桶）一律用**派生值**而不是 effect 回写 state：
 *    「先 setState 再靠 effect 触发查询」会让首个请求带着 undefined 打出去（全量），
 *    与随后的收窄请求并发，谁后返回谁写 store —— 实测出现过「桶列表混入其它实例的桶」。
 *    派生值 + ready 标记可保证落定后**只发一次**带完整条件的请求。
 */
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  DatabaseOutlined, DeleteOutlined, FileTextOutlined, HddOutlined,
  PlusOutlined, ReloadOutlined, UploadOutlined,
} from '@ant-design/icons';
import { Button, Card, Input, Popconfirm, Segmented, Select, Space, Table, Tag, Upload } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { PAGE_SIZE_OPTIONS } from '@/utils/pageSizePref';
import { useTableFillHeight } from '@/hooks/useTableFillHeight';
import { toast } from '@/utils/toast';
import type { JulyStorage, ObjectStat, StorageBucket, StorageObject } from '@/types/storage011';
import {
  fetchStoragePage, listStorages, removeStorage, removeStorages, testStorageConnection,
} from '@/services/storage011/julyStorageService';
import { fetchBucketPage, listBuckets, removeBucket } from '@/services/storage011/storageBucketService';
import {
  batchRemoveObjects, downloadObject, fetchObjectPage, presignedUrl, readObjectText, removeObject, statObject, uploadObject,
  type ObjectEditorKind, type ReadTextResult,
} from '@/services/storage011/storageObjectService';
import { useStorageState } from '@/stores/storage011/julyStorageStore';
import { useStorageBucketState } from '@/stores/storage011/storageBucketStore';
import { useStorageObjectState } from '@/stores/storage011/storageObjectStore';
import { StorageFormModal } from './StorageFormModal';
import { BucketFormModal } from './BucketFormModal';
import { TextEditorModal } from './TextEditorModal';

/** 表头单元格水平居中 */
const hdrCenter = (): React.HTMLAttributes<HTMLElement> => ({ style: { textAlign: 'center' } });

/** 数据内容左对齐 + 表头居中 */
const leftCell = { align: 'left' as const, onHeaderCell: hdrCenter };

/** 字节数格式化 */
function formatBytes(size?: number): string {
  if (size == null || Number.isNaN(size)) return '-';
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  if (size < 1024 * 1024 * 1024) return `${(size / 1024 / 1024).toFixed(1)} MB`;
  return `${(size / 1024 / 1024 / 1024).toFixed(2)} GB`;
}

/**
 * 适配器类型 → 展示名 / 颜色。
 * 取值来自后端 JulyStorageSaveVo011.provider 注释：local011 / minio011 / cos011 / tos011 / oss011 / s3011
 * （旧实现按 'S3' / 'LOCAL' 判断，与真实枚举对不上，Tag 恒为默认色、也误导用户）。
 */
const PROVIDER_META: Record<string, { label: string; color: string }> = {
  local011: { label: '本地磁盘', color: 'green' },
  minio011: { label: 'MinIO', color: 'blue' },
  cos011: { label: '腾讯云 COS', color: 'cyan' },
  tos011: { label: '火山 TOS', color: 'purple' },
  oss011: { label: '阿里云 OSS', color: 'orange' },
  s3011: { label: 'S3', color: 'geekblue' },
};

/** 文本类对象才允许在线编辑（其余只提供下载 / 预签名链接） */
const TEXT_OBJECT_RE = /\.(sql|md|markdown|txt|json|csv|yml|yaml|log|xml|properties|conf|ini)$/i;
const isTextObject = (objectName: string): boolean => TEXT_OBJECT_RE.test(objectName.trim());

/** 对象 editorKind（用于弹窗标题上的类型标签） */
const editorKindOf = (objectName: string): ObjectEditorKind => {
  const lower = objectName.trim().toLowerCase();
  if (lower.endsWith('.sql')) return 'sql';
  if (lower.endsWith('.md') || lower.endsWith('.markdown')) return 'markdown';
  return 'text';
};

/** 复制文本：优先 Clipboard API，非安全上下文回退到临时 textarea */
async function copyText(text: string): Promise<void> {
  if (navigator.clipboard?.writeText) { await navigator.clipboard.writeText(text); return; }
  const ta = document.createElement('textarea');
  ta.value = text;
  ta.style.position = 'fixed';
  ta.style.opacity = '0';
  document.body.appendChild(ta);
  ta.select();
  document.execCommand('copy');
  document.body.removeChild(ta);
}

/**
 * 存储实例下拉（桶 / 对象视图共用；只取启用中的实例）。
 * ready 标记「已拿到结果（哪怕是空）」——调用方据此决定何时发首个查询。
 */
function useStorageOptions(): { storages: JulyStorage[]; ready: boolean } {
  const [state, setState] = useState<{ storages: JulyStorage[]; ready: boolean }>({ storages: [], ready: false });
  useEffect(() => {
    let alive = true;
    void (async () => {
      try {
        const rows = await listStorages('1');
        if (alive) setState({ storages: rows || [], ready: true });
      } catch {
        if (alive) setState({ storages: [], ready: true });
      }
    })();
    return () => { alive = false; };
  }, []);
  return state;
}

/* ==================== 视图一：存储实例 ==================== */

const StorageInstancePane = () => {
  const { list, total, loading, query } = useStorageState();
  const [modal, setModal] = useState<{ open: boolean; node: JulyStorage | null }>({ open: false, node: null });
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [batchDeleting, setBatchDeleting] = useState(false);
  const [testingId, setTestingId] = useState<string | null>(null);
  const [keyword, setKeyword] = useState('');
  const cardRef = useRef<HTMLDivElement>(null);
  const tableBodyHeight = useTableFillHeight(cardRef, `${total}-${loading}`);

  // 只重置 pageIndex：pageSize 是用户偏好（存在 store 里），传值会把它覆盖回默认值
  useEffect(() => { void fetchStoragePage({ pageIndex: 1 }); }, []);

  // 搜索：后端 JulyStorageQueryVo011 的模糊条件字段是 keyword（编码 / 名称），
  // 传 storageName / storageCode 后端收不到（旧实现的错因就在这）。
  const search = (v: string) => { setKeyword(v); void fetchStoragePage({ pageIndex: 1, keyword: v || undefined }); };

  const handleTest = async (row: JulyStorage) => {
    setTestingId(row.id);
    try {
      const res = await testStorageConnection({ ...row, secretKey: undefined });
      if (res?.success) toast.success(`连接成功${res.message ? '：' + res.message : ''}`);
      else toast.error(`连接失败：${res?.message || '未知原因'}`);
    } catch (e) {
      toast.error((e as Error)?.message || '测试失败');
    } finally {
      setTestingId(null);
    }
  };

  const handleRemove = async (id: string) => {
    try {
      await removeStorage(id);
      toast.success('删除成功');
    } catch (e) {
      toast.error((e as Error)?.message || '删除失败，请重试');
    }
  };

  const handleBatchRemove = async () => {
    if (!selectedRowKeys.length) return;
    setBatchDeleting(true);
    try {
      const res = await removeStorages(selectedRowKeys.map(String));
      setSelectedRowKeys([]);
      toast.success(`批量删除成功 ${res.success} 条，失败 ${res.failed} 条`);
    } catch (e) {
      toast.error((e as Error)?.message || '批量删除失败，请重试');
    } finally {
      setBatchDeleting(false);
    }
  };

  const columns: ColumnsType<JulyStorage> = [
    { ...leftCell, title: '编码', dataIndex: 'storageCode', width: 150, render: (v) => <code>{v}</code> },
    { ...leftCell, title: '名称', dataIndex: 'storageName', width: 170 },
    {
      title: '类型', dataIndex: 'provider', width: 130, align: 'center', onHeaderCell: hdrCenter,
      render: (v: string) => {
        const meta = PROVIDER_META[v] || { label: v || '-', color: 'default' };
        return <Tag color={meta.color}>{meta.label}</Tag>;
      },
    },
    {
      ...leftCell, title: '接入点 / 根路径', key: 'endpoint', width: 300,
      render: (_, r) => <code>{r.endpoint || r.basePath || '-'}</code>,
    },
    { ...leftCell, title: '默认桶', dataIndex: 'defaultBucket', width: 130, render: (v) => v || '-' },
    {
      title: '状态', dataIndex: 'status', width: 100, align: 'center', onHeaderCell: hdrCenter,
      render: (s) => <Tag color={s === '1' ? 'green' : 'red'}>{s === '1' ? '启用' : '停用'}</Tag>,
    },
    {
      title: '操作', key: 'action', width: 210, fixed: 'right', align: 'center', onHeaderCell: hdrCenter,
      render: (_, r) => (
        <Space size="small">
          <Button type="link" size="small" loading={testingId === r.id} onClick={() => handleTest(r)}>测试连接</Button>
          <Button type="link" size="small" onClick={() => setModal({ open: true, node: r })}>编辑</Button>
          <Popconfirm
            title="确定删除该存储实例吗？" okText="删除" cancelText="取消" okButtonProps={{ danger: true }}
            onConfirm={() => handleRemove(r.id)}
          >
            <Button type="link" size="small" danger>删除</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <>
      <div className="page-toolbar">
        <div className="toolbar-left">
          <Input.Search allowClear placeholder="搜索编码 / 名称" style={{ width: 320 }} onSearch={search} />
        </div>
        <div className="toolbar-right">
          <Button color="primary" variant="filled" icon={<PlusOutlined />} onClick={() => setModal({ open: true, node: null })}>
            新建存储实例
          </Button>
          <Popconfirm
            title={`确定要删除选中的 ${selectedRowKeys.length} 条存储实例吗？`}
            okText="删除" cancelText="取消" okButtonProps={{ danger: true }}
            onConfirm={handleBatchRemove}
            disabled={!selectedRowKeys.length}
          >
            <Button color="danger" variant="filled" icon={<DeleteOutlined />} disabled={!selectedRowKeys.length} loading={batchDeleting}>
              批量删除
            </Button>
          </Popconfirm>
          <Button
            color="default" variant="filled" icon={<ReloadOutlined />}
            onClick={() => void fetchStoragePage({ pageIndex: 1, keyword: keyword || undefined })}
          >刷新</Button>
        </div>
      </div>

      <Card className="table-wrapper" ref={cardRef} styles={{ body: { padding: 0 } }}>
        <Table<JulyStorage>
          rowKey="id"
          columns={columns}
          rowSelection={{ selectedRowKeys, onChange: (keys) => setSelectedRowKeys(keys) }}
          dataSource={list}
          loading={loading}
          scroll={{ x: 1160, y: tableBodyHeight }}
          pagination={{
            current: query.pageIndex,
            pageSize: query.pageSize,
            total,
            showSizeChanger: true,
            pageSizeOptions: PAGE_SIZE_OPTIONS,
            showTotal: (t) => `共 ${t} 条`,
            onChange: (pageIndex, pageSize) => void fetchStoragePage({ pageIndex, pageSize }),
          }}
        />
      </Card>

      <StorageFormModal
        open={modal.open}
        node={modal.node}
        onClose={() => setModal({ open: false, node: null })}
        onSaved={() => setSelectedRowKeys([])}
      />
    </>
  );
};

/* ==================== 视图二：存储桶 ==================== */

export const StorageBucketPane = () => {
  const { list, total, loading, query } = useStorageBucketState();
  const { storages, ready } = useStorageOptions();
  /** 用户显式选择；未选时派生为首个实例（不写回 state，避免多打一次全量请求） */
  const [pickedCode, setPickedCode] = useState<string | undefined>();
  const [keyword, setKeyword] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const tableBodyHeight = useTableFillHeight(cardRef, `${total}-${loading}`);

  const storageCode = pickedCode ?? storages[0]?.storageCode;

  // 实例列表就绪后才发首个查询：条件一次带全，不会出现「先全量、后被收窄覆盖」的竞态
  useEffect(() => {
    if (!ready) return;
    void fetchBucketPage({ pageIndex: 1, storageCode, keyword: keyword || undefined });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, storageCode]);

  const reload = useCallback((patch: { pageIndex?: number; pageSize?: number } = {}) => {
    void fetchBucketPage({ pageIndex: patch.pageIndex ?? 1, pageSize: patch.pageSize, storageCode, keyword: keyword || undefined });
  }, [storageCode, keyword]);

  const search = (v: string) => { setKeyword(v); void fetchBucketPage({ pageIndex: 1, storageCode, keyword: v || undefined }); };

  const storageNameOf = (code?: string) => storages.find((s) => s.storageCode === code)?.storageName || code || '-';

  const handleRemove = async (row: StorageBucket) => {
    try {
      await removeBucket(row.storageCode ?? storageCode, row.bucketName);
      toast.success('删除成功');
    } catch (e) {
      toast.error((e as Error)?.message || '删除失败，请重试');
    }
  };

  /**
   * 列只保留后端真能给的东西：
   * bucket/selectList|selectListByPage 返回的是 `List<String>`（桶名），
   * 区域 / 创建时间 / 存在状态后端都不返回，列出这两列只会永远空白（曾按对象字段渲染过，属接口不对）。
   */
  const columns: ColumnsType<StorageBucket> = [
    { ...leftCell, title: '桶名', dataIndex: 'bucketName', width: 320, render: (v) => <code>{v}</code> },
    { ...leftCell, title: '归属实例', key: 'storageCode', width: 240, render: (_, r) => storageNameOf(r.storageCode) },
    {
      title: '操作', key: 'action', width: 110, fixed: 'right', align: 'center', onHeaderCell: hdrCenter,
      render: (_, r) => (
        <Popconfirm
          title="确定删除该桶吗？（桶内需为空）" okText="删除" cancelText="取消" okButtonProps={{ danger: true }}
          onConfirm={() => handleRemove(r)}
        >
          <Button type="link" size="small" danger>删除</Button>
        </Popconfirm>
      ),
    },
  ];

  return (
    <>
      <div className="page-toolbar">
        <div className="toolbar-left">
          <Select
            allowClear placeholder="全部存储实例" style={{ width: 260 }}
            value={storageCode} onChange={(v) => setPickedCode(v)}
            options={storages.map((s) => ({ value: s.storageCode, label: `${s.storageName} (${s.storageCode})` }))}
          />
          <Input.Search allowClear placeholder="搜索桶名" style={{ width: 240 }} onSearch={search} />
        </div>
        <div className="toolbar-right">
          <Button color="primary" variant="filled" icon={<PlusOutlined />} disabled={!ready} onClick={() => setModalOpen(true)}>
            新建桶
          </Button>
          <Button color="default" variant="filled" icon={<ReloadOutlined />} onClick={() => reload()}>刷新</Button>
        </div>
      </div>

      <Card className="table-wrapper" ref={cardRef} styles={{ body: { padding: 0 } }}>
        <Table<StorageBucket>
          rowKey={(r) => `${r.storageCode ?? ''}|${r.bucketName}`}
          columns={columns}
          dataSource={list}
          loading={loading}
          scroll={{ x: 1000, y: tableBodyHeight }}
          pagination={{
            current: query.pageIndex,
            pageSize: query.pageSize,
            total,
            showSizeChanger: true,
            pageSizeOptions: PAGE_SIZE_OPTIONS,
            showTotal: (t) => `共 ${t} 条`,
            onChange: (pageIndex, pageSize) => reload({ pageIndex, pageSize }),
          }}
        />
      </Card>

      <BucketFormModal
        open={modalOpen}
        storages={storages}
        defaultStorageCode={storageCode}
        onClose={() => setModalOpen(false)}
        onSaved={() => reload()}
      />
    </>
  );
};

/* ==================== 视图三：对象（文件） ==================== */

interface EditorState {
  open: boolean;
  storageCode?: string;
  bucketName: string;
  objectName: string;
  kind: ObjectEditorKind;
  initial: ReadTextResult | null;
}

export const StorageObjectPane = () => {
  const { list, total, loading, query } = useStorageObjectState();
  const { storages, ready: storagesReady } = useStorageOptions();
  const [pickedCode, setPickedCode] = useState<string | undefined>();
  const [bucketName, setBucketName] = useState<string | undefined>();
  /** 桶列表连同「属于哪个实例」一起存：ready 由实例号比对派生，实例一换立刻为 false，无需回写 */
  const [bucketState, setBucketState] = useState<{ forCode?: string; rows: StorageBucket[] }>({ rows: [] });
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [uploading, setUploading] = useState(false);
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const [editor, setEditor] = useState<EditorState>({ open: false, bucketName: '', objectName: '', kind: 'text', initial: null });
  const cardRef = useRef<HTMLDivElement>(null);
  const tableBodyHeight = useTableFillHeight(cardRef, `${total}-${loading}`);

  const storageCode = pickedCode ?? storages[0]?.storageCode;
  const bucketsReady = storagesReady && !!storageCode && bucketState.forCode === storageCode;
  const buckets = bucketsReady ? bucketState.rows : [];
  const effectiveBucket = bucketName && buckets.some((b) => b.bucketName === bucketName) ? bucketName : buckets[0]?.bucketName;

  // 实例变化 → 拉该实例的桶列表（结果自带 forCode，过期响应直接丢弃）
  useEffect(() => {
    if (!storageCode) { setBucketState({ rows: [] }); return; }
    let alive = true;
    void (async () => {
      try {
        const rows = await listBuckets(storageCode);
        if (alive) setBucketState({ forCode: storageCode, rows: rows || [] });
      } catch {
        if (alive) setBucketState({ forCode: storageCode, rows: [] });
      }
    })();
    return () => { alive = false; };
  }, [storageCode]);

  // 实例 + 桶都落定后拉对象：一次带全三元组条件
  useEffect(() => {
    if (!bucketsReady) return;
    void fetchObjectPage({ pageIndex: 1, storageCode, bucketName: effectiveBucket });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bucketsReady, storageCode, effectiveBucket]);

  /**
   * 对象元数据补齐。
   * 后端 object/selectListByPage 返回的是 `List<String>`（只有对象键），
   * size / contentType / lastModified 必须另调 `object/stat`（GET + query）拿。
   * 这里只补当前页，限量并发；单条 404（对象刚被删）只让该行降级成 '-'，不影响整页。
   */
  const [statMap, setStatMap] = useState<Record<string, ObjectStat>>({});
  useEffect(() => {
    const keys = list.map((r) => r.objectName).filter(Boolean);
    if (!keys.length || !storageCode || !effectiveBucket) { setStatMap({}); return; }
    let alive = true;
    void (async () => {
      const next: Record<string, ObjectStat> = {};
      const CONCURRENCY = 6;
      for (let i = 0; i < keys.length; i += CONCURRENCY) {
        const settled = await Promise.all(keys.slice(i, i + CONCURRENCY).map(async (key) => {
          try { return [key, await statObject(storageCode, effectiveBucket, key)] as const; }
          catch { return [key, null] as const; }
        }));
        for (const [key, stat] of settled) if (stat) next[key] = stat;
      }
      if (alive) setStatMap(next);
    })();
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [list, storageCode, effectiveBucket]);

  const reload = useCallback((patch: { pageIndex?: number; pageSize?: number } = {}) => {
    void fetchObjectPage({ pageIndex: patch.pageIndex ?? 1, pageSize: patch.pageSize, storageCode, bucketName: effectiveBucket });
  }, [storageCode, effectiveBucket]);

  /** 行键：桶 + 对象键即唯一（列表接口只回键，桶来自当前筛选条件） */
  const rowKeyOf = (r: StorageObject) => `${r.bucketName || effectiveBucket || ''}|${r.objectName}`;
  /** 行上的桶：后端列表不回带桶名，缺省回退到当前筛选的桶 */
  const bucketOf = (r: StorageObject) => r.bucketName || effectiveBucket || '';

  const handleUpload = async (file: File) => {
    if (!effectiveBucket) { toast.warning('请先选择目标桶'); return; }
    setUploading(true);
    try {
      // 后端 upload 返回的是落库后的对象键
      const key = await uploadObject(storageCode, effectiveBucket, file);
      toast.success(`上传成功：${key || file.name}`);
      reload();
    } catch (e) {
      toast.error((e as Error)?.message || '上传失败');
    } finally {
      setUploading(false);
    }
  };

  const handleDownload = async (row: StorageObject) => {
    setBusyKey(rowKeyOf(row));
    try {
      await downloadObject(row.storageCode ?? storageCode, bucketOf(row), row.objectName);
      toast.success('已开始下载');
    } catch (e) {
      toast.error((e as Error)?.message || '下载失败');
    } finally {
      setBusyKey(null);
    }
  };

  const handleCopyUrl = async (row: StorageObject) => {
    setBusyKey(rowKeyOf(row));
    try {
      // presignedUrl 后端是 GET，返回 URL 字符串本身
      const url = await presignedUrl(row.storageCode ?? storageCode, bucketOf(row), row.objectName);
      await copyText(url);
      toast.success('预签名 URL 已复制到剪贴板');
    } catch (e) {
      toast.error((e as Error)?.message || '获取预签名 URL 失败');
    } finally {
      setBusyKey(null);
    }
  };

  const handleEdit = async (row: StorageObject) => {
    setBusyKey(rowKeyOf(row));
    try {
      const storage = row.storageCode ?? storageCode;
      const bucket = bucketOf(row);
      const initial = await readObjectText(storage, bucket, row.objectName);
      setEditor({
        open: true, storageCode: storage, bucketName: bucket,
        objectName: row.objectName, kind: editorKindOf(row.objectName), initial,
      });
    } catch (e) {
      toast.error((e as Error)?.message || '读取文本失败');
    } finally {
      setBusyKey(null);
    }
  };

  const handleRemove = async (row: StorageObject) => {
    try {
      await removeObject(row.storageCode ?? storageCode, bucketOf(row), row.objectName);
      toast.success('删除成功');
    } catch (e) {
      toast.error((e as Error)?.message || '删除失败，请重试');
    }
  };

  const handleBatchRemove = async () => {
    if (!selectedRowKeys.length || !effectiveBucket) return;
    const keys = new Set(selectedRowKeys.map(String));
    const objectNames = list.filter((r) => keys.has(rowKeyOf(r))).map((r) => r.objectName);
    if (!objectNames.length) { setSelectedRowKeys([]); return; }
    try {
      // 后端 body 形状：{ storageCode, bucketName, objectNames[] }（同桶批量）
      await batchRemoveObjects(storageCode, effectiveBucket, objectNames);
      setSelectedRowKeys([]);
      toast.success(`批量删除成功 ${objectNames.length} 条`);
    } catch (e) {
      toast.error((e as Error)?.message || '批量删除失败，请重试');
    }
  };

  const columns: ColumnsType<StorageObject> = [
    { ...leftCell, title: '对象键', dataIndex: 'objectName', width: 300, ellipsis: true, render: (v) => <code>{v}</code> },
    { ...leftCell, title: '归属桶', key: 'bucketName', width: 150, render: (_, r) => bucketOf(r) || '-' },
    {
      title: '大小', key: 'size', width: 120, align: 'center', onHeaderCell: hdrCenter,
      render: (_, r) => formatBytes(statMap[r.objectName]?.size),
    },
    { ...leftCell, title: '内容类型', key: 'contentType', width: 190, render: (_, r) => statMap[r.objectName]?.contentType || '-' },
    { ...leftCell, title: '最后修改', key: 'lastModified', width: 190, render: (_, r) => statMap[r.objectName]?.lastModified || '-' },
    {
      title: '操作', key: 'action', width: 250, fixed: 'right', align: 'center', onHeaderCell: hdrCenter,
      render: (_, r) => (
        <Space size="small">
          <Button type="link" size="small" loading={busyKey === rowKeyOf(r)} onClick={() => handleDownload(r)}>下载</Button>
          {isTextObject(r.objectName) && (
            <Button type="link" size="small" loading={busyKey === rowKeyOf(r)} onClick={() => handleEdit(r)}>编辑</Button>
          )}
          <Button type="link" size="small" loading={busyKey === rowKeyOf(r)} onClick={() => handleCopyUrl(r)}>链接</Button>
          <Popconfirm
            title="确定删除该对象吗？" okText="删除" cancelText="取消" okButtonProps={{ danger: true }}
            onConfirm={() => handleRemove(r)}
          >
            <Button type="link" size="small" danger>删除</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <>
      <div className="page-toolbar">
        <div className="toolbar-left">
          <Select
            allowClear placeholder="存储实例" style={{ width: 240 }}
            value={storageCode}
            onChange={(v) => { setPickedCode(v); setBucketName(undefined); setSelectedRowKeys([]); }}
            options={storages.map((s) => ({ value: s.storageCode, label: `${s.storageName} (${s.storageCode})` }))}
          />
          <Select
            allowClear placeholder={storageCode ? '选择桶' : '请先选存储实例'} style={{ width: 220 }}
            disabled={!storageCode} value={effectiveBucket}
            onChange={(v) => { setBucketName(v); setSelectedRowKeys([]); }}
            options={buckets.map((b) => ({ value: b.bucketName, label: b.bucketName }))}
          />
        </div>
        <div className="toolbar-right">
          <Upload
            showUploadList={false}
            disabled={!effectiveBucket}
            beforeUpload={(file) => { void handleUpload(file as unknown as File); return false; }}
          >
            <Button color="primary" variant="filled" icon={<UploadOutlined />} loading={uploading} disabled={!effectiveBucket}>
              上传对象
            </Button>
          </Upload>
          <Popconfirm
            title={`确定要删除选中的 ${selectedRowKeys.length} 个对象吗？`}
            okText="删除" cancelText="取消" okButtonProps={{ danger: true }}
            onConfirm={handleBatchRemove}
            disabled={!selectedRowKeys.length}
          >
            <Button color="danger" variant="filled" icon={<DeleteOutlined />} disabled={!selectedRowKeys.length}>批量删除</Button>
          </Popconfirm>
          <Button color="default" variant="filled" icon={<ReloadOutlined />} onClick={() => reload()}>刷新</Button>
        </div>
      </div>

      <Card className="table-wrapper" ref={cardRef} styles={{ body: { padding: 0 } }}>
        <Table<StorageObject>
          rowKey={rowKeyOf}
          columns={columns}
          rowSelection={{ selectedRowKeys, onChange: (keys) => setSelectedRowKeys(keys) }}
          dataSource={list}
          loading={loading}
          scroll={{ x: 1200, y: tableBodyHeight }}
          pagination={{
            current: query.pageIndex,
            pageSize: query.pageSize,
            total,
            showSizeChanger: true,
            pageSizeOptions: PAGE_SIZE_OPTIONS,
            showTotal: (t) => `共 ${t} 条`,
            onChange: (pageIndex, pageSize) => reload({ pageIndex, pageSize }),
          }}
        />
      </Card>

      <TextEditorModal
        open={editor.open}
        storageCode={editor.storageCode}
        bucketName={editor.bucketName}
        objectName={editor.objectName}
        editorKind={editor.kind}
        initial={editor.initial}
        onClose={() => setEditor((prev) => ({ ...prev, open: false }))}
        onSaved={() => reload()}
      />
    </>
  );
};

/* ==================== 主页面 ==================== */

type ViewKey = 'storage' | 'bucket' | 'object';

const VIEW_HINT: Record<ViewKey, string> = {
  storage: '管理存储接入配置（local011 / minio011 / cos011 / tos011 / oss011 / s3011），支持连通性测试',
  bucket: '在指定存储实例下管理桶（后端只返回桶名）',
  object: '桶内对象：列表只回对象键，大小/类型/修改时间由 stat 补齐；支持上传、下载、预签名 URL 与在线文本编辑',
};

export const StorageCenter = () => {
  const [view, setView] = useState<ViewKey>('storage');

  return (
    <div className="page-fill">
      <div className="page-header">
        <h2>存储中心</h2>
      </div>

      <div className="page-toolbar">
        <div className="toolbar-left">
          <Segmented
            value={view}
            onChange={(v) => setView(v as ViewKey)}
            options={[
              { value: 'storage', label: '存储实例', icon: <HddOutlined /> },
              { value: 'bucket', label: '存储桶', icon: <DatabaseOutlined /> },
              { value: 'object', label: '对象', icon: <FileTextOutlined /> },
            ]}
          />
        </div>
        <div className="toolbar-right">
          <span className="text-muted text-xs">{VIEW_HINT[view]}</span>
        </div>
      </div>

      {/* 只渲染当前视图：pane 是新组件实例 → cardRef 重新绑定、实测高度不失效 */}
      {view === 'storage' && <StorageInstancePane />}
      {view === 'bucket' && <StorageBucketPane />}
      {view === 'object' && <StorageObjectPane />}
    </div>
  );
};
