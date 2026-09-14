/**
 * 用户列表页（julyUser）- antd 版
 * 列表读 julyUserStore；组织名读 julyOrganizationStore；分页/保存调 julyUserService。
 * 字段直接对齐后端（userAccount/userName/mobile/pkOrg/status），仅补充关联字段 department/roles。
 */
import React, { useEffect, useMemo, useState } from 'react';
import { Card, Input, Select, Space, Button, Table, Tag } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { useRoleState } from '@/stores/system011/julyRoleStore';
import { loadRoles } from '@/services/system011';
import { useOrganizationState } from '@/stores/system011/julyOrganizationStore';
import { useUserState } from '@/stores/system011/julyUserStore';
import { fetchUserPage } from '@/services/system011';
import { mockRelations } from '@/mock/system011';
import { JulyUserFormModal } from '@/pages/system011/julyUser/JulyUserFormModal';
import type { JulyUserVo011, JulyUserView } from '@/types/system011/julyUser';

/** 后端 JulyUserVo011 + 关联解析（组织名 / 角色编码） */
function toView(u: JulyUserVo011, orgNameById: Map<string, string>): JulyUserView {
  return {
    ...u,
    department: u.pkOrg ? (orgNameById.get(u.pkOrg) || '') : '',
    roles: mockRelations.userRoles(u.userAccount),
  };
}

export const JulyUser = () => {
  const { roles } = useRoleState();
  const { orgNameById, tree: orgTree } = useOrganizationState();
  const { list, total, loading, query } = useUserState();
  const [keyword, setKeyword] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [modal, setModal] = useState<{ open: boolean; user: JulyUserView | null }>({ open: false, user: null });

  // loadRoles 内部会拉组织树（填充 orgNameById）；用户分页单独拉
  useEffect(() => { loadRoles(); }, []);
  useEffect(() => { fetchUserPage({ pageIndex: 1, pageSize: 10 }); }, []);

  const users = useMemo(() => list.map((u) => toView(u, orgNameById)), [list, orgNameById]);
  const dataSource = users.filter((u) => !statusFilter || u.status === statusFilter);
  const roleLabel = (code: string) => roles.find((r) => r.roleCode === code)?.roleName || code;

  const columns: ColumnsType<JulyUserView> = [
    { title: '用户名', dataIndex: 'userAccount', width: 120 },
    { title: '姓名', dataIndex: 'userName', width: 100 },
    { title: '邮箱', dataIndex: 'email', render: (v) => v || '—' },
    { title: '手机号', dataIndex: 'mobile', width: 130, render: (v) => v || '—' },
    { title: '组织', dataIndex: 'department', width: 140, render: (v) => v || '—' },
    {
      title: '角色', dataIndex: 'roles', width: 160,
      render: (codes: string[]) => codes.length === 0
        ? '—'
        : codes.map((c) => <Tag key={c} color="blue">{roleLabel(c)}</Tag>),
    },
    {
      title: '状态', dataIndex: 'status', width: 90,
      render: (s: string) => <Tag color={s === '1' ? 'green' : 'red'}>{s === '1' ? '正常' : '停用'}</Tag>,
    },
    { title: '最近登录', dataIndex: 'lastLoginTime', width: 160, render: (v) => v || '—' },
    {
      title: '操作', key: 'action', width: 90, fixed: 'right',
      render: (_, user) => (
        <Space size="small">
          <Button type="link" size="small" onClick={() => setModal({ open: true, user })}>编辑</Button>
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
            placeholder="搜索账号"
            className="search-input"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            onSearch={(v) => fetchUserPage({ pageIndex: 1, userAccount: v || undefined })}
          />
          <Select
            className="filter-select"
            value={statusFilter}
            onChange={setStatusFilter}
            options={[
              { value: '', label: '全部状态' },
              { value: '1', label: '正常' },
              { value: '0', label: '停用' },
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
        onSaved={() => { fetchUserPage(); }}
      />
    </div>
  );
};
