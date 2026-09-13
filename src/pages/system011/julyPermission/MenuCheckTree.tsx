/** 菜单权限勾选树（julyPermission 模块组件） */
import React, { useState } from 'react';
import type { JulyMenuVo011 } from '@/types/system011';

export interface MenuTreeNode {
  id: number;
  title: string;
  path: string;
  icon: string;
  permissionCode: string;
  children?: MenuTreeNode[];
}

export function buildMenuTree(list: JulyMenuVo011[]): MenuTreeNode[] {
  return list.map((m) => ({
    id: Number(m.id),
    title: m.menuName,
    path: m.menuRoute,
    icon: m.menuIcon || '📄',
    permissionCode: m.permissionCode || m.menuRoute,
    children: m.children?.length ? buildMenuTree(m.children) : undefined,
  }));
}

function collectLeafCodes(nodes: MenuTreeNode[]): string[] {
  const codes: string[] = [];
  nodes.forEach((n) => {
    if (n.children?.length) codes.push(...collectLeafCodes(n.children));
    else codes.push(n.permissionCode);
  });
  return codes;
}

function collectAllCodes(nodes: MenuTreeNode[]): string[] {
  const codes: string[] = [];
  nodes.forEach((n) => { codes.push(n.permissionCode); if (n.children) codes.push(...collectAllCodes(n.children)); });
  return codes;
}

interface MenuCheckTreeProps {
  tree: MenuTreeNode[];
  checkedCodes: Set<string>;
  onCheck: (code: string, checked: boolean) => void;
  depth?: number;
}

export const MenuCheckTree: React.FC<MenuCheckTreeProps> = ({ tree, checkedCodes, onCheck, depth = 0 }) => {
  const [expanded, setExpanded] = useState<Set<number>>(new Set());
  return (
    <div style={{ paddingLeft: depth > 0 ? `${depth * 20}px` : 0 }}>
      {tree.map((node) => {
        const hasChildren = !!(node.children && node.children.length > 0);
        const isExpanded = expanded.has(node.id);
        const isChecked = checkedCodes.has(node.permissionCode);
        const leafCodes = hasChildren ? collectLeafCodes(node.children!) : [node.permissionCode];
        const checkedCount = leafCodes.filter((c) => checkedCodes.has(c)).length;
        const isIndeterminate = hasChildren && checkedCount > 0 && checkedCount < leafCodes.length;
        return (
          <div key={node.id}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '3px 0' }}>
              {hasChildren ? (
                <button onClick={(e) => { e.stopPropagation(); setExpanded((prev) => { const n = new Set(prev); n.has(node.id) ? n.delete(node.id) : n.add(node.id); return n; }); }}
                  style={{ background: 'none', border: 'none', fontSize: '10px', cursor: 'pointer', padding: '0 2px', transform: isExpanded ? 'rotate(90deg)' : 'rotate(0)' }}>▶</button>
              ) : <span style={{ width: '14px' }} />}
              <input type="checkbox" checked={isChecked} ref={(el) => { if (el) el.indeterminate = isIndeterminate; }}
                onChange={(e) => { const all = hasChildren ? collectAllCodes([node]) : [node.permissionCode]; all.forEach((c) => onCheck(c, e.target.checked)); }} />
              <span style={{ fontSize: '13px' }}>{node.icon} {node.title}</span>
              {hasChildren && <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{checkedCount}/{leafCodes.length}</span>}
            </div>
            {hasChildren && isExpanded && <MenuCheckTree tree={node.children!} checkedCodes={checkedCodes} onCheck={onCheck} depth={depth + 1} />}
          </div>
        );
      })}
    </div>
  );
};
