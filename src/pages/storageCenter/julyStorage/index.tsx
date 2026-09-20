/**
 * 存储中心（storageCenter）
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
 *
 * ⚠️ 「存储实例 / 桶 / 目录前缀」的选中态统一放在 storageExplorerStore（**已持久化**），
 *    对象视图与存储桶视图共用一份，刷新 / 切页回来都记得上次浏览位置。
 *    对象在线编辑已改为**整页路由** STORAGE_CENTER_ROUTES.fileEdit（见 julyFileList/FileEditorPage），
 *    本文件不再挂编辑弹窗。
 */
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  DeleteOutlined, FileOutlined, FileTextOutlined, FolderOutlined,
  HomeOutlined, PlusOutlined, ReloadOutlined, UploadOutlined,
} from '@ant-design/icons';
import { Button, Card, Input, Popconfirm, Select, Space, Table, Tag, Upload } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { PAGE_SIZE_OPTIONS } from '@/utils/pageSizePref';
import { useTableFillHeight } from '@/hooks/useTableFillHeight';
import { toast } from '@/utils/toast';
import { STORAGE_CENTER_ROUTES } from '@/config/routes';
import type { JulyStorage, StorageBucket, StorageObject } from '@/types/storageCenter';
import {
  fetchStoragePage, listStorages, removeStorage, removeStorages, testStorageConnection,
} from '@/services/storageCenter/julyStorageService';
import { fetchBucketPage, listBuckets, removeBucket } from '@/services/storageCenter/storageBucketService';
import {
  batchRemoveObjects, downloadObject, fetchObjectPage, presignedUrl, removeObject, resolveEditorKind, uploadObject,
  type ObjectEditorKind,
} from '@/services/storageCenter/storageObjectService';
import { useStorageState } from '@/stores/storageCenter/julyStorageStore';
import { useStorageBucketState } from '@/stores/storageCenter/storageBucketStore';
import { useStorageObjectState } from '@/stores/storageCenter/storageObjectStore';
import { storageExplorerStore, useStorageExplorer } from '@/stores/storageCenter/storageExplorerStore';
import { StorageFormModal } from '@/pages/storageCenter/julyStorage/StorageFormModal';
import { BucketFormModal } from '@/pages/storageCenter/julyStorage/BucketFormModal';

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
 * 后端 lastModified 是 LocalDateTime 序列化结果（如 2026-09-15T20:48:36.1933758）。
 * 归一化成 `YYYY-MM-DD HH:mm:ss`，避免 7 位小数撑破列宽。
 */
