/**
 * 菜单管理页（julyMenu）- antd 版
 * 左侧：antd Tree（可拖拽 + 右键菜单）；右侧：antd Form 编辑
 * 字段直接使用后端名：menuCode/menuName/menuIcon/menuRoute/menuType/sortOrder/status
 */
import React, { useState, useEffect, useMemo } from 'react';
import { Button, Card, Col, Dropdown, Empty, Form, Input, InputNumber, Modal, Row, Select, Space, Tree } from 'antd';
import type { DataNode, TreeProps } from 'antd/es/tree';
import { menuStore, useMenuState } from '@/stores/system011/julyMenuStore';
import { uiStore, useUiState } from '@/stores/uiStore';
import type { JulyMenuVo011 } from '@/types/system011/julyMenu';
import type { MenuListPageProps } from '@/types/view/page';

const MENU_TYPE_OPTIONS = [
  { value: '1', label: '目录' },
  { value: '2', label: '菜单' },
  { value: '3', label: '按钮' },
];

function findMenu(items: JulyMenuVo011[], id: string): JulyMenuVo011 | null {
  for (const item of items) {
    if (item.id === id) return item;
    if (item.children) {
      const found = findMenu(item.children, id);
      if (found) return found;
    }
  }
  return null;
}

function containsId(node: JulyMenuVo011, id: string): boolean {
  return node.id === id || (node.children || []).some((c) => containsId(c, id));
}

