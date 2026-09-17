/**
 * 业务功能页面集合 - PC 端（antd）
 * 配置管理 / 定时任务 / 数据导出 对接后端；其余为无后端模块的展示页（演示数据）。
 */
import React, { useState, useEffect, useCallback } from 'react';
import {
  Button, Card, Col, Empty, Form, Input, Modal, Popconfirm, Progress, Row, Select, Space, Statistic, Switch, Table, Tag,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
  exportData,
} from '@/services/system011';
import { toast } from '@/utils/toast';
import { downloadText, exportFileName } from '@/utils/download';
import { KlsjnhSql011, KlsjnhMarkdown011 } from '@/components/system011';
import type { OnlineUser, CacheItem } from '@/types/view/business';
import type { DictTypeVo011, DictItemVo011 } from '@/types/view/dict';
import { STATUS_OPTIONS } from '@/config/constants';

// ==================== 字典管理（主子表：字典类型 + 字典项） ====================

type DictType = DictTypeVo011;
type DictItem = DictItemVo011;

const genId = () => `${Date.now()}${Math.random().toString(36).slice(2, 6)}`;

const INITIAL_DICT_TYPES: DictType[] = [
  { id: 'dict-type-1', typeCode: 'menu_type', typeName: '菜单类型', description: '菜单的类型分类', status: '1', sort: 1, createdAt: '2026-09-15 10:00:00', updatedAt: '2026-09-15 10:00:00' },
  { id: 'dict-type-2', typeCode: 'status', typeName: '通用状态', description: '启用/停用状态', status: '1', sort: 2, createdAt: '2026-09-15 10:00:00', updatedAt: '2026-09-15 10:00:00' },
  { id: 'dict-type-3', typeCode: 'user_status', typeName: '用户状态', description: '用户账号状态', status: '1', sort: 3, createdAt: '2026-09-15 10:00:00', updatedAt: '2026-09-15 10:00:00' },
];

const INITIAL_DICT_ITEMS: DictItem[] = [
  // 菜单类型
  { id: 'dict-item-1', dictTypeId: 'dict-type-1', itemValue: '1', itemLabel: '目录', description: '一级分组', sort: 1, status: '1', createdAt: '2026-09-15 10:00:00', updatedAt: '2026-09-15 10:00:00' },
  { id: 'dict-item-2', dictTypeId: 'dict-type-1', itemValue: '2', itemLabel: '菜单', description: '页面菜单', sort: 2, status: '1', createdAt: '2026-09-15 10:00:00', updatedAt: '2026-09-15 10:00:00' },
  { id: 'dict-item-3', dictTypeId: 'dict-type-1', itemValue: '3', itemLabel: '按钮', description: '功能按钮', sort: 3, status: '1', createdAt: '2026-09-15 10:00:00', updatedAt: '2026-09-15 10:00:00' },
  // 通用状态
  { id: 'dict-item-4', dictTypeId: 'dict-type-2', itemValue: '1', itemLabel: '启用', description: '正常启用', sort: 1, status: '1', createdAt: '2026-09-15 10:00:00', updatedAt: '2026-09-15 10:00:00' },
  { id: 'dict-item-5', dictTypeId: 'dict-type-2', itemValue: '0', itemLabel: '停用', description: '禁用状态', sort: 2, status: '1', createdAt: '2026-09-15 10:00:00', updatedAt: '2026-09-15 10:00:00' },
  // 用户状态
  { id: 'dict-item-6', dictTypeId: 'dict-type-3', itemValue: '1', itemLabel: '正常', description: '账号正常', sort: 1, status: '1', createdAt: '2026-09-15 10:00:00', updatedAt: '2026-09-15 10:00:00' },
  { id: 'dict-item-7', dictTypeId: 'dict-type-3', itemValue: '0', itemLabel: '禁用', description: '账号禁用', sort: 2, status: '1', createdAt: '2026-09-15 10:00:00', updatedAt: '2026-09-15 10:00:00' },
  { id: 'dict-item-8', dictTypeId: 'dict-type-3', itemValue: '2', itemLabel: '锁定', description: '账号锁定', sort: 3, status: '1', createdAt: '2026-09-15 10:00:00', updatedAt: '2026-09-15 10:00:00' },
];

