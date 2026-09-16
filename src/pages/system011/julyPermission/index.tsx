/**
 * 权限管理页（julyPermission）- antd 版（左右分栏）
 * 左侧：角色列表；右侧：菜单权限树（antd Tree）/ 关联用户（antd Table）
 * 关联用户采用「草稿 + 保存」模式，与菜单权限 tab 一致。
 */
import React, { useEffect, useMemo, useState } from 'react';
import { Button, Card, Empty, List, Space, Table, Tabs, Tag, Tree } from 'antd';
import { KeyOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import type { DataNode } from 'antd/es/tree';
import { useRoleState } from '@/stores/system011/julyRoleStore';
import { useMenuState } from '@/stores/system011/julyMenuStore';
import { loadMenus, loadRoles, assignPermissions, assignUsersToRole, getMenusByRole } from '@/services/system011';
import { isMockMode } from '@/config/appConfig';
import { resolveMenuIcon } from '@/components/layout/MenuIcons';
import { toast } from '@/utils/toast';
import type { RoleDetail } from '@/types/system011/julyRole/view';
import { UserTransferModal } from '@/components/UserTransferModal';
import { RoleFormModal } from '@/pages/system011/julyPermission/RoleFormModal';
import type { JulyMenuVo011 } from '@/types/system011/julyMenu';
import type { JulyOrganizationVo011 } from '@/types/system011/julyOrganization';
import type { JulyUserView } from '@/types/system011/julyUser';
import type { OrgTreeNode } from '@/types/view/common';

/**
 * JulyMenuVo011 → antd Tree DataNode
 * key 必须用**菜单 id**：后端 /julyRole/v1/assignMenus 的 pkMenus 收菜单 id 全量列表，
 * 用 permissionCode 会导致保存写进不存在的主键（且目录节点 permissionCode 为 null）。
 */
function toTreeData(nodes: JulyMenuVo011[]): DataNode[] {
  return nodes.map((n) => ({
    title: (
      <span>
        {React.createElement(resolveMenuIcon(n.menuIcon))}
        {' '}
        {n.menuName}
      </span>
    ),
    key: n.id,
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

export const JulyPermission = () => {
  const { roles, users, orgTree, loaded } = useRoleState();
  const { menus: menuTree } = useMenuState();
  const [selectedRoleId, setSelectedRoleId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'perms' | 'users'>('perms');
  const [editModal, setEditModal] = useState<{ open: boolean; role: RoleDetail | null }>({ open: false, role: null });
  const [permissionDraft, setPermissionDraft] = useState<string[]>([]);
  const [addUserModal, setAddUserModal] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => { loadRoles(); }, []);
  useEffect(() => {
    loadMenus();
  }, []);

  const selectedRole = roles.find((r) => r.id === selectedRoleId) || null;
  const [userDraftIds, setUserDraftIds] = useState<string[]>([]);
  // 切换角色时重置草稿：采用 React 官方的「渲染期调整 state」写法（以角色 id 为键），
  // 避免在 useEffect 内 setState 触发级联渲染（react-hooks/set-state-in-effect）。
  // 以 id 而非对象引用为键，角色数据刷新时不会误清未保存的草稿。
  const [draftRoleId, setDraftRoleId] = useState<string | null>(null);
  if ((selectedRole?.id ?? null) !== draftRoleId) {
    setDraftRoleId(selectedRole?.id ?? null);
    setUserDraftIds(selectedRole ? [...selectedRole.userIds] : []);
  }
  const roleUsersDraft = useMemo(
    () => userDraftIds.map((id) => users.find((u) => u.id === id)).filter(Boolean) as JulyUserView[],
    [userDraftIds, users],
  );

  const selectRole = async (role: RoleDetail) => {
    setSelectedRoleId(role.id);
    // 菜单权限先清空，再用真实接口数据回显（mock 模式回退到本地投影）
    setPermissionDraft([]);
    if (!isMockMode()) {
      try {
        const menus = await getMenusByRole(role.id);
        setPermissionDraft(menus.map((m) => m.id));
      } catch {
        setPermissionDraft([]);
      }
    } else {
      setPermissionDraft([...role.permissions]);
    }
  };

  const savePermissions = async () => {
    if (!selectedRole) return;
    setSaving(true);
    try {
      await assignPermissions(selectedRole.id, permissionDraft);
      toast.success('菜单权限已保存');
    } catch (e) {
      toast.error((e as Error)?.message || '菜单权限保存失败');
    } finally {
      setSaving(false);
    }
  };

  const saveRoleUsers = async () => {
    if (!selectedRole) return;
    setSaving(true);
    try {
      await assignUsersToRole(selectedRole.id, userDraftIds);
      toast.success('关联用户已保存');
    } catch (e) {
      toast.error((e as Error)?.message || '关联用户保存失败');
    } finally {
      setSaving(false);
    }
  };

  const userColumns: ColumnsType<JulyUserView> = [
    { title: '用户名', dataIndex: 'userAccount' },
    { title: '姓名', dataIndex: 'userName' },
    { title: '组织', dataIndex: 'department' },
    {
      title: '操作', key: 'action', width: 90,
      render: (_, u) => (
        <Button type="link" size="small" danger onClick={() => setUserDraftIds(userDraftIds.filter((id) => id !== u.id))}>
          移除
        </Button>
      ),
    },
  ];

  return (
    <div>
      <div className="page-header">
        <h2>权限管理</h2>
      </div>

      <div className="permission-layout">
        <Card
          className="permission-sider"
          title="角色"
          styles={{ body: { padding: 8, minHeight: 670, overflowY: 'auto' } }}
          extra={
            <Space size="small">
              <Button type="primary" onClick={() => setEditModal({ open: true, role: null })}>+ 新建</Button>
              <Button
                type="link"
                disabled={!selectedRole}
                onClick={() => selectedRole && setEditModal({ open: true, role: selectedRole })}
              >
                编辑
              </Button>

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
                  avatar={<KeyOutlined className="role-icon" />}
                  title={role.roleName}
                  description={`${role.roleCode}`}
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
            <Card
              title={selectedRole.roleName}
              styles={{ body: { padding: 8, minHeight: 670, maxHeight: 670, overflowY: 'auto' } }}>
              <Tabs
                activeKey={activeTab}
                onChange={(k) => setActiveTab(k as 'perms' | 'users')}
                items={[
                  {
                    key: 'perms',
                    label: `菜单权限 (${permissionDraft.length})`,
                    children: (
                      <>
                        <div className="text-right mb-2">
                          <Button type="primary" size="small" loading={saving} onClick={savePermissions}>保存</Button>
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
                    label: `关联用户 (${roleUsersDraft.length})`,
                    children: (
                      <>
                        {/* 主操作在右：+ 添加用户 为次要(default)，保存 为唯一 primary */}
                        <div className="text-right mb-2">
                          <Space size="small">
                            <Button size="small" onClick={() => setAddUserModal(true)}>+ 添加用户</Button>
                            <Button type="primary" size="small" loading={saving} onClick={saveRoleUsers}>保存</Button>
                          </Space>
                        </div>
                        <Table<JulyUserView>
                          rowKey="id"
                          size="small"
                          columns={userColumns}
                          dataSource={roleUsersDraft}
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
          excludedUserIds={userDraftIds}
          onConfirm={(userIds) => {
            setUserDraftIds(Array.from(new Set([...userDraftIds, ...userIds.map(String)])));
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
