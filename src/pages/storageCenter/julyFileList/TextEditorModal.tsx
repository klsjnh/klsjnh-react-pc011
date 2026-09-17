/**
 * 对象在线文本编辑弹窗（对接 storage011/object readText|saveText）
 * 仅对文本类对象（.sql/.md/.txt 等）开放编辑；其余类型只读预览。
 * saveText 不刷新对象列表（service 无副作用），故由父页在 onSaved 里重拉当前页。
 */
import { useEffect, useState } from 'react';
import { Button, Input, Modal, Tag } from 'antd';
import { saveObjectText, type ObjectEditorKind, type ReadTextResult } from '@/services/storage011/storageObjectService';
import { toast } from '@/utils/toast';

interface Props {
  open: boolean;
  storageCode: string | undefined;
  bucketName: string;
  objectName: string;
  editorKind: ObjectEditorKind;
  initial: ReadTextResult | null;
  onClose: () => void;
  onSaved: () => void;
}

const KIND_LABEL: Record<ObjectEditorKind, string> = { sql: 'SQL', markdown: 'Markdown', text: '文本' };

export const TextEditorModal = ({ open, storageCode, bucketName, objectName, editorKind, initial, onClose, onSaved }: Props) => {
  const [content, setContent] = useState('');
  const [saving, setSaving] = useState(false);
  const readonly = editorKind === 'text' && !objectName.toLowerCase().match(/\.(sql|md|markdown|txt|json|csv|yml|yaml)$/);

  useEffect(() => {
    if (open) setContent(initial?.content ?? '');
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
      title={<span>在线编辑 <Tag color="blue">{KIND_LABEL[editorKind]}</Tag><code className="text-muted text-xs">{objectName}</code></span>}
      open={open}
      onOk={handleSave}
      onCancel={onClose}
      destroyOnHidden
      width={760}
      footer={[
        <Button key="cancel" onClick={onClose}>关闭</Button>,
        <Button key="ok" type="primary" loading={saving} onClick={handleSave}>保存</Button>,
      ]}
    >
      <Input.TextArea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        readOnly={readonly}
        autoSize={{ minRows: 12, maxRows: 24 }}
        style={{ fontFamily: 'monospace' }}
      />
    </Modal>
  );
};