export const DictPage = () => {
  const [dictTypes, setDictTypes] = useState<DictType[]>(INITIAL_DICT_TYPES);
  const [dictItems, setDictItems] = useState<DictItem[]>(INITIAL_DICT_ITEMS);
  const [selectedTypeId, setSelectedTypeId] = useState<string>(dictTypes[0]?.id || '');
  const [typeModal, setTypeModal] = useState<{ open: boolean; node: DictType | null }>({ open: false, node: null });
  const [itemModal, setItemModal] = useState<{ open: boolean; node: DictItem | null }>({ open: false, node: null });
  const [typeForm] = Form.useForm();
  const [itemForm] = Form.useForm();

  const selectedType = dictTypes.find((t) => t.id === selectedTypeId) || null;
  const filteredItems = dictItems
    .filter((i) => i.dictTypeId === selectedTypeId)
    .sort((a, b) => a.sort - b.sort);

  // ==================== 字典类型 CRUD ====================

  const handleSaveType = async () => {
    const v = await typeForm.validateFields();
    if (typeModal.node) {
      setDictTypes((prev) => prev.map((t) => t.id === typeModal.node!.id ? { ...t, ...v, updatedAt: new Date().toLocaleString('zh-CN') } : t));
      toast.success('字典类型已更新');
    } else {
      const newType: DictType = { id: genId(), ...v, createdAt: new Date().toLocaleString('zh-CN'), updatedAt: new Date().toLocaleString('zh-CN') };
      setDictTypes((prev) => [...prev, newType]);
      setSelectedTypeId(newType.id);
      toast.success('字典类型已创建');
    }
    setTypeModal({ open: false, node: null });
  };

  const handleDeleteType = (id: string) => {
    Modal.confirm({
      title: '删除字典类型',
      content: '删除后将同时删除该类型下的所有字典项，确定继续吗？',
      okText: '删除',
      okButtonProps: { danger: true },
      cancelText: '取消',
      onOk: () => {
        setDictTypes((prev) => prev.filter((t) => t.id !== id));
        setDictItems((prev) => prev.filter((i) => i.dictTypeId !== id));
        setSelectedTypeId((prev) => (prev === id ? '' : prev));
        toast.success('字典类型已删除');
      },
    });
  };

  // ==================== 字典项 CRUD ====================

  const handleSaveItem = async () => {
    const v = await itemForm.validateFields();
    if (itemModal.node) {
      setDictItems((prev) => prev.map((i) => i.id === itemModal.node!.id ? { ...i, ...v, updatedAt: new Date().toLocaleString('zh-CN') } : i));
      toast.success('字典项已更新');
    } else {
      const newItem: DictItem = { id: genId(), dictTypeId: selectedTypeId, ...v, createdAt: new Date().toLocaleString('zh-CN'), updatedAt: new Date().toLocaleString('zh-CN') };
      setDictItems((prev) => [...prev, newItem]);
      toast.success('字典项已创建');
    }
    setItemModal({ open: false, node: null });
  };

  const handleDeleteItem = (id: string) => {
    Modal.confirm({
      title: '删除字典项',
      content: '确定删除这个字典项吗？',
      okText: '删除',
      okButtonProps: { danger: true },
      cancelText: '取消',
      onOk: () => {
        setDictItems((prev) => prev.filter((i) => i.id !== id));
        toast.success('字典项已删除');
      },
    });
  };

  // ==================== 表格列定义 ====================

  const typeColumns: ColumnsType<DictType> = [
    { title: '字典编码', dataIndex: 'typeCode', render: (v) => <code>{v}</code> },
    { title: '字典名称', dataIndex: 'typeName' },
    { title: '描述', dataIndex: 'description', ellipsis: true },
    { title: '状态', dataIndex: 'status', width: 90, render: (s) => <Tag color={s === '1' ? 'green' : 'red'}>{s === '1' ? '启用' : '停用'}</Tag> },
    {
      title: '操作', key: 'action', width: 160,
      render: (_, r) => (
        <Space size="small">
          <Button type="link" size="small" onClick={() => { typeForm.setFieldsValue(r); setTypeModal({ open: true, node: r }); }}>编辑</Button>
          <Popconfirm title="确定删除这个字典类型吗？" okText="删除" cancelText="取消" okButtonProps={{ danger: true }} onConfirm={() => handleDeleteType(r.id)}>
            <Button type="link" size="small" danger>删除</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const itemColumns: ColumnsType<DictItem> = [
    { title: '字典项值', dataIndex: 'itemValue', render: (v) => <code>{v}</code> },
    { title: '字典项标签', dataIndex: 'itemLabel' },
    { title: '描述', dataIndex: 'description', ellipsis: true },
    { title: '状态', dataIndex: 'status', width: 90, render: (s) => <Tag color={s === '1' ? 'green' : 'red'}>{s === '1' ? '启用' : '停用'}</Tag> },
    {
      title: '操作', key: 'action', width: 160,
      render: (_, r) => (
        <Space size="small">
          <Button type="link" size="small" onClick={() => { itemForm.setFieldsValue(r); setItemModal({ open: true, node: r }); }}>编辑</Button>
          <Popconfirm title="确定删除这个字典项吗？" okText="删除" cancelText="取消" okButtonProps={{ danger: true }} onConfirm={() => handleDeleteItem(r.id)}>
            <Button type="link" size="small" danger>删除</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div className="page-header"><h2>字典管理</h2><p>字典类型 + 字典项（上下结构）</p></div>
      <div className="dict-vertical">
        {/* 上部：字典类型 */}
        <Card className="dict-type-card" title="字典类型" styles={{ body: { padding: 8 } }}
          extra={<Button type="primary" size="small" onClick={() => { typeForm.resetFields(); setTypeModal({ open: true, node: null }); }}>+ 新建字典类型</Button>}>
          <Table<DictType>
            rowKey="id" size="small" columns={typeColumns} dataSource={dictTypes}
            pagination={false}
            onRow={(r) => ({ onClick: () => setSelectedTypeId(r.id) })}
            rowClassName={(r) => r.id === selectedTypeId ? 'dict-type-row-active' : ''}
          />
        </Card>

        {/* 下部：字典项 */}
        <Card
          title={selectedType ? `字典项 - ${selectedType.typeName}` : '请选择字典类型'}
          styles={{ body: { padding: 8 } }}
          extra={
            <Space>
              <span className="text-muted text-xs">共 {filteredItems.length} 项</span>
              <Button type="primary" size="small" disabled={!selectedType} onClick={() => { itemForm.resetFields(); setItemModal({ open: true, node: null }); }}>+ 新建字典项</Button>
            </Space>
          }
        >
          {selectedType ? (
            <Table<DictItem> rowKey="id" size="small" columns={itemColumns} dataSource={filteredItems} pagination={false} />
          ) : (
            <div className="dict-empty"><Empty description="请先选择字典类型" /></div>
          )}
        </Card>
      </div>

      {/* 字典类型编辑弹窗 */}
      <Modal title={typeModal.node ? '编辑字典类型' : '新建字典类型'} open={typeModal.open} onCancel={() => setTypeModal({ open: false, node: null })}
        onOk={handleSaveType} okText="保存" cancelText="取消" destroyOnHidden>
        <Form form={typeForm} layout="vertical" preserve={false}>
          <Form.Item name="typeCode" label="字典编码" rules={[{ required: true, message: '请输入字典编码' }]}>
            <Input placeholder="如 menu_type" disabled={!!typeModal.node} />
          </Form.Item>
          <Form.Item name="typeName" label="字典名称" rules={[{ required: true, message: '请输入字典名称' }]}>
            <Input placeholder="如 菜单类型" />
          </Form.Item>
          <Form.Item name="description" label="描述">
            <Input.TextArea rows={2} placeholder="字典类型说明" />
          </Form.Item>
          <Form.Item name="status" label="状态" initialValue="1">
            <Select options={STATUS_OPTIONS} />
          </Form.Item>
        </Form>
      </Modal>

      {/* 字典项编辑弹窗 */}
      <Modal title={itemModal.node ? '编辑字典项' : '新建字典项'} open={itemModal.open} onCancel={() => setItemModal({ open: false, node: null })}
        onOk={handleSaveItem} okText="保存" cancelText="取消" destroyOnHidden>
        <Form form={itemForm} layout="vertical" preserve={false}>
          <Form.Item name="itemValue" label="字典项值" rules={[{ required: true, message: '请输入字典项值' }]}>
            <Input placeholder="如 1" />
          </Form.Item>
          <Form.Item name="itemLabel" label="字典项标签" rules={[{ required: true, message: '请输入字典项标签' }]}>
            <Input placeholder="如 目录" />
          </Form.Item>
          <Form.Item name="description" label="描述">
            <Input.TextArea rows={2} placeholder="字典项说明" />
          </Form.Item>
          <Row gutter={12}>
            <Col span={12}>
              <Form.Item name="sort" label="排序" rules={[{ required: true, message: '请输入排序' }]}>
                <Input type="number" placeholder="越小越靠前" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="status" label="状态" initialValue="1">
                <Select options={STATUS_OPTIONS} />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>
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
    },]

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
      <Card className="table-wrapper" styles={{ body: { padding: 0 } }}>
        <Table<OnlineUser> rowKey="id" columns={columns} dataSource={users} pagination={false} />
      </Card>
    </div>
  );
};

// ==================== 在线用户（演示） ====================


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
          <Col span={8} key={s.label}><Card><Statistic title={s.label} value={s.value} suffix={s.sub} styles={{ content: { color: s.color } }} /></Card></Col>
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
      // /export/v1 直接返回文件内容字符串 → 交给公共下载工具存盘
      const content = await exportData({ objectCode: v.objectCode, format: v.format });
      downloadText(content, exportFileName(v.objectCode, v.format), v.format);
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
          <Col span={6} key={w.label}><Card><Statistic title={w.label} value={w.value} styles={{ content: { color: w.color } }} /></Card></Col>
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

// ==================== Markdown 编辑器（演示） ====================

export const MarkdownEditorPage = () => {
  const [markdown, setMarkdown] = useState(`# Markdown 编辑器演示

## 功能特性
- **粗体**、*斜体*、\`代码\` 等基础格式
- 表格、列表、引用、分割线
- Mermaid 流程图支持
- Word HTML 粘贴自动转换
- 编辑 / 预览 双模式切换

## 示例表格
| 功能 | 状态 | 说明 |
|------|------|------|
| SQL 格式化 | ✅ | 支持多种数据库方言 |
| SQL 压缩 | ✅ | 去除多余空白 |
| Markdown 编辑 | ✅ | 所见即所得 |
| Word 转换 | ✅ | HTML 转 Markdown |

## 代码示例
\`\`\`javascript
const greeting = 'Hello, World!';
console.info(greeting);
\`\`\`
`);

  return (
    <div>
      <div className="page-header"><h2>Markdown 编辑器</h2><p>支持 Word HTML 粘贴转换 · 编辑 / 预览双模式</p></div>
      <KlsjnhMarkdown011
        value={markdown}
        onChange={setMarkdown}
        height={500}
      />
    </div>
  );
};

// ==================== SQL 编辑器（演示） ====================

export const SqlEditorPage = () => {
  const [sql, setSql] = useState(`SELECT
  u.user_account,
  u.user_name,
  u.email,
  u.status,
  o.org_name
FROM july_user u
LEFT JOIN july_organization o ON u.pk_org = o.pk_org
WHERE u.status = 1
ORDER BY u.created_time DESC
LIMIT 10;`);

  const [result, setResult] = useState<string | null>(null);

  const handleExecute = useCallback(async () => {
    setResult(`查询执行成功！

执行 SQL: ${sql.slice(0, 100)}...

返回 2 行数据：
| user_account | user_name | email | status | org_name |
|------|------|------|------|------|
| admin | 管理员 | admin@klsjnh.com | 1 | 技术中心 |
| zhangsan | 张三 | zhangsan@klsjnh.com | 1 | 产品部 |`);
  }, [sql]);

  return (
    <div>
      <div className="page-header"><h2>SQL 编辑器</h2><p>支持多方言格式化、压缩、自动补全</p></div>
      <Card title="SQL 编辑器" style={{ marginBottom: 16 }} extra={<span className="text-muted text-xs">支持 MySQL / Oracle / SQL Server / PostgreSQL</span>}>
        <KlsjnhSql011
          value={sql}
          onChange={setSql}
          onExecute={handleExecute}
          height={260}
          cacheKey="sql-editor-demo"
        />
      </Card>
      {result && (
        <Card title="执行结果" extra={<Button size="small" onClick={() => setResult(null)}>清空</Button>}>
          <pre style={{ background: '#f5f5f5', padding: 12, borderRadius: 4, fontSize: 13, whiteSpace: 'pre-wrap' }}>{result}</pre>
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
