/**
 * 权限管理页（julyPermission）- antd 版（左右分栏）
 * 左侧：角色列表；右侧：菜单权限树（antd Tree）/ 关联用户（antd Table）
 */
import React, { useEffect, useMemo, useState } from 'react';
import { Button, Card, Empty, List, Popconfirm, Space, Table, Tabs, Tag, Tree, Typography } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import type { DataNode } from 'antd/es/tree';
import { useRoleState } from '@/stores/system011/julyRoleStore';
import { selectMenuTree, loadRoles, assignPermissions, removeUserFromRole, removeRole, addUserToRole } from '@/services/system011';
import type { RoleDetail } from '@/types/system011/julyRole/view';
import { UserTransferModal } from '@/components/UserTransferModal';
import { RoleFormModal } from './RoleFormModal';
import type { JulyMenuVo011 } from '@/types/system011/julyMenu';
import type { JulyOrganizationVo011 } from '@/types/system011/julyOrganization';
import type { JulyUserView } from '@/types/system011/julyUser';
import type { OrgTreeNode } from '@/types/view/common';

/** JulyMenuVo011 → antd Tree DataNode */
function toTreeData(nodes: JulyMenuVo011[]): DataNode[] {
  return nodes.map((n) => ({
    title: `${n.menuIcon} ${n.menuName}`,
    key: n.permissionCode ?? n.id,
    children: n.children?.length ? toTreeData(n.children) : undefined,
  }));
}

/** JulyOrganizationVo011 → 穿梭框组织树 */
function toOrgTree(list: JulyOrganizationVo011[]): OrgTreeNode[] {
  return list.map((o) => ({
    id: o.id,
    name: o.orgName,
    type: String(o.orgLevel),
    children: o.children ? toOrgTree(o.children) : undefined,
  }));
}

export const julyPermission: React.FC = () => {
  const { roles, users, orgTree, loaded } = useRoleState();
  const [menuTree, setMenuTree] = useState<JulyMenuVo011[]>([]);
  const [selectedRoleId, setSelectedRoleId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'perms' | 'users'>('perms');
  const [editModal, setEditModal] = useState<{ open: boolean; role: RoleDetail | null }>({ open: false, role: null });
  const [permissionDraft, setPermissionDraft] = useState<string[]>([]);
  const [addUserModal, setAddUserModal] = useState(false);

  useEffect(() => { loadRoles(); }, []);
  useEffect(() => {
    selectMenuTree().then(setMenuTree).catch(() => setMenuTree([]));
  }, []);

  const selectedRole = roles.find((r) => r.id === selectedRoleId) || null;
  const roleUsers = useMemo(
    () => (selectedRole ? selectedRole.userIds.map((id) => users.find((u) => u.id === id)!).filter(Boolean) : []),
    [selectedRole, users],
  );

  const selectRole = (role: RoleDetail) => {
    setSelectedRoleId(role.id);
    setPermissionDraft([...role.permissions]);
  };

  const savePermissions = () => {
    if (selectedRole) assignPermissions(selectedRole.id, permissionDraft);
  };

  const userColumns: ColumnsType<JulyUserView> = [
    { title: '用户名', dataIndex: 'userAccount' },
    { title: '姓名', dataIndex: 'userName' },
    { title: '组织', dataIndex: 'department' },
    {
      title: '操作', key: 'action', width: 90,
      render: (_, u) => (
        <Button type="link" size="small" danger onClick={() => selectedRole && removeUserFromRole(selectedRole.id, u.id)}>
          移除
        </Button>
      ),
    },
  ];

  return (
    <div>
      <div className="page-header"><h2>权限管理</h2><p>共 {roles.length} 个角色 · 左侧选择角色配置菜单权限</p></div>

      <div className="permission-layout">
        <Card
          className="permission-sider"
          title="角色"
          styles={{ body: { padding: 0 } }}
          extra={
            <Space size="small">
              <Button size="small" type="primary" onClick={() => setEditModal({ open: true, role: null })}>+ 新建</Button>
              <Button size="small" disabled={!selectedRole} onClick={() => selectedRole && setEditModal({ open: true, role: selectedRole })}>编辑</Button>
              <Popconfirm
                title="确定删除这个角色吗？"
                okText="删除"
                cancelText="取消"
                okButtonProps={{ danger: true }}
                disabled={!selectedRole}
                onConfirm={() => {
                  if (!selectedRole) return;
                  removeRole(selectedRole.id);
                  setSelectedRoleId(null);
                }}
              >
                <Button size="small" danger disabled={!selectedRole}>删除</Button>
              </Popconfirm>
            </Space>
          }
        >
          <List
            loading={!loaded}
            dataSource={roles}
            renderItem={(role) => (
              <List.Item
                className={`role-item ${selectedRoleId === role.id ? 'active' : ''}`}
                onClick={() => selectRole(role)}
              >
                <List.Item.Meta
                  avatar={<span className="role-icon">🔑</span>}
                  title={role.roleName}
                  description={`${role.roleCode} · ${role.userIds.length}用户 · ${role.permissions.length}菜单`}
                />
                <Tag color={role.status === '1' ? 'green' : 'red'}>{role.status === '1' ? '启用' : '停用'}</Tag>
              </List.Item>
            )}
          />
        </Card>

        <div className="permission-main">
          {!selectedRole ? (
            <Card className="permission-empty"><Empty description="请从左侧选择一个角色配置权限" /></Card>
          ) : (
            <Card title={selectedRole.roleName}>
              <Tabs
                activeKey={activeTab}
                onChange={(k) => setActiveTab(k as 'perms' | 'users')}
                items={[
                  {
                    key: 'perms',
                    label: `菜单权限 (${permissionDraft.length})`,
                    children: (
                      <>
                        <div className="text-right mb-8">
                          <Button type="primary" size="small" onClick={savePermissions}>保存</Button>
                        </div>
                        {menuTree.length === 0
                          ? <Empty description="暂无菜单" />
                          : (
                            <Tree
                              checkable
                              defaultExpandAll
                              treeData={toTreeData(menuTree)}
                              checkedKeys={permissionDraft}
                              onCheck={(keys) => setPermissionDraft(keys as string[])}
                            />
                          )}
                      </>
                    ),
                  },
                  {
                    key: 'users',
                    label: `关联用户 (${selectedRole.userIds.length})`,
                    children: (
                      <>
                        <div className="text-right mb-8">
                          <Button type="primary" size="small" onClick={() => setAddUserModal(true)}>+ 添加用户</Button>
                        </div>
                        <Table<JulyUserView>
                          rowKey="id"
                          size="small"
                          columns={userColumns}
                          dataSource={roleUsers}
                          pagination={false}
                        />
                      </>
                    ),
                  },
                ]}
              />
            </Card>
          )}
        </div>
      </div>

      {addUserModal && selectedRole && (
        <UserTransferModal
          title={`添加用户到「${selectedRole.roleName}」`}
          orgTree={toOrgTree(orgTree)}
          allUsers={users.map((u) => ({
            id: u.id, username: u.userAccount, realName: u.userName,
            department: u.department, departmentId: u.pkOrg || '',
          }))}
          excludedUserIds={selectedRole.userIds}
          onConfirm={(userIds) => {
            userIds.forEach((id) => addUserToRole(selectedRole.id, String(id)));
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
    </div>
  );
};
