/**
 * 管理页面集合 - PC 端（所有按钮可点击）
 * 角色管理 / 菜单管理 / 权限管理 / 审计日志 / 系统设置（组织管理已迁移至 system011/julyOrg）
 */
import React, { useState } from 'react';

// ==================== 通用弹窗 ====================

const Modal: React.FC<{ title: string; onClose: () => void; onSave?: () => void; children: React.ReactNode }> = ({
  title, onClose, onSave, children,
}) => (
  <div className="modal-overlay" onClick={onClose}>
    <div className="modal-container" onClick={(e) => e.stopPropagation()}>
      <div className="modal-header">
        <h3>{title}</h3>
        <button className="modal-close" onClick={onClose}>×</button>
      </div>
      <div className="modal-body">{children}</div>
      {onSave && (
        <div className="modal-footer">
          <button className="btn btn-default" onClick={onClose}>取消</button>
          <button className="btn btn-primary" onClick={onSave}>保存</button>
        </div>
      )}
    </div>
  </div>
);

const inputStyle: React.CSSProperties = {
  width: '100%', height: '38px', padding: '0 12px',
  border: '1px solid var(--border)', borderRadius: 'var(--radius)',
  fontSize: '14px', outline: 'none',
};

// ==================== 角色管理 ====================

export const RoleListPage: React.FC = () => {
  const [roles, setRoles] = useState([
    { id: 1, name: 'admin', label: '超级管理员', desc: '拥有系统全部权限', userCount: 3, permCount: 19, status: 'active' },
    { id: 2, name: 'manager', label: '部门经理', desc: '管理部门内用户', userCount: 12, permCount: 8, status: 'active' },
    { id: 3, name: 'editor', label: '编辑人员', desc: '负责内容编辑', userCount: 28, permCount: 2, status: 'active' },
    { id: 4, name: 'viewer', label: '只读用户', desc: '仅可查看数据', userCount: 45, permCount: 1, status: 'active' },
  ]);
  const [modal, setModal] = useState<{ visible: boolean; role: typeof roles[0] | null }>({ visible: false, role: null });
  const [form, setForm] = useState({ name: '', label: '', desc: '' });
  const [dialog, setDialog] = useState({ visible: false, id: 0 });

  const handleSave = () => {
    if (!form.label.trim()) return;
    if (modal.role) {
      setRoles(prev => prev.map(r => r.id === modal.role!.id ? { ...r, ...form } : r));
    } else {
      setRoles(prev => [...prev, { id: Date.now(), name: form.name || form.label.toLowerCase(), label: form.label, desc: form.desc, userCount: 0, permCount: 0, status: 'active' }]);
    }
    setModal({ visible: false, role: null });
  };

  const handleDelete = (id: number) => {
    setRoles(prev => prev.filter(r => r.id !== id));
    setDialog({ visible: false, id: 0 });
  };

  return (
    <div>
      <div className="page-header"><h2>角色管理</h2><p>共 {roles.length} 个角色</p></div>
      <div className="page-toolbar">
        <div className="toolbar-left"><input className="form-input" placeholder="搜索角色" style={{ width: '220px' }} /></div>
        <div className="toolbar-right">
          <button className="btn btn-primary" onClick={() => { setForm({ name: '', label: '', desc: '' }); setModal({ visible: true, role: null }); }}>+ 新建角色</button>
        </div>
      </div>
      <div className="table-wrapper">
        <table className="data-table">
          <thead><tr><th>角色标识</th><th>角色名称</th><th>描述</th><th>关联用户</th><th>权限数</th><th>状态</th><th>操作</th></tr></thead>
          <tbody>
            {roles.map(role => (
              <tr key={role.id}>
                <td><code>{role.name}</code></td>
                <td style={{ fontWeight: 500 }}>{role.label}</td>
                <td style={{ color: 'var(--text-muted)' }}>{role.desc}</td>
                <td>{role.userCount} 人</td>
                <td>{role.permCount} 项</td>
                <td><span className="status-badge status-active">启用</span></td>
                <td>
                  <div style={{ display: 'flex', gap: '4px' }}>
                    <button className="btn-link" onClick={() => { setForm({ name: role.name, label: role.label, desc: role.desc }); setModal({ visible: true, role }); }}>编辑</button>
                    <button className="btn-link" onClick={() => alert('权限分配功能开发中')}>权限</button>
                    <button className="btn-link danger" onClick={() => setDialog({ visible: true, id: role.id })}>删除</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {modal.visible && (
        <Modal title={modal.role ? '编辑角色' : '新建角色'} onClose={() => setModal({ visible: false, role: null })} onSave={handleSave}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div><div style={{ fontSize: '13px', marginBottom: '4px' }}>角色标识</div>
              <input style={inputStyle} value={form.name} disabled={!!modal.role} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} /></div>
            <div><div style={{ fontSize: '13px', marginBottom: '4px' }}>角色名称 *</div>
              <input style={inputStyle} value={form.label} onChange={e => setForm(f => ({ ...f, label: e.target.value }))} /></div>
            <div><div style={{ fontSize: '13px', marginBottom: '4px' }}>描述</div>
              <textarea style={{ ...inputStyle, height: '60px', resize: 'none' }} value={form.desc} onChange={e => setForm(f => ({ ...f, desc: e.target.value }))} /></div>
          </div>
        </Modal>
      )}
      {dialog.visible && (
        <div className="modal-overlay" onClick={() => setDialog({ visible: false, id: 0 })}>
          <div className="modal-container" style={{ width: '320px' }} onClick={e => e.stopPropagation()}>
            <div className="modal-body" style={{ textAlign: 'center' }}>
              <p>确定删除这个角色吗？</p>
              <div style={{ display: 'flex', gap: '10px', marginTop: '16px', justifyContent: 'center' }}>
                <button className="btn btn-default" onClick={() => setDialog({ visible: false, id: 0 })}>取消</button>
                <button className="btn btn-danger" onClick={() => handleDelete(dialog.id)}>删除</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ==================== 菜单管理 ====================

export const MenuListPage: React.FC = () => {
  const [menus, setMenus] = useState([
    { id: 1, title: '仪表盘', path: '/dashboard', icon: '📊', type: '菜单', sort: 1 },
    { id: 2, title: '系统管理', path: '/system', icon: '⚙️', type: '目录', sort: 2 },
    { id: 3, title: '系统监控', path: '/monitor', icon: '📡', type: '目录', sort: 3 },
  ]);
  const [modal, setModal] = useState<{ visible: boolean; menu: typeof menus[0] | null }>({ visible: false, menu: null });
  const [form, setForm] = useState({ title: '', path: '', icon: '📄', type: '菜单' });
  const [dialog, setDialog] = useState({ visible: false, id: 0 });

  const handleSave = () => {
    if (!form.title.trim()) return;
    if (modal.menu) {
      setMenus(prev => prev.map(m => m.id === modal.menu!.id ? { ...m, ...form } : m));
    } else {
      setMenus(prev => [...prev, { id: Date.now(), ...form, sort: prev.length + 1 }]);
    }
    setModal({ visible: false, menu: null });
  };

  return (
    <div>
      <div className="page-header"><h2>菜单管理</h2><p>管理系统导航菜单</p></div>
      <div className="page-toolbar">
        <div className="toolbar-right">
          <button className="btn btn-primary" onClick={() => { setForm({ title: '', path: '', icon: '📄', type: '菜单' }); setModal({ visible: true, menu: null }); }}>+ 新建菜单</button>
        </div>
      </div>
      <div className="table-wrapper">
        <table className="data-table">
          <thead><tr><th>菜单标题</th><th>路由路径</th><th>图标</th><th>类型</th><th>排序</th><th>操作</th></tr></thead>
          <tbody>
            {menus.map(menu => (
              <tr key={menu.id}>
                <td><span style={{ marginRight: '6px' }}>{menu.icon}</span>{menu.title}</td>
                <td><code style={{ fontSize: '12px' }}>{menu.path}</code></td>
                <td>{menu.icon}</td>
                <td><span className="status-badge" style={{ background: menu.type === '目录' ? '#e6f7ff' : '#f6ffed', color: menu.type === '目录' ? '#1890ff' : '#52c41a' }}>{menu.type}</span></td>
                <td>{menu.sort}</td>
                <td>
                  <div style={{ display: 'flex', gap: '4px' }}>
                    <button className="btn-link" onClick={() => { setForm({ title: menu.title, path: menu.path, icon: menu.icon, type: menu.type }); setModal({ visible: true, menu }); }}>编辑</button>
                    <button className="btn-link danger" onClick={() => setDialog({ visible: true, id: menu.id })}>删除</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {modal.visible && (
        <Modal title={modal.menu ? '编辑菜单' : '新建菜单'} onClose={() => setModal({ visible: false, menu: null })} onSave={handleSave}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div><div style={{ fontSize: '13px', marginBottom: '4px' }}>菜单标题 *</div>
              <input style={inputStyle} value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} /></div>
            <div><div style={{ fontSize: '13px', marginBottom: '4px' }}>路由路径</div>
              <input style={inputStyle} value={form.path} onChange={e => setForm(f => ({ ...f, path: e.target.value }))} /></div>
            <div><div style={{ fontSize: '13px', marginBottom: '4px' }}>图标（emoji）</div>
              <input style={inputStyle} value={form.icon} onChange={e => setForm(f => ({ ...f, icon: e.target.value }))} /></div>
          </div>
        </Modal>
      )}
      {dialog.visible && (
        <div className="modal-overlay" onClick={() => setDialog({ visible: false, id: 0 })}>
          <div className="modal-container" style={{ width: '320px' }} onClick={e => e.stopPropagation()}>
            <div className="modal-body" style={{ textAlign: 'center' }}>
              <p>确定删除这个菜单吗？</p>
              <div style={{ display: 'flex', gap: '10px', marginTop: '16px', justifyContent: 'center' }}>
                <button className="btn btn-default" onClick={() => setDialog({ visible: false, id: 0 })}>取消</button>
                <button className="btn btn-danger" onClick={() => { setMenus(prev => prev.filter(m => m.id !== dialog.id)); setDialog({ visible: false, id: 0 }); }}>删除</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ==================== 权限管理 ====================

export const PermissionPage: React.FC = () => {
  const [selectedRole, setSelectedRole] = useState('admin');
  const [checked, setChecked] = useState<Set<string>>(new Set(['dashboard:view', 'dashboard:export', 'system:user:list', 'system:user:create', 'system:user:update']));
  const [saved, setSaved] = useState(false);

  const permissions = [
    { id: 'dashboard', label: '仪表盘', children: [{ key: 'dashboard:view', label: '查看' }, { key: 'dashboard:export', label: '导出' }] },
    { id: 'system', label: '系统管理', children: [
      { key: 'system:user:list', label: '用户-查看' }, { key: 'system:user:create', label: '用户-创建' },
      { key: 'system:user:update', label: '用户-编辑' }, { key: 'system:user:delete', label: '用户-删除' },
      { key: 'system:role:list', label: '角色-查看' }, { key: 'system:role:update', label: '角色-编辑' },
    ]},
    { id: 'audit', label: '审计日志', children: [{ key: 'audit:login:view', label: '登录日志' }, { key: 'audit:operation:view', label: '操作日志' }] },
  ];

  const toggle = (key: string) => {
    setChecked(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key); else next.add(key);
      return next;
    });
  };

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div>
      <div className="page-header"><h2>权限管理</h2><p>角色权限分配</p></div>
      <div className="page-toolbar">
        <div className="toolbar-left">
          <select className="form-select" value={selectedRole} onChange={(e) => setSelectedRole(e.target.value)}>
            <option value="admin">超级管理员</option>
            <option value="manager">部门经理</option>
            <option value="editor">编辑人员</option>
          </select>
        </div>
        <div className="toolbar-right">
          {saved && <span style={{ color: '#52c41a', fontSize: '13px' }}>✅ 已保存</span>}
          <button className="btn btn-primary" onClick={handleSave}>保存配置</button>
        </div>
      </div>
      <div className="table-wrapper">
        <table className="data-table">
          <thead><tr><th>权限模块</th><th>权限项</th><th style={{ width: '80px' }}>状态</th></tr></thead>
          <tbody>
            {permissions.map(mod => (
              <React.Fragment key={mod.id}>
                <tr style={{ background: '#fafafa' }}>
                  <td style={{ fontWeight: 600 }}>{mod.label}</td><td colSpan={2}></td>
                </tr>
                {mod.children.map(perm => (
                  <tr key={perm.key}>
                    <td></td>
                    <td><code style={{ fontSize: '12px' }}>{perm.key}</code> {perm.label}</td>
                    <td><input type="checkbox" checked={checked.has(perm.key)} onChange={() => toggle(perm.key)} /></td>
                  </tr>
                ))}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// ==================== 审计日志 ====================

export const AuditPage: React.FC = () => {
  const logs = [
    { id: 1, time: '2026-09-12 10:30:15', user: 'admin', module: '认证', action: '登录系统', ip: '192.168.1.100', status: '成功' },
    { id: 2, time: '2026-09-12 10:29:58', user: 'manager', module: '用户管理', action: '修改用户权限', ip: '192.168.1.101', status: '成功' },
    { id: 3, time: '2026-09-12 10:28:42', user: 'editor01', module: '配置管理', action: '更新配置', ip: '172.16.0.10', status: '成功' },
    { id: 4, time: '2026-09-12 10:27:20', user: 'admin', module: '角色管理', action: '创建角色', ip: '192.168.1.100', status: '成功' },
    { id: 5, time: '2026-09-12 10:25:15', user: 'user001', module: '认证', action: '登录系统', ip: '10.0.0.55', status: '失败' },
  ];
  const [exported, setExported] = useState(false);

  return (
    <div>
      <div className="page-header"><h2>审计日志</h2><p>共 {logs.length} 条记录</p></div>
      <div className="page-toolbar">
        <div className="toolbar-left">
          <input className="form-input" placeholder="搜索用户/操作" style={{ width: '220px' }} />
          <select className="form-select"><option>全部模块</option><option>认证</option><option>用户管理</option></select>
        </div>
        <div className="toolbar-right">
          {exported && <span style={{ color: '#52c41a', fontSize: '13px' }}>✅ 已导出</span>}
          <button className="btn btn-default" onClick={() => { setExported(true); setTimeout(() => setExported(false), 2000); }}>📥 导出</button>
        </div>
      </div>
      <div className="table-wrapper">
        <table className="data-table">
          <thead><tr><th>时间</th><th>用户</th><th>模块</th><th>操作</th><th>IP</th><th>状态</th></tr></thead>
          <tbody>
            {logs.map(log => (
              <tr key={log.id}>
                <td style={{ color: 'var(--text-muted)' }}>{log.time}</td>
                <td style={{ fontWeight: 500 }}>{log.user}</td>
                <td>{log.module}</td>
                <td>{log.action}</td>
                <td style={{ color: 'var(--text-muted)' }}>{log.ip}</td>
                <td><span className={`status-badge ${log.status === '成功' ? 'status-active' : 'status-inactive'}`}>{log.status}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// ==================== 系统设置 ====================

export const SettingsPage: React.FC = () => {
  const [settings, setSettings] = useState([
    { id: 1, name: '系统名称', value: '企业管理系统', type: 'text' },
    { id: 2, name: '系统描述', value: '企业级管理后台', type: 'text' },
    { id: 3, name: 'Token 过期时间(分钟)', value: '30', type: 'text' },
    { id: 4, name: '开启注册', value: true, type: 'toggle' },
    { id: 5, name: '开启审计日志', value: true, type: 'toggle' },
  ]);
  const [editing, setEditing] = useState<{ id: number; value: string } | null>(null);
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    if (!editing) return;
    setSettings(prev => prev.map(s => s.id === editing.id ? { ...s, value: editing.value } : s));
    setEditing(null);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div>
      <div className="page-header">
        <h2>系统设置</h2>
        <p>全局配置 {saved && <span style={{ color: '#52c41a' }}>✅ 已保存</span>}</p>
      </div>
      <div className="table-wrapper">
        <table className="data-table">
          <thead><tr><th>配置项</th><th>值</th><th>操作</th></tr></thead>
          <tbody>
            {settings.map(s => (
              <tr key={s.id}>
                <td style={{ fontWeight: 500 }}>{s.name}</td>
                <td>
                  {editing?.id === s.id ? (
                    <input style={inputStyle} value={editing.value} onChange={e => setEditing({ id: s.id, value: e.target.value })} />
                  ) : s.type === 'toggle' ? (
                    <span className={`status-badge ${s.value ? 'status-active' : 'status-inactive'}`}>
                      {s.value ? '开启' : '关闭'}
                    </span>
                  ) : (
                    <span>{String(s.value)}</span>
                  )}
                </td>
                <td>
                  {s.type === 'toggle' ? (
                    <button className="btn-link" onClick={() => setSettings(prev => prev.map(x => x.id === s.id ? { ...x, value: !x.value } : x))}>
                      {s.value ? '关闭' : '开启'}
                    </button>
                  ) : editing?.id === s.id ? (
                    <button className="btn-link" onClick={handleSave}>保存</button>
                  ) : (
                    <button className="btn-link" onClick={() => setEditing({ id: s.id, value: String(s.value) })}>编辑</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
