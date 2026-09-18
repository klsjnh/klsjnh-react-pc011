/**
 * 对象在线编辑器（整页路由 → STORAGE011_ROUTES.fileEdit = /storageCenter/fileList/edit）
 *
 * 形态来源：老项目 klsjnh-react-dev011_20260909_011 的 `pages/klsjnh011/StorageFileEdit.tsx`
 * （用户要求「用跳转页面不是弹窗」），故不再走 TextEditorModal，改为文件列表页跳本页整页编辑。
 *
 * 参数走 **query** 而不是路径段：对象键里带 '/'（前缀目录）会把路由层级撑破，
 * query 也天然支持中文 / 特殊字符（URLSearchParams 负责转义）。
 *   /storageCenter/fileList/edit?storageCode=x&bucketName=y&objectName=dir/a.md&prefix=dir/
 *
 * 编辑器按扩展名三选一 —— 规则唯一事实源 = storageObjectService.resolveEditorKind：
 *   .sql                     → KlsjnhSql011（存储场景不能执行语句 → disableExecute）
 *   .md / .markdown / .txt   → KlsjnhMarkdown011（工具栏 + 预览）
 *   其余文本类（json/csv/log…）→ 纯文本域（其中 json/csv/yml/yaml 可编辑，其余只读预览）
 *
 * 布局：页面根 .page-fill → 卡片吃掉剩余高度（_common.scss 的 `.page-fill > .table-wrapper`），
 * 编辑器高度用 ResizeObserver 实测（与表格同思路，不用 calc(100vh - Npx) 估）。
 * 未保存修改：脏标记 + 「返回」二次确认（Popconfirm，不依赖全局 Modal 静态方法）。
 */
import { useCallback, useEffect, useMemo, useRef, useState, type RefObject } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Button, Card, Input, Popconfirm, Space, Spin, Tag } from 'antd';
import { ArrowLeftOutlined, ReloadOutlined } from '@ant-design/icons';
import { KlsjnhMarkdown011, KlsjnhSql011 } from '@/components/system011';
import { STORAGE011_ROUTES } from '@/config/routes';
import {
  readObjectText, resolveEditorKind, saveObjectText, type ObjectEditorKind,
} from '@/services/storage011/storageObjectService';
import { storageExplorerStore } from '@/stores/storage011/storageExplorerStore';
import { toast } from '@/utils/toast';

const KIND_LABEL: Record<ObjectEditorKind, string> = { sql: 'SQL', markdown: 'Markdown', text: '文本' };

/** 纯文本域仍开放编辑的扩展名（其余文本类只读预览） */
const PLAIN_EDITABLE_RE = /\.(json|csv|yml|yaml)$/;

/** 编辑器最小高度（窗口过矮时不至于压成一条线） */
const MIN_EDITOR_HEIGHT = 240;
/** 卡片内层留白（上下各 12px，见下方 body padding），测量时要扣掉 */
const BOX_PADDING = 24;

/** 实测容器高度：编辑器要像素高度（组件 props 是 number），只能量不能估 */
function useBoxHeight(ref: RefObject<HTMLDivElement | null>): number {
  const [height, setHeight] = useState(MIN_EDITOR_HEIGHT);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const measure = () => setHeight((prev) => {
      const next = Math.max(MIN_EDITOR_HEIGHT, Math.floor(el.clientHeight - BOX_PADDING));
      return prev === next ? prev : next;
    });
    measure();
    // 首帧 flex 高度未落定 → 下一帧补测一次
    const timer = window.setTimeout(measure, 0);
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => { ro.disconnect(); window.clearTimeout(timer); };
  }, [ref]);
  return height;
}

