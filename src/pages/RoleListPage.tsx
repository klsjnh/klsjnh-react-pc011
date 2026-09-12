/**
 * 角色管理页 - 移动端（主子表：角色 → 关联用户 + 菜单权限）
 * 权限项目 = 可勾选的菜单树
 */
import React, { useState, useEffect, useMemo } from 'react';
import { PageHeader, ConfirmDialog } from '../components';
import { roleStore, useRoleState, type RoleDetail } from '../stores/roleStore';
import { mockApi } from '../mock';

// ==================== 菜单树节点 ====================

interface MenuTreeNode {
  id: number;
  title: string;
  path: string;
  icon: string;
  children?: MenuTreeNode[];
}

/** 系统菜单树（角色可勾选的权限范围） */
const systemMenuTree: MenuTreeNode[] = [
  { id: 1, title: '仪表盘', path: '/dashboard', icon: '📊' },
  {
    id: 2, title: '系统管理', path: '/system', icon: '⚙️',
    children: [
      { id: 21, title: '菜单管理', path: '/menus', icon: '📋' },
      { id: 22, title: '权限管理', path: '/permissions', icon: '🔑' },
      { id: 23, title: '角色管理', path: '/roles', icon: '🛡' },
      { id: 24, title: '组织管理', path: '/departments', icon: '🏢' },
      { id: 25, title: '用户管理', path: '/users', icon: '👥' },
    ],
  },
  {
    id: 3, title: '业务中心', path: '/business', icon: '💼',
    children: [
      { id: 31, title: '配置管理', path: '/business/config', icon: '⚙️' },
      { id: 32, title: '定时任务', path: '/business/scheduler', icon: '⏰' },
      { id: 33, title: '数据源', path: '/business/datasource', icon: '🗄' },
      { id: 34, title: '存储中心', path: '/business/storage', icon: '💾' },
      { id: 35, title: '字典管理', path: '/business/dict', icon: '📖' },
    ],
  },
  {
    id: 4, title: '系统工具', path: '/tools', icon: '🛠',
    children: [
      { id: 41, title: '消息通知', path: '/notifications', icon: '🔔' },
      { id: 42, title: '审计日志', path: '/audit', icon: '📝' },
      { id: 43, title: '系统监控', path: '/business/monitor', icon: '📡' },
      { id: 44, title: '在线用户', path: '/business/online', icon: '👤' },
      { id: 45, title: '缓存管理', path: '/business/cache', icon: '🧹' },
    ],
  },
];

/** 收集所有叶子节点 path */
function collectLeafPaths(nodes: MenuTreeNode[]): string[] {
  const paths: string[] = [];
  nodes.forEach(n => {
    if (n.children?.length) paths.push(...collectLeafPaths(n.children));
    else paths.push(n.path);
  });
  return paths;
}

/** 收集所有节点 path（含父级） */
function collectAllPaths(nodes: MenuTreeNode[]): string[] {
  const paths: string[] = [];
  nodes.forEach(n => {
    paths.push(n.path);
    if (n.children) paths.push(...collectAllPaths(n.children));
  });
  return paths;
}

// ==================== 菜单勾选树组件 ====================

