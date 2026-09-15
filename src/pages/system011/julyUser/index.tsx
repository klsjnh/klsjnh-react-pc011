/**
 * 用户列表页（julyUser）- antd 版
 * 列表读 julyUserStore；组织名读 julyOrganizationStore；分页/保存调 julyUserService。
 * 字段直接对齐后端（userAccount/userName/mobile/pkOrg/status），仅补充关联字段 department/roles。
 */
import React, { useEffect, useMemo, useState } from 'react';
import { DatabaseOutlined, DeleteOutlined, DownloadOutlined, DownOutlined, PlusOutlined } from '@ant-design/icons';
import { Button, Card, Dropdown, Input, Popconfirm, Select, Space, Table, Tag } from 'antd';
import type { MenuProps } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { useRoleState } from '@/stores/system011/julyRoleStore';
import { loadRoles, exportUsers, backupUser011, removeUsers } from '@/services/system011';
import { useOrganizationState } from '@/stores/system011/julyOrganizationStore';
import { useUserState } from '@/stores/system011/julyUserStore';
import { fetchUserPage } from '@/services/system011';
import { toast } from '@/utils/toast';
import { mockRelations } from '@/mock/system011';
import { JulyUserFormModal } from '@/pages/system011/julyUser/JulyUserFormModal';
import type { JulyUserVo011, JulyUserView } from '@/types/system011/julyUser';

/** 表头单元格水平居中 */
const hdrCenter = (): React.HTMLAttributes<HTMLElement> => ({ style: { textAlign: 'center' } });

/** 数据内容左对齐 + 表头居中 */
const leftCell = { align: 'left' as const, onHeaderCell: hdrCenter };

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
  const [actionLoading, setActionLoading] = useState<'export' | 'backup' | null>(null);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [batchDeleting, setBatchDeleting] = useState(false);

  // loadRoles 内部会拉组织树（填充 orgNameById）；用户分页单独拉
  useEffect(() => { loadRoles(); }, []);
  useEffect(() => { fetchUserPage({ pageIndex: 1, pageSize: 10 }); }, []);

  const users = useMemo(() => list.map((u) => toView(u, orgNameById)), [list, orgNameById]);
  const dataSource = users.filter((u) => !statusFilter || u.status === statusFilter);
  const roleLabel = (code: string) => roles.find((r) => r.roleCode === code)?.roleName || code;

  // 导出全部用户 -> 下载细节收敛在 service，页面只反馈结果
  const handleExport = async (format: 'json' | 'csv' = 'csv') => {
    setActionLoading('export');
    try {
      const res = await exportUsers(format);
      toast.success(`export julyUser success, ${res.rowCount} rows (${format})`);
    } catch (e) {
      toast.error((e as Error)?.message || '导出失败，请重试');
    } finally {
      setActionLoading(null);
    }
  };

  // 备份全部用户 -> 返回 object key
  const handleBackup = async () => {
    setActionLoading('backup');
    try {
      const key = await backupUser011();
      toast.success(`backup julyUser success, key=${key}`);
    } catch (e) {
      toast.error((e as Error)?.message || '备份失败，请重试');
    } finally {
      setActionLoading(null);
    }
  };

  const exportMenu: MenuProps = {
    items: [
      { key: 'json', label: 'JSON (.json)' },
      { key: 'csv', label: 'CSV (.csv)' },
    ],
    onClick: ({ key }) => handleExport(key as 'json' | 'csv'),
  };

  // 批量逻辑删除（选中行 -> service，删除/刷新已收敛在 service）
  const handleBatchRemove = async () => {
    if (!selectedRowKeys.length) return;
    setBatchDeleting(true);
    try {
      const res = await removeUsers(selectedRowKeys.map(String));
      setSelectedRowKeys([]);
      toast.success(`批量删除成功 ${res.success} 条，失败 ${res.failed} 条`);
    } catch (e) {
      toast.error((e as Error)?.message || '批量删除失败，请重试');
    } finally {
      setBatchDeleting(false);
    }
  };

  const rowSelection = {
    selectedRowKeys,
    onChange: (keys: React.Key[]) => setSelectedRowKeys(keys),
  };

  const columns: ColumnsType<JulyUserView> = [
    { ...leftCell, title: '用户名', dataIndex: 'userAccount', width: 120 },
    { ...leftCell, title: '姓名', dataIndex: 'userName', width: 160 },
    { ...leftCell, title: '邮箱', dataIndex: 'email', width: 230, render: (v) => v || '—' },
    { ...leftCell, title: '手机号', dataIndex: 'mobile', width: 130, render: (v) => v || '—' },
    { ...leftCell, title: '组织', dataIndex: 'department', width: 140, render: (v) => v || '—' },
    {
      title: '角色', dataIndex: 'roles', width: 160, align: 'left', onHeaderCell: hdrCenter,
      render: (codes: string[]) => codes.length === 0
        ? '—'
        : codes.map((c) => <Tag key={c} color="blue">{roleLabel(c)}</Tag>),
    },
    {
      title: '状态', dataIndex: 'status', width: 90, align: 'center', onHeaderCell: hdrCenter,
      render: (s: string) => <Tag color={s === '1' ? 'green' : 'red'}>{s === '1' ? '正常' : '停用'}</Tag>,
    },
    { ...leftCell, title: '最近登录', dataIndex: 'lastLoginTime', width: 160, render: (v) => v || '—' },
    {
      title: '操作', key: 'action', width: 90, fixed: 'right', align: 'center', onHeaderCell: hdrCenter,
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
      </div>

      <div className="page-toolbar" style={{ display: 'block' }}>
        <div className="toolbar-row-search" style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
          <Input.Search
            allowClear
            placeholder="搜索账号"
            style={{ width: 260 }}
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            onSearch={(v) => fetchUserPage({ pageIndex: 1, userAccount: v || undefined })}
          />
          <Select
            style={{ width: 140 }}
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
          <Button icon={<PlusOutlined />} onClick={() => setModal({ open: true, user: null })}
            style={{ background: '#52c41a', borderColor: '#52c41a', color: '#fff' }}>新建用户</Button>
          <Popconfirm
            title={`确定要删除选中的 ${selectedRowKeys.length} 个用户吗？`}
            okText="删除" cancelText="取消" okButtonProps={{ danger: true }}
            onConfirm={handleBatchRemove}
            disabled={!selectedRowKeys.length}
          >
            <Button
              icon={<DeleteOutlined />}
              disabled={!selectedRowKeys.length}
              loading={batchDeleting}
              style={
                selectedRowKeys.length
                  ? { background: '#ff4d4f', borderColor: '#ff4d4f', color: '#fff' }
                  : { background: '#f5f5f5', borderColor: '#d9d9d9', color: 'rgba(0, 0, 0, 0.25)' }
              }
            >批量删除</Button>
          </Popconfirm>
          <Button icon={<DatabaseOutlined />} loading={actionLoading === 'backup'} onClick={handleBackup}
            style={{ background: '#faad14', borderColor: '#faad14', color: '#fff' }}>备份011</Button>
          <Dropdown menu={exportMenu} trigger={['click']}>
            <Button icon={<DownloadOutlined />} loading={actionLoading === 'export'}
              style={{ background: '#1677ff', borderColor: '#1677ff', color: '#fff' }}>
              导出 <DownOutlined />
            </Button>
          </Dropdown>
        </div>
      </div>

      <Card className="table-wrapper" styles={{ body: { padding: 0 } }}>
        <Table<JulyUserView>
          rowKey="id"
          columns={columns}
          rowSelection={rowSelection}
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
