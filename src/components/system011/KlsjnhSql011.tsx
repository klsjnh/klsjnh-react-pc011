/**
 * Klsjnh SQL 编辑器组件 011
 * 从老项目 klsjnh-react-dev011_20260909_011 迁移
 * 功能：SQL 编辑、格式化、压缩、执行、复制、清除
 */
import React, { useCallback, useEffect, useRef, useState, type ClipboardEvent, type ReactNode } from 'react';
import { App, Button, Input, Select, Space, Tooltip } from 'antd';
import type { TextAreaRef as AntTextAreaRef } from 'antd/es/input/TextArea';
import {
  SnippetsOutlined,
  AlignLeftOutlined,
  PlayCircleOutlined,
  CopyOutlined,
  DeleteOutlined,
  LoadingOutlined,
} from '@ant-design/icons';
import {
  tryFormatSQL,
  type SqlFormatLanguage,
  type SqlFormatMode,
} from '@/utils/system011/Sql011Util';

const { TextArea } = Input;

export interface KlsjnhSql011Props {
  value?: string;
  onChange?: (value: string) => void;
  onExecute?: (sql: string) => void | Promise<void>;
  onExecuted?: (sql: string) => void;
  cacheKey?: string;
  placeholder?: string;
  height?: number;
  disableExecute?: boolean;
  className?: string;
  prefix?: ReactNode;
  suffix?: ReactNode;
  defaultDialect?: SqlFormatLanguage;
}

const DIALECT_OPTIONS = [
  { value: 'auto', label: '自动方言' },
  { value: 'mysql', label: 'MySQL' },
  { value: 'oracle', label: 'Oracle' },
  { value: 'sqlserver', label: 'SQL Server' },
  { value: 'postgresql', label: 'PostgreSQL' },
  { value: 'sql', label: '标准 SQL' },
];

const FORMAT_MODE_OPTIONS = [
  { value: 'standard', label: '标准格式化' },
  { value: 'compress', label: '压缩' },
];

function getNativeTextarea(ref: AntTextAreaRef | null): HTMLTextAreaElement | null {
  return ref?.resizableTextArea?.textArea ?? null;
}