const MenuCheckTree: React.FC<{
  tree: MenuTreeNode[];
  checkedPaths: Set<string>;
  onCheck: (path: string, checked: boolean) => void;
  depth?: number;
}> = ({ tree, checkedPaths, onCheck, depth = 0 }) => {
  const [expanded, setExpanded] = useState<Set<number>>(new Set(tree.map(n => n.id)));

  return (
    <div style={{ paddingLeft: depth > 0 ? `${depth * 16}px` : 0 }}>
      {tree.map(node => {
        const hasChildren = node.children && node.children.length > 0;
        const isExpanded = expanded.has(node.id);
        const isChecked = checkedPaths.has(node.path);
        const leafPaths = hasChildren ? collectLeafPaths(node.children!) : [node.path];
        const checkedCount = leafPaths.filter(p => checkedPaths.has(p)).length;
        const isIndeterminate = hasChildren && checkedCount > 0 && checkedCount < leafPaths.length;

        return (
          <div key={node.id}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '4px 0' }}>
              {hasChildren ? (
                <button
                  onClick={(e) => { e.stopPropagation(); setExpanded(prev => { const n = new Set(prev); n.has(node.id) ? n.delete(node.id) : n.add(node.id); return n; }); }}
                  style={{ background: 'none', border: 'none', fontSize: '10px', cursor: 'pointer', padding: '0 2px', transform: isExpanded ? 'rotate(90deg)' : 'rotate(0)' }}
                >▶</button>
              ) : <span style={{ width: '14px' }} />}
              <input
                type="checkbox"
                checked={isChecked}
                ref={el => { if (el) el.indeterminate = isIndeterminate; }}
                onChange={(e) => {
                  // 勾选父级 = 勾选所有子级
                  const allPaths = hasChildren ? collectAllPaths([node]) : [node.path];
                  allPaths.forEach(p => onCheck(p, e.target.checked));
                }}
              />
              <span style={{ fontSize: '13px' }}>{node.icon} {node.title}</span>
              {hasChildren && (
                <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                  {checkedCount}/{leafPaths.length}
                </span>
              )}
            </div>
            {hasChildren && isExpanded && (
              <MenuCheckTree tree={node.children!} checkedPaths={checkedPaths} onCheck={onCheck} depth={depth + 1} />
            )}
          </div>
        );
      })}
    </div>
  );
};

// ==================== 角色管理页 ====================

interface RoleListPageProps {
  onNavigate?: (path: string) => void;
}