export const julyMenu: React.FC<MenuListPageProps> = () => {
  const { menus, loaded } = useMenuState();
  const ui = useUiState();
  const selectedId = ui.menuTreeSelectedId;
  const expandedKeys = useMemo(() => ui.menuTreeExpandedIds ?? [], [ui.menuTreeExpandedIds]);

  const [form] = Form.useForm();
  const [createForm] = Form.useForm();
  const [createModal, setCreateModal] = useState(false);

  useEffect(() => {
    if (loaded && menus.length > 0 && ui.menuTreeExpandedIds === null) {
      uiStore.setMenuTreeExpandedIds([menus[0].id]);
    }
  }, [loaded, menus, ui.menuTreeExpandedIds]);

  const selectedNode = selectedId != null ? findMenu(menus, selectedId) : null;

  useEffect(() => {
    if (selectedNode) {
      form.setFieldsValue({
        menuName: selectedNode.menuName,
        menuIcon: selectedNode.menuIcon,
        menuRoute: selectedNode.menuRoute,
        menuType: selectedNode.menuType,
        parentId: selectedNode.parentId || '',
        status: selectedNode.status,
      });
    }
  }, [selectedId, menus, selectedNode, form]);

  const selectNode = (id: string) => uiStore.setMenuTreeSelectedId(id);

  const buildParentOptions = (exclude: JulyMenuVo011 | null) => {
    const options: { value: string; label: string; disabled: boolean }[] = [];
    const walk = (items: JulyMenuVo011[], depth: number) => {
      items.forEach((m) => {
        options.push({
          value: m.id,
          label: `${'　'.repeat(depth)}${m.menuIcon} ${m.menuName}`,
          disabled: !!exclude && containsId(exclude, m.id),
        });
        if (m.children) walk(m.children, depth + 1);
      });
    };
    walk(menus, 0);
    return options;
  };

  const toTreeData = (items: JulyMenuVo011[]): DataNode[] =>
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
            {m.menuIcon} {m.menuName}
            {m.status !== '1' && <span className="text-muted text-sm">（停用）</span>}
          </span>
        </Dropdown>
      ),
      children: m.children?.length ? toTreeData(m.children) : undefined,
    }));

  const openCreate = (parentId: string) => {
    createForm.resetFields();
    createForm.setFieldsValue({ parentId, menuType: '2', menuIcon: '📄' });
    setCreateModal(true);
  };

  const handleCreate = async () => {
    const v = await createForm.validateFields();
    menuStore.add({
      parentId: v.parentId || '',
      menuCode: v.menuCode,
      menuName: v.menuName,
      menuIcon: v.menuIcon || '📄',
      menuRoute: v.menuRoute,
      menuType: v.menuType,
      permissionCode: null,
      component: null,
      sortOrder: 0,
      status: '1',
    });
    if (v.parentId) uiStore.setMenuTreeExpandedIds(Array.from(new Set([...expandedKeys, v.parentId])));
    setCreateModal(false);
  };

  const handleSaveEdit = async () => {
    if (!selectedNode) return;
    const v = await form.validateFields();
    menuStore.update(selectedNode.id, {
      menuName: v.menuName,
      menuIcon: v.menuIcon,
      menuRoute: v.menuRoute,
      menuType: v.menuType,
      status: v.status,
    });
    if (v.parentId !== selectedNode.parentId) menuStore.move(selectedNode.id, v.parentId || '');
  };

  const handleDelete = (menu: JulyMenuVo011) => {
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
    const dragId = String(info.dragNode.key);
    const dropId = String(info.node.key);
    if (dragId === dropId) return;
    const dragNode = findMenu(menus, dragId);
    if (!dragNode || containsId(dragNode, dropId)) return;
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
          extra={<Button type="link" size="small" onClick={() => openCreate('')}>+ 新建顶级菜单</Button>}
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
                onExpand={(keys) => uiStore.setMenuTreeExpandedIds(keys as string[])}
                onSelect={(keys) => uiStore.setMenuTreeSelectedId((keys[0] as string) ?? null)}
                onDrop={onDrop}
              />
            )}
        </Card>

        <div className="menu-main">
          {selectedNode ? (
            <Card
              title={`${selectedNode.menuIcon} 编辑菜单 - ${selectedNode.menuName}`}
              extra={<Button type="primary" onClick={handleSaveEdit}>保存</Button>}
            >
              <Form form={form} layout="vertical">
                <Row gutter={24}>
                  <Col span={12}>
                    <Form.Item name="menuName" label="菜单名称" rules={[{ required: true, message: '请输入菜单名称' }]}>
                      <Input />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item name="menuIcon" label="图标（emoji）"><Input /></Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item name="menuRoute" label="路由路径" rules={[{ required: true, message: '请输入路由路径' }]}>
                      <Input />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item name="menuType" label="类型">
                      <Select options={MENU_TYPE_OPTIONS} />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item name="parentId" label="上级菜单">
                      <Select allowClear placeholder="（顶级菜单）" options={buildParentOptions(selectedNode)} />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item name="status" label="状态">
                      <Select options={[{ value: '1', label: '启用' }, { value: '0', label: '停用' }]} />
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
        open={createModal}
        onCancel={() => setCreateModal(false)}
        onOk={handleCreate}
        okText="保存"
        cancelText="取消"
        destroyOnClose
      >
        <Form form={createForm} layout="vertical" preserve={false}>
          <Form.Item name="parentId" label="上级菜单">
            <Select allowClear placeholder="（顶级菜单）" options={buildParentOptions(null)} />
          </Form.Item>
          <Form.Item name="menuCode" label="菜单编码" rules={[{ required: true, message: '请输入菜单编码' }]}>
            <Input placeholder="如 config" />
          </Form.Item>
          <Form.Item name="menuName" label="菜单名称" rules={[{ required: true, message: '请输入菜单名称' }]}>
            <Input placeholder="请输入菜单名称" />
          </Form.Item>
          <Form.Item name="menuRoute" label="路由路径" rules={[{ required: true, message: '请输入路由路径' }]}>
            <Input placeholder="如 /business/newpage" />
          </Form.Item>
          <Row gutter={12}>
            <Col span={12}>
              <Form.Item name="menuIcon" label="图标（emoji）"><Input /></Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="menuType" label="类型">
                <Select options={MENU_TYPE_OPTIONS} />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>
    </div>
  );
};
