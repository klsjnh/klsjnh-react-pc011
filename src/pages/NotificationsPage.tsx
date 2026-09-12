/**
 * 消息通知页 - PC 端（分类筛选 + 详情弹窗 + 删除 + 全部已读）
 * 数据来源：notificationStore（与顶栏未读红点共用）
 */
import React, { useState, useEffect } from 'react';
import { notificationStore, useNotificationState } from '../stores/notificationStore';

type FilterType = 'all' | 'system' | 'user' | 'order';

export const NotificationsPage: React.FC = () => {
  const { notifications } = useNotificationState();
  const [filter, setFilter] = useState<FilterType>('all');
  const [selectedNotif, setSelectedNotif] = useState<(typeof notifications)[number] | null>(null);

  useEffect(() => { notificationStore.load(); }, []);

  const markAsRead = (id: number) => notificationStore.markAsRead(id);
  const markAllRead = () => notificationStore.markAllRead();
  const deleteNotif = (id: number) => {
    notificationStore.remove(id);
    setSelectedNotif(null);
  };

  const filtered = notifications.filter(n => filter === 'all' || n.type === filter);
  const unreadCount = notifications.filter(n => !n.read).length;

  const typeIcon: Record<string, string> = { system: '🔔', user: '👤', order: '📦' };
  const typeLabel: Record<string, string> = { system: '系统', user: '用户', order: '订单' };

  return (
    <div>
      <div className="page-header">
        <h2>消息通知</h2>
        <p>{unreadCount} 条未读</p>
      </div>

      <div className="page-toolbar">
        <div className="toolbar-left">
          <select className="form-select" value={filter} onChange={(e) => setFilter(e.target.value as FilterType)}>
            <option value="all">全部类型</option>
            <option value="system">系统</option>
            <option value="user">用户</option>
            <option value="order">订单</option>
          </select>
        </div>
        <div className="toolbar-right">
          {unreadCount > 0 && (
            <button className="btn btn-default" onClick={markAllRead}>全部已读</button>
          )}
        </div>
      </div>

      <div className="table-wrapper">
        <table className="data-table">
          <thead><tr><th style={{ width: '40px' }}></th><th>类型</th><th>标题</th><th>内容</th><th>时间</th><th style={{ width: '110px' }}>操作</th></tr></thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={6} style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)' }}>📭 暂无通知</td></tr>
            ) : filtered.map(notif => (
              <tr key={notif.id} style={{ cursor: 'pointer' }} onClick={() => { setSelectedNotif(notif); markAsRead(notif.id); }}>
                <td>{!notif.read && <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', background: 'var(--primary)' }} />}</td>
                <td>{typeIcon[notif.type]} {typeLabel[notif.type]}</td>
                <td style={{ fontWeight: notif.read ? 400 : 600 }}>{notif.title}</td>
                <td style={{ color: 'var(--text-muted)', maxWidth: '420px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{notif.content}</td>
                <td style={{ color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{notif.time}</td>
                <td onClick={(e) => e.stopPropagation()}>
                  <div style={{ display: 'flex', gap: '4px' }}>
                    <button className="btn-link" onClick={() => { setSelectedNotif(notif); markAsRead(notif.id); }}>查看</button>
                    <button className="btn-link danger" onClick={() => deleteNotif(notif.id)}>删除</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 通知详情弹窗 */}
      {selectedNotif && (
        <div className="modal-overlay" onClick={() => setSelectedNotif(null)}>
          <div className="modal-container" style={{ width: '560px' }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{typeIcon[selectedNotif.type]} {selectedNotif.title}</h3>
              <button className="modal-close" onClick={() => setSelectedNotif(null)}>×</button>
            </div>
            <div className="modal-body">
              <div style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.8, marginBottom: '14px', padding: '12px', background: '#f5f7fa', borderRadius: '8px' }}>
                {selectedNotif.content}
              </div>
              <div style={{ display: 'flex', gap: '8px', fontSize: '12px', color: 'var(--text-muted)' }}>
                <span className="status-badge" style={{ background: '#f0f5ff', color: '#597ef7' }}>{typeLabel[selectedNotif.type]}</span>
                <span>{selectedNotif.time}</span>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-default" onClick={() => { deleteNotif(selectedNotif.id); }}>删除</button>
              <button className="btn btn-primary" onClick={() => setSelectedNotif(null)}>关闭</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
