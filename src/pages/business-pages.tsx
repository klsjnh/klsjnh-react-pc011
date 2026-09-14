/**
 * 业务功能页面集合 - PC 端（antd）
 * 配置管理 / 定时任务 / 数据导出 对接后端；其余为无后端模块的展示页（演示数据）。
 */
import React, { useState, useEffect } from 'react';
import {
  Button, Card, Col, Form, Input, Modal, Popconfirm, Progress, Row, Select, Space, Statistic, Switch, Table, Tag,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { useConfigState } from '@/stores/system011/julyConfigStore';
import { useSchedulerState } from '@/stores/system011/julySchedulerStore';
import {
  fetchConfigPage, saveConfig, removeConfig,
  fetchSchedulerPage, saveScheduler, startScheduler, stopScheduler, runSchedulerOnce, removeSchedulers,
  exportData,
} from '@/services/system011';
import { toast } from '@/utils/toast';
import type { JulyConfigVo011, JulySchedulerVo011 } from '@/types/system011';
import type { DictItem, OnlineUser, CacheItem, DataSourceItem } from '@/types/view/business';

// ==================== 配置管理（对接 julyConfig） ====================

export const ConfigPage = () => {
  const { list, total, loading, query } = useConfigState();
  const [modal, setModal] = useState<{ open: boolean; node: JulyConfigVo011 | null }>({ open: false, node: null });
  const [form] = Form.useForm();

  useEffect(() => { fetchConfigPage({ pageIndex: 1, pageSize: 10 }); }, []);
  useEffect(() => {
    if (!modal.open) return;
    form.setFieldsValue({ code: modal.node?.code || '', data: modal.node?.data || '' });
  }, [modal, form]);

  const handleSave = async () => {
    const v = await form.validateFields();
    await saveConfig({ id: modal.node?.id, code: v.code, data: v.data });
    toast.success('保存成功');
    setModal({ open: false, node: null });
  };

  const columns: ColumnsType<JulyConfigVo011> = [
    { title: '配置键', dataIndex: 'code', render: (v) => <code>{v}</code> },
    { title: '配置值', dataIndex: 'data' },
    { title: '状态', dataIndex: 'status', width: 90, render: (s) => <Tag color={s === '1' ? 'green' : 'red'}>{s === '1' ? '启用' : '停用'}</Tag> },
    {
      title: '操作', key: 'action', width: 140,
      render: (_, r) => (
        <Space size="small">
          <Button type="link" size="small" onClick={() => setModal({ open: true, node: r })}>编辑</Button>
          <Popconfirm title="确定删除这条配置吗？" okText="删除" cancelText="取消" okButtonProps={{ danger: true }} onConfirm={() => removeConfig(r.id)}>
            <Button type="link" size="small" danger>删除</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div className="page-header"><h2>配置管理</h2><p>共 {total} 条配置</p></div>
      <div className="page-toolbar">
        <div className="toolbar-left">
          <Input.Search allowClear placeholder="搜索 code / data" className="search-input"
            onSearch={(v) => fetchConfigPage({ pageIndex: 1, keyword: v || undefined })} />
        </div>
        <div className="toolbar-right">
          <Button type="primary" onClick={() => { form.resetFields(); setModal({ open: true, node: null }); }}>+ 新建配置</Button>
        </div>
      </div>
      <Card className="table-wrapper" styles={{ body: { padding: 0 } }}>
        <Table<JulyConfigVo011>
          rowKey="id" columns={columns} dataSource={list} loading={loading}
          pagination={{
            current: query.pageIndex, pageSize: query.pageSize, total,
            showSizeChanger: true, pageSizeOptions: [10, 50, 100], showTotal: (t) => `共 ${t} 条`,
            onChange: (pageIndex, pageSize) => fetchConfigPage({ pageIndex, pageSize }),
          }}
        />
      </Card>
      <Modal title={modal.node ? '编辑配置' : '新建配置'} open={modal.open} onCancel={() => setModal({ open: false, node: null })}
        onOk={handleSave} okText="保存" cancelText="取消" destroyOnClose>
        <Form form={form} layout="vertical" preserve={false}>
          <Form.Item name="code" label="配置键" rules={modal.node ? [] : [{ required: true, message: '请输入配置键' }]}>
            <Input disabled={!!modal.node} placeholder="如 site.name" />
          </Form.Item>
          <Form.Item name="data" label="配置值" rules={[{ required: true, message: '请输入配置值' }]}>
            <Input placeholder="请输入配置值" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

// ==================== 定时任务（对接 julyScheduler） ====================

export const SchedulerPage = () => {
  const { list, total, loading, query } = useSchedulerState();
  const [modal, setModal] = useState<{ open: boolean; node: JulySchedulerVo011 | null }>({ open: false, node: null });
  const [form] = Form.useForm();

  useEffect(() => { fetchSchedulerPage({ pageIndex: 1, pageSize: 10 }); }, []);
  useEffect(() => {
    if (!modal.open) return;
    form.setFieldsValue({
      schedulerCode: modal.node?.schedulerCode || '',
      schedulerName: modal.node?.schedulerName || '',
      schedulerHandler: modal.node?.schedulerHandler || '',
      schedulerCron: modal.node?.schedulerCron || '',
    });
  }, [modal, form]);

  const handleSave = async () => {
    const v = await form.validateFields();
    await saveScheduler({ id: modal.node?.id, ...v, status: modal.node?.status || '0' });
    toast.success('保存成功');
    setModal({ open: false, node: null });
  };

  const columns: ColumnsType<JulySchedulerVo011> = [
    { title: '任务编码', dataIndex: 'schedulerCode', width: 140 },
    { title: '任务名称', dataIndex: 'schedulerName', width: 140 },
    { title: '处理器', dataIndex: 'schedulerHandler' },
    { title: 'Cron', dataIndex: 'schedulerCron', width: 160, render: (v) => <code>{v}</code> },
    { title: '执行次数', dataIndex: 'executeTimes', width: 90 },
    { title: '状态', dataIndex: 'status', width: 90, render: (s) => <Tag color={s === '1' ? 'green' : 'default'}>{s === '1' ? '运行中' : '已停止'}</Tag> },
    {
      title: '操作', key: 'action', width: 240,
      render: (_, r) => (
        <Space size="small">
          <Button type="link" size="small" onClick={() => setModal({ open: true, node: r })}>编辑</Button>
          {r.status === '1'
            ? <Button type="link" size="small" onClick={() => stopScheduler(r.id)}>停止</Button>
            : <Button type="link" size="small" onClick={() => startScheduler(r.id)}>启动</Button>}
          <Button type="link" size="small" onClick={() => runSchedulerOnce(r.id)}>执行一次</Button>
          <Popconfirm title="确定删除这个定时任务吗？" okText="删除" cancelText="取消" okButtonProps={{ danger: true }} onConfirm={() => removeSchedulers([r.id])}>
            <Button type="link" size="small" danger>删除</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div className="page-header"><h2>定时任务</h2><p>共 {total} 个任务</p></div>
      <div className="page-toolbar">
        <div className="toolbar-left">
          <Input.Search allowClear placeholder="搜索编码 / 名称" className="search-input"
            onSearch={(v) => fetchSchedulerPage({ pageIndex: 1, schedulerName: v || undefined })} />
        </div>
        <div className="toolbar-right">
          <Button type="primary" onClick={() => { form.resetFields(); setModal({ open: true, node: null }); }}>+ 新建任务</Button>
        </div>
      </div>
      <Card className="table-wrapper" styles={{ body: { padding: 0 } }}>
        <Table<JulySchedulerVo011>
          rowKey="id" columns={columns} dataSource={list} loading={loading} scroll={{ x: 1100 }}
          pagination={{
            current: query.pageIndex, pageSize: query.pageSize, total,
            showSizeChanger: true, pageSizeOptions: [10, 50, 100], showTotal: (t) => `共 ${t} 条`,
            onChange: (pageIndex, pageSize) => fetchSchedulerPage({ pageIndex, pageSize }),
          }}
        />
      </Card>
      <Modal title={modal.node ? '编辑任务' : '新建任务'} open={modal.open} onCancel={() => setModal({ open: false, node: null })}
        onOk={handleSave} okText="保存" cancelText="取消" destroyOnClose>
        <Form form={form} layout="vertical" preserve={false}>
          <Form.Item name="schedulerCode" label="任务编码" rules={modal.node ? [] : [{ required: true, message: '请输入任务编码' }]}>
            <Input disabled={!!modal.node} placeholder="如 dataBackup" />
          </Form.Item>
          <Form.Item name="schedulerName" label="任务名称" rules={[{ required: true, message: '请输入任务名称' }]}><Input /></Form.Item>
          <Form.Item name="schedulerHandler" label="处理器" rules={[{ required: true, message: '请输入处理器' }]}><Input placeholder="后端 bean/方法名" /></Form.Item>
          <Form.Item name="schedulerCron" label="Cron 表达式" rules={[{ required: true, message: '请输入 Cron' }]}><Input placeholder="如 0 2 * * *" /></Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

// ==================== 字典管理（演示） ====================

export const DictPage = () => {
  const [dicts] = useState<DictItem[]>([
    { id: 1, type: 'user_status', label: '用户状态', items: [{ value: 'active', label: '正常' }, { value: 'inactive', label: '停用' }, { value: 'locked', label: '锁定' }] },
    { id: 2, type: 'user_role', label: '用户角色', items: [{ value: 'admin', label: '管理员' }, { value: 'manager', label: '经理' }, { value: 'editor', label: '编辑' }, { value: 'viewer', label: '只读' }] },
    { id: 3, type: 'order_status', label: '订单状态', items: [{ value: 'pending', label: '待支付' }, { value: 'paid', label: '已支付' }, { value: 'shipped', label: '已发货' }, { value: 'done', label: '已完成' }] },
  ]);

  const columns: ColumnsType<DictItem> = [
    { title: '字典类型', dataIndex: 'type', render: (v) => <Tag color="blue">{v}</Tag> },
    { title: '字典名称', dataIndex: 'label' },
    { title: '字典项', dataIndex: 'items', render: (items: DictItem['items']) => items.map((i) => <Tag key={i.value}>{i.label}</Tag>) },
  ];

  return (
    <div>
      <div className="page-header"><h2>字典管理</h2><p>{dicts.length} 个字典类型</p></div>
      <Card className="table-wrapper" styles={{ body: { padding: 0 } }}>
        <Table<DictItem> rowKey="id" columns={columns} dataSource={dicts} pagination={false} />
      </Card>
    </div>
  );
};

// ==================== 系统监控（演示） ====================

export const MonitorPage = () => {
  const [metrics, setMetrics] = useState({ cpu: 35, memory: 62, disk: 45, network: 28, qps: 156 });
  useEffect(() => {
    const timer = setInterval(() => {
      setMetrics((p) => ({
        ...p,
        cpu: Math.max(10, Math.min(90, p.cpu + Math.floor(Math.random() * 20) - 10)),
        memory: Math.max(30, Math.min(90, p.memory + Math.floor(Math.random() * 10) - 5)),
        network: Math.max(5, Math.min(80, p.network + Math.floor(Math.random() * 20) - 10)),
        qps: Math.max(50, Math.min(500, p.qps + Math.floor(Math.random() * 60) - 30)),
      }));
    }, 2000);
    return () => clearInterval(timer);
  }, []);

  const gauges = [
    { label: 'CPU 使用率', value: metrics.cpu, color: metrics.cpu > 80 ? '#f5222d' : metrics.cpu > 60 ? '#faad14' : '#52c41a' },
    { label: '内存使用率', value: metrics.memory, color: '#1890ff' },
    { label: '磁盘使用率', value: metrics.disk, color: '#722ed1' },
    { label: '网络使用率', value: metrics.network, color: '#13c2c2' },
  ];

  return (
    <div>
      <div className="page-header"><h2>系统监控</h2><p>实时运行状态 · 每 2 秒自动刷新</p></div>
      <Card title="资源使用率" className="table-wrapper" style={{ marginBottom: 16 }}>
        <Row gutter={24}>
          {gauges.map((g) => (
            <Col span={6} key={g.label}>
              <div className="flex-between mb-2 text-xs text-muted"><span>{g.label}</span><span style={{ fontWeight: 600, color: g.color }}>{g.value}%</span></div>
              <Progress percent={g.value} showInfo={false} strokeColor={g.color} size="small" />
            </Col>
          ))}
        </Row>
      </Card>
      <Card title="运行指标" className="table-wrapper">
        <Row gutter={[16, 16]}>
          {[
            { label: 'QPS', value: metrics.qps }, { label: '平均响应', value: '23ms' },
            { label: '错误率', value: '0.1%' }, { label: '运行时长', value: '15天3小时' },
            { label: '连接数', value: 89 }, { label: '线程数', value: 45 },
            { label: '堆内存', value: '512MB' }, { label: '最大堆', value: '1GB' },
          ].map((s) => (
            <Col span={6} key={s.label}><Card size="small"><Statistic title={s.label} value={s.value} /></Card></Col>
          ))}
        </Row>
      </Card>
    </div>
  );
};

// ==================== 在线用户（演示） ====================

export const OnlineUsersPage = () => {
  const [users, setUsers] = useState<OnlineUser[]>([
    { id: 1, username: 'admin', realName: '张三', ip: '192.168.1.100', location: '北京市', loginTime: '09:30', browser: 'Chrome' },
    { id: 2, username: 'manager', realName: '李四', ip: '192.168.1.101', location: '上海市', loginTime: '09:15', browser: 'Safari' },
    { id: 3, username: 'editor01', realName: '王五', ip: '172.16.0.10', location: '深圳市', loginTime: '08:50', browser: 'Edge' },
  ]);

  const columns: ColumnsType<OnlineUser> = [
    { title: '用户名', dataIndex: 'username' },
    { title: '姓名', dataIndex: 'realName' },
    { title: 'IP', dataIndex: 'ip' },
    { title: '位置', dataIndex: 'location' },
    { title: '登录时间', dataIndex: 'loginTime' },
    { title: '浏览器', dataIndex: 'browser' },
    {
      title: '操作', key: 'action', width: 100,
      render: (_, u) => (
        <Popconfirm title={`确定将「${u.realName}」强制下线吗？`} okText="确定" cancelText="取消" okButtonProps={{ danger: true }}
          onConfirm={() => setUsers((prev) => prev.filter((x) => x.id !== u.id))}>
          <Button type="link" size="small" danger>强制下线</Button>
        </Popconfirm>
      ),
    },
  ];

  return (
    <div>
      <div className="page-header"><h2>在线用户</h2><p>{users.length} 人在线</p></div>
      <Card className="table-wrapper" styles={{ body: { padding: 0 } }}>
        <Table<OnlineUser> rowKey="id" columns={columns} dataSource={users} pagination={false} />
      </Card>
    </div>
  );
};

// ==================== 缓存管理（演示） ====================

export const CachePage = () => {
  const [caches, setCaches] = useState<CacheItem[]>([
    { id: 1, name: '用户信息缓存', size: '2.5MB', items: 128, hitRate: '95.2%', ttl: '30分钟' },
    { id: 2, name: '菜单缓存', size: '0.3MB', items: 45, hitRate: '99.8%', ttl: '1小时' },
    { id: 3, name: '权限缓存', size: '1.2MB', items: 86, hitRate: '98.5%', ttl: '15分钟' },
  ]);
  const totalSize = caches.reduce((s, c) => s + parseFloat(c.size), 0).toFixed(1);
  const totalItems = caches.reduce((s, c) => s + c.items, 0);

  const columns: ColumnsType<CacheItem> = [
    { title: '缓存域', dataIndex: 'name' },
    { title: '大小', dataIndex: 'size' },
    { title: '条目数', dataIndex: 'items' },
    { title: '命中率', dataIndex: 'hitRate', render: (v) => <span style={{ color: '#52c41a' }}>{v}</span> },
    { title: 'TTL', dataIndex: 'ttl' },
    {
      title: '操作', key: 'action', width: 120,
      render: (_, c) => (
        <Button type="link" size="small" disabled={c.items === 0}
          onClick={() => setCaches((prev) => prev.map((x) => x.id === c.id ? { ...x, size: '0MB', items: 0, hitRate: '-' } : x))}>
          清除缓存
        </Button>
      ),
    },
  ];

  return (
    <div>
      <div className="page-header"><h2>缓存管理</h2><p>{totalSize}MB · {totalItems} 项</p></div>
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={8}><Card><Statistic title="总缓存" value={totalSize} suffix="MB" /></Card></Col>
        <Col span={8}><Card><Statistic title="缓存项" value={totalItems} /></Card></Col>
        <Col span={8}><Card><Statistic title="缓存域" value={caches.length} /></Card></Col>
      </Row>
      <Card className="table-wrapper" styles={{ body: { padding: 0 } }}>
        <Table<CacheItem> rowKey="id" columns={columns} dataSource={caches} pagination={false} />
      </Card>
    </div>
  );
};

// ==================== 数据源管理（演示） ====================

export const DataSourcePage = () => {
  const [sources] = useState<DataSourceItem[]>([
    { id: 1, name: '主数据库', type: 'MySQL', host: '192.168.1.10:3306', database: 'enterprise_main', status: 'connected', latency: '2ms' },
    { id: 2, name: '缓存数据库', type: 'Redis', host: '192.168.1.12:6379', database: 'db0', status: 'connected', latency: '0.5ms' },
    { id: 3, name: '测试数据库', type: 'MySQL', host: '10.0.0.20:3306', database: 'test_db', status: 'disconnected', latency: '-' },
  ]);

  const columns: ColumnsType<DataSourceItem> = [
    { title: '数据源', dataIndex: 'name' },
    { title: '类型', dataIndex: 'type', render: (v) => <Tag color="blue">{v}</Tag> },
    { title: '主机地址', dataIndex: 'host', render: (v) => <code>{v}</code> },
    { title: '数据库', dataIndex: 'database', render: (v) => <code>{v}</code> },
    { title: '延迟', dataIndex: 'latency', render: (v) => <span style={{ color: '#52c41a' }}>{v}</span> },
    { title: '状态', dataIndex: 'status', render: (s) => <Tag color={s === 'connected' ? 'green' : 'red'}>{s === 'connected' ? '已连接' : '未连接'}</Tag> },
    { title: '操作', key: 'action', width: 120, render: () => <Button type="link" size="small">测试连接</Button> },
  ];

  return (
    <div>
      <div className="page-header"><h2>数据源管理</h2><p>{sources.filter((s) => s.status === 'connected').length}/{sources.length} 已连接</p></div>
      <Card className="table-wrapper" styles={{ body: { padding: 0 } }}>
        <Table<DataSourceItem> rowKey="id" columns={columns} dataSource={sources} pagination={false} />
      </Card>
    </div>
  );
};

// ==================== 存储中心（演示） ====================

export const StoragePage = () => {
  const [files] = useState([
    { id: 1, name: '报表_202609.pdf', size: '2.5MB', type: 'PDF', time: '2026-09-12', path: '/reports/' },
    { id: 2, name: '产品图.png', size: '1.2MB', type: '图片', time: '2026-09-11', path: '/images/' },
    { id: 3, name: '系统日志.zip', size: '15.8MB', type: '压缩包', time: '2026-09-08', path: '/logs/' },
  ]);
  const used = 20.7, totalGb = 100;
  const usagePercent = Math.round((used / totalGb) * 100);

  const columns: ColumnsType<typeof files[number]> = [
    { title: '文件名', dataIndex: 'name' },
    { title: '类型', dataIndex: 'type', render: (v) => <Tag color="blue">{v}</Tag> },
    { title: '大小', dataIndex: 'size' },
    { title: '路径', dataIndex: 'path', render: (v) => <code>{v}</code> },
    { title: '时间', dataIndex: 'time' },
    { title: '操作', key: 'action', width: 80, render: () => <Button type="link" size="small">下载</Button> },
  ];

  return (
    <div>
      <div className="page-header"><h2>存储中心</h2><p>{used}GB / {totalGb}GB</p></div>
      <Card title="存储使用率" className="table-wrapper" style={{ marginBottom: 16 }} extra={<span className="text-muted text-xs">适配器: 本地存储 / MinIO</span>}>
        <Progress percent={usagePercent} strokeColor={usagePercent > 80 ? '#f5222d' : '#1890ff'} />
        <div className="text-muted text-xs mt-2">已用 {used}GB / 总容量 {totalGb}GB · 使用率 {usagePercent}%</div>
      </Card>
      <Card className="table-wrapper" styles={{ body: { padding: 0 } }}>
        <Table rowKey="id" columns={columns} dataSource={files} pagination={false} />
      </Card>
    </div>
  );
};

// ==================== 参数设置（演示） ====================

export const ParamsPage = () => {
  const [params, setParams] = useState([
    { id: 1, name: '消息推送', key: 'notify.push', enabled: true, desc: '接收系统推送通知' },
    { id: 2, name: '声音提醒', key: 'notify.sound', enabled: false, desc: '新消息播放提示音' },
    { id: 3, name: '自动登录', key: 'security.autoLogin', enabled: true, desc: '下次打开自动登录' },
    { id: 4, name: '错误上报', key: 'system.errorReport', enabled: true, desc: '自动上报错误信息' },
  ]);

  const columns: ColumnsType<typeof params[number]> = [
    { title: '参数名称', dataIndex: 'name' },
    { title: '说明', dataIndex: 'desc' },
    { title: '参数键', dataIndex: 'key', render: (v) => <code>{v}</code> },
    {
      title: '状态', key: 'enabled', width: 90,
      render: (_, p) => (
        <Switch checked={p.enabled} onChange={() => setParams((prev) => prev.map((x) => x.id === p.id ? { ...x, enabled: !x.enabled } : x))} />
      ),
    },
  ];

  return (
    <div>
      <div className="page-header"><h2>参数设置</h2><p>运行参数配置</p></div>
      <Card className="table-wrapper" styles={{ body: { padding: 0 } }}>
        <Table rowKey="id" columns={columns} dataSource={params} pagination={false} />
      </Card>
    </div>
  );
};

// ==================== 通知模板（演示） ====================

export const TemplatePage = () => {
  const [templates] = useState([
    { id: 1, name: '用户注册欢迎', channel: '站内信', content: '欢迎 {{realName}} 加入企业管理系统！', updatedAt: '2026-09-10' },
    { id: 2, name: '订单支付成功', channel: '短信', content: '您的订单 {{orderNo}} 已支付成功，金额 ¥{{amount}}。', updatedAt: '2026-09-08' },
    { id: 3, name: '密码重置通知', channel: '邮件', content: '您的密码已重置，新密码：{{tempPassword}}', updatedAt: '2026-09-05' },
  ]);

  const columns: ColumnsType<typeof templates[number]> = [
    { title: '模板名称', dataIndex: 'name' },
    { title: '渠道', dataIndex: 'channel', render: (v) => <Tag color="blue">{v}</Tag> },
    { title: '模板内容', dataIndex: 'content', render: (v) => <code>{v}</code> },
    { title: '更新时间', dataIndex: 'updatedAt' },
  ];

  return (
    <div>
      <div className="page-header"><h2>通知模板</h2><p>{templates.length} 个模板</p></div>
      <Card className="table-wrapper" styles={{ body: { padding: 0 } }}>
        <Table rowKey="id" columns={columns} dataSource={templates} pagination={false} />
      </Card>
    </div>
  );
};

// ==================== 消息推送（演示） ====================

export const PushPage = () => {
  const [pushes, setPushes] = useState([
    { id: 1, title: '系统维护通知', channel: '企微', target: '全部用户', status: '已发送', time: '2026-09-12 09:00', opens: 45 },
    { id: 2, title: '新功能上线', channel: '站内信', target: 'VIP用户', status: '已发送', time: '2026-09-11 14:00', opens: 128 },
    { id: 3, title: '安全提醒', channel: '邮件', target: '管理员', status: '草稿', time: '-', opens: 0 },
  ]);

  const columns: ColumnsType<typeof pushes[number]> = [
    { title: '推送标题', dataIndex: 'title' },
    { title: '渠道', dataIndex: 'channel', render: (v) => <Tag color="blue">{v}</Tag> },
    { title: '目标', dataIndex: 'target' },
    { title: '状态', dataIndex: 'status', render: (s) => <Tag color={s === '已发送' ? 'green' : 'orange'}>{s}</Tag> },
    { title: '发送时间', dataIndex: 'time' },
    { title: '打开数', dataIndex: 'opens' },
    {
      title: '操作', key: 'action', width: 120,
      render: (_, p) => p.status === '草稿'
        ? <Button type="link" size="small" onClick={() => setPushes((prev) => prev.map((x) => x.id === p.id ? { ...x, status: '已发送', time: new Date().toLocaleString('zh-CN') } : x))}>立即发送</Button>
        : null,
    },
  ];

  return (
    <div>
      <div className="page-header"><h2>消息推送</h2><p>已推送 {pushes.filter((p) => p.status === '已发送').length} 次</p></div>
      <Card className="table-wrapper" styles={{ body: { padding: 0 } }}>
        <Table rowKey="id" columns={columns} dataSource={pushes} pagination={false} />
      </Card>
    </div>
  );
};

// ==================== 数据统计（演示） ====================

export const StatsPage = () => {
  const stats = [
    { label: '今日新增用户', value: '23', change: '+15%', up: true },
    { label: '今日活跃用户', value: '1,256', change: '+8%', up: true },
    { label: '今日订单数', value: '186', change: '+12%', up: true },
    { label: '今日销售额', value: '¥4.2万', change: '-3%', up: false },
    { label: '本周访问量', value: '15,820', change: '+22%', up: true },
    { label: '本周转化率', value: '5.7%', change: '+0.8%', up: true },
    { label: '本月收入', value: '¥28.6万', change: '+5%', up: true },
    { label: '用户总数', value: '12,480', change: '+3%', up: true },
  ];

  return (
    <div>
      <div className="page-header"><h2>数据统计</h2><p>核心指标一览</p></div>
      <Row gutter={[16, 16]}>
        {stats.map((s) => (
          <Col span={6} key={s.label}>
            <Card><Statistic title={s.label} value={s.value} /></Card>
            <div className="text-xs" style={{ color: s.up ? '#52c41a' : '#f5222d' }}>{s.up ? '↑' : '↓'} {s.change}</div>
          </Col>
        ))}
      </Row>
    </div>
  );
};

// ==================== 趋势分析（演示） ====================

export const TrendPage = () => {
  const data = [65, 78, 52, 91, 84, 45, 38, 72, 88, 95, 62, 75];
  const labels = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];
  const maxValue = Math.max(...data);

  return (
    <div>
      <div className="page-header"><h2>趋势分析</h2><p>月度数据趋势</p></div>
      <Card title="访问量趋势" className="table-wrapper" style={{ marginBottom: 16 }}>
        <div className="bar-chart">
          {data.map((val, i) => (
            <div className="bar-col" key={i}>
              <div className="bar-label">{val}</div>
              <div className="bar-fill" style={{ height: `${(val / maxValue) * 100}%` }} />
              <div className="bar-label">{labels[i]}</div>
            </div>
          ))}
        </div>
      </Card>
      <Row gutter={16}>
        {[
          { label: '最高月', value: '95', sub: '10月', color: '#52c41a' },
          { label: '最低月', value: '38', sub: '7月', color: '#f5222d' },
          { label: '平均值', value: '70', sub: '月均', color: '#1890ff' },
        ].map((s) => (
          <Col span={8} key={s.label}><Card><Statistic title={s.label} value={s.value} suffix={s.sub} valueStyle={{ color: s.color }} /></Card></Col>
        ))}
      </Row>
    </div>
  );
};

// ==================== 图表展示（演示） ====================

export const ChartsPage = () => {
  const pieData = [
    { label: '电子产品', value: 35, color: '#1890ff' },
    { label: '服装配饰', value: 25, color: '#52c41a' },
    { label: '食品饮料', value: 20, color: '#faad14' },
    { label: '家居用品', value: 12, color: '#722ed1' },
    { label: '其他', value: 8, color: '#8c8c8c' },
  ];
  const week = [42, 68, 35, 81, 56, 73, 90];
  const weekLabels = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];

  return (
    <div>
      <div className="page-header"><h2>图表展示</h2><p>可视化数据图表</p></div>
      <Row gutter={16}>
        <Col span={12}>
          <Card title="销售占比">
            {pieData.map((d) => (
              <div className="flex-center" style={{ gap: 8, padding: '6px 0' }} key={d.label}>
                <span style={{ width: 10, height: 10, borderRadius: 2, background: d.color }} />
                <span style={{ flex: 1 }}>{d.label}</span>
                <Progress percent={d.value} showInfo={false} strokeColor={d.color} style={{ width: 120 }} size="small" />
                <span style={{ fontWeight: 600 }}>{d.value}%</span>
              </div>
            ))}
          </Card>
        </Col>
        <Col span={12}>
          <Card title="周度对比">
            <div className="bar-chart" style={{ height: 180 }}>
              {week.map((v, i) => (
                <div className="bar-col" key={i}>
                  <div className="bar-label">{v}</div>
                  <div className="bar-fill" style={{ height: `${v}%`, background: i === 6 ? '#faad14' : '#1890ff' }} />
                  <div className="bar-label">{weekLabels[i]}</div>
                </div>
              ))}
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

// ==================== 数据导出（对接 export） ====================

export const ExportPage = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  const handleExport = async () => {
    const v = await form.validateFields();
    setLoading(true);
    try {
      const content = await exportData({ objectCode: v.objectCode, format: v.format });
      const blob = new Blob([content], { type: v.format === 'json' ? 'application/json' : 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${v.objectCode}.${v.format}`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('导出成功');
    } catch (e) {
      toast.error((e as Error)?.message || '导出失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="page-header"><h2>数据导出</h2><p>导出业务数据（json / csv，上限 500 行）</p></div>
      <Card className="table-wrapper" styles={{ body: { padding: 24, maxWidth: 640 } }}>
        <Form form={form} layout="vertical" initialValues={{ objectCode: 'julyUser', format: 'csv' }}>
          <Form.Item name="objectCode" label="导出对象" rules={[{ required: true, message: '请选择导出对象' }]}>
            <Select options={[
              { value: 'julyUser', label: '用户数据' }, { value: 'julyRole', label: '角色数据' },
              { value: 'julyMenu', label: '菜单数据' }, { value: 'julyOrganization', label: '组织数据' },
              { value: 'julyUserAudit', label: '操作日志' },
            ]} />
          </Form.Item>
          <Form.Item name="format" label="导出格式" rules={[{ required: true }]}>
            <Select options={[{ value: 'csv', label: 'CSV' }, { value: 'json', label: 'JSON' }]} />
          </Form.Item>
          <Button type="primary" loading={loading} onClick={handleExport}>导出</Button>
        </Form>
      </Card>
    </div>
  );
};

// ==================== 数据大屏（演示） ====================

export const DashboardScreenPage = () => {
  const [time, setTime] = useState(new Date());
  useEffect(() => { const t = setInterval(() => setTime(new Date()), 1000); return () => clearInterval(t); }, []);

  const widgets = [
    { label: '今日访问', value: '3,256', color: '#1890ff' },
    { label: '今日订单', value: '186', color: '#52c41a' },
    { label: '今日收入', value: '¥4.2万', color: '#faad14' },
    { label: '在线用户', value: '89', color: '#f5222d' },
  ];

  return (
    <div>
      <div className="page-header"><h2>数据大屏</h2><p>{time.toLocaleTimeString('zh-CN')}</p></div>
      <Row gutter={16} style={{ marginBottom: 16 }}>
        {widgets.map((w) => (
          <Col span={6} key={w.label}><Card><Statistic title={w.label} value={w.value} valueStyle={{ color: w.color }} /></Card></Col>
        ))}
      </Row>
      <Card title="实时数据流" className="table-wrapper">
        {[
          { time: '10:30:15', event: '用户 admin 登录系统', color: '#52c41a' },
          { time: '10:29:58', event: '新订单 #20260912002 创建', color: '#1890ff' },
          { time: '10:29:42', event: '用户 editor01 更新了数据', color: '#faad14' },
          { time: '10:29:20', event: '系统缓存刷新完成', color: '#722ed1' },
        ].map((item, i) => (
          <div className="flex-center" style={{ gap: 12, fontSize: 13, padding: '5px 0' }} key={i}>
            <span className="text-muted text-xs">{item.time}</span>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: item.color }} />
            <span>{item.event}</span>
          </div>
        ))}
      </Card>
    </div>
  );
};

// ==================== 数据计算（演示） ====================

export const CalcPage = () => {
  const [num1, setNum1] = useState('');
  const [num2, setNum2] = useState('');
  const [op, setOp] = useState('+');
  const [result, setResult] = useState<string | null>(null);

  const calculate = () => {
    const a = parseFloat(num1), b = parseFloat(num2);
    if (isNaN(a) || isNaN(b)) { setResult('请输入有效数字'); return; }
    const r = op === '+' ? a + b : op === '-' ? a - b : op === '×' ? a * b : (b !== 0 ? a / b : NaN);
    setResult(isNaN(r) ? '除数不能为零' : `= ${r}`);
  };

  return (
    <div>
      <div className="page-header"><h2>数据计算</h2><p>快速计算工具</p></div>
      <Card className="table-wrapper" styles={{ body: { padding: 24, maxWidth: 560 } }}>
        <Space>
          <Input style={{ width: 140, textAlign: 'center' }} placeholder="数字" value={num1} onChange={(e) => setNum1(e.target.value)} />
          <Select style={{ width: 64 }} value={op} onChange={setOp} options={['+', '-', '×', '÷'].map((v) => ({ value: v, label: v }))} />
          <Input style={{ width: 140, textAlign: 'center' }} placeholder="数字" value={num2} onChange={(e) => setNum2(e.target.value)} />
          <Button type="primary" onClick={calculate}>= 计算</Button>
        </Space>
        {result && <div className="text-center mt-4" style={{ fontSize: 20, fontWeight: 700, color: 'var(--primary)' }}>{result}</div>}
      </Card>
    </div>
  );
};

// ==================== 数据查询（演示） ====================

export const QueryPage = () => {
  const [searched, setSearched] = useState(false);
  const results = [
    { id: 1, name: '用户001', type: '用户', detail: '正常 · 技术中心' },
    { id: 2, name: '订单20260912', type: '订单', detail: '已支付 · ¥299' },
    { id: 3, name: '配置site.name', type: '配置', detail: '企业管理系统' },
  ];

  const columns: ColumnsType<typeof results[number]> = [
    { title: '类型', dataIndex: 'type', render: (v) => <Tag color="blue">{v}</Tag> },
    { title: '名称', dataIndex: 'name' },
    { title: '详情', dataIndex: 'detail' },
  ];

  return (
    <div>
      <div className="page-header"><h2>数据查询</h2><p>全局搜索</p></div>
      <div className="page-toolbar">
        <div className="toolbar-left">
          <Input.Search className="search-input" style={{ width: 280 }} placeholder="搜索用户/订单/配置..."
            onSearch={() => setSearched(true)} />
        </div>
      </div>
      {searched && (
        <Card className="table-wrapper" styles={{ body: { padding: 0 } }}>
          <Table rowKey="id" columns={columns} dataSource={results} pagination={false} />
        </Card>
      )}
    </div>
  );
};

// ==================== 服务日志（演示） ====================

export const ServiceLogPage = () => {
  const [level, setLevel] = useState('all');
  const logs = [
    { id: 1, time: '10:30:15', level: 'INFO', message: 'Server started on port 11170', source: 'Application' },
    { id: 2, time: '10:30:16', level: 'INFO', message: 'Database connection pool initialized', source: 'DataSource' },
    { id: 3, time: '10:29:58', level: 'WARN', message: 'Cache hit rate below threshold: 85%', source: 'CacheService' },
    { id: 4, time: '10:28:20', level: 'ERROR', message: 'Failed to connect to test_db: timeout', source: 'DataSource' },
  ];
  const filtered = logs.filter((l) => level === 'all' || l.level === level);
  const levelColor: Record<string, string> = { INFO: '#52c41a', WARN: '#faad14', ERROR: '#f5222d' };

  return (
    <div>
      <div className="page-header"><h2>服务日志</h2><p>{filtered.length} 条记录</p></div>
      <div className="page-toolbar">
        <div className="toolbar-left">
          <Select style={{ width: 140 }} value={level} onChange={setLevel} options={[
            { value: 'all', label: '全部级别' }, { value: 'INFO', label: 'INFO' },
            { value: 'WARN', label: 'WARN' }, { value: 'ERROR', label: 'ERROR' },
          ]} />
        </div>
      </div>
      <div className="log-panel">
        {filtered.map((log) => (
          <div className="log-line" key={log.id}>
            <span style={{ color: '#888' }}>{log.time}</span>
            <span style={{ color: levelColor[log.level], marginLeft: 10, fontWeight: 600 }}>[{log.level}]</span>
            <span style={{ color: '#aaa', marginLeft: 10 }}>[{log.source}]</span>
            <div style={{ color: '#ddd', paddingLeft: 90 }}>{log.message}</div>
          </div>
        ))}
      </div>
    </div>
  );
};
