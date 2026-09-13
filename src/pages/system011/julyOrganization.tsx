/**
 * 组织机构管理页（julyOrganization）- PC 端
 * 树形表格展示组织架构；新建/编辑弹窗支持选择上级组织（可改上下级）
 *
 * 数据源：真实后端 /julyOrganization/v1/*（mock 模式走 src/mock/system011.ts 同名 action，两模式同形）
 * 已对接接口：
 *  - selectTree       组织树（含人数角标）
 *  - insert           新增（orgCode + orgName 必填，层级由上级推导）
 *  - update           修改（编码不可改，可移动上级）
 *  - logicDelete      逻辑删除（有子组织或挂有用户会被拒绝）
 * 负责人：表单为用户下拉（pkUser），展示名取自后端用户列表
 */
import React, { useState, useEffect, useMemo } from 'react';
import { useOrganizationState } from '../../stores/system011/julyOrganizationStore';
import { roleStore, useRoleState } from '../../stores/system011/julyRoleStore';
import { fetchOrganizationTree, saveOrganization, removeOrganization } from '../../services/system011';
import { toast } from '../../utils/toast';
import type { JulyOrganizationVo011 } from '../../types/system011';

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

interface DeptNode {
  id: string;
  name: string;
  code: string;
  leader: string;
  leaderId: string;
  count: number;
  level: number;
  sortOrder: number;
  children?: DeptNode[];
}

function projectOrg(o: JulyOrganizationVo011, userNameById: Map<string, string>): DeptNode {
  return {
    id: o.id,
    name: o.orgName,
    code: o.orgCode,
    leader: o.pkUser ? (userNameById.get(o.pkUser) || '—') : '—',
    leaderId: o.pkUser || '',
    count: o.memberCount || 0,
    level: o.orgLevel,
    sortOrder: o.sortOrder,
    children: o.children?.map((c) => projectOrg(c, userNameById)),
  };
}

// ==================== 组织机构管理 ====================

