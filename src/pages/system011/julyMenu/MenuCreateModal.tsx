/**
 * 菜单新建弹窗（system011 · julyMenu）—— 从页面壳拆出（2026-09-22）
 * 契合金标准弹窗模式：Modal 与 Form 同组件、onOk/okText 内建 footer、confirmLoading 防重复提交。
 * 打开方式：壳持有 open 状态，`<MenuCreateModal open menuTree parentId={id} onCreated onClose />`；
 * 表单初始值由 initialValues 定型（parentId 预填），不走 setFieldsValue。
 */
import React, { useState } from 'react';
import { Col, Form, Input, Modal, Row, Select } from 'antd';
import type { ReactNode } from 'react';
import { addMenu, reloadMenus } from '@/services/system011';
import { isMockMode } from '@/config/appConfig';
import { resolveMenuIcon } from '@/components/layout/MenuIcons';
import { IconPicker } from '@/components/layout/IconPicker';
import { MENU_TYPE_OPTIONS } from '@/config/constants';
import type { JulyMenuVo011 } from '@/types/system011/julyMenu';
import { toast } from '@/utils/toast';

/** 按后端 menuIcon 字符串渲染 antd 图标（与壳内树标题同款） */
const MenuIcon = ({ value }: { value?: string | null }) =>
  React.createElement(resolveMenuIcon(value));

/** 上级菜单选项：树展平 + 层级缩进（新建态无需防环） */
function buildParentOptions(tree: JulyMenuVo011[]): { value: string; label: ReactNode }[] {
  const options: { value: string; label: ReactNode }[] = [];
  const walk = (items: JulyMenuVo011[], depth: number) => {
    items.forEach((m) => {
      options.push({
        value: m.id,
        label: <span>{'　'.repeat(depth)}<MenuIcon value={m.menuIcon} /> {m.menuName}</span>,
      });
      if (m.children) walk(m.children, depth + 1);
    });
  };
  walk(tree, 0);
  return options;
}

export interface MenuCreateModalProps {
  open: boolean;
  /** 全量菜单树（上级菜单选项数据源） */
  menuTree: JulyMenuVo011[];
  /** 新建子级时预填的上级菜单 id；'' = 顶级 */
  parentId?: string;
  onClose: () => void;
  /** 创建成功回调（壳用于展开树节点到新上级） */
  onCreated?: (parentId: string) => void;
}

const MenuCreateModal = ({ open, menuTree, parentId = '', onClose, onCreated }: MenuCreateModalProps) => {
  const [form] = Form.useForm();
  const [saving, setSaving] = useState(false);

  const handleCreate = async () => {
    const v = await form.validateFields();
    try {
      setSaving(true);
      const isDir = v.menuType === '1';
      const isButton = v.menuType === '3';
      await addMenu({
        parentId: v.parentId,
        menuCode: v.menuCode,
        menuName: v.menuName,
        menuIcon: v.menuIcon,
        menuType: v.menuType,
        status: v.status || '1',
        menuRoute: isButton ? '' : (v.menuRoute || ''),
        component: isDir || isButton ? null : (v.component || null),
        permissionCode: isDir ? null : (v.permissionCode || null),
      });
      if (v.parentId) onCreated?.(v.parentId);
      if (!isMockMode()) await reloadMenus();
      onClose();
      toast.success('菜单已创建');
    } catch (e) {
      toast.error((e as Error)?.message || '创建失败');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      title="新建菜单"
      open={open}
      onCancel={onClose}
      onOk={handleCreate}
      okText="保存"
      cancelText="取消"
      confirmLoading={saving}
      destroyOnHidden
    >
      <Form
        form={form}
        layout="vertical"
        preserve={false}
        initialValues={{
          parentId: parentId || undefined,
          menuCode: '',
          menuType: parentId ? '2' : '1',
          menuIcon: 'FileTextOutlined',
          status: '1',
          permissionCode: '',
          component: '',
        }}
      >
        <Row gutter={12}>
          <Col span={8}>
            <Form.Item name="menuType" label="类型" rules={[{ required: true, message: '请选择类型' }]}>
              <Select options={MENU_TYPE_OPTIONS} />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item name="menuCode" label="菜单编码" rules={[{ required: true, message: '请输入菜单编码' }]}>
              <Input placeholder="如 config" />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item name="menuName" label="菜单名称" rules={[{ required: true, message: '请输入菜单名称' }]}>
              <Input placeholder="请输入菜单名称" />
            </Form.Item>
          </Col>
        </Row>
        <Row gutter={12}>
          <Col span={8}>
            {/* 留空 = 顶级菜单（与编辑表单同口径，后端不要求 parentId） */}
            <Form.Item name="parentId" label="上级菜单">
              <Select allowClear placeholder="（顶级菜单）" options={buildParentOptions(menuTree)} />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item noStyle shouldUpdate={(prev, next) => prev.menuType !== next.menuType}>
              {({ getFieldValue }) => (
                <Form.Item
                  name="menuRoute"
                  label="路由路径"
                  hidden={getFieldValue('menuType') === '3'}
                  rules={getFieldValue('menuType') === '2' ? [{ required: true, message: '请输入路由路径' }] : []}
                >
                  <Input placeholder="如 /business/newpage" />
                </Form.Item>
              )}
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item name="menuIcon" label="图标" rules={[{ required: true, message: '请选择图标' }]}>
              <IconPicker />
            </Form.Item>
          </Col>
        </Row>
        <Row gutter={12}>
          <Col span={12}>
            <Form.Item noStyle shouldUpdate={(prev, next) => prev.menuType !== next.menuType}>
              {({ getFieldValue }) => (
                <Form.Item
                  name="permissionCode"
                  label="权限编码"
                  hidden={getFieldValue('menuType') === '1'}
                  tooltip="接口权限标识；目录节点留空"
                  rules={getFieldValue('menuType') === '3' ? [{ required: true, message: '按钮必须填写权限编码' }] : []}
                >
                  <Input placeholder="如 biz:newpage:view" />
                </Form.Item>
              )}
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="sortOrder" label="排序" rules={[{ required: true, message: '请输入排序值' }]}>
              <Input type="number" placeholder="越小越靠前" />
            </Form.Item>
          </Col>
        </Row>
        <Row gutter={12}>
          <Col span={24}>
            <Form.Item name="status" label="状态" initialValue="1">
              <Select options={[{ value: '1', label: '启用' }, { value: '0', label: '停用' }]} />
            </Form.Item>
          </Col>
        </Row>
      </Form>
    </Modal>
  );
};

export default MenuCreateModal;
