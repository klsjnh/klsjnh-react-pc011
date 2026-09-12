/**
 * 消息通知页 - PC 端（分类筛选 + 详情弹窗 + 删除 + 全部已读）
 */
import React, { useState } from 'react';
import { ConfirmDialog } from '../components';

type FilterType = 'all' | 'system' | 'user' | 'order';

interface Notification {
  id: number;
  title: string;
  content: string;
  time: string;
  read: boolean;
  type: 'system' | 'user' | 'order';
}

export const NotificationsPage: React.FC = () => {
  const [notifications, setNotifications] = useState<Notification[]>([
    { id: 1, title: '系统更新通知', content: '系统将于今晚 22:00-22:30 进行维护升级，升级期间可能无法正常访问。升级内容：优化系统性能、修复已知问题、新增数据导出功能。请提前做好相关准备。', time: '2026-09-12 09:30:00', read: false, type: 'system' },
    { id: 2, title: '新用户注册审核', content: '用户「张三」已完成注册申请，请前往用户管理页面进行审核。注册时间：2026-09-12 09:25:00，注册邮箱：zhangsan@example.com。', time: '2026-09-12 09:25:00', read: false, type: 'user' },
    { id: 3, title: '订单支付成功', content: '订单 #20260912001 已支付成功，金额 ¥299.00。买家：李四，商品：企业管理系统年度会员。请及时处理订单发货。', time: '2026-09-12 09:00:00', read: true, type: 'order' },
    { id: 4, title: '权限变更提醒', content: '您的角色权限已被修改。变更内容：新增「数据报表」查看权限，移除「菜单管理」编辑权限。当前角色：部门经理。', time: '2026-09-12 08:00:00', read: true, type: 'system' },
    { id: 5, title: '数据备份完成', content: '系统数据已于 2026-09-12 06:00 自动备份完成。备份大小：256MB，备份位置：云端存储，保留天数：30天。', time: '2026-09-12 06:00:00', read: true, type: 'system' },
    { id: 6, title: '新订单提醒', content: '您有 3 个新订单待处理。订单号：#20260911001、#20260911002、#20260911003，总金额 ¥1,256.00。', time: '2026-09-11 17:30:00', read: true, type: 'order' },
    { id: 7, title: '用户反馈', content: '用户「王五」提交了新的反馈：系统登录页面加载速度较慢，建议优化。反馈时间：2026-09-11 16:20:00。', time: '2026-09-11 16:20:00', read: true, type: 'user' },
    { id: 8, title: '安全警告', content: '检测到异常登录尝试。IP：45.33.22.11，地点：美国加利福尼亚州，时间：2026-09-11 14:00:00。如非本人操作请立即修改密码。', time: '2026-09-11 14:00:00', read: false, type: 'system' },
  ]);
  const [filter, setFilter] = useState<FilterType>('all');
  const [selectedNotif, setSelectedNotif] = useState<Notification | null>(null);
  const [dialog, setDialog] = useState({ visible: false });

  const markAsRead = (id: number) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const markAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const deleteNotif = (id: number) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
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

      <ConfirmDialog
        visible={dialog.visible}
        title="删除通知"
        content="确定要删除这条通知吗？"
        onConfirm={() => setDialog({ visible: false })}
        onCancel={() => setDialog({ visible: false })}
        danger
      />
    </div>
  );
};