export const RoleListPage: React.FC<RoleListPageProps> = ({ onNavigate }) => {
  const { roles, users, loaded } = useRoleState();
  const [selectedRoleId, setSelectedRoleId] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<'users' | 'menus'>('users');
  const [dialog, setDialog] = useState({ visible: false, id: 0 });
  const [editModal, setEditModal] = useState<{ visible: boolean; role: RoleDetail | null }>({ visible: false, role: null });
  const [form, setForm] = useState({ name: '', label: '', description: '' });
  const [addUserModal, setAddUserModal] = useState(false);
  const [menuDraft, setMenuDraft] = useState<Set<string>>(new Set());

  useEffect(() => { roleStore.load(); }, []);

  const selectedRole = roles.find(r => r.id === selectedRoleId) || null;
  const roleUsers = useMemo(() => {
    if (!selectedRole) return [];
    return selectedRole.userIds.map(id => users.find(u => u.id === id)!).filter(Boolean);
  }, [selectedRole, users]);

  const unassignedUsers = useMemo(() => {
    if (!selectedRole) return [];
    return users.filter(u => !selectedRole.userIds.includes(u.id));
  }, [selectedRole, users]);

  const selectRole = (role: RoleDetail) => {
    setSelectedRoleId(role.id);
    setActiveTab('users');
    setMenuDraft(new Set(role.permissions));
  };

  const toggleMenuPath = (path: string, checked: boolean) => {
    setMenuDraft(prev => {
      const next = new Set(prev);
      if (checked) next.add(path); else next.delete(path);
      return next;
    });
  };

  const saveMenus = () => {
    if (!selectedRole) return;
    roleStore.assignPermissions(selectedRole.id, Array.from(menuDraft));
  };

  const handleSaveEdit = () => {
    if (!form.label.trim()) return;
    if (editModal.role) {
      roleStore.updateRole(editModal.role.id, form);
    } else {
      roleStore.addRole({ ...form, status: 'active', permissions: ['/dashboard'], userIds: [] });
    }
    setEditModal({ visible: false, role: null });
  };

  const handleDelete = (role: RoleDetail) => {
    if (role.userIds.length > 0) {
      alert('该角色下存在用户，无法删除');
      return;
    }
    setDialog({ visible: true, id: role.id });
  };

  return (
    <div className="page">
      <PageHeader
        title="角色管理"
        subtitle={`共 ${roles.length} 个角色 · 点击展开配置`}
        onBack={() => onNavigate?.('/system')}
        right={
          <button
            onClick={() => { setForm({ name: '', label: '', description: '' }); setEditModal({ visible: true, role: null }); }}
            style={{ height: '32px', padding: '0 14px', background: 'var(--primary)', color: '#fff', border: 'none', borderRadius: 'var(--radius)', fontSize: '13px', cursor: 'pointer' }}
          >
            + 新建
          </button>
        }
      />

      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '12px' }}>
        {roles.map(role => {
          const isExpanded = selectedRoleId === role.id;
          return (
            <div key={role.id} style={{
              background: 'var(--bg-card)', borderRadius: 'var(--radius)',
              boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
              borderLeft: isExpanded ? '3px solid var(--primary)' : '3px solid transparent',
            }}>
              <div onClick={() => toggleExpand(role.id)}
                style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '14px', cursor: 'pointer' }}>
                <span style={{ fontSize: '20px' }}>🛡</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '15px', fontWeight: 600 }}>{role.label}</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{role.name} · {role.userIds.length} 用户 · {role.permissions.length} 菜单</div>
                </div>
                <span className={`status-badge status-${role.status}`}>{role.status === 'active' ? '启用' : '停用'}</span>
                <span style={{ fontSize: '10px', transform: isExpanded ? 'rotate(90deg)' : 'rotate(0)', transition: 'transform 0.2s' }}>▶</span>
              </div>

              {isExpanded && (
                <div style={{ borderTop: '1px solid var(--border-light)' }}>
                  <div style={{ display: 'flex', borderBottom: '1px solid var(--border-light)' }}>
                    {([['users', `关联用户 (${role.userIds.length})`], ['menus', `菜单权限 (${role.permissions.length})`]] as [typeof activeTab, string][]).map(([key, label]) => (
                      <button key={key} onClick={() => setActiveTab(key)}
                        style={{
                          flex: 1, padding: '10px',
                          background: activeTab === key ? '#e6f7ff' : 'transparent',
                          border: 'none', borderBottom: activeTab === key ? '2px solid var(--primary)' : '2px solid transparent',
                          fontSize: '13px', fontWeight: activeTab === key ? 600 : 400,
                          color: activeTab === key ? 'var(--primary)' : 'var(--text-secondary)', cursor: 'pointer',
                        }}>
                        {label}
                      </button>
                    ))}
                  </div>

                  {activeTab === 'users' && (
                    <div style={{ padding: '12px' }}>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '10px' }}>
                        {roleUsers.map(u => (
                          <span key={u.id} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '4px 10px', background: '#f0f5ff', borderRadius: '16px', fontSize: '12px' }}>
                            {u.realName}
                            <button onClick={(e) => { e.stopPropagation(); roleStore.removeUserFromRole(role.id, u.id); }}
                              style={{ background: 'none', border: 'none', color: '#999', cursor: 'pointer', fontSize: '12px', padding: 0 }}>✕</button>
                          </span>
                        ))}
                        {roleUsers.length === 0 && <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>暂无关联用户</span>}
                      </div>
                      <button onClick={() => setAddUserModal(true)}
                        style={{ width: '100%', height: '32px', background: '#f6ffed', color: '#52c41a', border: '1px dashed #b7eb8f', borderRadius: 'var(--radius)', fontSize: '12px', cursor: 'pointer' }}>
                        + 添加用户
                      </button>
                    </div>
                  )}

                  {activeTab === 'menus' && (
                    <div style={{ padding: '12px' }}>
                      <MenuCheckTree tree={systemMenuTree} checkedPaths={menuDraft} onCheck={toggleMenuPath} />
                      <button onClick={saveMenus}
                        style={{ width: '100%', height: '34px', marginTop: '12px', background: 'var(--primary)', color: '#fff', border: 'none', borderRadius: 'var(--radius)', fontSize: '13px', cursor: 'pointer' }}>
                        保存菜单权限
                      </button>
                    </div>
                  )}

                  <div style={{ display: 'flex', gap: '6px', padding: '10px 12px', borderTop: '1px solid var(--border-light)' }}>
                    <button onClick={(e) => { e.stopPropagation(); setForm({ name: role.name, label: role.label, description: role.description }); setEditModal({ visible: true, role }); }}
                      style={{ flex: 1, height: '30px', fontSize: '12px', background: '#f0f5ff', color: '#597ef7', border: '1px solid #d6e4ff', borderRadius: 'var(--radius)', cursor: 'pointer' }}>编辑</button>
                    <button onClick={(e) => { e.stopPropagation(); handleDelete(role); }}
                      style={{ flex: 1, height: '30px', fontSize: '12px', background: '#fff', color: 'var(--danger)', border: '1px solid var(--danger)', borderRadius: 'var(--radius)', cursor: 'pointer' }}>删除</button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* 弹窗们 */}
      {addUserModal && selectedRole && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}
          onClick={() => setAddUserModal(false)}>
          <div style={{ width: 'calc(100vw - 48px)', maxWidth: '320px', background: '#fff', borderRadius: '12px', padding: '20px', maxHeight: '70vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
            <div style={{ fontSize: '16px', fontWeight: 600, marginBottom: '12px' }}>添加用户到「{selectedRole.label}」</div>
            {unassignedUsers.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-muted)', fontSize: '13px' }}>所有用户已关联</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {unassignedUsers.map(u => (
                  <button key={u.id} onClick={() => { roleStore.addUserToRole(selectedRole.id, u.id); setAddUserModal(false); }}
                    style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px', background: '#f5f7fa', border: 'none', borderRadius: 'var(--radius)', cursor: 'pointer', textAlign: 'left' }}>
                    <span style={{ fontSize: '14px', fontWeight: 500 }}>{u.realName}</span>
                    <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>@{u.username}</span>
                    <span style={{ marginLeft: 'auto', fontSize: '11px', color: 'var(--text-muted)' }}>{u.department}</span>
                  </button>
                ))}
              </div>
            )}
            <button onClick={() => setAddUserModal(false)} style={{ width: '100%', height: '36px', marginTop: '12px', background: '#f5f7fa', border: '1px solid var(--border)', borderRadius: 'var(--radius)', fontSize: '13px', cursor: 'pointer' }}>关闭</button>
          </div>
        </div>
      )}

      {editModal.visible && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}
          onClick={() => setEditModal({ visible: false, role: null })}>
          <div style={{ width: 'calc(100vw - 48px)', maxWidth: '340px', background: '#fff', borderRadius: '12px', padding: '20px' }} onClick={e => e.stopPropagation()}>
            <div style={{ fontSize: '16px', fontWeight: 600, marginBottom: '14px' }}>{editModal.role ? '编辑角色' : '新建角色'}</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <div style={{ fontSize: '13px', fontWeight: 500, marginBottom: '4px' }}>角色标识</div>
                <input style={{ width: '100%', height: '38px', padding: '0 12px', border: '1px solid var(--border)', borderRadius: 'var(--radius)', fontSize: '14px', outline: 'none' }}
                  value={form.name} disabled={!!editModal.role} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
              </div>
              <div>
                <div style={{ fontSize: '13px', fontWeight: 500, marginBottom: '4px' }}>角色名称 <span style={{ color: 'var(--danger)' }}>*</span></div>
                <input style={{ width: '100%', height: '38px', padding: '0 12px', border: '1px solid var(--border)', borderRadius: 'var(--radius)', fontSize: '14px', outline: 'none' }}
                  value={form.label} onChange={e => setForm(f => ({ ...f, label: e.target.value }))} />
              </div>
              <div>
                <div style={{ fontSize: '13px', fontWeight: 500, marginBottom: '4px' }}>描述</div>
                <textarea style={{ width: '100%', height: '60px', padding: '8px 12px', border: '1px solid var(--border)', borderRadius: 'var(--radius)', fontSize: '14px', outline: 'none', resize: 'none' }}
                  value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
              </div>
            </div>
            <div style={{ display: 'flex', gap: '10px', marginTop: '16px' }}>
              <button onClick={() => setEditModal({ visible: false, role: null })} style={{ flex: 1, height: '38px', background: '#fff', color: 'var(--text-secondary)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', fontSize: '14px', cursor: 'pointer' }}>取消</button>
              <button onClick={handleSaveEdit} style={{ flex: 1, height: '38px', background: 'var(--primary)', color: '#fff', border: 'none', borderRadius: 'var(--radius)', fontSize: '14px', cursor: 'pointer' }}>保存</button>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        visible={dialog.visible} title="删除角色" content="确定删除这个角色吗？"
        onConfirm={() => { roleStore.removeRole(dialog.id); setDialog({ visible: false, id: 0 }); }}
        onCancel={() => setDialog({ visible: false, id: 0 })} danger
      />
    </div>
  );
};
