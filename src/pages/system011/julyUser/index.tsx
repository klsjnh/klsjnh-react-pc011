/**
 * 用户列表页（julyUser）页面壳 —— 单表金标准
 * 组件拆分（3 文件）：
 *  - 本壳：页头 + 工具栏（搜索/状态筛选 + 新建/批量删除/备份/导出）+ 组装
 *  - UserTable            表格（列定义 / 勾选 / 分页 / 实测高度；行内动作回调上抛）
 *  - JulyUserFormModal    新建 / 编辑弹窗
 * 金标准口径（2026-09-21 用户定稿）：工具栏配色 green 新建 / blue 备份 / pink 导出；
 * 行内操作 filled 小按钮；「新建」不带资源后缀；状态筛选走客户端过滤。
 */
import React, { useEffect, useState } from 'react';
import { DatabaseOutlined, DeleteOutlined, DownloadOutlined, DownOutlined, PlusOutlined } from '@ant-design/icons';
import { Button, Dropdown, Input, Popconfirm, Select } from 'antd';
import type { MenuProps } from 'antd';
import { loadRoles, exportUsers, backupUser011, removeUsers, fetchUserPage } from '@/services/system011';
import { toast } from '@/utils/toast';
import { useRoleState } from '@/stores/system011/julyRoleStore';
import { useOrganizationState } from '@/stores/system011/julyOrganizationStore';
import { UserTable } from '@/pages/system011/julyUser/UserTable';
import { JulyUserFormModal } from '@/pages/system011/julyUser/JulyUserFormModal';
import type { JulyUserView } from '@/types/system011/julyUser';

export const JulyUser = () => {
  const { roles } = useRoleState();
  const { tree: orgTree } = useOrganizationState();
  const [keyword, setKeyword] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [modal, setModal] = useState<{ open: boolean; user: JulyUserView | null }>({ open: false, user: null });
  const [actionLoading, setActionLoading] = useState<'export' | 'backup' | null>(null);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [batchDeleting, setBatchDeleting] = useState(false);

  // loadRoles 内部会拉组织树（填充 orgNameById）；用户分页单独拉。
  // 只重置 pageIndex：pageSize 是用户偏好（存在 store 里），传值会把它覆盖回默认 10。
  useEffect(() => { loadRoles(); }, []);
  useEffect(() => { fetchUserPage({ pageIndex: 1 }); }, []);

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

  // 导出格式下拉（json / csv）
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

  // 行级删除（与批量删除同一个 service，刷新已收敛在 service 内）
  const handleRemoveRow = async (id: string) => {
    try {
      const res = await removeUsers([String(id)]);
      setSelectedRowKeys((keys) => keys.filter((k) => String(k) !== String(id)));
      toast.success(`删除成功 ${res.success} 条，失败 ${res.failed} 条`);
    } catch (e) {
      toast.error((e as Error)?.message || '删除失败，请重试');
    }
  };

  return (
    <div className="page-fill">

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
          {/* 浅底 tonal（variant="filled"）：颜色表达强度、跟随主题 token，不再写死色 */}
          <Button
            color="green" variant="filled"
            icon={<PlusOutlined />}
            onClick={() => setModal({ open: true, user: null })}
          >新建</Button>
          <Popconfirm
            title={`确定要删除选中的 ${selectedRowKeys.length} 个用户吗？`}
            okText="删除" cancelText="取消" okButtonProps={{ danger: true }}
            onConfirm={handleBatchRemove}
            disabled={!selectedRowKeys.length}
          >
            <Button
              color="danger" variant="filled"
              icon={<DeleteOutlined />}
              disabled={!selectedRowKeys.length}
              loading={batchDeleting}
            >批量删除</Button>
          </Popconfirm>
          <Button
            color="blue" variant="filled"
            icon={<DatabaseOutlined />}
            loading={actionLoading === 'backup'}
            onClick={handleBackup}
          >备份011</Button>
          <Dropdown menu={exportMenu} trigger={['click']}>
            <Button
              color="pink" variant="filled"
              icon={<DownloadOutlined />}
              loading={actionLoading === 'export'}
            >
              导出 <DownOutlined />
            </Button>
          </Dropdown>
        </div>
      </div>

      <UserTable
        statusFilter={statusFilter}
        selectedRowKeys={selectedRowKeys}
        onSelectionChange={setSelectedRowKeys}
        onEdit={(user) => setModal({ open: true, user })}
        onRemove={handleRemoveRow}
      />

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

export default JulyUser;
