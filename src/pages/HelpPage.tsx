/**
 * 帮助与反馈页 - PC 端（FAQ + 反馈表单 + 反馈历史）
 */
import React, { useState } from 'react';
import { ConfirmDialog } from '../components';

type FeedbackCategory = 'bug' | 'feature' | 'other';

interface FeedbackItem {
  id: number;
  category: string;
  content: string;
  time: string;
  status: 'pending' | 'replied';
  reply?: string;
}

export const HelpPage: React.FC = () => {
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);
  const [feedbackCategory, setFeedbackCategory] = useState<FeedbackCategory>('bug');
  const [feedback, setFeedback] = useState('');
  const [contact, setContact] = useState('');
  const [feedbackHistory, setFeedbackHistory] = useState<FeedbackItem[]>([
    { id: 1, category: '功能建议', content: '希望增加深色模式支持', time: '2026-09-10 14:30', status: 'replied', reply: '感谢您的建议，深色模式已在开发计划中，预计下月上线。' },
    { id: 2, category: '问题反馈', content: '用户列表页面加载较慢', time: '2026-09-08 09:15', status: 'pending' },
  ]);
  const [dialog, setDialog] = useState({ visible: false });

  const faqs = [
    { q: '如何创建新用户？', a: '进入「用户管理」→ 点击右上角「+ 新建用户」→ 在弹窗中填写信息（用户名、姓名、邮箱、手机号、组织、角色、密码）→ 点击保存。新建用户默认状态为「正常」。' },
    { q: '如何修改用户权限？', a: '进入「权限管理」→ 左侧选择角色 → 在「菜单权限」页签中勾选权限 → 点击「保存菜单权限」。角色决定了用户的权限范围。' },
    { q: '忘记密码怎么办？', a: '请联系系统管理员重置密码。管理员可在用户管理中直接处理，新密码会以邮件形式发送给用户。' },
    { q: '如何调整菜单结构？', a: '进入「菜单管理」→ 左侧树上右键节点可新建子菜单/编辑/删除 → 直接拖拽节点可调整层级，拖到底部虚线区可设为顶级。' },
    { q: '系统支持哪些浏览器？', a: '推荐使用 Chrome 120+、Safari 17+、Firefox 121+、Edge 120+ 等主流浏览器的最新版本。' },
    { q: '如何导出数据报表？', a: '进入「业务中心 → 数据导出」→ 选择导出格式（CSV/Excel/JSON/PDF）→ 勾选导出范围 → 点击导出。导出文件会自动下载到本地。' },
    { q: '审计日志保留多久？', a: '系统默认保留 90 天的审计日志。超过 90 天的日志会自动归档，如需更长时间保留请联系系统管理员调整配置。' },
    { q: '如何修改个人信息？', a: '点击左侧「个人中心」→ 进入个人信息页面 → 修改后保存。可修改的信息包括：头像、手机号、邮箱。' },
  ];

  const categoryOptions: { value: FeedbackCategory; label: string; icon: string }[] = [
    { value: 'bug', label: '问题反馈', icon: '🐛' },
    { value: 'feature', label: '功能建议', icon: '💡' },
    { value: 'other', label: '其他', icon: '💬' },
  ];

  const handleSubmitFeedback = () => {
    if (!feedback.trim()) return;
    const newFeedback: FeedbackItem = {
      id: Date.now(),
      category: categoryOptions.find(c => c.value === feedbackCategory)?.label || '',
      content: feedback,
      time: new Date().toLocaleString('zh-CN'),
      status: 'pending',
    };
    setFeedbackHistory(prev => [newFeedback, ...prev]);
    setFeedback('');
    setContact('');
    setDialog({ visible: true });
  };

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '0 12px', border: '1px solid var(--border)',
    borderRadius: 'var(--radius)', fontSize: '14px', outline: 'none', background: '#fff',
  };

  return (
    <div>
      <div className="page-header">
        <h2>帮助与反馈</h2>
        <p>常见问题与意见反馈</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '3fr 2fr', gap: '16px', alignItems: 'start' }}>
        {/* 常见问题 */}
        <div className="table-wrapper" style={{ padding: '0' }}>
          <div style={{ fontSize: '14px', fontWeight: 600, padding: '16px 20px', borderBottom: '1px solid var(--border-light)' }}>
            常见问题 <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 400 }}>({faqs.length} 条)</span>
          </div>
          {faqs.map((faq, index) => (
            <div key={index} style={{ borderBottom: index < faqs.length - 1 ? '1px solid var(--border-light)' : 'none' }}>
              <div
                onClick={() => setExpandedFaq(expandedFaq === index ? null : index)}
                style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '13px 20px', cursor: 'pointer' }}
              >
                <span style={{
                  width: '20px', height: '20px', borderRadius: '50%',
                  background: '#e6f7ff', color: '#1890ff',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '11px', fontWeight: 600, flexShrink: 0,
                }}>Q</span>
                <span style={{ flex: 1, fontSize: '14px' }}>{faq.q}</span>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)', transform: expandedFaq === index ? 'rotate(90deg)' : 'rotate(0)', transition: 'transform 0.2s' }}>▶</span>
              </div>
              {expandedFaq === index && (
                <div style={{ padding: '0 20px 14px 50px', fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.8 }}>
                  {faq.a}
                </div>
              )}
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* 意见反馈 */}
          <div className="table-wrapper" style={{ padding: '20px' }}>
            <div style={{ fontSize: '14px', fontWeight: 600, marginBottom: '14px' }}>意见反馈</div>

            <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
              {categoryOptions.map((cat) => (
                <button
                  key={cat.value}
                  onClick={() => setFeedbackCategory(cat.value)}
                  className={`btn ${feedbackCategory === cat.value ? 'btn-primary' : 'btn-default'}`}
                  style={{ flex: 1 }}
                >
                  {cat.icon} {cat.label}
                </button>
              ))}
            </div>

            <textarea
              style={{ ...inputStyle, height: '110px', padding: '12px', resize: 'none', marginBottom: '8px' }}
              placeholder="请详细描述您的问题或建议..."
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
            />
            <input
              style={{ ...inputStyle, height: '38px', marginBottom: '14px' }}
              placeholder="选填：手机号/邮箱，方便我们联系您"
              value={contact}
              onChange={(e) => setContact(e.target.value)}
            />
            <button className="btn btn-primary" onClick={handleSubmitFeedback} disabled={!feedback.trim()}
              style={{ width: '100%', opacity: feedback.trim() ? 1 : 0.5 }}>
              提交反馈
            </button>
          </div>

          {/* 联系方式 */}
          <div className="table-wrapper" style={{ padding: '20px' }}>
            <div style={{ fontSize: '14px', fontWeight: 600, marginBottom: '14px' }}>其他联系方式</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              {[
                { icon: '📧', label: '邮箱', value: 'support@enterprise.com' },
                { icon: '📞', label: '电话', value: '400-123-4567' },
                { icon: '💬', label: '微信', value: 'EnterpriseAdmin' },
                { icon: '🕐', label: '服务时间', value: '工作日 9:00-18:00' },
              ].map((item) => (
                <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ fontSize: '20px' }}>{item.icon}</span>
                  <div>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{item.label}</div>
                    <div style={{ fontSize: '13px' }}>{item.value}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 反馈历史 */}
      <div className="table-wrapper" style={{ marginTop: '16px' }}>
        <table className="data-table">
          <thead><tr><th>分类</th><th>反馈内容</th><th>状态</th><th>官方回复</th><th>时间</th></tr></thead>
          <tbody>
            {feedbackHistory.length === 0 ? (
              <tr><td colSpan={5} style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)' }}>📭 暂无反馈记录</td></tr>
            ) : feedbackHistory.map((item) => (
              <tr key={item.id}>
                <td><span className="status-badge" style={{ background: '#e6f7ff', color: '#1890ff' }}>{item.category}</span></td>
                <td style={{ fontWeight: 500 }}>{item.content}</td>
                <td>
                  <span className={`status-badge ${item.status === 'replied' ? 'status-active' : 'status-inactive'}`}>
                    {item.status === 'replied' ? '已回复' : '待处理'}
                  </span>
                </td>
                <td style={{ color: 'var(--text-secondary)', maxWidth: '360px' }}>
                  {item.reply || <span style={{ color: 'var(--text-muted)' }}>-</span>}
                </td>
                <td style={{ color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{item.time}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 提交成功提示 */}
      <ConfirmDialog
        visible={dialog.visible}
        title="提交成功"
        content="您的反馈已提交成功，我们会尽快处理并回复您！"
        onConfirm={() => setDialog({ visible: false })}
        onCancel={() => setDialog({ visible: false })}
        confirmText="好的"
      />
    </div>
  );
};
