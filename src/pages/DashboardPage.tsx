/**
 * 仪表盘页 - PC 端（antd）
 *
 * 「最近操作日志」走真实接口分页查询（julyUserAudit/v1/selectListByPage），
 * 取第一页 10 条；mock 模式下由 src/api/request.ts 自动命中内置 mock 后端，
 * 与 API 模式共用同一套信封解包逻辑，页面无感。
 */
import React, { useEffect, useState } from 'react';
import { Card, Col, Row, Statistic, Table, Tag } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { selectUserAuditListByPage } from '@/services/system011';
import { AUDIT_TYPE_LABEL, auditTypeColor } from '@/config/constants';
import { formatDateTime } from '@/utils/formatDate';
import { toast } from '@/utils/toast';
import type { JulyUserAuditVo011 } from '@/types/system011';

/** 最近操作日志取数条数（第一页） */
const RECENT_LOG_PAGE_SIZE = 10;

export const DashboardPage = () => {
  const stats = [
    { label: '用户总数', value: '12,480', change: '+12.5%', up: true, color: '#1890ff' },
    { label: '今日活跃', value: '3,256', change: '+8.3%', up: true, color: '#52c41a' },
    { label: '今日订单', value: '186', change: '-2.4%', up: false, color: '#faad14' },
    { label: '系统通知', value: '5', change: '', up: true, color: '#f5222d' },
  ];

  const [logs, setLogs] = useState<JulyUserAuditVo011[]>([]);
  const [logsLoading, setLogsLoading] = useState(false);

  // 最近操作日志：进页拉第一页 10 条。
  // setState 均发生在 await 之后，并用 cancelled 标记丢弃过期响应（react-hooks/set-state-in-effect）。
  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      setLogsLoading(true);
      try {
        const res = await selectUserAuditListByPage({ pageIndex: 1, pageSize: RECENT_LOG_PAGE_SIZE });
        if (cancelled) return;
        setLogs(res.rows);
      } catch (e) {
        if (cancelled) return;
        toast.error((e as Error)?.message || '加载操作日志失败');
        setLogs([]);
      } finally {
        if (!cancelled) setLogsLoading(false);
      }
    };
    void run();
    return () => { cancelled = true; };
  }, []);

  const columns: ColumnsType<JulyUserAuditVo011> = [
    { title: '时间', dataIndex: 'createTime', width: 170, render: (v) => formatDateTime(v) },
    { title: '操作者', dataIndex: 'userAccount', width: 120 },
    {
      title: '事件类型', dataIndex: 'auditType', width: 120,
      render: (t: string) => <Tag color={auditTypeColor(t)}>{AUDIT_TYPE_LABEL[t] || t}</Tag>,
    },
    { title: '描述', dataIndex: 'auditContent', render: (v) => v || '—' },
    { title: 'IP', dataIndex: 'auditIp', width: 140, render: (v) => v || '—' },
  ];

  return (
    <div>
      <div className="page-header"><h2>仪表盘</h2><p>系统运行概览</p></div>
      <Row gutter={[16, 16]} style={{ marginBottom: 20 }}>
        {stats.map((s) => (
          <Col span={6} key={s.label}>
            <Card>
              <Statistic title={s.label} value={s.value} styles={{ content: { color: s.color } }} />
              {s.change && (
                <div className="text-xs mt-2" style={{ color: s.up ? '#52c41a' : '#f5222d' }}>
                  {s.up ? '↑' : '↓'} {s.change} 较昨日
                </div>
              )}
            </Card>
          </Col>
        ))}
      </Row>
      <Card title="最近操作日志" className="table-wrapper" styles={{ body: { padding: 0 } }}>
        <Table<JulyUserAuditVo011>
          rowKey="id"
          columns={columns}
          dataSource={logs}
          loading={logsLoading}
          pagination={false}
          scroll={{ x: 760 }}
        />
      </Card>
    </div>
  );
};
