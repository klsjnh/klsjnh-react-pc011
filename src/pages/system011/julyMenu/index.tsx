/**
 * 菜单管理页（julyMenu）- antd 版
 * 左侧：antd Tree（可拖拽 + 右键菜单）；右侧：antd Form 编辑
 * 字段直接使用后端名：menuCode/menuName/menuIcon/menuRoute/menuType/sortOrder/status
 */
import React, { useState, useEffect, useMemo } from 'react';
import { Button, Card, Col, Dropdown, Empty, Form, Input, Modal, Row, Select, Tree } from 'antd';
import type { DataNode, TreeProps } from 'antd/es/tree';
import { useMenuState } from '@/stores/system011/julyMenuStore';
import { addMenu, updateMenu, removeMenu, moveMenu, reorderMenu, loadMenus, reloadMenus } from '@/services/system011';
import { isMockMode } from '@/config/appConfig';
import { resolveMenuIcon } from '@/components/layout/MenuIcons';
import { IconPicker } from '@/components/layout/IconPicker';
import { uiStore, useUiState } from '@/stores/uiStore';
import type { JulyMenuVo011 } from '@/types/system011/julyMenu';
import { MENU_TYPE_OPTIONS } from '@/config/constants';
import { toast } from '@/utils/toast';

/**
 * 按后端 menuIcon 字符串渲染 antd 图标（树标题 / 下拉项 / 卡片标题复用）。
 * 用 createElement 而非 `const Icon = ...; <Icon />`：后者会被
 * react-hooks/static-components 判定为「渲染期创建组件」，而这里只是从
 * 模块级映射表取一个已存在的组件，并不新建组件。
 */
const MenuIcon = ({ value }: { value?: string | null }) =>
  React.createElement(resolveMenuIcon(value));

/** 新建菜单时 menuIcon 的默认值（存 antd 图标名，由 resolveMenuIcon 解析） */
const DEFAULT_MENU_ICON = 'FileTextOutlined';

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

