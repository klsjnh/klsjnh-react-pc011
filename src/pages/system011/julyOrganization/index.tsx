/**
 * 组织机构管理页（julyOrganization）- antd 版
 * 树形表格（antd Table 树数据，直接消费 JulyOrganizationVo011）；写操作走 julyOrganizationService。
 */
import React, { useEffect, useMemo, useState } from 'react';
import { Button, Card, Popconfirm, Space, Table, Tag } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { useOrganizationState } from '@/stores/system011/julyOrganizationStore';
import { useRoleState } from '@/stores/system011/julyRoleStore';
import { fetchOrganizationTree, removeOrganization, loadRoles } from '@/services/system011';
import { toast } from '@/utils/toast';
import { OrganizationFormModal } from './OrganizationFormModal';
import type { JulyOrganizationVo011 } from '@/types/system011/julyOrganization';

/** 返回父节点 id；顶级返回空串 */
function findParentId(items: JulyOrganizationVo011[], id: string, parentId = ''): string | null {
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
  const [modal, setModal] = useState<{ open: boolean; mode: 'create' | 'edit'; node: JulyOrganizationVo011 | null; parentId: string }>(
    { open: false, mode: 'create', node: null, parentId: '' },
  );

  useEffect(() => { loadRoles(); fetchOrganizationTree(); }, []);

  const userNameById = useMemo(
    () => new Map(users.map((u) => [u.id, u.userName] as [string, string])),
    [users],
  );

  const openCreate = (parent: JulyOrganizationVo011 | null) =>
    setModal({ open: true, mode: 'create', node: null, parentId: parent?.id || '' });
  const openEdit = (node: JulyOrganizationVo011) =>
    setModal({ open: true, mode: 'edit', node, parentId: findParentId(tree, node.id) ?? '' });

  const handleDelete = async (id: string) => {
    try {
      const deleted = await removeOrganization(id);
      toast.success(`delete ${deleted} success ...`);
    } catch (e: any) {
      toast.error(e?.message || '删除失败');
    }
  };

  const columns: ColumnsType<JulyOrganizationVo011> = [
    { title: '组织名称', dataIndex: 'orgName', render: (v, r) => (r.orgLevel === 1 ? <strong>{v}</strong> : v) },
    { title: '编码', dataIndex: 'orgCode', width: 140, render: (v) => <Tag>{v}</Tag> },
    { title: '负责人', dataIndex: 'pkUser', width: 120, render: (v) => (v ? (userNameById.get(v) || '—') : '—') },
    { title: '人数', dataIndex: 'memberCount', width: 90, render: (v) => `${v ?? 0} 人` },
    {
      title: '操作', key: 'action', width: 200,
      render: (_, node) => (
        <Space size="small">
          <Button type="link" size="small" onClick={() => openEdit(node)}>编辑</Button>
          <Button type="link" size="small" onClick={() => openCreate(node)}>+ 子部门</Button>
          <Popconfirm
            title="确定删除这个组织吗？"
            description="有子组织或挂有用户时后端会拒绝。"
            okText="删除"
            cancelText="取消"
            okButtonProps={{ danger: true }}
            onConfirm={() => handleDelete(node.id)}
          >
            <Button type="link" size="small" danger>删除</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div className="page-header"><h2>组织管理</h2><p>集团 → 分公司 → 部门</p></div>
      <div className="page-toolbar">
        <div className="toolbar-right">
          <Button type="primary" onClick={() => openCreate(null)}>+ 新建集团</Button>
        </div>
      </div>

      <Card className="table-wrapper" styles={{ body: { padding: 0 } }}>
        <Table<JulyOrganizationVo011>
          rowKey="id"
          columns={columns}
          dataSource={tree}
          loading={loading}
          pagination={false}
          expandable={{ defaultExpandAllRows: true }}
        />
      </Card>

      <OrganizationFormModal
        open={modal.open}
        mode={modal.mode}
        node={modal.node}
        departments={tree}
        users={users}
        initialParentId={modal.parentId}
        onClose={() => setModal({ open: false, mode: 'create', node: null, parentId: '' })}
        onSaved={() => { /* 组织树由 service 刷新 */ }}
      />
    </div>
  );
};
