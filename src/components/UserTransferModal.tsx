/**
 * 用户穿梭框组件 — 组织树 + 用户列表 + 已选面板
 * 用于角色管理添加用户
 */
import React, { useState, useMemo } from 'react';

// ==================== 类型 ====================

/** id 统一为 string | number：本地 mock 可能给数字，后端真实数据为 UUID 字符串 */
export type NodeId = string | number;

export interface OrgTreeNode {
  id: NodeId;
  name: string;
  type: string;
  children?: OrgTreeNode[];
}

export interface TransferUser {
  id: NodeId;
  username: string;
  realName: string;
  department: string;
  departmentId: NodeId;
}

interface UserTransferModalProps {
  title: string;
  orgTree: OrgTreeNode[];
  allUsers: TransferUser[];
  excludedUserIds: NodeId[];
  onConfirm: (userIds: NodeId[]) => void;
  onCancel: () => void;
}

// ==================== 组织树 ====================

const OrgTree: React.FC<{
  tree: OrgTreeNode[];
  selectedId: NodeId | null;
  onSelect: (id: NodeId | null, name: string) => void;
  depth?: number;
}> = ({ tree, selectedId, onSelect, depth = 0 }) => {
  const [expanded, setExpanded] = useState<Set<NodeId>>(new Set(tree.map(n => n.id)));

  const typeIcons: Record<string, string> = { group: '🏛', company: '🏢', department: '📋', team: '👥' };

  return (
    <div style={{ paddingLeft: depth > 0 ? `${depth * 12}px` : 0 }}>
      {tree.map(node => {
        const hasChildren = node.children && node.children.length > 0;
        const isExpanded = expanded.has(node.id);
        return (
          <div key={node.id}>
            <div
              onClick={() => {
                if (hasChildren) setExpanded(prev => { const n = new Set(prev); n.has(node.id) ? n.delete(node.id) : n.add(node.id); return n; });
                onSelect(node.id, node.name);
              }}
              style={{
                display: 'flex', alignItems: 'center', gap: '4px',
                padding: '4px 6px', cursor: 'pointer', borderRadius: '4px',
                background: selectedId === node.id ? '#e6f7ff' : 'transparent',
                fontSize: '12px',
              }}
            >
              {hasChildren ? (
                <button onClick={(e) => { e.stopPropagation(); setExpanded(prev => { const n = new Set(prev); n.has(node.id) ? n.delete(node.id) : n.add(node.id); return n; }); }}
                  style={{ background: 'none', border: 'none', fontSize: '9px', cursor: 'pointer', padding: 0, transform: isExpanded ? 'rotate(90deg)' : 'rotate(0)' }}>▶</button>
              ) : <span style={{ width: '12px' }} />}
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

// ==================== 主组件 ====================

export const UserTransferModal: React.FC<UserTransferModalProps> = ({
  title, orgTree, allUsers, excludedUserIds, onConfirm, onCancel,
}) => {
  const [selectedOrgId, setSelectedOrgId] = useState<NodeId | null>(null);
  const [selectedOrgName, setSelectedOrgName] = useState('');
  const [keyword, setKeyword] = useState('');
  const [selectedUserIds, setSelectedUserIds] = useState<Set<NodeId>>(new Set());

  /** 可选用户（排除已关联的） */
  const availableUsers = useMemo(() =>
    allUsers.filter(u => !excludedUserIds.includes(u.id)),
    [allUsers, excludedUserIds]
  );

  /** 按组织和关键词过滤 */
  const filteredUsers = useMemo(() => {
    return availableUsers.filter(u => {
      if (selectedOrgId !== null && u.departmentId !== selectedOrgId) return false;
      if (keyword && !u.realName.includes(keyword) && !u.username.includes(keyword)) return false;
      return true;
    });
  }, [availableUsers, selectedOrgId, keyword]);

  /** 已选中的用户信息 */
  const selectedUsers = useMemo(() =>
    availableUsers.filter(u => selectedUserIds.has(u.id)),
    [availableUsers, selectedUserIds]
  );

  const toggleSelect = (id: NodeId) => {
    setSelectedUserIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const handleConfirm = () => {
    if (selectedUserIds.size > 0) {
      onConfirm(Array.from(selectedUserIds));
    }
  };

  const panelStyle: React.CSSProperties = {
    border: '1px solid var(--border)', borderRadius: 'var(--radius)',
    display: 'flex', flexDirection: 'column', overflow: 'hidden',
  };
  const panelHeaderStyle: React.CSSProperties = {
    padding: '8px 12px', background: '#fafafa',
    borderBottom: '1px solid var(--border-light)', fontSize: '12px', fontWeight: 600,
  };
  const panelBodyStyle: React.CSSProperties = {
    flex: 1, overflowY: 'auto', padding: '6px',
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}
      onClick={onCancel}>
      <div style={{ width: 'calc(100vw - 64px)', maxWidth: '780px', background: '#fff', borderRadius: '12px', padding: '20px', maxHeight: '80vh', display: 'flex', flexDirection: 'column' }}
        onClick={e => e.stopPropagation()}>

        {/* 标题 */}
        <div style={{ fontSize: '16px', fontWeight: 600, marginBottom: '16px' }}>{title}</div>

        {/* 三栏穿梭框 */}
        <div style={{ display: 'flex', gap: '10px', flex: 1, minHeight: '350px' }}>

          {/* 左栏：组织架构树 */}
          <div style={{ ...panelStyle, width: '180px', flexShrink: 0 }}>
            <div style={panelHeaderStyle}>组织架构</div>
            <div style={{ ...panelBodyStyle, overflowY: 'auto' }}>
              <div
                onClick={() => { setSelectedOrgId(null); setSelectedOrgName('全部'); }}
                style={{ padding: '4px 6px', cursor: 'pointer', borderRadius: '4px', fontSize: '12px', background: selectedOrgId === null ? '#e6f7ff' : 'transparent' }}
              >
                📂 全部部门
              </div>
              <OrgTree tree={orgTree} selectedId={selectedOrgId} onSelect={(id, name) => { setSelectedOrgId(id); setSelectedOrgName(name); }} />
            </div>
          </div>

          {/* 中栏：用户列表 */}
          <div style={{ ...panelStyle, flex: 1 }}>
            <div style={{ padding: '8px 12px', borderBottom: '1px solid var(--border-light)' }}>
              <input
                style={{ width: '100%', height: '30px', padding: '0 10px', border: '1px solid var(--border)', borderRadius: '6px', fontSize: '12px', outline: 'none' }}
                placeholder="搜索姓名/用户名..."
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
              />
            </div>
            <div style={panelBodyStyle}>
              {filteredUsers.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-muted)', fontSize: '12px' }}>
                  {selectedOrgId !== null ? `「${selectedOrgName}」下暂无可选用户` : '暂无可选用户'}
                </div>
              ) : (
                filteredUsers.map(u => (
                  <div
                    key={u.id}
                    onClick={() => toggleSelect(u.id)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '8px',
                      padding: '6px 8px', cursor: 'pointer', borderRadius: '6px',
                      background: selectedUserIds.has(u.id) ? '#e6f7ff' : 'transparent',
                      transition: 'background 0.15s',
                    }}
                  >
                    <input type="checkbox" checked={selectedUserIds.has(u.id)} readOnly />
                    <span style={{ fontSize: '13px', fontWeight: 500 }}>{u.realName}</span>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>@{u.username}</span>
                    <span style={{ marginLeft: 'auto', fontSize: '11px', color: 'var(--text-muted)' }}>{u.department}</span>
                  </div>
                ))
              )}
            </div>
            <div style={{ padding: '6px 12px', borderTop: '1px solid var(--border-light)', fontSize: '11px', color: 'var(--text-muted)' }}>
              {selectedOrgId !== null ? selectedOrgName : '全部'} · {filteredUsers.length} 人
            </div>
          </div>

          {/* 右栏：已选用户 */}
          <div style={{ ...panelStyle, width: '180px', flexShrink: 0 }}>
            <div style={panelHeaderStyle}>已选用户 ({selectedUsers.length})</div>
            <div style={panelBodyStyle}>
              {selectedUsers.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-muted)', fontSize: '12px' }}>点击左侧用户添加</div>
              ) : (
                selectedUsers.map(u => (
                  <div key={u.id} style={{
                    display: 'flex', alignItems: 'center', gap: '6px',
                    padding: '6px 8px', marginBottom: '4px',
                    background: '#f6ffed', border: '1px solid #b7eb8f', borderRadius: '6px',
                    fontSize: '12px',
                  }}>
                    <span style={{ flex: 1, fontWeight: 500 }}>{u.realName}</span>
                    <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{u.department}</span>
                    <button
                      onClick={() => toggleSelect(u.id)}
                      style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer', fontSize: '12px', padding: 0 }}
                    >✕</button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* 底部按钮 */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '16px' }}>
          <button onClick={onCancel} className="btn btn-default">取消</button>
          <button
            onClick={handleConfirm}
            disabled={selectedUserIds.size === 0}
            className="btn btn-primary"
            style={{ opacity: selectedUserIds.size === 0 ? 0.5 : 1, cursor: selectedUserIds.size === 0 ? 'not-allowed' : 'pointer' }}
          >
            ✅ 确认添加 ({selectedUserIds.size})
          </button>
        </div>
      </div>
    </div>
  );
};
