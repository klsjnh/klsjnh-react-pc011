/**
 * 管理页面集合 - PC 端（antd）
 * 审计日志（对接 julyUserAudit）
 */
import React, { useState, useEffect } from 'react';
import { Button, Card, Input, Select, Table, Tag } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { selectUserAuditListByPage } from '@/services/system011';
import { toast } from '@/utils/toast';
import { downloadText } from '@/utils/download';
import { formatDate, formatDateTime, formatDateTimeOrEmpty } from '@/utils/formatDate';
import type { JulyUserAuditVo011 } from '@/types/system011';

// ==================== 审计日志 ====================

/** 事件类型 → 中文文案 */
const AUDIT_TYPE_LABEL: Record<string, string> = {
  LOGIN: '登录成功',
  LOGIN_FAILED: '登录失败',
  LOGOUT: '退出登录',
  CHANGE_PASSWORD: '修改密码',
  EXPORT: '导出',
};

/** 事件类型 → Tag 颜色 */
function auditColor(type: string): string {
  if (type === 'LOGIN_FAILED') return 'red';
  if (type === 'LOGIN' || type === 'LOGOUT') return 'green';
  return 'blue';
}

export const AuditPage = () => {
  const [logs, setLogs] = useState<JulyUserAuditVo011[]>([]);
  const [loading, setLoading] = useState(false);
  const [keyword, setKeyword] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const pageSize = 10;

  // 分页/筛选变化时拉取审计日志。
  // 所有 setState 均发生在 await 之后（异步），避免在 effect 同步阶段 setState 触发级联渲染
  // （react-hooks/set-state-in-effect）；同时用 cancelled 标记丢弃过期响应。
  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      setLoading(true);
      try {
        const res = await selectUserAuditListByPage({
          pageIndex: page,
          pageSize,
          userAccount: keyword.trim() || undefined,
          auditType: typeFilter || undefined,
        });
        if (cancelled) return;
        setLogs(res.rows);
        setTotal(res.total);
      } catch (e) {
        if (cancelled) return;
        toast.error((e as Error)?.message || '加载审计日志失败');
        setLogs([]);
        setTotal(0);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    void run();
    return () => { cancelled = true; };
  }, [page, keyword, typeFilter]);

  /** 导出当前页为 CSV */
  const handleExport = () => {
    const header = ['时间', '操作者账号', '事件类型', '对象编码', '事件描述', 'IP'];
    const lines = logs.map((l) => [
      formatDateTimeOrEmpty(l.createTime), l.userAccount, AUDIT_TYPE_LABEL[l.auditType] || l.auditType,
      l.objectCode, l.auditContent, l.auditIp,
    ].map((v) => `"${String(v ?? '').replace(/"/g, '""')}"`).join(','));
    const csv = '\uFEFF' + [header.join(','), ...lines].join('\r\n');
    downloadText(csv, `julyUserAudit-${formatDate(new Date().toISOString())}.csv`, 'csv');
    toast.success(`导出 ${logs.length} 条成功`);
  };

  const columns: ColumnsType<JulyUserAuditVo011> = [
    { title: '时间', dataIndex: 'createTime', width: 170, render: (v) => formatDateTime(v) },
    { title: '操作者', dataIndex: 'userAccount', width: 120 },
    {
      title: '事件类型', dataIndex: 'auditType', width: 120,
      render: (t: string) => <Tag color={auditColor(t)}>{AUDIT_TYPE_LABEL[t] || t}</Tag>,
    },
    { title: '对象', dataIndex: 'objectCode', width: 140, render: (v) => v || '—' },
    { title: '描述', dataIndex: 'auditContent', render: (v) => v || '—' },
    { title: 'IP', dataIndex: 'auditIp', width: 140, render: (v) => v || '—' },
  ];

  return (
    <div>
      <div className="page-header"><h2>审计日志</h2><p>共 {total} 条记录 · 接口 /julyUserAudit/v1/selectListByPage</p></div>

      <div className="page-toolbar">
        <div className="toolbar-left">
          <Input.Search
            allowClear className="search-input" placeholder="搜索操作者账号"
            onSearch={(v) => { setKeyword(v); setPage(1); }}
          />
          <Select
            className="filter-select"
            value={typeFilter}
            onChange={(v) => { setTypeFilter(v); setPage(1); }}
            options={[
              { value: '', label: '全部事件类型' },
              { value: 'LOGIN', label: '登录成功' },
              { value: 'LOGIN_FAILED', label: '登录失败' },
              { value: 'LOGOUT', label: '退出登录' },
              { value: 'CHANGE_PASSWORD', label: '修改密码' },
              { value: 'EXPORT', label: '导出' },
            ]}
          />
        </div>
        <div className="toolbar-right">
          <Button onClick={handleExport} disabled={logs.length === 0}>导出当前页</Button>
        </div>
      </div>

      <Card className="table-wrapper" styles={{ body: { padding: 0 } }}>
        <Table<JulyUserAuditVo011>
          rowKey="id"
          columns={columns}
          dataSource={logs}
          loading={loading}
          scroll={{ x: 1000 }}
          pagination={{
            current: page, pageSize, total,
            showSizeChanger: false, showTotal: (t) => `共 ${t} 条`,
            onChange: (p) => setPage(p),
          }}
        />
      </Card>
    </div>
  );
};
