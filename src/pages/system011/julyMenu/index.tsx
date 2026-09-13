/**
 * 菜单管理页（julyMenu）- antd 版
 * 左侧：antd Tree（可拖拽 + 右键菜单）；右侧：antd Form 编辑
 */
import React, { useState, useEffect, useMemo } from 'react';
import { Button, Card, Col, Dropdown, Empty, Form, Input, Modal, Row, Select, Space, Switch, Tree, Typography } from 'antd';
import type { DataNode, TreeProps } from 'antd/es/tree';
import { menuStore, useMenuState, type MenuConfig } from '@/stores/system011/julyMenuStore';
import { uiStore, useUiState } from '@/stores/uiStore';

interface MenuListPageProps {
  onNavigate?: (path: string) => void;
}

export const julyMenu: React.FC<MenuListPageProps> = () => {
  const { menus, loaded } = useMenuState();
  const ui = useUiState();
  const selectedId = ui.menuTreeSelectedId;
  const expandedKeys = useMemo(() => ui.menuTreeExpandedIds ?? [], [ui.menuTreeExpandedIds]);

  const [form] = Form.useForm();
  const [createForm] = Form.useForm();
  const [createModal, setCreateModal] = useState<{ open: boolean; parentId: number }>({ open: false, parentId: 0 });

  useEffect(() => {
    if (loaded && menus.length > 0 && ui.menuTreeExpandedIds === null) {
      uiStore.setMenuTreeExpandedIds([menus[0].id]);
    }
  }, [loaded, menus, ui.menuTreeExpandedIds]);

  const findNode = (items: MenuConfig[], id: number): MenuConfig | null => {
    for (const item of items) {
      if (item.id === id) return item;
      if (item.children) {
        const found = findNode(item.children, id);
        if (found) return found;
      }
    }
    return null;
  };

  const containsId = (node: MenuConfig, id: number): boolean =>
    node.id === id || (node.children || []).some((c) => containsId(c, id));

  const selectedNode = selectedId != null ? findNode(menus, selectedId) : null;

  useEffect(() => {
    if (selectedNode) {
      form.setFieldsValue({
        title: selectedNode.title, path: selectedNode.path, icon: selectedNode.icon,
        type: selectedNode.type, parentId: selectedNode.parentId, visible: selectedNode.visible,
      });
    }
  }, [selectedId, menus, selectedNode, form]);

  const selectNode = (id: number) => uiStore.setMenuTreeSelectedId(id);

  /** 组织树 → antd Tree DataNode（title 内嵌右键下拉） */
  const toTreeData = (items: MenuConfig[]): DataNode[] =>
    items.map((m) => ({
      key: m.id,
      title: (
        <Dropdown
          trigger={['contextMenu']}
          menu={{
            items: [
              { key: 'add', label: '新建子菜单' },
              { key: 'edit', label: '编辑' },
              { key: 'del', label: '删除', danger: true },
            ],
            onClick: ({ key, domEvent }) => {
              domEvent.stopPropagation();
              if (key === 'add') openCreate(m.id);
              if (key === 'edit') selectNode(m.id);
              if (key === 'del') handleDelete(m);
            },
          }}
        >
          <span className="menu-tree-title">
            {m.icon || '📄'} {m.title}
            {!m.visible && <Typography.Text type="secondary" className="text-sm">（隐藏）</Typography.Text>}
          </span>
        </Dropdown>
      ),
      children: m.children?.length ? toTreeData(m.children) : undefined,
    }));

  const buildParentOptions = (excludeNode: MenuConfig | null) => {
    const options: { value: number; label: string; disabled: boolean }[] = [];
    const walk = (items: MenuConfig[], depth: number) => {
      items.forEach((m) => {
        options.push({
          value: m.id,
          label: `${'　'.repeat(depth)}${m.icon} ${m.title}`,
          disabled: excludeNode != null && containsId(excludeNode, m.id),
        });
        if (m.children) walk(m.children, depth + 1);
      });
    };
    walk(menus, 0);
    return options;
  };

  const openCreate = (parentId: number) => {
    createForm.resetFields();
    createForm.setFieldsValue({ parentId, type: 'page', icon: '📄' });
    setCreateModal({ open: true, parentId });
  };

  const handleSaveCreate = async () => {
    const v = await createForm.validateFields();
    const parent = v.parentId === 0 ? null : findNode(menus, v.parentId);
    menuStore.add({
      parentId: v.parentId,
      name: v.path.split('/').pop() || 'NewPage',
      path: v.path,
      icon: v.icon || '📄',
      title: v.title,
      type: v.type,
      sort: (parent?.children?.length || 0) + 1,
      visible: true,
    });
    if (v.parentId !== 0) {
      uiStore.setMenuTreeExpandedIds(Array.from(new Set([...expandedKeys, v.parentId])));
    }
    setCreateModal({ open: false, parentId: 0 });
  };

  const handleSaveEdit = async () => {
    if (!selectedNode) return;
    const v = await form.validateFields();
    menuStore.update(selectedNode.id, { title: v.title, path: v.path, icon: v.icon, type: v.type, visible: v.visible });
    if (v.parentId !== selectedNode.parentId) menuStore.move(selectedNode.id, v.parentId);
  };

  const handleDelete = (menu: MenuConfig) => {
    if (menu.children && menu.children.length > 0) {
      Modal.warning({ title: '无法删除', content: '该菜单下存在子菜单，无法删除。' });
      return;
    }
    Modal.confirm({
      title: '删除菜单',
      content: '确定删除这个菜单吗？删除后导航将实时更新。',
      okText: '删除',
      okButtonProps: { danger: true },
      cancelText: '取消',
      onOk: () => {
        menuStore.remove(menu.id);
        if (selectedId === menu.id) uiStore.setMenuTreeSelectedId(null);
      },
    });
  };

  const onDrop: TreeProps['onDrop'] = (info) => {
    const dragId = Number(info.dragNode.key);
    const dropId = Number(info.node.key);
    if (dragId === dropId) return;
    const dragNode = findNode(menus, dragId);
    if (!dragNode || containsId(dragNode, dropId)) return;
    // 放到目标节点下（成为子菜单）
    menuStore.move(dragId, dropId);
    uiStore.setMenuTreeExpandedIds(Array.from(new Set([...expandedKeys, dropId])));
  };

  return (
    <div>
      <div className="page-header">
        <h2>菜单管理</h2>
        <p>左树右编辑 · 右键新建 · 拖拽调整层级</p>
      </div>

      <div className="menu-layout">
        <Card
          className="menu-sider"
          title="菜单结构"
          styles={{ body: { padding: 8, maxHeight: 560, overflowY: 'auto' } }}
          extra={<Button type="link" size="small" onClick={() => openCreate(0)}>+ 新建顶级菜单</Button>}
        >
          {menus.length === 0
            ? <Empty description="暂无菜单" />
            : (
              <Tree
                blockNode
                draggable
                defaultExpandAll
                treeData={toTreeData(menus)}
                expandedKeys={expandedKeys}
                selectedKeys={selectedId != null ? [selectedId] : []}
                onExpand={(keys) => uiStore.setMenuTreeExpandedIds(keys as number[])}
                onSelect={(keys) => uiStore.setMenuTreeSelectedId((keys[0] as number) ?? null)}
                onDrop={onDrop}
              />
            )}
        </Card>

        <div className="menu-main">
          {selectedNode ? (
            <Card
              title={`${selectedNode.icon} 编辑菜单 - ${selectedNode.title}`}
              extra={<Button type="primary" onClick={handleSaveEdit}>保存</Button>}
            >
              <Form form={form} layout="vertical">
                <Row gutter={24}>
                  <Col span={12}>
                    <Form.Item name="title" label="菜单标题" rules={[{ required: true, message: '请输入菜单标题' }]}>
                      <Input />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item name="icon" label="图标（emoji）"><Input /></Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item name="path" label="路由路径" rules={[{ required: true, message: '请输入路由路径' }]}>
                      <Input />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item name="type" label="类型">
                      <Select options={[{ value: 'page', label: '页面' }, { value: 'tab', label: '导航' }]} />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item name="parentId" label="上级菜单">
                      <Select options={[{ value: 0, label: '（顶级菜单）' }, ...buildParentOptions(selectedNode)]} />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item name="visible" label="在导航中显示" valuePropName="checked">
                      <Switch />
                    </Form.Item>
                  </Col>
                </Row>
              </Form>
            </Card>
          ) : (
            <Card className="menu-empty"><Empty description="请在左侧选择要编辑的菜单" /></Card>
          )}
        </div>
      </div>

      <Modal
        title="新建菜单"
        open={createModal.open}
        onCancel={() => setCreateModal({ open: false, parentId: 0 })}
        onOk={handleSaveCreate}
        okText="保存"
        cancelText="取消"
        destroyOnClose
      >
        <Form form={createForm} layout="vertical" preserve={false}>
          <Form.Item name="parentId" label="上级菜单">
            <Select options={[{ value: 0, label: '（顶级菜单）' }, ...buildParentOptions(null)]} />
          </Form.Item>
          <Form.Item name="title" label="菜单标题" rules={[{ required: true, message: '请输入菜单标题' }]}>
            <Input placeholder="请输入菜单标题" />
          </Form.Item>
          <Form.Item name="path" label="路由路径" rules={[{ required: true, message: '请输入路由路径' }]}>
            <Input placeholder="如 /business/newpage" />
          </Form.Item>
          <Row gutter={12}>
            <Col span={12}>
              <Form.Item name="icon" label="图标（emoji）"><Input /></Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="type" label="类型">
                <Select options={[{ value: 'page', label: '页面' }, { value: 'tab', label: '导航' }]} />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>
    </div>
  );
};
