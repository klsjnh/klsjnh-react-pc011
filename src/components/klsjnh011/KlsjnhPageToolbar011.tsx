import { Button, Popconfirm } from 'antd';
import { DeleteOutlined } from '@ant-design/icons';
import type { ReactNode } from 'react';

/**
 * KlsjnhPageToolbar011 —— 页面工具栏原语（031 §015/016 定稿形态）
 *
 * 两行结构（默认，金标准 julyUser 口径）：
 *   第一行：搜索区（左侧）—— search 槽，页面自己放 Input.Search / Select 筛选
 *   第二行：动作区（右侧）—— actions 槽，五色按钮按 031 §016 固定排序
 * 单行结构（layout="inline"，存量单行工具栏形态）：
 *   左搜索右按钮同一行，等价旧 .page-toolbar + toolbar-left/right。
 *
 * 设计取舍：
 * - 不包 Search/Select 的受控逻辑（关键词/筛选值是页面状态），只管结构、间距、对齐；
 *   搜索行为契约（宽 260 / 筛选宽 140 / onSearch 回第一页）由 031 §015 + SCSS 宽度类约束。
 * - 批量删除的 Popconfirm/禁用/loading 规则做成现成子件 KlsjnhBatchDeleteButton011，页面零胶水。
 */

export interface KlsjnhPageToolbar011Props {
  /** 搜索区内容（Input.Search / Select 筛选等），落在第一行左侧；inline 模式下落在 toolbar-left */
  search?: ReactNode;
  /** 动作区内容（新建/批量删除/导出等五色按钮），落在右侧动作区 */
  actions?: ReactNode;
  /** 两行（默认，金标准）或单行（存量单行工具栏） */
  layout?: 'stacked' | 'inline';
  className?: string;
}

export function KlsjnhPageToolbar011({ search, actions, layout = 'stacked', className }: KlsjnhPageToolbar011Props) {
  const cls = className ? ` ${className}` : '';
  if (layout === 'inline') {
    return (
      <div className={`page-toolbar klsjnh-page-toolbar011${cls}`}>
        {search != null && <div className="toolbar-left">{search}</div>}
        {actions != null && <div className="toolbar-right">{actions}</div>}
      </div>
    );
  }
  return (
    <div className={`page-toolbar klsjnh-page-toolbar011 klsjnh-page-toolbar011-stacked${cls}`} style={{ display: 'block' }}>
      <div className="toolbar-row-search">{search}</div>
      <div className="toolbar-right klsjnh-toolbar-actions">{actions}</div>
    </div>
  );
}

/** 031 §016 #2：批量删除按钮（danger filled + Popconfirm + 双态 disabled/loading） */
export function KlsjnhBatchDeleteButton011({
  selectedCount,
  onDelete,
  deleting,
  children = '批量删除',
}: {
  selectedCount: number;
  onDelete: () => void;
  deleting?: boolean;
  children?: string;
}) {
  return (
    <Popconfirm
      title="批量删除"
      description={`确认删除选中的 ${selectedCount} 项？`}
      okText="删除"
      cancelText="取消"
      okButtonProps={{ danger: true }}
      onConfirm={onDelete}
      disabled={selectedCount === 0 || deleting}
    >
      <Button color="danger" variant="filled" icon={<DeleteOutlined />} disabled={selectedCount === 0} loading={deleting}>
        {children}
      </Button>
    </Popconfirm>
  );
}
