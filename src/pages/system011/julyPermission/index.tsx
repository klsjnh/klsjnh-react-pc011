/**
 * 权限管理页 - PC 端专版（左右分栏主子表）
 * 左侧：角色列表表格
 * 右侧：Tab（菜单权限树 + 关联用户）
 *
 * 数据源：统一 mock 后端（角色经 roleStore 投影自 JulyRoleVo011；
 * 菜单权限树经 selectMenuTree 投影自 JulyMenuVo011，勾选 key = 菜单 permissionCode）
 */
import React, { useState, useEffect, useMemo } from 'react';
import { roleStore, useRoleState, type RoleDetail } from '@/stores/system011/julyRoleStore';
import { selectMenuTree } from '@/services/system011';
import { UserTransferModal } from '@/components/UserTransferModal';
import { Modal } from '@/components/Modal';
import { buildMenuTree, MenuCheckTree, type MenuTreeNode } from './MenuCheckTree';
import { RoleFormModal } from './RoleFormModal';

// ==================== 主组件 ====================

export const julyPermission: React.FC = () => {
  const { roles, users, orgTree, loaded } = useRoleState();
  const [menuTree, setMenuTree] = useState<MenuTreeNode[]>([]);
  const [selectedRoleId, setSelectedRoleId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'users' | 'perms'>('perms');
  const [editModal, setEditModal] = useState<{ open: boolean; role: RoleDetail | null }>({ open: false, role: null });
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
              onClick={() => setEditModal({ open: true, role: null })}
            >
              + 新建
            </button>
            <button
              className="btn btn-default btn-sm"
              disabled={!selectedRole}
              style={{ opacity: selectedRole ? 1 : 0.4, cursor: selectedRole ? 'pointer' : 'not-allowed' }}
              onClick={() => { if (selectedRole) setEditModal({ open: true, role: selectedRole }); }}
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

      <RoleFormModal
        open={editModal.open}
        role={editModal.role}
        onClose={() => setEditModal({ open: false, role: null })}
      />

      {dialog.visible && (
        <Modal title="删除角色" onClose={() => setDialog({ visible: false, id: '' })} width={320}>
          <div style={{ textAlign: 'center' }}>
            <p>确定删除这个角色吗？</p>
            <div style={{ display: 'flex', gap: '10px', marginTop: '16px', justifyContent: 'center' }}>
              <button className="btn btn-default" onClick={() => setDialog({ visible: false, id: '' })}>取消</button>
              <button className="btn btn-danger" onClick={() => { roleStore.removeRole(dialog.id); setDialog({ visible: false, id: '' }); }}>删除</button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