export const julyOrganization: React.FC = () => {
  const { users } = useRoleState();
  const { tree, loading } = useOrganizationState();
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [modal, setModal] = useState<{ visible: boolean; mode: 'create' | 'edit'; node: DeptNode | null }>({ visible: false, mode: 'create', node: null });
  const [form, setForm] = useState({ name: '', code: '', leaderId: '', sortOrder: 0 });
  const [parentChoice, setParentChoice] = useState<string>('');
  const [saving, setSaving] = useState(false);
  const [dialog, setDialog] = useState<{ visible: boolean; id: string }>({ visible: false, id: '' });

  /** 成功/失败提示 → 全局 toast 浮层（对齐用户页 message.success / message.error） */
  const flash = (msg: string) => {
    const isOk = msg.startsWith('✅');
    const content = msg.replace(/^[✅⚠]\s*/, '');
    if (isOk) toast.success(content);
    else toast.error(content);
  };

  useEffect(() => { roleStore.load(); fetchOrganizationTree(); }, []);
  useEffect(() => { setExpandedIds((prev) => (prev.size ? prev : new Set(tree.map((o) => o.id)))); }, [tree]);

  /** 负责人 id → 姓名（来自后端用户列表） */
  const userNameById = useMemo(
    () => new Map(users.map((u) => [u.id, u.realName] as [string, string])),
    [users],
  );
  const departments = useMemo(
    () => tree.map((o) => projectOrg(o, userNameById)),
    [tree, userNameById],
  );

  const containsId = (node: DeptNode, id: string): boolean =>
    node.id === id || (node.children || []).some((c) => containsId(c, id));
  /** 返回父节点 id；顶级节点返回空串 ''（无父） */
  const findParentId = (items: DeptNode[], id: string, parentId = ''): string | null => {
    for (const item of items) {
      if (item.id === id) return parentId;
      if (item.children) {
        const found = findParentId(item.children, id, item.id);
        if (found !== null) return found;
      }
    }
    return null;
  };

  // 上级组织下拉选项（编辑时排除自己及下级）
  const parentOptions: { id: string; label: string; disabled: boolean }[] = [];
  const flattenOrgs = (items: DeptNode[], depth: number) => {
    items.forEach((item) => {
      const disabled = modal.mode === 'edit' && modal.node != null && containsId(modal.node, item.id);
      parentOptions.push({ id: item.id, label: `${'　'.repeat(depth)}${item.name}`, disabled });
      if (item.children?.length) flattenOrgs(item.children, depth + 1);
    });
  };
  flattenOrgs(departments, 0);

  const openCreate = (parent: DeptNode | null) => {
    setForm({ name: '', code: '', leaderId: '', sortOrder: 0 });
    setParentChoice(parent ? parent.id : '');
    setModal({ visible: true, mode: 'create', node: null });
  };

  const openEdit = (dept: DeptNode) => {
    setForm({ name: dept.name, code: dept.code, leaderId: dept.leaderId, sortOrder: dept.sortOrder });
    setParentChoice(findParentId(departments, dept.id) ?? '');
    setModal({ visible: true, mode: 'edit', node: dept });
  };

  const handleSave = async () => {
    if (saving) return;
    if (!form.name.trim()) { flash('⚠ 请填写组织名称'); return; }
    if (modal.mode === 'create' && !form.code.trim()) { flash('⚠ 请填写组织编码'); return; }
    setSaving(true);
    const isEdit = modal.mode === 'edit' && !!modal.node;
    try {
      const id = await saveOrganization({
        id: modal.node?.id,
        orgCode: form.code.trim(),
        orgName: form.name.trim(),
        pkUser: form.leaderId || undefined,
        parentId: parentChoice || undefined,
        sortOrder: form.sortOrder,
      });
      flash(`✅ ${isEdit ? 'update' : 'insert'} ${id} success ...`);
      setModal({ visible: false, mode: 'create', node: null });
    } catch (e: any) {
      flash(`⚠ ${e?.message || '保存失败'}`);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    setDialog({ visible: false, id: '' });
    try {
      const deleted = await removeOrganization(id);
      flash(`✅ delete ${deleted} success ...`);
    } catch (e: any) {
      flash(`⚠ ${e?.message || '删除失败'}`);
    }
  };

  const renderDept = (depts: DeptNode[], depth = 0): React.ReactNode =>
    depts.map((dept) => (
      <React.Fragment key={dept.id}>
        <tr style={{ background: depth === 0 ? '#fafafa' : undefined }}>
          <td style={{ paddingLeft: `${16 + depth * 24}px`, fontWeight: depth === 0 ? 600 : 400 }}>
            {dept.children?.length ? (
              <button onClick={() => setExpandedIds((prev) => { const n = new Set(prev); n.has(dept.id) ? n.delete(dept.id) : n.add(dept.id); return n; })}
                style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '10px', marginRight: '4px' }}>
                {expandedIds.has(dept.id) ? '▼' : '▶'}
              </button>
            ) : <span style={{ marginLeft: '14px' }} />}
            {dept.name}
          </td>
          <td><code style={{ fontSize: '12px' }}>{dept.code}</code></td>
          <td>{dept.leader}</td>
          <td>{dept.count} 人</td>
          <td>
            <div style={{ display: 'flex', gap: '4px' }}>
              <button className="btn-link" onClick={() => openEdit(dept)}>编辑</button>
              <button className="btn-link" onClick={() => openCreate(dept)}>+ 子部门</button>
              <button className="btn-link danger" onClick={() => setDialog({ visible: true, id: dept.id })}>删除</button>
            </div>
          </td>
        </tr>
        {dept.children && expandedIds.has(dept.id) && renderDept(dept.children, depth + 1)}
      </React.Fragment>
    ));

  return (
    <div>
      <div className="page-header"><h2>组织管理</h2><p>集团 → 分公司 → 部门</p></div>
      <div className="page-toolbar">
        <div className="toolbar-right">
          <button className="btn btn-primary" onClick={() => openCreate(null)}>+ 新建集团</button>
        </div>
      </div>
      <div className="table-wrapper">
        <table className="data-table">
          <thead><tr><th>组织名称</th><th>编码</th><th>负责人</th><th>人数</th><th>操作</th></tr></thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)' }}>加载中...</td></tr>
            ) : departments.length === 0 ? (
              <tr><td colSpan={5} style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)' }}>暂无组织数据</td></tr>
            ) : (
              renderDept(departments)
            )}
          </tbody>
        </table>
      </div>
      {modal.visible && (
        <Modal
          title={modal.mode === 'edit' ? '编辑组织' : parentChoice === '' ? '新建集团' : '新建子部门'}
          onClose={() => setModal({ visible: false, mode: 'create', node: null })}
          onSave={handleSave}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div><div style={{ fontSize: '13px', marginBottom: '4px' }}>上级组织</div>
              <select style={{ ...inputStyle, background: '#fff' }} value={parentChoice} onChange={(e) => setParentChoice(e.target.value)}>
                <option value="">（顶级组织）</option>
                {parentOptions.map((o) => <option key={o.id} value={o.id} disabled={o.disabled}>{o.label}</option>)}
              </select>
            </div>
            <div><div style={{ fontSize: '13px', marginBottom: '4px' }}>名称 *</div>
              <input style={inputStyle} value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} /></div>
            <div><div style={{ fontSize: '13px', marginBottom: '4px' }}>编码 {/* 编辑时后端不允许改编码 */}{modal.mode === 'edit' ? '（不可改）' : '*'}</div>
              <input style={{ ...inputStyle, background: modal.mode === 'edit' ? '#f5f5f5' : '#fff' }} value={form.code}
                disabled={modal.mode === 'edit'} onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))} /></div>
            <div><div style={{ fontSize: '13px', marginBottom: '4px' }}>负责人</div>
              <select style={{ ...inputStyle, background: '#fff' }} value={form.leaderId} onChange={(e) => setForm((f) => ({ ...f, leaderId: e.target.value }))}>
                <option value="">（未指定）</option>
                {users.map((u) => <option key={u.id} value={u.id}>{u.realName}（{u.username}）</option>)}
              </select>
            </div>
            <div><div style={{ fontSize: '13px', marginBottom: '4px' }}>排序</div>
              <input type="number" style={inputStyle} value={form.sortOrder}
                onChange={(e) => setForm((f) => ({ ...f, sortOrder: Number(e.target.value) || 0 }))} /></div>
          </div>
          {saving && <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '8px' }}>保存中...</div>}
        </Modal>
      )}
      {dialog.visible && (
        <div className="modal-overlay" onClick={() => setDialog({ visible: false, id: '' })}>
          <div className="modal-container" style={{ width: '320px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-body" style={{ textAlign: 'center' }}>
              <p>确定删除这个组织吗？（有子组织或挂有用户时后端会拒绝）</p>
              <div style={{ display: 'flex', gap: '10px', marginTop: '16px', justifyContent: 'center' }}>
                <button className="btn btn-default" onClick={() => setDialog({ visible: false, id: '' })}>取消</button>
                <button className="btn btn-danger" onClick={() => handleDelete(dialog.id)}>删除</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