export const JulyMenu = () => {
  const { menus, loaded } = useMenuState();
  const ui = useUiState();
  const selectedId = ui.menuTreeSelectedId;
  const expandedKeys = useMemo(() => ui.menuTreeExpandedIds ?? [], [ui.menuTreeExpandedIds]);

  const [form] = Form.useForm();
  const [createForm] = Form.useForm();
  const [createModal, setCreateModal] = useState(false);

  /** 计算节点深度 */
  function getNodeDepth(nodes: JulyMenuVo011[], id: string, depth: number): number {
    for (const n of nodes) {
      if (n.id === id) return depth;
      if (n.children?.length) {
        const d = getNodeDepth(n.children, id, depth + 1);
        if (d !== -1) return d;
      }
    }
    return -1;
  }

  /** 找出一级节点的父节点 id（用于判断子项归属） */
  function findParentId(nodes: JulyMenuVo011[], id: string): string | null {
    for (const n of nodes) {
      if (n.id === id) return null; // 自身是一级节点
      if (n.children?.length) {
        if (n.children.some(c => c.id === id)) return n.id;
        const p = findParentId(n.children, id);
        if (p) return p;
      }
    }
    return null;
  }

  /** 展开控制：最多同时展开 2 个一级节点 */
  const handleTreeExpand = (keys: React.Key[]) => {
    const stringKeys = keys.map(String);
    // 找出一级节点（depth === 0）已展开的项
    const prevKeys = (ui.menuTreeExpandedIds ?? []).map(String);
    const allKeys = Array.from(new Set([...prevKeys, ...stringKeys]));
    const topLevelOpened = allKeys.filter(k => getNodeDepth(menus, k, 0) === 0);

    if (topLevelOpened.length > 2) {
      const [first, ...rest] = topLevelOpened;
      const filtered = allKeys.filter(k => {
        if (k === first) return false;
        const parent = findParentId(menus, k);
        if (parent === first) return false;
        return true;
      });
      uiStore.setMenuTreeExpandedIds(filtered);
    } else {
      uiStore.setMenuTreeExpandedIds(stringKeys);
    }
  };

  /** 进页面即拉菜单树（loadMenus 内部有 loaded/loading 守卫，重复调用安全） */
  useEffect(() => {
    loadMenus();
  }, []);

  useEffect(() => {
    if (loaded && menus.length > 0 && ui.menuTreeExpandedIds === null) {
      uiStore.setMenuTreeExpandedIds([menus[0].id]);
    }
  }, [loaded, menus, ui.menuTreeExpandedIds]);

  const selectedNode = selectedId != null ? findMenu(menus, selectedId) : null;

  useEffect(() => {
    if (selectedNode) {
      form.setFieldsValue({
        menuCode: selectedNode.menuCode,
        menuName: selectedNode.menuName,
        menuIcon: selectedNode.menuIcon,
        menuRoute: selectedNode.menuRoute,
        menuType: selectedNode.menuType,
        parentId: selectedNode.parentId || '',
        status: selectedNode.status,
        sortOrder: selectedNode.sortOrder,
      });
    }
  }, [selectedId, menus, selectedNode, form]);

  const selectNode = (id: string) => uiStore.setMenuTreeSelectedId(id);

  const buildParentOptions = (exclude: JulyMenuVo011 | null) => {
    const options: { value: string; label: React.ReactNode; disabled: boolean }[] = [];
    const walk = (items: JulyMenuVo011[], depth: number) => {
      items.forEach((m) => {
        options.push({
          value: m.id,
          label: <span>{'　'.repeat(depth)}<MenuIcon value={m.menuIcon} /> {m.menuName}</span>,
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
            <MenuIcon value={m.menuIcon} /> {m.menuName}
            {m.status !== '1' && <span className="text-muted text-xs">（停用）</span>}
          </span>
        </Dropdown>
      ),
      children: m.children?.length ? toTreeData(m.children) : undefined,
    }));

  const openCreate = (parentId: string) => {
    createForm.resetFields();
    createForm.setFieldsValue({ parentId, menuCode: '', menuType: '2', menuIcon: DEFAULT_MENU_ICON, status: '1' });
    setCreateModal(true);
  };

  const handleCreate = async () => {
    const v = await createForm.validateFields();
    try {
      await addMenu({
        parentId: v.parentId,
        menuCode: v.menuCode,
        menuName: v.menuName,
        menuIcon: v.menuIcon,
        menuRoute: v.menuRoute,
        menuType: v.menuType,
        status: v.status || '1',
      });
      if (v.parentId) uiStore.setMenuTreeExpandedIds(Array.from(new Set([...expandedKeys, v.parentId])));
      if (!isMockMode()) await reloadMenus();
      setCreateModal(false);
      toast.success('菜单已创建');
    } catch (e) {
      toast.error((e as Error)?.message || '创建失败');
    }
  };

  const handleSaveEdit = async () => {
    if (!selectedNode) return;
    try {
      const v = await form.validateFields();
      await updateMenu(selectedNode.id, {
        menuCode: v.menuCode,
        menuName: v.menuName,
        menuIcon: v.menuIcon,
        menuRoute: v.menuRoute,
        menuType: v.menuType,
        parentId: v.parentId || '',
        status: v.status,
        sortOrder: v.sortOrder,
      });
      if (v.parentId !== selectedNode.parentId) await moveMenu(selectedNode.id, v.parentId || '');
      if (!isMockMode()) await reloadMenus();
      toast.success(`update ${selectedNode.id} success ...`);
    } catch (e) {
      toast.error((e as Error)?.message || '保存失败');
    }
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
      onOk: async () => {
        try {
          await removeMenu(menu.id);
          if (selectedId === menu.id) uiStore.setMenuTreeSelectedId(null);
          if (!isMockMode()) await reloadMenus();
          toast.success('菜单已删除');
        } catch (e) {
          toast.error((e as Error)?.message || '删除失败');
        }
      },
    });
  };

  const onDrop: TreeProps['onDrop'] = async (info) => {
    const dragId = String(info.dragNode.key);
    const dropId = String(info.node.key);
    if (dragId === dropId) return;
    const dragNode = findMenu(menus, dragId);
    if (!dragNode || containsId(dragNode, dropId)) return;
    if (info.dropToGap) {
      await reorderMenu(dragId, dropId, info.dropPosition);
    } else {
      await moveMenu(dragId, dropId);
    }
    uiStore.setMenuTreeExpandedIds(Array.from(new Set([...expandedKeys, dropId])));
    if (!isMockMode()) await reloadMenus();
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
          title="菜单"
          styles={{ body: { padding: 8, maxHeight: 560, overflowY: 'auto' } }}
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
                onExpand={handleTreeExpand}
                onSelect={(keys) => uiStore.setMenuTreeSelectedId((keys[0] as string) ?? null)}
                onDrop={onDrop}
              />
            )}
        </Card>

        <div className="menu-main">
          {selectedNode ? (
            <Card
              title={<span><MenuIcon value={selectedNode.menuIcon} /> 编辑菜单 - {selectedNode.menuName}</span>}
              extra={<Button type="primary" onClick={handleSaveEdit}>保存</Button>}
            >
              <Form form={form} layout="vertical">
                <Row gutter={24}>
                  <Col span={12}>
                    <Form.Item name="menuCode" label="菜单编码" rules={[{ required: true, message: '请输入菜单编码' }]}>
                      <Input disabled />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item name="menuName" label="菜单名称" rules={[{ required: true, message: '请输入菜单名称' }]}>
                      <Input />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item name="menuType" label="类型">
                      <Select options={MENU_TYPE_OPTIONS} />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item name="menuRoute" label="路由路径" rules={[{ required: true, message: '请输入路由路径' }]}>
                      <Input />
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
                  <Col span={12}>
                    <Form.Item name="menuIcon" label="图标">
                      <IconPicker value={selectedNode?.menuIcon} onChange={(v) => form.setFieldsValue({ menuIcon: v })} />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item name="sortOrder" label="排序" rules={[{ required: true, message: '请输入排序值' }]}>
                      <Input type="number" placeholder="越小越靠前" />
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
          <Row gutter={12}>
            <Col span={12}>
              <Form.Item name="menuCode" label="菜单编码" rules={[{ required: true, message: '请输入菜单编码' }]}>
                <Input placeholder="如 config" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="menuName" label="菜单名称" rules={[{ required: true, message: '请输入菜单名称' }]}>
                <Input placeholder="请输入菜单名称" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={12}>
            <Col span={12}>
              <Form.Item name="menuType" label="类型" rules={[{ required: true, message: '请选择类型' }]}>
                <Select options={MENU_TYPE_OPTIONS} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="menuRoute" label="路由路径" rules={[{ required: true, message: '请输入路由路径' }]}>
                <Input placeholder="如 /business/newpage" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={12}>
            <Col span={12}>
              <Form.Item name="menuIcon" label="图标" rules={[{ required: true, message: '请选择图标' }]}>
                <IconPicker />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="sortOrder" label="排序" rules={[{ required: true, message: '请输入排序值' }]}>
                <Input type="number" placeholder="越小越靠前" />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="status" label="状态" initialValue="1" rules={[{ required: true, message: '请选择状态' }]}>
            <Select options={[{ value: '1', label: '启用' }, { value: '0', label: '停用' }]} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};
