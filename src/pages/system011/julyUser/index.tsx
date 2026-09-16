/**
 * 用户列表页（julyUser）- antd 版
 * 列表读 julyUserStore；组织名读 julyOrganizationStore；分页/保存调 julyUserService。
 * 字段直接对齐后端（userAccount/userName/mobile/pkOrg/status），仅补充关联字段 department/roles。
 */
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { DatabaseOutlined, DeleteOutlined, DownloadOutlined, DownOutlined, PlusOutlined } from '@ant-design/icons';
import { Button, Card, Dropdown, Input, Popconfirm, Select, Space, Table, Tag } from 'antd';
import type { MenuProps } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { useRoleState } from '@/stores/system011/julyRoleStore';
import { loadRoles, exportUsers, backupUser011, removeUsers } from '@/services/system011';
import { useOrganizationState } from '@/stores/system011/julyOrganizationStore';
import { useUserState } from '@/stores/system011/julyUserStore';
import { PAGE_SIZE_OPTIONS } from '@/utils/pageSizePref';
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

/**
 * 表格体高度自适应：实测「卡片高度 - 表头 - 分页（含外边距）」。
 * 用 calc(100vh - Npx) 估值会随工具栏折行 / 窗口高度失准，残余高度就会顶出外层滚动条；
 * 这里的前提是 .page-fill 的 flex 布局让卡片高度由容器决定（与数据量无关，无循环依赖），
 * 卡片又 overflow:hidden，即使测量差 1~2px 也只会被卡片裁掉，不会外溢成页面滚动条。
 * signature：数据/加载态变化时补测一次（表头、分页会随数据出现或改变，而卡片高度不变 → ResizeObserver 不会触发）。
 */
function useTableFillHeight(
  cardRef: React.RefObject<HTMLDivElement | null>,
  signature?: unknown,
): number | undefined {
  const [height, setHeight] = useState<number>();
  const measureRef = useRef<() => void>(() => {});

  useEffect(() => {
    const card = cardRef.current;
    if (!card) return;

    measureRef.current = () => {
      const head = card.querySelector<HTMLElement>('.ant-table-header');
      const pager = card.querySelector<HTMLElement>('.ant-table-pagination');
      const headH = head?.offsetHeight ?? 47;
      let pagerH = 0;
      if (pager) {
        const cs = getComputedStyle(pager);
        pagerH = pager.offsetHeight + (parseFloat(cs.marginTop) || 0) + (parseFloat(cs.marginBottom) || 0);
      }
      const next = Math.max(120, Math.floor(card.clientHeight - headH - pagerH - 2));
      setHeight((prev) => (prev === next ? prev : next));
    };

    measureRef.current();
    // 首帧还是整表（无 scroll.y），表头/分页测量值不可靠 → 下一帧补测一次
    const timer = window.setTimeout(() => measureRef.current(), 0);
    const ro = new ResizeObserver(() => measureRef.current());
    ro.observe(card);
    return () => { ro.disconnect(); window.clearTimeout(timer); };
  }, [cardRef]);

  useEffect(() => { measureRef.current(); }, [signature]);

  return height;
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
  const cardRef = useRef<HTMLDivElement>(null);
  const tableBodyHeight = useTableFillHeight(cardRef, `${total}-${loading}`);

  // loadRoles 内部会拉组织树（填充 orgNameById）；用户分页单独拉。
  // 只重置 pageIndex：pageSize 是用户偏好（存在 store 里），传值会把它覆盖回默认 10。
  useEffect(() => { loadRoles(); }, []);
  useEffect(() => { fetchUserPage({ pageIndex: 1 }); }, []);

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
      title: '操作', key: 'action', width: 130, fixed: 'right', align: 'center', onHeaderCell: hdrCenter,
      render: (_, user) => (
        <Space size="small">
          <Button type="link" size="small" onClick={() => setModal({ open: true, user })}>编辑</Button>
          <Popconfirm
            title="确定删除这个用户吗？"
            okText="删除" cancelText="取消" okButtonProps={{ danger: true }}
            onConfirm={() => handleRemoveRow(user.id)}
          >
            <Button type="link" size="small" danger>删除</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

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
            color="primary" variant="filled"
            icon={<PlusOutlined />}
            onClick={() => setModal({ open: true, user: null })}
          >新建用户</Button>
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
            color="default" variant="filled"
            icon={<DatabaseOutlined />}
            loading={actionLoading === 'backup'}
            onClick={handleBackup}
          >备份011</Button>
          <Dropdown menu={exportMenu} trigger={['click']}>
            <Button
              color="default" variant="filled"
              icon={<DownloadOutlined />}
              loading={actionLoading === 'export'}
            >
              导出 <DownOutlined />
            </Button>
          </Dropdown>
        </div>
      </div>

      <Card className="table-wrapper" ref={cardRef} styles={{ body: { padding: 0 } }}>
        <Table<JulyUserView>
          rowKey="id"
          columns={columns}
          rowSelection={rowSelection}
          dataSource={dataSource}
          loading={loading}
          scroll={{ x: 1100, y: tableBodyHeight }}
          pagination={{
            current: query.pageIndex,
            pageSize: query.pageSize,
            total,
            showSizeChanger: true,
            pageSizeOptions: PAGE_SIZE_OPTIONS,
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
