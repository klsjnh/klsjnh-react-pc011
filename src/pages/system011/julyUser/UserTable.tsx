/**
 * 用户表格（julyUser 主表）
 * 只负责表格渲染（store 取数 / 视图映射 / 列定义 / 勾选 / 分页 / 实测高度）；
 * 工具栏 / 弹窗 / 删除与批量删除处理由 index 页面壳编排（行内动作经回调上抛）。
 */
import React, { useMemo, useRef } from 'react';
import { Button, Card, Popconfirm, Space, Table, Tag } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { KlsjnhStatusTag011 } from '@/components/klsjnh011';
import { useRoleState } from '@/stores/system011/julyRoleStore';
import { useOrganizationState } from '@/stores/system011/julyOrganizationStore';
import { useUserState } from '@/stores/system011/julyUserStore';
import { useTableFillHeight } from '@/hooks/useTableFillHeight';
import { PAGE_SIZE_OPTIONS } from '@/utils/pageSizePref';
import { fetchUserPage } from '@/services/system011';
import { mockRelations } from '@/mock/system011';
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

export interface UserTableProps {
  /** 状态筛选（index 工具栏下拉；'' = 全部，客户端过滤） */
  statusFilter: string;
  /** 勾选行（index 持有，批量删除按钮消费） */
  selectedRowKeys: React.Key[];
  /** 勾选变化回调 */
  onSelectionChange: (keys: React.Key[]) => void;
  /** 行内「编辑」回调（弹窗状态由页面壳持有） */
  onEdit: (user: JulyUserView) => void;
  /** 行内「删除」回调（删除与选中态清理由页面壳处理） */
  onRemove: (id: string) => void;
}

export const UserTable = ({ statusFilter, selectedRowKeys, onSelectionChange, onEdit, onRemove }: UserTableProps) => {
  const { roles } = useRoleState();
  const { orgNameById } = useOrganizationState();
  const { list, total, loading, query } = useUserState();
  const cardRef = useRef<HTMLDivElement>(null);
  const tableBodyHeight = useTableFillHeight(cardRef, `${total}-${loading}`);

  const users = useMemo(() => list.map((u) => toView(u, orgNameById)), [list, orgNameById]);
  const dataSource = users.filter((u) => !statusFilter || u.status === statusFilter);
  const roleLabel = (code: string) => roles.find((r) => r.roleCode === code)?.roleName || code;

  const rowSelection = {
    selectedRowKeys,
    onChange: (keys: React.Key[]) => onSelectionChange(keys),
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
      render: (s: string) => <KlsjnhStatusTag011 value={s} labels={{ '1': '正常' }} />
    },
    { ...leftCell, title: '最近登录', dataIndex: 'lastLoginTime', width: 160, render: (v) => v || '—' },
    {
      title: '操作', key: 'action', width: 130, fixed: 'right', align: 'center', onHeaderCell: hdrCenter,
      render: (_, user) => (
        <Space size="small">
          <Button color="primary" variant="filled" size="small" onClick={() => onEdit(user)}>编辑</Button>
          <Popconfirm
            title="确定删除这个用户吗？"
            okText="删除" cancelText="取消" okButtonProps={{ danger: true }}
            onConfirm={() => onRemove(user.id)}
          >
            <Button color="danger" variant="filled" size="small" danger>删除</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
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
  );
};

export default UserTable;
