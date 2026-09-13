/**
 * 组织选择弹窗 - PC 端（组织架构树单选）
 */
import React, { useState } from 'react';
import type { OrgTreeNode } from '../stores/roleStore';

interface OrgPickerModalProps {
  title?: string;
  tree: OrgTreeNode[];
  /** 当前已选组织 ID（用于回显高亮） */
  selectedId: string | null;
  onConfirm: (id: string, name: string) => void;
  onCancel: () => void;
}

const typeIcons: Record<string, string> = { group: '🏛', company: '🏢', department: '📋', team: '👥' };

const OrgTree: React.FC<{
  tree: OrgTreeNode[];
  selectedId: string | null;
  onSelect: (node: OrgTreeNode) => void;
  depth?: number;
}> = ({ tree, selectedId, onSelect, depth = 0 }) => {
  const [expanded, setExpanded] = useState<Set<string>>(new Set(tree.map(n => n.id)));
  return (
    <div style={{ paddingLeft: depth > 0 ? `${depth * 16}px` : 0 }}>
      {tree.map(node => {
        const hasChildren = node.children && node.children.length > 0;
        const isExpanded = expanded.has(node.id);
        return (
          <div key={node.id}>
            <div
              onClick={() => onSelect(node)}
              style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                padding: '6px 8px', cursor: 'pointer', borderRadius: '4px', fontSize: '13px',
                background: selectedId === node.id ? '#e6f7ff' : 'transparent',
              }}
            >
              {hasChildren ? (
                <button
                  onClick={(e) => { e.stopPropagation(); setExpanded(prev => { const n = new Set(prev); n.has(node.id) ? n.delete(node.id) : n.add(node.id); return n; }); }}
                  style={{ background: 'none', border: 'none', fontSize: '10px', cursor: 'pointer', padding: '0 2px', transform: isExpanded ? 'rotate(90deg)' : 'rotate(0)' }}
                >▶</button>
              ) : <span style={{ width: '14px' }} />}
              <span>{typeIcons[node.type] || '📁'}</span>
              <span style={{ fontWeight: depth === 0 ? 600 : 400 }}>{node.name}</span>
            </div>
            {hasChildren && isExpanded && (
              <OrgTree tree={node.children!} selectedId={selectedId} onSelect={onSelect} depth={depth + 1} />
            )}
          </div>
        );
      })}
    </div>
  );
};

export const OrgPickerModal: React.FC<OrgPickerModalProps> = ({
  title = '选择组织', tree, selectedId, onConfirm, onCancel,
}) => {
  const [picked, setPicked] = useState<OrgTreeNode | null>(null);

  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100 }}
      onClick={onCancel}
    >
      <div
        style={{ width: '360px', maxHeight: '70vh', background: '#fff', borderRadius: '12px', padding: '20px', display: 'flex', flexDirection: 'column' }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{ fontSize: '16px', fontWeight: 600, marginBottom: '12px' }}>{title}</div>
        <div style={{ flex: 1, overflowY: 'auto', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '8px', minHeight: '240px' }}>
          <OrgTree tree={tree} selectedId={picked ? picked.id : selectedId} onSelect={setPicked} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '16px' }}>
          <button className="btn btn-default" onClick={onCancel}>取消</button>
          <button
            className="btn btn-primary"
            disabled={!picked}
            style={{ opacity: picked ? 1 : 0.5, cursor: picked ? 'pointer' : 'not-allowed' }}
            onClick={() => { if (picked) onConfirm(picked.id, picked.name); }}
          >
            确定
          </button>
        </div>
      </div>
    </div>
  );
};
