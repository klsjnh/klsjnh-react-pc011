/**
 * 消息通知页 - PC 端（antd，数据来自 notificationStore）
 */
import React, { useState, useEffect } from 'react';
import { Button, Card, List, Modal, Select, Tag, Typography } from 'antd';
import { notificationStore, useNotificationState } from '@/stores/notificationStore';
import type { FilterType } from '@/types/view/page';

const TYPE_ICON: Record<string, string> = { system: '🔔', user: '👤', order: '📦' };
const TYPE_LABEL: Record<string, string> = { system: '系统', user: '用户', order: '订单' };

export const NotificationsPage: React.FC = () => {
  const { notifications } = useNotificationState();
  const [filter, setFilter] = useState<FilterType>('all');
  const [selected, setSelected] = useState<(typeof notifications)[number] | null>(null);

  useEffect(() => { notificationStore.load(); }, []);

  const filtered = notifications.filter((n) => filter === 'all' || n.type === filter);
  const unreadCount = notifications.filter((n) => !n.read).length;

  const open = (id: number) => {
    const n = notifications.find((x) => x.id === id) || null;
    setSelected(n);
    notificationStore.markAsRead(id);
  };

  return (
    <div>
      <div className="page-header"><h2>消息通知</h2><p>{unreadCount} 条未读</p></div>

      <div className="page-toolbar">
        <div className="toolbar-left">
          <Select
            className="filter-select"
            value={filter}
            onChange={setFilter}
            options={[
              { value: 'all', label: '全部类型' }, { value: 'system', label: '系统' },
              { value: 'user', label: '用户' }, { value: 'order', label: '订单' },
            ]}
          />
        </div>
        <div className="toolbar-right">
          {unreadCount > 0 && <Button onClick={() => notificationStore.markAllRead()}>全部已读</Button>}
        </div>
      </div>

      <Card className="table-wrapper" styles={{ body: { padding: 0 } }}>
        <List
          dataSource={filtered}
          locale={{ emptyText: '📭 暂无通知' }}
          renderItem={(n) => (
            <List.Item
              style={{ cursor: 'pointer', paddingLeft: 20, paddingRight: 20 }}
              onClick={() => open(n.id)}
              actions={[
                <Button key="view" type="link" size="small" onClick={(e) => { e.stopPropagation(); open(n.id); }}>查看</Button>,
                <Button key="del" type="link" size="small" danger onClick={(e) => { e.stopPropagation(); notificationStore.remove(n.id); }}>删除</Button>,
              ]}
            >
              <List.Item.Meta
                avatar={!n.read ? <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: 'var(--primary)' }} /> : <span style={{ width: 8 }} />}
                title={<span style={{ fontWeight: n.read ? 400 : 600 }}>{TYPE_ICON[n.type]} {n.title}</span>}
                description={<Typography.Text type="secondary" ellipsis>{n.content}</Typography.Text>}
              />
              <Typography.Text type="secondary" className="text-sm">{n.time}</Typography.Text>
            </List.Item>
          )}
        />
      </Card>

      <Modal
        title={selected ? `${TYPE_ICON[selected.type]} ${selected.title}` : ''}
        open={!!selected}
        onCancel={() => setSelected(null)}
        footer={[
          <Button key="del" danger onClick={() => { if (selected) notificationStore.remove(selected.id); setSelected(null); }}>删除</Button>,
          <Button key="close" type="primary" onClick={() => setSelected(null)}>关闭</Button>,
        ]}
      >
        {selected && (
          <>
            <div style={{ padding: 12, background: '#f5f7fa', borderRadius: 8, lineHeight: 1.8, color: 'var(--text-secondary)' }}>
              {selected.content}
            </div>
            <div className="flex-center gap-8 mt-12">
              <Tag color="blue">{TYPE_LABEL[selected.type]}</Tag>
              <Typography.Text type="secondary" className="text-sm">{selected.time}</Typography.Text>
            </div>
          </>
        )}
      </Modal>
    </div>
  );
};
