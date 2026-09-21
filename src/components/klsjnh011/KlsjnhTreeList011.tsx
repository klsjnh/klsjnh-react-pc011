/**
 * KlsjnhTreeList011 —— 实体树面板（klsjnh011 组件库）
 * 「左侧树 + 动作」的通用形态（蓝本：菜单管理左栏；2026-09-21 用户指定落 klsjnh011）：
 * Card 容器 + antd Tree + 受控选中态 + 节点动作（右键菜单）+ 空态/加载态。
 * 纯受控展示组件：不发请求、不持业务状态；树数据（parentId/children 成品树）由调用方喂入。
 * 边界：拖拽排序的编排（service 级联）留在页面，本组件仅 draggable + onDrop 上抛。
 */
import { useMemo } from 'react';
import type { ReactNode } from 'react';
import { Card, Dropdown, Empty, Tree } from 'antd';
import type { DataNode } from 'antd/es/tree';

/** 节点动作（渲染为树节点右键菜单项；danger=true 红字） */
export interface KlsjnhTreeList011Action {
  key: string;
  label: string;
  danger?: boolean;
}

export interface KlsjnhTreeList011Props<T> {
  /** Card 标题（「业务域」「菜单」…） */
  title: ReactNode;
  /** Card 右上角动作区（如「新建」按钮） */
  extra?: ReactNode;
  /** 成品树数据（已是 children 嵌套形态，直接渲染） */
  nodes: T[];
  /** 节点 key 取值 */
  getKey: (node: T) => string;
  /** 节点标题渲染（图标/编码/状态 Tag/计数 各页自定义） */
  renderTitle: (node: T) => ReactNode;
  /** 节点动作（右键菜单；不传 = 无动作菜单） */
  nodeActions?: (node: T) => KlsjnhTreeList011Action[];
  /** 动作点击回调 */
  onAction?: (node: T, actionKey: string) => void;
  /** 受控选中 key（null = 无选中） */
  selectedKey: string | null;
  /** 选中回调（点击已选中项回 null = 取消选中） */
  onSelect: (key: string | null) => void;
  loading?: boolean;
  /** 空态文案 */
  emptyText?: string;
  /** 是否可拖拽（配合 onDrop 上抛，编排留在调用方） */
  draggable?: boolean;
  /** 拖拽落点回调（dropToGap=true 落在间隙=排序；false 落入节点=换父） */
  onDrop?: (dragKey: string, dropKey: string, dropToGap: boolean) => void;
  /** 受控展开 keys（不传 = 默认全展开；用户收起后经 onExpandedKeysChange 转受控） */
  expandedKeys?: string[];
  /** 展开变化回调 */
  onExpandedKeysChange?: (keys: string[]) => void;
  /** Card body 高度（默认对齐左栏面板 640） */
  bodyMinHeight?: number;
  bodyMaxHeight?: number;
  className?: string;
}

export const KlsjnhTreeList011 = <T,>({
  title,
  extra,
  nodes,
  getKey,
  renderTitle,
  nodeActions,
  onAction,
  selectedKey,
  onSelect,
  loading = false,
  emptyText = '暂无数据',
  draggable = false,
  onDrop,
  expandedKeys,
  onExpandedKeysChange,
  bodyMinHeight = 640,
  bodyMaxHeight = 640,
  className,
}: KlsjnhTreeList011Props<T>) => {
  /** 成品树 → antd DataNode（标题渲染 + 右键动作菜单，同菜单管理 toTreeData 口径） */
  const toTreeData = (items: T[]): DataNode[] =>
    items.map((n) => {
      const actions = nodeActions?.(n) ?? [];
      const raw = renderTitle(n);
      const wrapped = actions.length > 0 && onAction
        ? (
          <Dropdown
            trigger={['contextMenu']}
            menu={{
              items: actions.map((a) => ({ key: a.key, label: a.label, danger: a.danger })),
              onClick: ({ key, domEvent }) => {
                domEvent.stopPropagation();
                onAction(n, key);
              },
            }}
          >
            <span>{raw}</span>
          </Dropdown>
        )
        : raw;
      const children = (n as { children?: T[] }).children;
      return {
        key: getKey(n),
        title: wrapped,
        children: children?.length ? toTreeData(children) : undefined,
      };
    });

  /** 默认全展开（受控 keys 未传时兜底） */
  const defaultExpanded = useMemo(() => {
    const keys: string[] = [];
    const walk = (items: T[]) => {
      for (const n of items) {
        keys.push(getKey(n));
        const children = (n as { children?: T[] }).children;
        if (children?.length) walk(children);
      }
    };
    walk(nodes);
    return keys;
  }, [nodes, getKey]);

  if (loading) {
    return (
      <Card className={className} title={title} loading styles={{ body: { minHeight: bodyMinHeight } }} />
    );
  }

  return (
    <Card
      className={className}
      title={title}
      extra={extra}
      styles={{ body: { padding: 8, minHeight: bodyMinHeight, maxHeight: bodyMaxHeight, overflowY: 'auto' } }}
    >
      {nodes.length === 0 ? (
        <Empty description={emptyText} />
      ) : (
        <Tree
          blockNode
          draggable={draggable}
          treeData={toTreeData(nodes)}
          expandedKeys={expandedKeys ?? defaultExpanded}
          selectedKeys={selectedKey != null ? [selectedKey] : []}
          onExpand={(keys) => onExpandedKeysChange?.(keys.map(String))}
          onSelect={(keys) => onSelect((keys[0] as string) ?? null)}
          onDrop={onDrop
            ? (info) => onDrop(String(info.dragNode.key), String(info.node.key), !!info.dropToGap)
            : undefined}
        />
      )}
    </Card>
  );
};

export default KlsjnhTreeList011;
