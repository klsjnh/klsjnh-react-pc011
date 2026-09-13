/**
 * 用户列表页（julyUser）- antd 版
 * 列表读 julyUserStore；分页/保存调 julyUserService；新增/编辑弹窗见 JulyUserFormModal。
 */
import React, { useEffect, useMemo, useState } from 'react';
import { Card, Input, Select, Space, Button, Table, Tag } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { roleStore, useRoleState } from '@/stores/system011/julyRoleStore';
import { useUserState } from '@/stores/system011/julyUserStore';
import { fetchUserPage } from '@/services/system011';
import { toast } from '@/utils/toast';
import { mockRelations } from '@/mock/system011';
import { JulyUserFormModal } from './JulyUserFormModal';
import type { JulyUserVo011 } from '@/types/system011';
import type { JulyUserView } from '@/types/view';

/** 后端 JulyUserVo011 → 页面 UI 视图 */
function toUI(u: JulyUserVo011, orgNameById: Map<string, string>): JulyUserView {
  return {
    id: u.id,
    username: u.userAccount,
    realName: u.userName,
    email: u.email || '',
    phone: u.mobile || '',
    department: u.pkOrg ? (orgNameById.get(u.pkOrg) || '') : '',
    departmentId: u.pkOrg || null,
    roles: mockRelations.userRoles(u.userAccount),
    status: u.status === '1' ? 'active' : 'inactive',
    createdAt: (u.createTime || '').slice(0, 10),
    lastLoginTime: u.lastLoginTime ? u.lastLoginTime.replace('T', ' ').slice(0, 19) : '—',
  };
}

interface UserListPageProps {
  onNavigate?: (path: string) => void;
}

export const julyUser: React.FC<UserListPageProps> = () => {
  const { roles, orgTree } = useRoleState();
  const { list, total, loading, query } = useUserState();
  const [keyword, setKeyword] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  /** 启停用为本地展示（后端无启停接口），用覆盖表保留切换结果 */
  const [statusOverride, setStatusOverride] = useState<Record<string, JulyUserView['status']>>({});
  const [modal, setModal] = useState<{ open: boolean; user: JulyUserView | null }>({ open: false, user: null });

  const orgNameById = useMemo(() => {
    const m = new Map<string, string>();
    const walk = (nodes: typeof orgTree) => {
      for (const o of nodes) { m.set(o.id, o.name); if (o.children) walk(o.children); }
    };
    walk(orgTree);
    return m;
  }, [orgTree]);

  useEffect(() => { roleStore.load(); }, []);
  useEffect(() => { fetchUserPage({ pageIndex: 1, pageSize: 10 }); }, []);

  const users = useMemo(
    () => list.map((u) => {
      const ui = toUI(u, orgNameById);
      return statusOverride[u.id] ? { ...ui, status: statusOverride[u.id] } : ui;
    }),
    [list, orgNameById, statusOverride],
  );

  const dataSource = users.filter((u) => !statusFilter || u.status === statusFilter);
  const roleLabel = (name: string) => roles.find((r) => r.name === name)?.label || name;

  const toggleStatus = (id: string) => {
    const cur = users.find((u) => u.id === id);
    if (!cur) return;
    setStatusOverride((prev) => ({ ...prev, [id]: cur.status === 'active' ? 'inactive' : 'active' }));
    toast.success('状态已切换（仅本地展示；后端无启停接口）');
  };

  const columns: ColumnsType<JulyUserView> = [
    { title: '用户名', dataIndex: 'username', width: 120 },
    { title: '姓名', dataIndex: 'realName', width: 100 },
    { title: '邮箱', dataIndex: 'email', render: (v) => v || '—' },
    { title: '手机号', dataIndex: 'phone', width: 130, render: (v) => v || '—' },
    { title: '组织', dataIndex: 'department', width: 140, render: (v) => v || '—' },
    {
      title: '角色', dataIndex: 'roles', width: 160,
      render: (names: string[]) => names.length === 0
        ? '—'
        : names.map((n) => <Tag key={n} color="blue">{roleLabel(n)}</Tag>),
    },
    {
      title: '状态', dataIndex: 'status', width: 90,
      render: (s: JulyUserView['status']) => <Tag color={s === 'active' ? 'green' : 'red'}>{s === 'active' ? '正常' : '停用'}</Tag>,
    },
    { title: '最近登录', dataIndex: 'lastLoginTime', width: 160 },
    {
      title: '操作', key: 'action', width: 130, fixed: 'right',
      render: (_, user) => (
        <Space size="small">
          <Button type="link" size="small" onClick={() => setModal({ open: true, user })}>编辑</Button>
          <Button type="link" size="small" onClick={() => toggleStatus(user.id)}>
            {user.status === 'active' ? '停用' : '启用'}
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div className="page-header">
        <h2>用户管理</h2>
        <p>共 {total} 个用户 · 接口 /julyUser/v1/selectListByPage</p>
      </div>

      <div className="page-toolbar">
        <div className="toolbar-left">
          <Input.Search
            allowClear
            placeholder="搜索用户名"
            style={{ width: 240 }}
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            onSearch={(v) => fetchUserPage({ pageIndex: 1, userAccount: v || undefined })}
            onClear={() => { setKeyword(''); fetchUserPage({ pageIndex: 1, userAccount: undefined }); }}
          />
          <Select
            style={{ width: 140 }}
            value={statusFilter}
            onChange={setStatusFilter}
            options={[
              { value: '', label: '全部状态' },
              { value: 'active', label: '正常' },
              { value: 'inactive', label: '停用' },
            ]}
          />
        </div>
        <div className="toolbar-right">
          <Button type="primary" onClick={() => setModal({ open: true, user: null })}>+ 新建用户</Button>
        </div>
      </div>

      <Card className="table-wrapper" styles={{ body: { padding: 0 } }}>
        <Table<JulyUserView>
          rowKey="id"
          columns={columns}
          dataSource={dataSource}
          loading={loading}
          scroll={{ x: 1100 }}
          pagination={{
            current: query.pageIndex,
            pageSize: query.pageSize,
            total,
            showSizeChanger: true,
            pageSizeOptions: [10, 50, 100],
            showTotal: (t) => `共 ${t} 条`,
            onChange: (pageIndex, pageSize) => fetchUserPage({ pageIndex, pageSize }),
          }}
        />
      </Card>

      <JulyUserFormModal
        open={modal.open}
        user={modal.user}
        roles={roles}
        orgTree={orgTree}
        onClose={() => setModal({ open: false, user: null })}
        onSaved={() => { roleStore.reload(); }}
      />
    </div>
  );
};
