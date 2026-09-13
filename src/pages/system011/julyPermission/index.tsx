/**
 * 权限管理页 - PC 端专版（左右分栏主子表）
 * 左侧：角色列表表格
 * 右侧：Tab（菜单权限树 + 关联用户）
 *
 * 数据源：统一 mock 后端（角色经 roleStore 投影自 JulyRoleVo011；
 * 菜单权限树经 selectMenuTree 投影自 JulyMenuVo011，勾选 key = 菜单 permissionCode）
 */
import React, { useState, useEffect, useMemo } from 'react';
import { roleStore, useRoleState, type RoleDetail } from '../../../stores/system011/julyRoleStore';
import { selectMenuTree } from '../../../services/system011';
import { UserTransferModal } from '../../../components/UserTransferModal';
import type { JulyMenuVo011 } from '../../../types/system011';

// ==================== 菜单树（来自后端 JulyMenuVo011） ====================

interface MenuTreeNode {
  id: number; title: string; path: string; icon: string;
  permissionCode: string; children?: MenuTreeNode[];
}

function buildMenuTree(list: JulyMenuVo011[]): MenuTreeNode[] {
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

const MenuCheckTree: React.FC<{
  tree: MenuTreeNode[]; checkedCodes: Set<string>;
  onCheck: (code: string, checked: boolean) => void; depth?: number;
}> = ({ tree, checkedCodes, onCheck, depth = 0 }) => {
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

// ==================== 主组件 ====================

export const julyPermission: React.FC = () => {
  const { roles, users, orgTree, loaded } = useRoleState();
  const [menuTree, setMenuTree] = useState<MenuTreeNode[]>([]);
  const [selectedRoleId, setSelectedRoleId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'users' | 'perms'>('perms');
  const [editModal, setEditModal] = useState<{ visible: boolean; role: RoleDetail | null }>({ visible: false, role: null });
  const [form, setForm] = useState({ name: '', label: '', description: '' });
  const [dialog, setDialog] = useState<{ visible: boolean; id: string }>({ visible: false, id: '' });
  const [addUserModal, setAddUserModal] = useState(false);
  const [permissionDraft, setPermissionDraft] = useState<Set<string>>(new Set());

  useEffect(() => { roleStore.load(); }, []);
  useEffect(() => {
    selectMenuTree().then((tree) => setMenuTree(buildMenuTree(tree))).catch(() => setMenuTree([]));
  }, []);

  const selectedRole = roles.find((r) => r.id === selectedRoleId) || null;
  const roleUsers = useMemo(() => {
    if (!selectedRole) return [];
    return selectedRole.userIds.map((id) => users.find((u) => u.id === id)!).filter(Boolean);
  }, [selectedRole, users]);
  const unassignedUsers = useMemo(() => {
    if (!selectedRole) return [];
    return users.filter((u) => !selectedRole.userIds.includes(u.id));
  }, [selectedRole, users]);

  const selectRole = (role: RoleDetail) => {
    setSelectedRoleId(role.id);
    setPermissionDraft(new Set(role.permissions));
  };

  const togglePermission = (code: string) => {
    setPermissionDraft((prev) => { const n = new Set(prev); n.has(code) ? n.delete(code) : n.add(code); return n; });
  };

  const savePermissions = () => {
    if (!selectedRole) return;
    roleStore.assignPermissions(selectedRole.id, Array.from(permissionDraft));
  };

  const handleSaveEdit = () => {
    if (!form.label.trim()) return;
    if (editModal.role) roleStore.updateRole(editModal.role.id, { label: form.label, description: form.description });
    else roleStore.addRole({ name: form.name, label: form.label, description: form.description, status: 'active', isBuiltin: false, permissions: [] });
    setEditModal({ visible: false, role: null });
  };

  const handleDelete = (role: RoleDetail) => {
    if (role.userIds.length > 0) { alert('该角色下存在用户，无法删除'); return; }
    setDialog({ visible: true, id: role.id });
  };

  return (
    <div>
      <div className="page-header"><h2>权限管理</h2><p>共 {roles.length} 个角色 · 左侧选择角色配置菜单权限</p></div>

      <div style={{ display: 'flex', gap: '16px', minHeight: '500px' }}>
        {/* ===== 左侧：操作栏 + 角色列表 ===== */}
        <div style={{ width: '300px', flexShrink: 0 }}>
          <div style={{ display: 'flex', gap: '6px', marginBottom: '10px' }}>
            <button
              className="btn btn-primary btn-sm"
              onClick={() => { setForm({ name: '', label: '', description: '' }); setEditModal({ visible: true, role: null }); }}
            >
              + 新建
            </button>
            <button
              className="btn btn-default btn-sm"
              disabled={!selectedRole}
              style={{ opacity: selectedRole ? 1 : 0.4, cursor: selectedRole ? 'pointer' : 'not-allowed' }}
              onClick={() => {
                if (!selectedRole) return;
                setForm({ name: selectedRole.name, label: selectedRole.label, description: selectedRole.description });
                setEditModal({ visible: true, role: selectedRole });
              }}
            >
              ✏️ 编辑
            </button>
            <button
              className="btn btn-default btn-sm"
              disabled={!selectedRole}
              style={{ opacity: selectedRole ? 1 : 0.4, cursor: selectedRole ? 'pointer' : 'not-allowed', color: selectedRole ? 'var(--danger)' : 'var(--text-muted)', borderColor: selectedRole ? 'var(--danger)' : 'var(--border)' }}
              onClick={() => { if (selectedRole) handleDelete(selectedRole); }}
            >
              🗑 删除
            </button>
          </div>
          <div className="table-wrapper" style={{ maxHeight: '600px', overflowY: 'auto' }}>
            {!loaded ? (
              <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)' }}>加载中...</div>
            ) : (
              roles.map((role) => (
                <div key={role.id}
                  onClick={() => selectRole(role)}
                  style={{
                    padding: '12px 14px', cursor: 'pointer',
                    borderBottom: '1px solid var(--border-light)',
                    background: selectedRoleId === role.id ? '#e6f7ff' : 'transparent',
                    borderLeft: selectedRoleId === role.id ? '3px solid var(--primary)' : '3px solid transparent',
                  }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '16px' }}>🔑</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '13px', fontWeight: selectedRoleId === role.id ? 600 : 400 }}>{role.label}</div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                        {role.name} · {role.userIds.length}用户 · {role.permissions.length}菜单
                      </div>
                    </div>
                    <span className={`status-badge status-${role.status}`}>
                      {role.status === 'active' ? '启用' : '停用'}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* ===== 右侧：详情面板 ===== */}
        <div style={{ flex: 1 }}>
          {!selectedRole ? (
            <div className="table-wrapper" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '400px' }}>
              <div style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
                <div style={{ fontSize: '48px', marginBottom: '12px' }}>👈</div>
                <p>请从左侧选择一个角色配置权限</p>
                <p style={{ fontSize: '12px', marginTop: '8px' }}>可查看菜单权限和关联用户</p>
              </div>
            </div>
          ) : (
            <div className="table-wrapper">
              <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-light)', display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ fontSize: '28px' }}>🔑</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '18px', fontWeight: 700 }}>{selectedRole.label}</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{selectedRole.description}</div>
                </div>
              </div>

              <div style={{ display: 'flex', borderBottom: '1px solid var(--border-light)' }}>
                {([['perms', `菜单权限 (${selectedRole.permissions.length})`], ['users', `关联用户 (${selectedRole.userIds.length})`]] as [typeof activeTab, string][]).map(([key, label]) => (
                  <button key={key} onClick={() => setActiveTab(key)}
                    style={{
                      padding: '12px 24px', background: 'transparent', border: 'none',
                      borderBottom: activeTab === key ? '2px solid var(--primary)' : '2px solid transparent',
                      fontSize: '14px', fontWeight: activeTab === key ? 600 : 400,
                      color: activeTab === key ? 'var(--primary)' : 'var(--text-secondary)', cursor: 'pointer',
                    }}>
                    {label}
                  </button>
                ))}
              </div>

              {activeTab === 'perms' && (
                <div style={{ padding: '16px' }}>
                  <div style={{ marginBottom: '12px', textAlign: 'right' }}>
                    <button onClick={savePermissions} className="btn btn-primary btn-sm">保存</button>
                  </div>
                  {menuTree.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)' }}>加载菜单树中...</div>
                  ) : (
                    <MenuCheckTree tree={menuTree} checkedCodes={permissionDraft} onCheck={togglePermission} />
                  )}
                </div>
              )}

              {activeTab === 'users' && (
                <div style={{ padding: '16px' }}>
                  <div style={{ marginBottom: '12px', textAlign: 'right' }}>
                    <button className="btn btn-primary btn-sm" onClick={() => setAddUserModal(true)}>+ 添加用户</button>
                  </div>
                  {roleUsers.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>暂无关联用户</div>
                  ) : (
                    <table className="data-table">
                      <thead><tr><th>用户名</th><th>姓名</th><th>部门</th><th style={{ width: '80px' }}>操作</th></tr></thead>
                      <tbody>
                        {roleUsers.map((u) => (
                          <tr key={u.id}>
                            <td>{u.username}</td>
                            <td style={{ fontWeight: 500 }}>{u.realName}</td>
                            <td>{u.department}</td>
                            <td><button className="btn-link danger" onClick={() => roleStore.removeUserFromRole(selectedRole.id, u.id)}>移除</button></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {addUserModal && selectedRole && (
        <UserTransferModal
          title={`添加用户到「${selectedRole.label}」`}
          orgTree={orgTree}
          allUsers={users.map((u) => ({
            id: u.id, username: u.username, realName: u.realName,
            department: u.department, departmentId: u.departmentId,
          }))}
          excludedUserIds={selectedRole.userIds}
          onConfirm={(userIds) => {
            userIds.forEach((id) => roleStore.addUserToRole(selectedRole.id, String(id)));
            setAddUserModal(false);
          }}
          onCancel={() => setAddUserModal(false)}
        />
      )}

      {editModal.visible && (
        <div className="modal-overlay" onClick={() => setEditModal({ visible: false, role: null })}>
          <div className="modal-container" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editModal.role ? '编辑角色' : '新建角色'}</h3>
              <button className="modal-close" onClick={() => setEditModal({ visible: false, role: null })}>×</button>
            </div>
            <div className="modal-body">
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div><div style={{ fontSize: '13px', marginBottom: '4px' }}>角色标识</div>
                  <input className="form-input" style={{ width: '100%' }} value={form.name} disabled={!!editModal.role}
                    onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} /></div>
                <div><div style={{ fontSize: '13px', marginBottom: '4px' }}>角色名称 *</div>
                  <input className="form-input" style={{ width: '100%' }} value={form.label}
                    onChange={(e) => setForm((f) => ({ ...f, label: e.target.value }))} /></div>
                <div><div style={{ fontSize: '13px', marginBottom: '4px' }}>描述</div>
                  <textarea className="form-input" style={{ width: '100%', height: '60px', resize: 'none' }} value={form.description}
                    onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} /></div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-default" onClick={() => setEditModal({ visible: false, role: null })}>取消</button>
              <button className="btn btn-primary" onClick={handleSaveEdit}>保存</button>
            </div>
          </div>
        </div>
      )}

      {dialog.visible && (
        <div className="modal-overlay" onClick={() => setDialog({ visible: false, id: '' })}>
          <div className="modal-container" style={{ width: '320px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-body" style={{ textAlign: 'center' }}>
              <p>确定删除这个角色吗？</p>
              <div style={{ display: 'flex', gap: '10px', marginTop: '16px', justifyContent: 'center' }}>
                <button className="btn btn-default" onClick={() => setDialog({ visible: false, id: '' })}>取消</button>
                <button className="btn btn-danger" onClick={() => { roleStore.removeRole(dialog.id); setDialog({ visible: false, id: '' }); }}>删除</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
