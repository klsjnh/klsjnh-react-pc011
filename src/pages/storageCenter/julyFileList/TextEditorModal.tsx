/**
 * 对象在线文本编辑弹窗（对接 storageCenter/object readText|saveText）
 * 按扩展名挂对应编辑器（规则唯一事实源 = storageObjectService.resolveEditorKind）：
 *   .sql                    → KlsjnhSql011（SQL 编辑器；存储场景不能执行语句，故 disableExecute）
 *   .md / .markdown / .txt  → KlsjnhMarkdown011（工具栏 + 预览）
 *   其余文本类（json/csv/log…）→ Input.TextArea 纯文本域
 * saveText 不刷新对象列表（service 无副作用），故由父页在 onSaved 里重拉当前页。
 */
import { useEffect, useState } from 'react';
import { Button, Input, Modal, Tag } from 'antd';
import { KlsjnhMarkdown011, KlsjnhSql011 } from '@/components/system011';
import {
  resolveEditorKind, saveObjectText, type ObjectEditorKind, type ReadTextResult,
} from '@/services/storageCenter/storageObjectService';
import { toast } from '@/utils/toast';

interface Props {
  open: boolean;
  storageCode: string | undefined;
  bucketName: string;
  objectName: string;
  /** 父页给出的编辑器类型；缺省或为空时由弹窗按对象名自行推断 */
  editorKind?: ObjectEditorKind;
  initial: ReadTextResult | null;
  onClose: () => void;
  onSaved: () => void;
}

const KIND_LABEL: Record<ObjectEditorKind, string> = { sql: 'SQL', markdown: 'Markdown', text: '文本' };

/** 编辑区高度 */
const EDITOR_HEIGHT = 420;

/** 纯文本域仍开放编辑的扩展名（其余只读预览） */
const PLAIN_EDITABLE_RE = /\.(json|csv|yml|yaml)$/;

export const TextEditorModal = ({ open, storageCode, bucketName, objectName, editorKind, initial, onClose, onSaved }: Props) => {
  const [content, setContent] = useState('');
  const [saving, setSaving] = useState(false);
  /** 编辑器和标题标签都以这里为准：父页没给 / 两处规则漂移时都能自愈 */
  const kind: ObjectEditorKind = editorKind || resolveEditorKind(objectName);
  const readonly = kind === 'text' && !PLAIN_EDITABLE_RE.test(objectName.toLowerCase());

  // intentional sync from prop to local editor state
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (open) setContent((initial?.content) ?? '');
  }, [open, initial]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await saveObjectText(storageCode, bucketName, objectName, content);
      toast.success('保存成功');
      onSaved();
      onClose();
    } catch (e) {
      toast.error((e as Error)?.message || '保存失败');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      title={<span>在线编辑 <Tag color="blue">{KIND_LABEL[kind]}</Tag><code className="text-muted text-xs">{objectName}</code></span>}
      open={open}
      onOk={handleSave}
      onCancel={onClose}
      destroyOnHidden
      width={kind === 'text' ? 760 : 960}
      footer={[
        <Button key="cancel" onClick={onClose}>关闭</Button>,
        <Button key="ok" type="primary" loading={saving} onClick={handleSave}>保存</Button>,
      ]}
    >
      {kind === 'sql' ? (
        // cacheKey 不传：存储文件内容才是唯一来源，不能把上次的 SQL 草稿灌进来
        <KlsjnhSql011
          value={content}
          onChange={setContent}
          height={EDITOR_HEIGHT}
          disableExecute
          defaultDialect="oracle"
          placeholder="输入 SQL 语句..."
        />
      ) : kind === 'markdown' ? (
        <KlsjnhMarkdown011
          value={content}
          onChange={setContent}
          height={EDITOR_HEIGHT}
          placeholder="输入 Markdown 内容..."
        />
      ) : (
        <Input.TextArea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          readOnly={readonly}
          autoSize={{ minRows: 12, maxRows: 24 }}
          style={{ fontFamily: 'monospace' }}
        />
      )}
    </Modal>
  );
};