export const FileEditorPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const params = useMemo(() => new URLSearchParams(location.search), [location.search]);

  const storageCode = params.get('storageCode') || undefined;
  const bucketName = params.get('bucketName') || '';
  const objectName = params.get('objectName') || '';
  /** 进入编辑时列表页所处的目录前缀，返回时用它把浏览位置还原 */
  const backPrefix = params.get('prefix') || '';

  const kind: ObjectEditorKind = objectName ? resolveEditorKind(objectName) : 'text';
  const readonly = kind === 'text' && !PLAIN_EDITABLE_RE.test(objectName.toLowerCase());
  /** 展示用短名（去掉目录前缀） */
  const shortName = objectName.includes('/') ? objectName.slice(objectName.lastIndexOf('/') + 1) : objectName;
  const dirPath = objectName.includes('/') ? objectName.slice(0, objectName.lastIndexOf('/') + 1) : '';

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [remote, setRemote] = useState('');
  const [content, setContent] = useState('');
  const dirty = content !== remote;

  const boxRef = useRef<HTMLDivElement>(null);
  const editorHeight = useBoxHeight(boxRef);

  const load = useCallback(async () => {
    if (!bucketName || !objectName) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const row = await readObjectText(storageCode, bucketName, objectName);
      const text = row.content ?? '';
      setRemote(text);
      setContent(text);
    } catch (e) {
      toast.error((e as Error)?.message || '读取文件失败');
      setRemote('');
      setContent('');
    } finally {
      setLoading(false);
    }
  }, [storageCode, bucketName, objectName]);

  //  intentional data-loading effect
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { void load(); }, [load]);

  /** 返回列表：先把浏览位置写回 explorer（刷新后仍停在同一实例 + 桶 + 目录） */
  const goBack = useCallback(() => {
    storageExplorerStore.setPrefix(backPrefix);
    navigate(STORAGE011_ROUTES.fileList);
  }, [backPrefix, navigate]);

  const handleSave = async (andBack = false) => {
    if (!bucketName || !objectName) return;
    if (!dirty) {
      if (andBack) goBack();
      return;
    }
    setSaving(true);
    try {
      await saveObjectText(storageCode, bucketName, objectName, content);
      setRemote(content);
      toast.success(andBack ? '保存成功，已返回列表' : '保存成功');
      if (andBack) goBack();
    } catch (e) {
      toast.error((e as Error)?.message || '保存失败');
    } finally {
      setSaving(false);
    }
  };

  const missingParams = !bucketName || !objectName;

  const editor = kind === 'sql' ? (
    // cacheKey 不传：存储文件内容才是唯一来源，不能把上次的 SQL 草稿灌进来
    <KlsjnhSql011
      value={content}
      onChange={setContent}
      height={editorHeight}
      disableExecute
      defaultDialect="oracle"
      placeholder="输入 SQL 语句..."
    />
  ) : kind === 'markdown' ? (
    <KlsjnhMarkdown011
      value={content}
      onChange={setContent}
      height={editorHeight}
      readOnly={readonly}
      placeholder="输入 Markdown 内容..."
    />
  ) : (
    <Input.TextArea
      value={content}
      onChange={(e) => setContent(e.target.value)}
      readOnly={readonly}
      style={{ height: editorHeight, fontFamily: 'monospace', resize: 'none' }}
    />
  );

  return (
    <div className="page-fill">
      <div className="page-header">
        <h2>
          在线编辑 <Tag color="blue">{KIND_LABEL[kind]}</Tag>
          <code style={{ fontSize: 13, marginLeft: 4 }}>{shortName || '-'}</code>
        </h2>
      </div>

      <div className="page-toolbar">
        <div className="toolbar-left">
          <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
            {bucketName || '-'}{dirPath ? ` / ${dirPath}` : ' / 根目录'}
          </span>
          {dirty && <span style={{ fontSize: 13, color: 'var(--primary)' }}>有未保存的修改</span>}
        </div>
        <div className="toolbar-right">
          {dirty ? (
            <Popconfirm
              title="有未保存的修改，确定离开？" okText="离开" cancelText="取消"
              okButtonProps={{ danger: true }} onConfirm={goBack}
            >
              <Button color="default" variant="filled" icon={<ArrowLeftOutlined />}>返回列表</Button>
            </Popconfirm>
          ) : (
            <Button color="default" variant="filled" icon={<ArrowLeftOutlined />} onClick={goBack}>返回列表</Button>
          )}
          {!dirty && (
            <Button
              color="default" variant="filled" icon={<ReloadOutlined />}
              disabled={loading || missingParams} onClick={() => void load()}
            >重新加载</Button>
          )}
          <Button
            color="default" variant="filled" loading={saving}
            disabled={!dirty || loading || missingParams} onClick={() => void handleSave(false)}
          >保存</Button>
          <Button
            color="primary" variant="filled" loading={saving}
            disabled={loading || missingParams} onClick={() => void handleSave(true)}
          >保存并返回</Button>
        </div>
      </div>

      <Card className="table-wrapper" ref={boxRef} styles={{ body: { padding: 0 } }}>
        <div style={{ padding: 12, height: '100%', boxSizing: 'border-box' }}>
          {missingParams ? (
            <div style={{ height: editorHeight, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
              未获取到文件参数，请从文件列表点击文件名进入。
            </div>
          ) : (
            <Spin spinning={loading}>
              <div style={{ height: editorHeight }}>
                {loading ? null : editor}
              </div>
            </Spin>
          )}
        </div>
      </Card>

      {readonly && !loading && (
        <Space style={{ marginTop: 8, fontSize: 12, color: 'var(--text-muted)' }}>
          该类型文件仅支持只读预览（可编辑类型：sql / md / txt / json / csv / yml / yaml）
        </Space>
      )}
    </div>
  );
};
