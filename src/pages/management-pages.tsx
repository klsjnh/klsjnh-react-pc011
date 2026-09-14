/**
 * 管理页面集合 - PC 端（antd）
 * 审计日志（对接 julyUserAudit） / 系统设置
 */
import React, { useState, useEffect, useCallback } from 'react';
import { Button, Card, Input, Select, Switch, Table, Tag, Typography } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { selectUserAuditListByPage } from '@/services/system011';
import { toast } from '@/utils/toast';
import type { JulyUserAuditVo011 } from '@/types/system011';
import type { SettingItem } from '@/types/view/business';

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

export const AuditPage: React.FC = () => {
  const [logs, setLogs] = useState<JulyUserAuditVo011[]>([]);
  const [loading, setLoading] = useState(false);
  const [keyword, setKeyword] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const pageSize = 10;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await selectUserAuditListByPage({
        pageIndex: page,
        pageSize,
        userAccount: keyword.trim() || undefined,
        auditType: typeFilter || undefined,
      });
      setLogs(res.rows);
      setTotal(res.total);
    } catch (e: any) {
      toast.error(e?.message || '加载审计日志失败');
      setLogs([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [page, keyword, typeFilter]);

  useEffect(() => { load(); }, [load]);

  /** 导出当前页为 CSV */
  const handleExport = () => {
    const header = ['时间', '操作者账号', '事件类型', '对象编码', '事件描述', 'IP'];
    const lines = logs.map((l) => [
      l.createTime?.replace('T', ' ') || '', l.userAccount, AUDIT_TYPE_LABEL[l.auditType] || l.auditType,
      l.objectCode, l.auditContent, l.auditIp,
    ].map((v) => `"${String(v ?? '').replace(/"/g, '""')}"`).join(','));
    const csv = '\uFEFF' + [header.join(','), ...lines].join('\r\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = `julyUserAudit-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`导出 ${logs.length} 条成功`);
  };

  const columns: ColumnsType<JulyUserAuditVo011> = [
    { title: '时间', dataIndex: 'createTime', width: 170, render: (v) => v?.replace('T', ' ') || '—' },
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

// ==================== 系统设置 ====================

export const SettingsPage: React.FC = () => {
  const [settings, setSettings] = useState<SettingItem[]>([
    { id: 1, name: '系统名称', value: '企业管理系统', type: 'text' },
    { id: 2, name: '系统描述', value: '企业级管理后台', type: 'text' },
    { id: 3, name: 'Token 过期时间(分钟)', value: '30', type: 'text' },
    { id: 4, name: '开启注册', value: true, type: 'toggle' },
    { id: 5, name: '开启审计日志', value: true, type: 'toggle' },
  ]);

  const columns: ColumnsType<SettingItem> = [
    { title: '配置项', dataIndex: 'name', width: 240 },
    {
      title: '值', dataIndex: 'value',
      render: (v: SettingItem['value'], s) => s.type === 'toggle'
        ? <Tag color={v ? 'green' : 'red'}>{v ? '开启' : '关闭'}</Tag>
        : <Typography.Text editable={{
            onChange: (text) => setSettings((prev) => prev.map((x) => x.id === s.id ? { ...x, value: text } : x)),
          }}>{String(v)}</Typography.Text>,
    },
    {
      title: '操作', key: 'action', width: 100,
      render: (_, s) => s.type === 'toggle'
        ? <Switch checked={!!s.value} onChange={(c) => setSettings((prev) => prev.map((x) => x.id === s.id ? { ...x, value: c } : x))} />
        : null,
    },
  ];

  return (
    <div>
      <div className="page-header"><h2>系统设置</h2><p>全局配置</p></div>
      <Card className="table-wrapper" styles={{ body: { padding: 0 } }}>
        <Table<SettingItem> rowKey="id" columns={columns} dataSource={settings} pagination={false} />
      </Card>
    </div>
  );
};
