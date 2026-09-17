/**
 * 文件列表页（storage011 · object/*）
 *
 * 存储中心分「存储桶」「文件列表」两页：本页在「实例 + 桶 + 前缀」条件下管理对象，
 * 覆盖上传 / 下载 / 预签名 URL / 在线文本编辑 / 删除 / 批量删除。
 * 分层：page 调 service + 读 store；service 编排业务并写 store（store 不调 service）。
 * 布局：页面根 .page-fill（flex 列），.page-toolbar 与 Card.table-wrapper 均为其**直接子元素**
 *       → 卡片吃满剩余高度，表格体高度由 useTableFillHeight 实测后喂 antd scroll.y。
 *
 * ⚠️ 条件全部走**派生值**（explorer 里存的选择 → 校验后落到实际生效值）：
 *    实例 / 桶 都必须"先拿到列表再发查询"，否则首个请求会带 undefined 打全量，
 *    与随后的收窄请求并发、谁后返回谁写 store（实测桶列表曾混入其它实例的桶）。
 * ⚠️ 前缀只认 store：输入框是本地 state，点「查询」才写入 store → 每次前缀变化恰好触发一次查询。
 */
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { DeleteOutlined, HddOutlined, ReloadOutlined, UploadOutlined } from '@ant-design/icons';
import { Button, Card, Input, Popconfirm, Select, Space, Table, Upload } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { PAGE_SIZE_OPTIONS } from '@/utils/pageSizePref';
import { useTableFillHeight } from '@/hooks/useTableFillHeight';
import { toast } from '@/utils/toast';
import type { StorageBucket, StorageObject } from '@/types/storage011';
import { listBuckets } from '@/services/storage011/storageBucketService';
import {
  batchRemoveObjects, downloadObject, fetchObjectPage, presignedUrl, readObjectText, removeObject, uploadObject,
  type ObjectEditorKind, type ReadTextResult,
} from '@/services/storage011/storageObjectService';
import { useStorageObjectState } from '@/stores/storage011/storageObjectStore';
import { storageExplorerStore, useStorageExplorer } from '@/stores/storage011/storageExplorerStore';
import { useStorageOptions } from '@/pages/storageCenter/useStorageOptions';
import { StorageInstancesModal } from '@/pages/storageCenter/StorageInstancesModal';
import { TextEditorModal } from '@/pages/backup011/storageCenter/storageFile/TextEditorModal';

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

/** 文本类对象才提供在线编辑（其余只给下载 / 预签名链接） */
const TEXT_OBJECT_RE = /\.(sql|md|markdown|txt|json|csv|yml|yaml|log|xml|properties|conf|ini)$/i;
const isTextObject = (objectName: string): boolean => TEXT_OBJECT_RE.test(objectName.trim());

/** 编辑器类型（弹窗标题上的类型标签） */
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

interface EditorState {
  open: boolean;
  storageCode?: string;
  bucketName: string;
  objectName: string;
  kind: ObjectEditorKind;
  initial: ReadTextResult | null;
}