function formatDateTime(v?: string): string {
  if (!v) return '-';
  const t = v.replace('T', ' ');
  return t.length > 19 ? t.slice(0, 19) : t;
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

/** 对象 editorKind（名称列提示用）—— 规则唯一事实源在 service，这里只做本页短别名 */
const editorKindOf = (objectName: string): ObjectEditorKind => resolveEditorKind(objectName);

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

export const StorageInstancePane = ({ onSelectInstance }: { onSelectInstance?: (code: string) => void } = {}) => {
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
      // 后端 testConnection 入参是 JulyStorageConnectVo011：已保存实例只 id，secretKey 默认不回显所以不能拿整行测
      const res = await testStorageConnection({ id: row.id });
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
          rowSelection={{
            selectedRowKeys,
            onChange: (keys) => {
              setSelectedRowKeys(keys);
              if (onSelectInstance && keys.length > 0) {
                const row = list.find((item) => item.id === keys[0]);
                if (row) onSelectInstance(row.storageCode);
              }
            },
          }}
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

export const StorageBucketPane = ({ defaultStorageCode }: { defaultStorageCode?: string } = {}) => {
  const { list, total, loading } = useStorageBucketState();
  const { storages, ready } = useStorageOptions();
  const [keyword, _setKeyword] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const tableBodyHeight = useTableFillHeight(cardRef, `${total}-${loading}`);

  const storageCode = defaultStorageCode;

  // 实例列表就绪后才发首个查询：条件一次带全，不会出现「先全量、后被收窄覆盖」的竞态
  useEffect(() => {
    if (!ready) return;
    void fetchBucketPage({ pageIndex: 1, storageCode, keyword: keyword || undefined });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, storageCode]);

  const reload = useCallback((patch: { pageIndex?: number; pageSize?: number } = {}) => {
    void fetchBucketPage({ pageIndex: patch.pageIndex ?? 1, pageSize: patch.pageSize, storageCode, keyword: keyword || undefined });
  }, [storageCode, keyword]);

  // search removed; toolbar uses Input.Search onSearch


  const storageNameOf = (code?: string) => storages.find((s) => s.storageCode === code)?.storageName || code || '-';
  const providerOf = (code?: string) => {
    const s = storages.find((x) => x.storageCode === code);
    if (!s) return '-';
    const meta = PROVIDER_META[s.provider || ''];
    return meta ? <Tag color={meta.color}>{meta.label}</Tag> : (s.provider || '-');
  };
  const endpointOf = (code?: string) => storages.find((s) => s.storageCode === code)?.endpoint || '-';
  const statusOf = (code?: string) => {
    const s = storages.find((x) => x.storageCode === code);
    if (!s) return '-';
    return <Tag color={s.status === '1' ? 'green' : 'red'}>{s.status === '1' ? '启用' : '停用'}</Tag>;
  };

  const handleRemove = async (row: StorageBucket) => {
    try {
      await removeBucket(row.storageCode ?? storageCode, row.bucketName);
      toast.success('删除成功');
    } catch (e) {
      toast.error((e as Error)?.message || '删除失败，请重试');
    }
  };

  /**
   * 列以后端真实出参为准：bucket/selectBucketList|selectBucketListByPage 回
   * `BucketInfo{bucketName, creationDate}` —— 创建时间**已随列表返回**，可直接展示。
   * 区域（region）只在新建入参里，出参不回，故不列。
   * ⚠️ 桶名来自对象的 `bucketName` 字段；曾按「桶名字符串数组」解析，导致整行 bucketName 变成对象、
   *    React 渲染 `<code>{object}</code>` 直接抛错，同时 rowKey 退化成 `xx|[object Object]`。
   */
  const columns: ColumnsType<StorageBucket> = [
    { ...leftCell, title: '桶名', dataIndex: 'bucketName', width: 300, render: (v) => <code>{v}</code> },
    { ...leftCell, title: '创建时间', dataIndex: 'creationDate', width: 180, render: (v) => formatDateTime(v) },
    { ...leftCell, title: '归属实例', key: 'storageCode', width: 220, render: (_, r) => storageNameOf(r.storageCode) },
    { title: '实例类型', key: 'provider', width: 120, align: 'center', onHeaderCell: hdrCenter, render: (_, r) => providerOf(r.storageCode) },
    { ...leftCell, title: '接入点', key: 'endpoint', width: 240, render: (_, r) => endpointOf(r.storageCode) },
    { title: '状态', key: 'status', width: 100, align: 'center', onHeaderCell: hdrCenter, render: (_, r) => statusOf(r.storageCode) },
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
          scroll={{ x: 1320, y: tableBodyHeight }}
          pagination={false}
        />
      </Card>

      <BucketFormModal
        open={modalOpen}
        storages={storages}
        storageCode={storageCode ?? ''}
        onClose={() => setModalOpen(false)}
        onSaved={() => reload()}
      />
    </>
  );
};

/* ==================== 视图三：对象（文件） ==================== */

/**
 * 当前层级的分层派生：把递归列表按当前 prefix 拆成「子文件夹」+「当层文件」。
 * 后端恒递归 → 子文件夹 = 对象在当前 prefix 后的第一段 '/' 前缀（去重）；当层文件 = 当前 prefix 下没有 '/' 后缀的条目。
 */
interface FolderItem { name: string; prefix: string; isDir: true; }
interface DerivedView {
  folders: FolderItem[];
  files: StorageObject[];
}
function deriveLevel(list: StorageObject[], currentPrefix: string): DerivedView {
  const folderSet = new Set<string>();
  const files: StorageObject[] = [];
  for (const r of list) {
    const name = r.objectName || '';
    const rest = name.startsWith(currentPrefix) ? name.slice(currentPrefix.length) : name;
    const slash = rest.indexOf('/');
    if (slash > 0) {
      folderSet.add(rest.slice(0, slash));
    } else {
      files.push(r);
    }
  }
  const folders: FolderItem[] = [...folderSet].sort().map((n) => ({
    name: n, prefix: `${currentPrefix}${n}/`, isDir: true,
  }));
  return { folders, files };
}

/** 面包屑项 */
interface Crumb { label: string; prefix: string | undefined; }
function buildCrumbs(bucketName: string, prefix: string | undefined): Crumb[] {
  const crumbs: Crumb[] = [{ label: bucketName || '根目录', prefix: undefined }];
  if (!prefix) return crumbs;
  const clean = prefix.endsWith('/') ? prefix.slice(0, -1) : prefix;
  const segs = clean.split('/').filter(Boolean);
  let acc = '';
  for (const s of segs) { acc += `${s}/`; crumbs.push({ label: s, prefix: acc }); }
  return crumbs;
}

type DirRow = { _isDir: true; name: string; prefix: string };
type FileRow = { _isDir: false; obj: StorageObject };
type MergedRow = (DirRow | FileRow) & { __key: string };

export const StorageObjectPane = ({ defaultStorageCode }: { defaultStorageCode?: string } = {}) => {
  const navigate = useNavigate();
  const { list, total, loading, query } = useStorageObjectState();
  const explorer = useStorageExplorer();
  const { storages, ready: storagesReady } = useStorageOptions();
  const [bucketState, setBucketState] = useState<{ forCode?: string; rows: StorageBucket[] }>({ rows: [] });
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [uploading, setUploading] = useState(false);
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  /** 浏览位置统一读 storageExplorerStore（已持久化）：刷新 / 切页回来仍停在上次的实例 + 桶 + 目录 */
  const currentPrefix = explorer.prefix || '';
  /** 当前优先用 store 里的 storageCode；只在 store 里没有且 defaultStorageCode 有值时回退（首次挂载/被父组件指定） */
  const storageCode = explorer.storageCode ?? defaultStorageCode ?? storages[0]?.storageCode;
  /** 当前选中的桶：store 里的 bucketName 若仍在桶列表中则用，否则回落到第一个桶（自动进入） */
  const bucketsReady = storagesReady && !!storageCode && bucketState.forCode === storageCode;
  const buckets = bucketsReady ? bucketState.rows : [];
  const effectiveBucket = bucketsReady
    ? (explorer.bucketName && buckets.some((b) => b.bucketName === explorer.bucketName) ? explorer.bucketName : buckets[0]?.bucketName)
    : undefined;

  const derived = useMemo(() => deriveLevel(list, currentPrefix), [list, currentPrefix]);
  const crumbs = useMemo(() => buildCrumbs(effectiveBucket || '', effectiveBucket ? currentPrefix : undefined), [effectiveBucket, currentPrefix]);
  /** 列表行键：挂靠 storage+bucket+objectName 保证跨桶/跨层切换时不撞键（避免 React 的同 key 警告） */
  const fileKey = useMemo(() => (obj: StorageObject) => `${storageCode || ''}|${effectiveBucket || ''}|${obj.objectName}`, [storageCode, effectiveBucket]);
  const mergedRows = useMemo<MergedRow[]>(() => {
    const rows: MergedRow[] = [];
    for (const f of derived.folders) rows.push({ _isDir: true, name: f.name, prefix: f.prefix, __key: `dir:${storageCode || ''}|${effectiveBucket || ''}|${f.prefix}` });
    for (const obj of derived.files) rows.push({ _isDir: false, obj, __key: `file:${fileKey(obj)}` });
    return rows;
  }, [derived, storageCode, effectiveBucket, fileKey]);
  const tableBodyHeight = useTableFillHeight(cardRef, `${total}-${loading}`);
  /** 文件夹进入下一层 */
  const handleEnterDir = (prefix: string) => { storageExplorerStore.navigateToPrefix(prefix); setSelectedRowKeys([]); };
  /** 面包屑点击：prefix=undefined 回到根，否则退回对应上级 */
  const handleCrumb = (prefix: string | undefined) => { storageExplorerStore.setPrefix(prefix); setSelectedRowKeys([]); };

  // 外部（存储管理页行点击）改了 defaultStorageCode → store 还没跟上，同步一次
  useEffect(() => {
    if (defaultStorageCode && explorer.storageCode !== defaultStorageCode) {
      storageExplorerStore.selectStorage(defaultStorageCode);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [defaultStorageCode]);

  // 实例变化 → 拉该实例的桶列表（结果自带 forCode，过期响应直接丢弃）
  useEffect(() => {
    if (!storageCode) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setBucketState({ rows: [] });
      return;
    }
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

  // 实例 + 桶都落定后拉对象：一次带全三元组条件（加上 prefix）
  useEffect(() => {
    if (!bucketsReady) return;
    void fetchObjectPage({ pageIndex: 1, storageCode, bucketName: effectiveBucket, prefix: currentPrefix || undefined });
     
  }, [bucketsReady, storageCode, effectiveBucket, currentPrefix]);

  /**
   * 对象元数据（size / contentType / lastModified）**不再单独拉**：
   * 后端 selectObjectListByPage 回 `PageResult011<ObjectStat>`，元数据随列表一起返回，
   * 行上直接可用（见 storageObjectService.toObjectRows）。
   * 旧实现对本页每个键并发 6 个 object/stat 请求（每页 N 次往返），列表页白白放大 N 倍流量，已移除；
   * statObject 仍保留给「不分页的 selectObjectList（只回键字符串）」的场景按需补齐。
   */

  const reload = useCallback((patch: { pageIndex?: number; pageSize?: number } = {}) => {
    void fetchObjectPage({ pageIndex: patch.pageIndex ?? 1, pageSize: patch.pageSize, storageCode, bucketName: effectiveBucket, prefix: currentPrefix || undefined });
  }, [storageCode, effectiveBucket, currentPrefix]);

  /** 行键：桶 + 对象键即唯一（bucketName 现由后端 ObjectStat.bucket 带回，缺省回退当前筛选桶） */
  const rowKeyOf = (r: StorageObject) => `${r.bucketName || effectiveBucket || ''}|${r.objectName}`;
  /** 行上的桶：优先用后端回带的 bucket，缺失时回退到当前筛选的桶 */
  const bucketOf = (r: StorageObject) => r.bucketName || effectiveBucket || '';

  const handleUpload = async (file: File) => {
    if (!effectiveBucket) { toast.warning('请先选择目标桶'); return; }
    setUploading(true);
    try {
      // 当前在子文件夹下 → 上传时自动把 prefix 拼到对象键前面
      const objectName = currentPrefix ? `${currentPrefix}${file.name}` : file.name;
      // 后端 upload 返回的是落库后的对象键
      const key = await uploadObject(storageCode, effectiveBucket, file, objectName);
      toast.success(`上传成功：${key || objectName}`);
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

  /**
   * 打开在线编辑：**跳整页路由**（不是弹窗）。
   * 参数走 query：objectName 可能带 '/' 前缀目录，塞进路径段会把层级撑破；
   * prefix 一起带上，编辑器返回时据此把浏览位置还原到所在目录。
   */
  const openEditor = (row: StorageObject) => {
    const bucket = bucketOf(row);
    if (!bucket) { toast.warning('请先选择桶'); return; }
    const qs = new URLSearchParams({
      storageCode: row.storageCode ?? storageCode ?? '',
      bucketName: bucket,
      objectName: row.objectName,
    });
    if (currentPrefix) qs.set('prefix', currentPrefix);
    navigate(`${STORAGE_CENTER_ROUTES.fileEdit}?${qs.toString()}`);
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

  /** 表格列 + 行数据：文件夹（上层虚拟行）+ 文件（当层真实对象）走同一张表 */
  const _isRoot = !currentPrefix;
  const columns: ColumnsType<MergedRow> = [
    {
      ...leftCell, title: '名称', key: 'name', width: 360, ellipsis: true,
      render: (_, r) => {
        if (r._isDir) {
          return (
            <span
              style={{ cursor: 'pointer', color: '#1677ff', display: 'inline-flex', alignItems: 'center', gap: 6 }}
              onClick={() => handleEnterDir(r.prefix)}
              title="进入文件夹"
            >
              <FolderOutlined style={{ color: '#faad14' }} />
              <strong>{r.name}/</strong>
            </span>
          );
        }
        const obj = r.obj;
        const shortName = currentPrefix && obj.objectName.startsWith(currentPrefix)
          ? obj.objectName.slice(currentPrefix.length) : obj.objectName;
        if (isTextObject(obj.objectName)) {
          const kind = editorKindOf(obj.objectName);
          const hint = kind === 'sql' ? 'SQL 编辑器' : (kind === 'markdown' ? 'Markdown 编辑器' : '文本编辑器');
          return (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              <FileTextOutlined style={{ color: '#8c8c8c' }} />
              <a
                onClick={(e) => { e.preventDefault(); openEditor(obj); }}
                style={{ cursor: 'pointer', color: '#1677ff' }}
                title={`点击跳转到 ${hint}`}
              >
                <code>{shortName}</code>
              </a>
            </span>
          );
        }
        return (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <FileOutlined style={{ color: '#8c8c8c' }} />
            <code>{shortName}</code>
          </span>
        );
      },
    },
    {
      title: '大小', key: 'size', width: 110, align: 'center', onHeaderCell: hdrCenter,
      render: (_, r) => (r._isDir ? '—' : formatBytes(r.obj.size)),
    },
    {
      ...leftCell, title: '内容类型', key: 'contentType', width: 200,
      render: (_, r) => (r._isDir ? '文件夹' : (r.obj.contentType || '-')),
    },
    {
      ...leftCell, title: '最后修改', key: 'lastModified', width: 190,
      render: (_, r) => (r._isDir ? '—' : formatDateTime(r.obj.lastModified)),
    },
    {
      title: '操作', key: 'action', width: 250, fixed: 'right', align: 'center', onHeaderCell: hdrCenter,
      render: (_, r) => {
        if (r._isDir) {
          return (
            <Button type="link" size="small" onClick={() => handleEnterDir(r.prefix)}>
              <FolderOutlined /> 打开
            </Button>
          );
        }
        const obj = r.obj;
        return (
          <Space size="small">
            <Button type="link" size="small" loading={busyKey === rowKeyOf(obj)} onClick={() => handleDownload(obj)}>下载</Button>
            {isTextObject(obj.objectName) && (
              <Button type="link" size="small" onClick={() => openEditor(obj)}>编辑</Button>
            )}
            <Button type="link" size="small" loading={busyKey === rowKeyOf(obj)} onClick={() => handleCopyUrl(obj)}>链接</Button>
            <Popconfirm
              title="确定删除该对象吗？" okText="删除" cancelText="取消" okButtonProps={{ danger: true }}
              onConfirm={() => handleRemove(obj)}
            >
              <Button type="link" size="small" danger>删除</Button>
            </Popconfirm>
          </Space>
        );
      },
    },
  ];

  return (
    <>
      <div className="page-toolbar">
        <div className="toolbar-left">
          <Select
            allowClear placeholder="存储实例" style={{ width: 240 }}
            value={storageCode}
            onChange={(v) => {
              storageExplorerStore.selectStorage(v);
              setSelectedRowKeys([]);
            }}
            options={storages.map((s) => ({ value: s.storageCode, label: `${s.storageName} (${s.storageCode})` }))}
          />
          <Select
            allowClear placeholder={storageCode ? '选择桶' : '请先选存储实例'} style={{ width: 220 }}
            disabled={!storageCode} value={effectiveBucket}
            onChange={(v) => {
              storageExplorerStore.selectBucket(v);
              setSelectedRowKeys([]);
            }}
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

      {/* 面包屑：仅在选桶后显示；在子文件夹时可通过点击回到任一层 */}
      {effectiveBucket && (
        <div className="page-breadcrumb" style={{ padding: '0 0 8px 0', fontSize: 13, color: '#595959' }}>
          <HomeOutlined style={{ marginRight: 4 }} />
          {crumbs.map((c, idx) => (
            <span key={c.prefix ?? 'root'}>
              {idx > 0 && <span style={{ margin: '0 4px', color: '#bfbfbf' }}>/</span>}
              {idx === crumbs.length - 1
                ? (
                  <span style={{ color: '#262626', fontWeight: 500 }}>{c.label}</span>
                ) : (
                  <a onClick={() => handleCrumb(c.prefix)} style={{ cursor: 'pointer' }}>{c.label}</a>
                )
              }
            </span>
          ))}
          {currentPrefix && (
            <span style={{ marginLeft: 8, fontSize: 12, color: '#8c8c8c' }}>
              （当前：{currentPrefix}）
            </span>
          )}
        </div>
      )}

      <Card className="table-wrapper" ref={cardRef} styles={{ body: { padding: 0 } }}>
        <Table<MergedRow>
          rowKey="__key"
          columns={columns}
          rowSelection={{
            selectedRowKeys,
            onChange: (keys) => setSelectedRowKeys(keys),
            // 只允许勾选文件行，不让选文件夹
            getCheckboxProps: (r): { disabled?: boolean } => ({ disabled: r._isDir }),
          }}
          dataSource={mergedRows}
          loading={loading}
          scroll={{ x: 1300, y: tableBodyHeight }}
          pagination={{
            current: query.pageIndex,
            pageSize: query.pageSize,
            total: mergedRows.length,
            showSizeChanger: true,
            pageSizeOptions: PAGE_SIZE_OPTIONS,
            showTotal: (t) => `共 ${t} 项（${derived.folders.length} 个文件夹 / ${derived.files.length} 个文件）`,
            onChange: (pageIndex, pageSize) => reload({ pageIndex, pageSize }),
          }}
        />
      </Card>
    </>
  );
};
