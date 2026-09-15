/**
 * Klsjnh Markdown Editor 011 - Markdown editor component (antd version)
 * Migrated from klsjnh-react-dev011_20260909_011.
 * Features: edit/preview modes, toolbar formatting, Word HTML conversion.
 */
import React, { useCallback, useRef, useState, type ClipboardEvent } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { App, Button, Input, Space, Tooltip } from 'antd';
import type { TextAreaRef } from 'antd/es/input/TextArea';
import {
  BoldOutlined,
  ItalicOutlined,
  CodeOutlined,
  LinkOutlined,
  PictureOutlined,
  UnorderedListOutlined,
  OrderedListOutlined,
  CheckSquareOutlined,
  CommentOutlined,
  MinusOutlined,
  TableOutlined,
  ApartmentOutlined,
  EditOutlined,
  EyeOutlined,
  FileWordOutlined,
} from '@ant-design/icons';
import {
  convertWordContentToMarkdown,
  looksLikeWordHtml,
  readPasteMarkdown,
  shouldConvertPaste,
} from '@/utils/system011/wordPasteToMarkdown';
import './KlsjnhMarkdown011.css';

const { TextArea } = Input;

export interface KlsjnhMarkdown011Props {
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  height?: number;
  readOnly?: boolean;
  className?: string;
}

export const KlsjnhMarkdown011: React.FC<KlsjnhMarkdown011Props> = ({
  value = '',
  onChange,
  placeholder = 'Enter Markdown content...',
  height = 400,
  readOnly = false,
  className = '',
}) => {
  const { message } = App.useApp();
  const [mode, setMode] = useState<'edit' | 'preview'>('edit');
  const textareaRef = useRef<TextAreaRef>(null);

  const insertText = useCallback((before: string, after: string = '') => {
    if (readOnly) return;
    const textarea = textareaRef.current?.resizableTextArea?.textArea;
    if (!textarea) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = value.substring(start, end);
    const newText = value.substring(0, start) + before + selectedText + after + value.substring(end);
    onChange?.(newText);
    setTimeout(() => {
      textarea.focus();
      const newCursorPos = start + before.length + selectedText.length + after.length;
      textarea.setSelectionRange(newCursorPos, newCursorPos);
    }, 0);
  }, [value, onChange, readOnly]);

  const insertBlock = useCallback((text: string) => {
    if (readOnly) return;
    const textarea = textareaRef.current?.resizableTextArea?.textArea;
    if (!textarea) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const before = value.substring(0, start);
    const after = value.substring(end);
    const needsLeadingBreak = before.length > 0 && !before.endsWith('\n');
    const needsTrailingBreak = after.length > 0 && !after.startsWith('\n');
    const block = `${needsLeadingBreak ? '\n\n' : ''}${text}${needsTrailingBreak ? '\n\n' : ''}`;
    const newText = before + block + after;
    onChange?.(newText);
    setTimeout(() => {
      textarea.focus();
      const cursor = before.length + block.length;
      textarea.setSelectionRange(cursor, cursor);
    }, 0);
  }, [onChange, readOnly, value]);

  const handlePaste = useCallback((event: ClipboardEvent<HTMLTextAreaElement>) => {
    if (readOnly) return;
    const { clipboardData } = event;
    if (!shouldConvertPaste(clipboardData)) return;
    event.preventDefault();
    const markdown = readPasteMarkdown(clipboardData);
    if (markdown) insertBlock(markdown);
  }, [insertBlock, readOnly]);

  const handleConvertWord = useCallback(() => {
    if (readOnly || !value.trim()) {
      message.warning('No content to convert');
      return;
    }
    if (!looksLikeWordHtml(value)) {
      message.warning('No Word / HTML content detected');
      return;
    }
    const markdown = convertWordContentToMarkdown(value);
    if (!markdown || markdown === value) {
      message.warning('Conversion result is empty or unchanged');
      return;
    }
    onChange?.(markdown);
    message.success('Word HTML converted to Markdown');
  }, [message, onChange, readOnly, value]);

  const toolbarItems = [
    { icon: BoldOutlined, title: 'Bold', action: () => insertText('**', '**') },
    { icon: ItalicOutlined, title: 'Italic', action: () => insertText('*', '*') },
    { icon: CodeOutlined, title: 'Code', action: () => insertText('`', '`') },
    { icon: LinkOutlined, title: 'Link', action: () => insertText('[', '](url)') },
    { icon: PictureOutlined, title: 'Image', action: () => insertText('![alt](', ')') },
    { icon: UnorderedListOutlined, title: 'Unordered list', action: () => insertText('- ') },
    { icon: OrderedListOutlined, title: 'Ordered list', action: () => insertText('1. ') },
    { icon: CheckSquareOutlined, title: 'Task', action: () => insertText('- [ ] ') },
    { icon: CommentOutlined, title: 'Quote', action: () => insertText('> ') },
    { icon: MinusOutlined, title: 'Divider', action: () => insertText('\n---\n') },
    {
      icon: TableOutlined,
      title: 'Table',
      action: () => insertText('\n| Col1 | Col2 | Col3 |\n|------|------|------|\n| Data | Data | Data |\n'),
    },
    {
      icon: ApartmentOutlined,
      title: 'Flowchart',
      action: () => insertText('\n```mermaid\ngraph TD\n    A[Start] --> B{Decision}\n    B -->|Yes| C[Action1]\n    B -->|No| D[Action2]\n    C --> E[End]\n    D --> E\n```\n'),
    },
  ];

  return (
    <div
      className={className}
      style={{
        border: '1px solid #d9d9d9',
        borderRadius: 8,
        overflow: 'hidden',
        background: '#fff',
      }}
    >
      {!readOnly && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 8,
            padding: '8px 12px',
            borderBottom: '1px solid #f0f0f0',
            background: '#fafafa',
            flexWrap: 'wrap',
          }}
        >
          <Space size={4} wrap>
            {toolbarItems.map((item, index) => {
              const Icon = item.icon;
              return (
                <Tooltip key={index} title={item.title}>
                  <Button type="text" size="small" icon={<Icon />} onClick={item.action} />
                </Tooltip>
              );
            })}
          </Space>
          <Space size={4} wrap>
            <Tooltip title="Convert Word / HTML to Markdown">
              <Button type="text" size="small" icon={<FileWordOutlined />} onClick={handleConvertWord}>
                Word
              </Button>
            </Tooltip>
            <Button
              type="default"
              size="small"
              icon={mode === 'edit' ? <EyeOutlined /> : <EditOutlined />}
              onClick={() => setMode(mode === 'edit' ? 'preview' : 'edit')}
            >
              {mode === 'edit' ? 'Preview' : 'Edit'}
            </Button>
          </Space>
        </div>
      )}

      {mode === 'edit' ? (
        <TextArea
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange?.(e.target.value)}
          onPaste={handlePaste}
          placeholder={placeholder}
          readOnly={readOnly}
          className="klsjnh-markdown011-textarea"
          style={{ height }}
        />
      ) : (
        <div className="klsjnh-markdown011-body" style={{ height, overflow: 'auto', padding: 16 }}>
          {value ? (
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{value}</ReactMarkdown>
          ) : (
            <p style={{ color: '#999' }}>No content</p>
          )}
        </div>
      )}
    </div>
  );
};

export default KlsjnhMarkdown011;