export const StorageFile = () => {
  const { list, total, loading, query } = useStorageObjectState();
  const { storages, ready: storagesReady, reload: reloadStorages } = useStorageOptions();
  const explorer = useStorageExplorer();
  /** 桶列表连同「属于哪个实例」一起存：ready 由实例号比对派生，实例一换立刻为 false，无需回写 */
  const [bucketState, setBucketState] = useState<{ forCode?: string; rows: StorageBucket[] }>({ rows: [] });
  const [prefixInput, setPrefixInput] = useState(explorer.prefix ?? '');
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [uploading, setUploading] = useState(false);
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const [instancesOpen, setInstancesOpen] = useState(false);
  const [editor, setEditor] = useState<EditorState>({ open: false, bucketName: '', objectName: '', kind: 'text', initial: null });
  const cardRef = useRef<HTMLDivElement>(null);
  const tableBodyHeight = useTableFillHeight(cardRef, `${total}-${loading}`);

  // 用户在 store 里选过、且该实例仍存在时才用它；否则派生为第一个可用实例
  const storageCode = explorer.storageCode && storages.some((s) => s.storageCode === explorer.storageCode)
    ? explorer.storageCode
    : storages[0]?.storageCode;
  const bucketsReady = storagesReady && !!storageCode && bucketState.forCode === storageCode;
  const buckets = bucketsReady ? bucketState.rows : [];
  // 同理：store 里的桶必须仍在该实例的桶列表里才生效
  const bucketName = explorer.bucketName && buckets.some((b) => b.bucketName === explorer.bucketName)
    ? explorer.bucketName
    : buckets[0]?.bucketName;
  const prefix = explorer.prefix ?? '';

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

  // 实例 + 桶都落定后拉对象：一次带全三元组条件（前缀变化也走这里，故它是依赖项）
  useEffect(() => {
    if (!bucketsReady || !bucketName) return;
    void fetchObjectPage({ pageIndex: 1, storageCode, bucketName, prefix: prefix || undefined });
  }, [bucketsReady, storageCode, bucketName, prefix]);

  /** 条件未变时的翻页 / 换每页条数 */
  const paged = useCallback((patch: { pageIndex?: number; pageSize?: number } = {}) => {
    void fetchObjectPage({
      pageIndex: patch.pageIndex ?? 1,
      pageSize: patch.pageSize,
      storageCode, bucketName, prefix: prefix || undefined,
    });
  }, [storageCode, bucketName, prefix]);

  /** 当前条件下的原地刷新（上传 / 编辑保存后保持页码不变） */
  const refresh = useCallback(() => {
    void fetchObjectPage({
      pageIndex: query.pageIndex,
      storageCode, bucketName, prefix: prefix || undefined,
    });
  }, [query.pageIndex, storageCode, bucketName, prefix]);

  const applyPrefix = () => storageExplorerStore.setPrefix(prefixInput.trim());

  /** 行键：实例 + 桶 + 对象名三元组才唯一定位一个对象 */
  const rowKeyOf = (r: StorageObject) => `${r.storageCode ?? storageCode ?? ''}|${r.bucketName}|${r.objectName}`;

  const handleUpload = async (file: File) => {
    if (!bucketName) { toast.warning('请先选择目标桶'); return; }
    setUploading(true);
    try {
      await uploadObject(storageCode, bucketName, file);
      toast.success(`上传成功：${file.name}`);
      void fetchObjectPage({ pageIndex: 1, storageCode, bucketName, prefix: prefix || undefined });
    } catch (e) {
      toast.error((e as Error)?.message || '上传失败');
    } finally {
      setUploading(false);
    }
  };

  const handleDownload = async (row: StorageObject) => {
    setBusyKey(rowKeyOf(row));
    try {
      await downloadObject(row.storageCode ?? storageCode, row.bucketName, row.objectName);
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
      const { url } = await presignedUrl(row.storageCode ?? storageCode, row.bucketName, row.objectName);
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
      const initial = await readObjectText(storage, row.bucketName, row.objectName);
      setEditor({
        open: true, storageCode: storage, bucketName: row.bucketName,
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
      await removeObject(row.storageCode ?? storageCode, row.bucketName, row.objectName);
      setSelectedRowKeys([]);
      toast.success('删除成功');
    } catch (e) {
      toast.error((e as Error)?.message || '删除失败，请重试');
    }
  };

  const handleBatchRemove = async () => {
    if (!selectedRowKeys.length) return;
    const keys = new Set(selectedRowKeys.map(String));
    const items = list
      .filter((r) => keys.has(rowKeyOf(r)))
      .map((r) => ({ storageCode: r.storageCode ?? storageCode, bucketName: r.bucketName, objectName: r.objectName }));
    if (!items.length) { setSelectedRowKeys([]); return; }
    try {
      await batchRemoveObjects(items);
      setSelectedRowKeys([]);
      toast.success(`批量删除成功 ${items.length} 条`);
    } catch (e) {
      toast.error((e as Error)?.message || '批量删除失败，请重试');
    }
  };

  const columns: ColumnsType<StorageObject> = [
    { ...leftCell, title: '文件名称', dataIndex: 'objectName', width: 320, render: (v) => <code>{v}</code> },
    {
      title: '大小', dataIndex: 'size', width: 110, align: 'center', onHeaderCell: hdrCenter,
      render: (v: number) => formatBytes(v),
    },
    { ...leftCell, title: '内容类型', dataIndex: 'contentType', width: 200, render: (v) => v || '-' },
    { ...leftCell, title: '最后修改', dataIndex: 'lastModified', width: 190, render: (v) => v || '-' },
    {
      title: '操作', key: 'action', width: 230, fixed: 'right', align: 'center', onHeaderCell: hdrCenter,
      render: (_, r) => (
        <Space size="small">
          <Button type="link" size="small" loading={busyKey === rowKeyOf(r)} onClick={() => handleDownload(r)}>下载</Button>
          {isTextObject(r.objectName) && (
            <Button type="link" size="small" loading={busyKey === rowKeyOf(r)} onClick={() => handleEdit(r)}>编辑</Button>
          )}
          <Button type="link" size="small" loading={busyKey === rowKeyOf(r)} onClick={() => handleCopyUrl(r)}>链接</Button>
          <Popconfirm
            title="确定删除该文件吗？" okText="删除" cancelText="取消" okButtonProps={{ danger: true }}
            onConfirm={() => handleRemove(r)}
          >
            <Button type="link" size="small" danger>删除</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div className="page-fill">
      <div className="page-header">
        <h2>文件列表</h2>
      </div>

      {/* 有搜索条件 → 条件单独占一行，按钮区放 .toolbar-right（与全站列表页一致） */}
      <div className="page-toolbar" style={{ display: 'block' }}>
        <div className="toolbar-row-search" style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
          <Select
            placeholder="存储实例" style={{ width: 250 }}
            value={storageCode}
            onChange={(v) => { storageExplorerStore.selectStorage(v); setSelectedRowKeys([]); }}
            options={storages.map((s) => ({ value: s.storageCode, label: `${s.storageName} (${s.storageCode})` }))}
          />
          <Select
            placeholder={storageCode ? '选择桶' : '请先选存储实例'} style={{ width: 200 }}
            disabled={!storageCode} value={bucketName}
            onChange={(v) => { storageExplorerStore.selectBucket(v); setSelectedRowKeys([]); }}
            options={buckets.map((b) => ({ value: b.bucketName, label: b.bucketName }))}
          />
          <Input
            allowClear placeholder="前缀过滤，如 sql/" style={{ width: 200 }}
            value={prefixInput}
            onChange={(e) => setPrefixInput(e.target.value)}
            onPressEnter={applyPrefix}
          />
          <Button color="default" variant="filled" onClick={applyPrefix}>查询</Button>
        </div>
        <div className="toolbar-right">
          <Upload
            showUploadList={false}
            disabled={!bucketName}
            beforeUpload={(file) => { void handleUpload(file as unknown as File); return false; }}
          >
            <Button color="primary" variant="filled" icon={<UploadOutlined />} loading={uploading} disabled={!bucketName}>
              上传文件
            </Button>
          </Upload>
          <Popconfirm
            title={`确定要删除选中的 ${selectedRowKeys.length} 个文件吗？`}
            okText="删除" cancelText="取消" okButtonProps={{ danger: true }}
            onConfirm={handleBatchRemove}
            disabled={!selectedRowKeys.length}
          >
            <Button color="danger" variant="filled" icon={<DeleteOutlined />} disabled={!selectedRowKeys.length}>批量删除</Button>
          </Popconfirm>
          <Button color="default" variant="filled" icon={<HddOutlined />} onClick={() => setInstancesOpen(true)}>
            管理实例
          </Button>
          <Button color="default" variant="filled" icon={<ReloadOutlined />} onClick={refresh}>刷新</Button>
        </div>
      </div>

      <Card className="table-wrapper" ref={cardRef} styles={{ body: { padding: 0 } }}>
        <Table<StorageObject>
          rowKey={rowKeyOf}
          columns={columns}
          rowSelection={{ selectedRowKeys, onChange: (keys) => setSelectedRowKeys(keys) }}
          dataSource={list}
          loading={loading}
          scroll={{ x: 1050, y: tableBodyHeight }}
          pagination={{
            current: query.pageIndex,
            pageSize: query.pageSize,
            total,
            showSizeChanger: true,
            pageSizeOptions: PAGE_SIZE_OPTIONS,
            showTotal: (t) => `共 ${t} 条`,
            onChange: (pageIndex, pageSize) => paged({ pageIndex, pageSize }),
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
        onSaved={refresh}
      />

      <StorageInstancesModal
        open={instancesOpen}
        onClose={() => setInstancesOpen(false)}
        onChanged={reloadStorages}
      />
    </div>
  );
};
