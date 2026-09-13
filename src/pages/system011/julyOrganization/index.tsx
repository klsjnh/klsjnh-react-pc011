/**
 * 组织机构管理页（julyOrganization）- PC 端
 * 树形表格展示组织架构；数据读 julyOrganizationStore，写操作走 julyOrganizationService。
 * 新增/编辑弹窗见 OrganizationFormModal。
 */
import React, { useState, useEffect, useMemo } from 'react';
import { useOrganizationState } from '../../../stores/system011/julyOrganizationStore';
import { roleStore, useRoleState } from '../../../stores/system011/julyRoleStore';
import { fetchOrganizationTree, removeOrganization } from '../../../services/system011';
import { toast } from '../../../utils/toast';
import { Modal } from '../../../components/Modal';
import { OrganizationFormModal } from './OrganizationFormModal';
import type { JulyOrganizationVo011 } from '../../../types/system011';
import type { OrgDeptNode } from '../../../types/view';

function projectOrg(o: JulyOrganizationVo011, userNameById: Map<string, string>): OrgDeptNode {
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

/** 返回父节点 id；顶级节点返回空串 ''（无父） */
function findParentId(items: OrgDeptNode[], id: string, parentId = ''): string | null {
  for (const item of items) {
    if (item.id === id) return parentId;
    if (item.children) {
      const found = findParentId(item.children, id, item.id);
      if (found !== null) return found;
    }
  }
  return null;
}

export const julyOrganization: React.FC = () => {
  const { users } = useRoleState();
  const { tree, loading } = useOrganizationState();
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [modal, setModal] = useState<{ open: boolean; mode: 'create' | 'edit'; node: OrgDeptNode | null; parentId: string }>(
    { open: false, mode: 'create', node: null, parentId: '' },
  );
  const [dialog, setDialog] = useState<{ visible: boolean; id: string }>({ visible: false, id: '' });

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

  const openCreate = (parent: OrgDeptNode | null) =>
    setModal({ open: true, mode: 'create', node: null, parentId: parent?.id || '' });
  const openEdit = (dept: OrgDeptNode) =>
    setModal({ open: true, mode: 'edit', node: dept, parentId: findParentId(departments, dept.id) ?? '' });

  const handleDelete = async (id: string) => {
    setDialog({ visible: false, id: '' });
    try {
      const deleted = await removeOrganization(id);
      toast.success(`delete ${deleted} success ...`);
    } catch (e: any) {
      toast.error(e?.message || '删除失败');
    }
  };

  const renderDept = (depts: OrgDeptNode[], depth = 0): React.ReactNode =>
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

      <OrganizationFormModal
        open={modal.open}
        mode={modal.mode}
        node={modal.node}
        departments={departments}
        users={users}
        initialParentId={modal.parentId}
        onClose={() => setModal({ open: false, mode: 'create', node: null, parentId: '' })}
        onSaved={() => { /* 组织树由 service 刷新 */ }}
      />

      {dialog.visible && (
        <Modal title="删除组织" onClose={() => setDialog({ visible: false, id: '' })} width={320}>
          <div style={{ textAlign: 'center' }}>
            <p>确定删除这个组织吗？（有子组织或挂有用户时后端会拒绝）</p>
            <div style={{ display: 'flex', gap: '10px', marginTop: '16px', justifyContent: 'center' }}>
              <button className="btn btn-default" onClick={() => setDialog({ visible: false, id: '' })}>取消</button>
              <button className="btn btn-danger" onClick={() => handleDelete(dialog.id)}>删除</button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