export const KlsjnhSql011 = ({
  value = '',
  onChange,
  onExecute,
  onExecuted,
  cacheKey,
  placeholder = '请输入 SQL 语句...',
  height = 200,
  disableExecute = false,
  className = '',
  prefix,
  suffix,
  defaultDialect = 'oracle',
}: KlsjnhSql011Props) => {
  const { message } = App.useApp();
  const [executing, setExecuting] = useState(false);
  const [dialect, setDialect] = useState<SqlFormatLanguage>(defaultDialect);
  const [formatMode, setFormatMode] = useState<SqlFormatMode>('standard');
  const textareaRef = useRef<AntTextAreaRef>(null);

  useEffect(() => {
    if (cacheKey && !value) {
      const cached = localStorage.getItem(cacheKey);
      if (cached) {
        onChange?.(cached);
      }
    }
  }, []);

  useEffect(() => {
    if (cacheKey && value) {
      localStorage.setItem(cacheKey, value);
    }
  }, [value, cacheKey]);

  const applyFormat = useCallback((source: string, showMessage = true) => {
    const result = tryFormatSQL(source, { language: dialect, mode: formatMode });
    if (!result.ok) {
      if (showMessage) message.error(result.message || 'SQL 格式化失败');
      return false;
    }
    onChange?.(result.sql);
    if (showMessage) {
      if (formatMode === 'compress') {
        message.success('压缩成功');
      } else {
        message.success(result.dialect ? `格式化成功（${result.dialect}）` : '格式化成功');
      }
    }
    return true;
  }, [dialect, formatMode, message, onChange]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange?.(e.target.value);
  }, [onChange]);

  const handlePasteAndFormat = useCallback(async () => {
    const applyFromText = (text: string) => {
      if (!text.trim()) {
        message.warning('剪贴板为空');
        return;
      }
      applyFormat(text);
    };

    try {
      if (navigator.clipboard?.readText) {
        applyFromText(await navigator.clipboard.readText());
        return;
      }
    } catch {
      // fall through to native paste listener
    }

    const native = getNativeTextarea(textareaRef.current);
    if (!native) {
      message.warning('无法读取剪贴板，请手动粘贴后点「格式化」');
      return;
    }

    const onNativePaste = (event: Event) => {
      native.removeEventListener('paste', onNativePaste);
      const clip = event as unknown as ClipboardEvent;
      const text = clip.clipboardData?.getData('text/plain') ?? '';
      if (!text.trim()) {
        message.warning('剪贴板为空');
        return;
      }
      event.preventDefault();
      applyFromText(text);
    };

    native.addEventListener('paste', onNativePaste);
    native.focus();
    message.info('请按 Ctrl+V 粘贴');
  }, [applyFormat, message]);

  const handleFormat = useCallback(() => {
    if (!value.trim()) {
      message.warning('请输入 SQL 语句');
      return;
    }
    applyFormat(value);
  }, [applyFormat, message, value]);

  const handleCopy = useCallback(async () => {
    if (!value.trim()) {
      message.warning('没有可复制的内容');
      return;
    }
    try {
      await navigator.clipboard.writeText(value);
      message.success('已复制到剪贴板');
    } catch {
      message.error('复制失败');
    }
  }, [message, value]);

  const handleClear = useCallback(() => {
    onChange?.('');
    if (cacheKey) {
      localStorage.removeItem(cacheKey);
    }
    message.info('已清空');
  }, [cacheKey, message, onChange]);

  const handleExecute = useCallback(async () => {
    if (!value.trim()) {
      message.warning('请输入 SQL 语句');
      return;
    }
    if (!onExecute) {
      message.warning('未配置 SQL 执行');
      return;
    }

    setExecuting(true);
    try {
      await Promise.resolve(onExecute(value));
      onExecuted?.(value);
    } catch (e: unknown) {
      message.error(e instanceof Error ? e.message : 'SQL 执行失败');
    } finally {
      setExecuting(false);
    }
  }, [message, onExecute, onExecuted, value]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const textarea = e.currentTarget;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const newValue = value.substring(0, start) + '  ' + value.substring(end);
      onChange?.(newValue);
      setTimeout(() => {
        textarea.selectionStart = textarea.selectionEnd = start + 2;
      }, 0);
    }
  }, [onChange, value]);

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
          {prefix}
          <Select
            size="small"
            value={formatMode}
            onChange={setFormatMode}
            options={FORMAT_MODE_OPTIONS}
            style={{ width: 120 }}
          />
          <Select
            size="small"
            value={dialect}
            onChange={setDialect}
            options={DIALECT_OPTIONS}
            style={{ width: 110 }}
          />
          <Tooltip title="粘贴并格式化">
            <Button type="text" size="small" icon={<SnippetsOutlined />} onClick={handlePasteAndFormat} />
          </Tooltip>
          <Tooltip title="格式化">
            <Button type="text" size="small" icon={<AlignLeftOutlined />} onClick={handleFormat} />
          </Tooltip>
          <Tooltip title="执行（仅 SELECT，最多 10 行）">
            <Button
              type="text"
              size="small"
              icon={executing ? <LoadingOutlined spin /> : <PlayCircleOutlined />}
              onClick={handleExecute}
              disabled={executing || disableExecute}
            />
          </Tooltip>
          <Tooltip title="复制">
            <Button type="text" size="small" icon={<CopyOutlined />} onClick={handleCopy} />
          </Tooltip>
          <Tooltip title="清除">
            <Button type="text" size="small" icon={<DeleteOutlined />} onClick={handleClear} />
          </Tooltip>
          {suffix}
        </Space>
      </div>

      <TextArea
        ref={textareaRef}
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className="klsjnh-sql011-textarea"
        style={{ height }}
        spellCheck={false}
      />
    </div>
  );
};

export default KlsjnhSql011;
