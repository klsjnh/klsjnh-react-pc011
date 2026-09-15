/**
 * 用户穿梭框组件（antd）— 组织树 + 用户列表 + 已选面板
 * 用于角色管理添加用户
 */
import React, { useState, useMemo } from 'react';
import { Button, Card, Checkbox, Col, Input, List, Modal, Row, Tree, Typography } from 'antd';
import { FolderOpenOutlined } from '@ant-design/icons';
import type { DataNode } from 'antd/es/tree';
import type { NodeId, OrgTreeNode } from '@/types/view/common';
import type { TransferUser } from '@/types/view/transfer';
import type { UserTransferModalProps } from '@/types/view/components';

export type { NodeId, OrgTreeNode, TransferUser };

function toTreeData(list: OrgTreeNode[]): DataNode[] {
  return list.map((n) => ({
    title: n.name,
    key: n.id,
    children: n.children?.length ? toTreeData(n.children) : undefined,
  }));
}

export const UserTransferModal = ({
  title, orgTree, allUsers, excludedUserIds, onConfirm, onCancel,
}: UserTransferModalProps) => {
  const [selectedOrgId, setSelectedOrgId] = useState<NodeId | null>(null);
  const [keyword, setKeyword] = useState('');
  const [selectedUserIds, setSelectedUserIds] = useState<Set<NodeId>>(new Set());

  const availableUsers = useMemo(
    () => allUsers.filter((u) => !excludedUserIds.includes(u.id)),
    [allUsers, excludedUserIds],
  );

  const filteredUsers = useMemo(() => availableUsers.filter((u) => {
    if (selectedOrgId !== null && u.departmentId !== selectedOrgId) return false;
    if (keyword && !u.realName.includes(keyword) && !u.username.includes(keyword)) return false;
    return true;
  }), [availableUsers, selectedOrgId, keyword]);

  const selectedUsers = useMemo(
    () => availableUsers.filter((u) => selectedUserIds.has(u.id)),
    [availableUsers, selectedUserIds],
  );

  const toggleSelect = (id: NodeId) => {
    setSelectedUserIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const handleConfirm = () => {
    if (selectedUserIds.size > 0) onConfirm(Array.from(selectedUserIds));
  };

  return (
    <Modal
      title={title}
      open
      onCancel={onCancel}
      onOk={handleConfirm}
      okText={`确认添加 (${selectedUserIds.size})`}
      cancelText="取消"
      okButtonProps={{ disabled: selectedUserIds.size === 0 }}
      width={780}
      destroyOnClose
    >
      <Row gutter={10} style={{ minHeight: 360 }}>
        <Col span={6}>
          <Card size="small" title="组织架构" styles={{ body: { height: 360, overflowY: 'auto' } }}>
            <Button
              type={selectedOrgId === null ? 'primary' : 'text'}
              size="small"
              block
              style={{ textAlign: 'left', marginBottom: 4 }}
              onClick={() => setSelectedOrgId(null)}
            >
              <FolderOpenOutlined /> 全部部门
            </Button>
            <Tree
              defaultExpandAll
              selectedKeys={selectedOrgId !== null ? [String(selectedOrgId)] : []}
              treeData={toTreeData(orgTree)}
              onSelect={(keys) => setSelectedOrgId(keys.length ? (keys[0] as string) : null)}
            />
          </Card>
        </Col>

        <Col span={12}>
          <Card
            size="small"
            title="可选用户"
            extra={<Input.Search size="small" allowClear placeholder="搜索姓名/用户名" onSearch={setKeyword} onChange={(e) => setKeyword(e.target.value)} />}
            styles={{ body: { height: 360, overflowY: 'auto', padding: 0 } }}
          >
            <List
              size="small"
              dataSource={filteredUsers}
              locale={{ emptyText: '暂无可选用户' }}
              renderItem={(u) => (
                <List.Item
                  style={{ cursor: 'pointer', paddingLeft: 12, paddingRight: 12 }}
                  onClick={() => toggleSelect(u.id)}
                >
                  <Checkbox checked={selectedUserIds.has(u.id)} />
                  <span style={{ marginLeft: 8, fontWeight: 500 }}>{u.realName}</span>
                  <Typography.Text type="secondary" className="text-xs">@{u.username}</Typography.Text>
                  <span style={{ marginLeft: 'auto' }} className="text-muted text-xs">{u.department}</span>
                </List.Item>
              )}
            />
          </Card>
        </Col>

        <Col span={6}>
          <Card size="small" title={`已选用户 (${selectedUsers.length})`} styles={{ body: { height: 360, overflowY: 'auto', padding: 0 } }}>
            <List
              size="small"
              dataSource={selectedUsers}
              locale={{ emptyText: '点击中间用户添加' }}
              renderItem={(u) => (
                <List.Item
                  style={{ paddingLeft: 12, paddingRight: 12 }}
                  actions={[<Button key="rm" type="link" size="small" danger onClick={() => toggleSelect(u.id)}>移除</Button>]}
                >
                  <span style={{ fontWeight: 500 }}>{u.realName}</span>
                </List.Item>
              )}
            />
          </Card>
        </Col>
      </Row>
    </Modal>
  );
};
