/**
 * 组织机构管理页（julyOrganization）- PC 端
 * 树形表格展示组织架构；新建/编辑弹窗支持选择上级组织（可改上下级）
 *
 * 数据源：统一 mock 后端 /julyOrganization/v1/selectListByPage（真实 JulyOrganizationVo011 嵌套树）
 * 字段映射：orgName→名称, orgCode→编码, memberCount→人数, pkUser→负责人(解析为用户名)
 */
import React, { useState, useEffect } from 'react';
import { selectOrganizationListByPage } from '../../services/system011';
import { mockRelations } from '../../mock/system011';
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
  count: number;
  children?: DeptNode[];
}

function projectOrg(o: JulyOrganizationVo011): DeptNode {
  return {
    id: o.id,
    name: o.orgName,
    code: o.orgCode,
    leader: mockRelations.userName(o.pkUser || undefined),
    count: o.memberCount || 0,
    children: o.children?.map(projectOrg),
  };
}

// ==================== 组织机构管理 ====================

export const julyOrganization: React.FC = () => {
  const [departments, setDepartments] = useState<DeptNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [modal, setModal] = useState<{ visible: boolean; mode: 'create' | 'edit'; node: DeptNode | null }>({ visible: false, mode: 'create', node: null });
  const [form, setForm] = useState({ name: '', code: '', leader: '' });
  const [parentChoice, setParentChoice] = useState<string>('');
  const [dialog, setDialog] = useState<{ visible: boolean; id: string }>({ visible: false, id: '' });

  useEffect(() => {
    selectOrganizationListByPage({ pageIndex: 1, pageSize: 100 })
      .then((page) => {
        setDepartments(page.rows.map(projectOrg));
        setExpandedIds(new Set(page.rows.map((o) => o.id)));
      })
      .catch(() => setDepartments([]))
      .finally(() => setLoading(false));
  }, []);

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
  const updateById = (items: DeptNode[], id: string, data: Partial<DeptNode>): DeptNode[] =>
    items.map((item) => (item.id === id
      ? { ...item, ...data }
      : { ...item, children: item.children ? updateById(item.children, id, data) : item.children }));
  const detachById = (items: DeptNode[], id: string): DeptNode[] =>
    items.filter((item) => item.id !== id).map((item) => ({ ...item, children: item.children ? detachById(item.children, id) : item.children }));
  const appendUnder = (items: DeptNode[], parentId: string, node: DeptNode): DeptNode[] =>
    items.map((item) => {
      if (item.id === parentId) return { ...item, children: [...(item.children || []), node] };
      return item.children ? { ...item, children: appendUnder(item.children, parentId, node) } : item;
    });

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
    setForm({ name: '', code: '', leader: '' });
    setParentChoice(parent ? parent.id : '');
    setModal({ visible: true, mode: 'create', node: null });
  };

  const openEdit = (dept: DeptNode) => {
    setForm({ name: dept.name, code: dept.code, leader: dept.leader });
    setParentChoice(findParentId(departments, dept.id) ?? '');
    setModal({ visible: true, mode: 'edit', node: dept });
  };

  const handleSave = () => {
    if (!form.name.trim()) return;
    if (modal.mode === 'create') {
      const newDept: DeptNode = { id: 'tmp-org-' + Date.now(), name: form.name, code: form.code || 'NEW', leader: form.leader || '待定', count: 0, children: [] };
      setDepartments((prev) => (parentChoice === '' ? [...prev, newDept] : appendUnder(prev, parentChoice, newDept)));
    } else if (modal.node) {
      const node = modal.node;
      const oldParentId = findParentId(departments, node.id);
      if (parentChoice === (oldParentId ?? '')) {
        setDepartments((prev) => updateById(prev, node.id, { name: form.name, code: form.code, leader: form.leader }));
      } else {
        const rest = detachById(departments, node.id);
        const moved: DeptNode = { ...node, name: form.name, code: form.code, leader: form.leader };
        setDepartments(parentChoice === '' ? [...rest, moved] : appendUnder(rest, parentChoice, moved));
      }
    }
    setModal({ visible: false, mode: 'create', node: null });
  };

  const handleDelete = (id: string) => {
    const deleteRecursive = (items: DeptNode[]): DeptNode[] =>
      items.filter((d) => d.id !== id).map((d) => ({ ...d, children: d.children ? deleteRecursive(d.children) : undefined }));
    setDepartments(deleteRecursive(departments) as typeof departments);
    setDialog({ visible: false, id: '' });
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
        <Modal title={modal.mode === 'edit' ? '编辑组织' : parentChoice === '' ? '新建集团' : '新建子部门'} onClose={() => setModal({ visible: false, mode: 'create', node: null })} onSave={handleSave}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div><div style={{ fontSize: '13px', marginBottom: '4px' }}>上级组织</div>
              <select style={{ ...inputStyle, background: '#fff' }} value={parentChoice} onChange={(e) => setParentChoice(e.target.value)}>
                <option value="">（顶级组织）</option>
                {parentOptions.map((o) => <option key={o.id} value={o.id} disabled={o.disabled}>{o.label}</option>)}
              </select>
            </div>
            <div><div style={{ fontSize: '13px', marginBottom: '4px' }}>名称 *</div>
              <input style={inputStyle} value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} /></div>
            <div><div style={{ fontSize: '13px', marginBottom: '4px' }}>编码</div>
              <input style={inputStyle} value={form.code} onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))} /></div>
            <div><div style={{ fontSize: '13px', marginBottom: '4px' }}>负责人</div>
              <input style={inputStyle} value={form.leader} onChange={(e) => setForm((f) => ({ ...f, leader: e.target.value }))} /></div>
          </div>
        </Modal>
      )}
      {dialog.visible && (
        <div className="modal-overlay" onClick={() => setDialog({ visible: false, id: '' })}>
          <div className="modal-container" style={{ width: '320px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-body" style={{ textAlign: 'center' }}>
              <p>确定删除这个组织吗？下属组织也会被删除。</p>
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
