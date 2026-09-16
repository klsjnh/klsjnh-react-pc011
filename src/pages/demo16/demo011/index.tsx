/**
 * 统一设置页（系统设置 + 参数设置合并）
 * 路由：/settings、/settings/params、/business/params 均指向此页
 */
import React, { useState } from 'react';
import { Card, Switch, Table, Tag, Typography, Tabs } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import type { SettingItem } from '@/types/view/business';

/** 系统设置数据 */
const INITIAL_SETTINGS: SettingItem[] = [
  { id: 1, name: '系统名称', value: '企业管理系统', type: 'text' },
  { id: 2, name: '系统描述', value: '企业级管理后台', type: 'text' },
  { id: 3, name: 'Token 过期时间(分钟)', value: '30', type: 'text' },
  { id: 4, name: '开启注册', value: true, type: 'toggle' },
  { id: 5, name: '开启审计日志', value: true, type: 'toggle' },
];

/** 参数设置数据 */
const INITIAL_PARAMS: SettingItem[] = [
  { id: 101, name: '消息推送', value: true, type: 'toggle' },
  { id: 102, name: '声音提醒', value: false, type: 'toggle' },
  { id: 103, name: '自动登录', value: true, type: 'toggle' },
  { id: 104, name: '错误上报', value: true, type: 'toggle' },
];

export const Demo011 = () => {
  const [settings, setSettings] = useState<SettingItem[]>(INITIAL_SETTINGS);
  const [params, setParams] = useState<SettingItem[]>(INITIAL_PARAMS);

  const settingColumns: ColumnsType<SettingItem> = [
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

  const paramColumns: ColumnsType<SettingItem> = [
    { title: '参数名称', dataIndex: 'name' },
    {
      title: '状态', key: 'enabled', width: 90,
      render: (_, p) => (
        <Switch checked={p.value as boolean} onChange={(c) => setParams((prev) => prev.map((x) => x.id === p.id ? { ...x, value: c } : x))} />
      ),
    },
  ];

  return (
    <div>
      <div className="page-header">
        <h2>系统设置</h2>
        <p>系统参数与运行参数配置</p>
      </div>
      <Tabs
        defaultActiveKey="system"
        items={[
          {
            key: 'system',
            label: '系统设置',
            children: (
              <Card className="table-wrapper" styles={{ body: { padding: 0 } }}>
                <Table<SettingItem> rowKey="id" columns={settingColumns} dataSource={settings} pagination={false} />
              </Card>
            ),
          },
          {
            key: 'params',
            label: '参数设置',
            children: (
              <Card className="table-wrapper" styles={{ body: { padding: 0 } }}>
                <Table<SettingItem> rowKey="id" columns={paramColumns} dataSource={params} pagination={false} />
              </Card>
            ),
          },
        ]}
      />
    </div>
  );
};
