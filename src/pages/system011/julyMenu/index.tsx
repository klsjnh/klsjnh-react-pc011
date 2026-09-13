/**
 * 菜单管理页（julyMenu）- PC 端
 * 左侧：菜单树，支持右键菜单（新建子菜单/编辑/删除）与拖拽调整层级
 * 右侧：当前菜单的编辑表单（右上角保存），点击树节点切换
 */
import React, { useState, useEffect, useMemo } from 'react';
import { menuStore, useMenuState, type MenuConfig } from '@/stores/system011/julyMenuStore';
import { ConfirmDialog } from '@/components';
import { uiStore, useUiState } from '@/stores/uiStore';

interface MenuListPageProps {
  onNavigate?: (path: string) => void;
}

const inputStyle: React.CSSProperties = {
  width: '100%', height: '38px', padding: '0 12px',
  border: '1px solid var(--border)', borderRadius: 'var(--radius)',
  fontSize: '14px', outline: 'none', background: '#fff',
};

const labelStyle: React.CSSProperties = {
  fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '6px',
};

export const julyMenu: React.FC<MenuListPageProps> = () => {
  const { menus, loaded } = useMenuState();
  const ui = useUiState();
  const expandedIds = useMemo(() => new Set(ui.menuTreeExpandedIds ?? []), [ui.menuTreeExpandedIds]);
  const selectedId = ui.menuTreeSelectedId;
  // 展开/选中状态写入 uiStore（localStorage 持久化），保持原 setState 调用形态
  const setExpandedIds = (
    value: Set<number> | ((prev: Set<number>) => Set<number>)
  ) => {
    const next = typeof value === 'function' ? value(new Set(ui.menuTreeExpandedIds ?? [])) : value;
    uiStore.setMenuTreeExpandedIds(Array.from(next));
  };
  const setSelectedId = (id: number | null) => uiStore.setMenuTreeSelectedId(id);

  // 拖拽
  const [dragId, setDragId] = useState<number | null>(null);
  const [dragOverId, setDragOverId] = useState<number | null>(null);
  const [dragOverRoot, setDragOverRoot] = useState(false);

  // 右键菜单
  const [ctx, setCtx] = useState<{ x: number; y: number; menu: MenuConfig } | null>(null);

  // 新建弹窗（树上右键/左上按钮触发）
  const [createModal, setCreateModal] = useState<{ visible: boolean; parentId: number }>({ visible: false, parentId: 0 });
  const [form, setForm] = useState({ title: '', path: '', icon: '📄', type: 'page' as MenuConfig['type'], parentId: 0, visible: true });
  const [dialog, setDialog] = useState({ visible: false, id: 0 });

  // 默认仅展开第一个顶级节点；用户操作后的展开状态由 uiStore 持久化
  useEffect(() => {
    if (loaded && menus.length > 0 && ui.menuTreeExpandedIds === null) {
      uiStore.setMenuTreeExpandedIds([menus[0].id]);
    }
  }, [loaded, menus, ui.menuTreeExpandedIds]);

  // ==================== 树操作 ====================

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

  /** node 子树中是否包含 id（用于禁止拖到自己的子孙下） */
  const containsId = (node: MenuConfig, id: number): boolean =>
    node.id === id || (node.children || []).some(c => containsId(c, id));

  /** 从根到 id 的路径 */
  const findPath = (items: MenuConfig[], id: number, trail: number[]): number[] | null => {
    for (const item of items) {
      const next = [...trail, item.id];
      if (item.id === id) return next;
      if (item.children) {
        const found = findPath(item.children, id, next);
        if (found) return found;
      }
    }
    return null;
  };

  const toggleExpand = (id: number) => {
    setExpandedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const selectedNode = selectedId != null ? findNode(menus, selectedId) : null;

  // 选中节点变化时，把节点数据同步到编辑表单
  useEffect(() => {
    if (selectedNode) {
      setForm({
        title: selectedNode.title, path: selectedNode.path, icon: selectedNode.icon,
        type: selectedNode.type, parentId: selectedNode.parentId, visible: selectedNode.visible,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId, menus]);

  /** 点击树节点或表格行：选中并展开其祖先，右侧切换为该菜单的编辑 */
  const selectNode = (menu: MenuConfig) => {
    setSelectedId(menu.id);
    const path = findPath(menus, menu.id, []);
    if (path && path.length > 1) {
      setExpandedIds(prev => {
        const next = new Set(prev);
        path.slice(0, -1).forEach(id => next.add(id));
        return next;
      });
    }
  };

  /** 上级菜单下拉选项（excludeNode 及其子孙会被置灰） */
  const buildParentOptions = (excludeNode: MenuConfig | null) => {
    const options: { id: number; label: string; disabled: boolean }[] = [];
    const walk = (items: MenuConfig[], depth: number) => {
      items.forEach(m => {
        const disabled = excludeNode != null && containsId(excludeNode, m.id);
        options.push({ id: m.id, label: `${'　'.repeat(depth)}${m.icon} ${m.title}`, disabled });
        if (m.children) walk(m.children, depth + 1);
      });
    };
    walk(menus, 0);
    return options;
  };

  // ==================== 增删改 ====================

  const openCreate = (parentId: number) => {
    setForm({ title: '', path: '', icon: '📄', type: 'page', parentId, visible: true });
    setCreateModal({ visible: true, parentId });
  };

  const handleSaveCreate = () => {
    if (!form.title.trim() || !form.path.trim()) return;
    const parent = form.parentId === 0 ? null : findNode(menus, form.parentId);
    menuStore.add({
      parentId: form.parentId,
      name: form.path.split('/').pop() || 'NewPage',
      path: form.path,
      icon: form.icon,
      title: form.title,
      type: form.type,
      sort: (parent?.children?.length || 0) + 1,
      visible: true,
    });
    if (form.parentId !== 0) setExpandedIds(prev => new Set(prev).add(form.parentId));
    setCreateModal({ visible: false, parentId: 0 });
  };

  const handleSaveEdit = () => {
    if (!selectedNode || !form.title.trim() || !form.path.trim()) return;
    menuStore.update(selectedNode.id, { title: form.title, path: form.path, icon: form.icon, type: form.type, visible: form.visible });
    if (form.parentId !== selectedNode.parentId) menuStore.move(selectedNode.id, form.parentId);
  };

  const handleDelete = (menu: MenuConfig) => {
    if (menu.children && menu.children.length > 0) {
      alert('该菜单下存在子菜单，无法删除');
      return;
    }
    setDialog({ visible: true, id: menu.id });
  };

  // ==================== 渲染 ====================

  const renderTreeNode = (menu: MenuConfig, depth = 0): React.ReactNode => {
    const hasChildren = menu.children && menu.children.length > 0;
    const isExpanded = expandedIds.has(menu.id);
    const isSelected = selectedId === menu.id;
    const dragNode = dragId != null ? findNode(menus, dragId) : null;
    const canDrop = dragNode != null && dragId !== menu.id && !containsId(dragNode, menu.id);

    return (
      <React.Fragment key={menu.id}>
        <div
          draggable
          onDragStart={(e) => { setDragId(menu.id); e.dataTransfer.effectAllowed = 'move'; }}
          onDragEnd={() => { setDragId(null); setDragOverId(null); }}
          onDragOver={(e) => {
            if (!canDrop) return;
            e.preventDefault();
            e.dataTransfer.dropEffect = 'move';
            setDragOverId(menu.id);
          }}
          onDragLeave={() => setDragOverId(prev => (prev === menu.id ? null : prev))}
          onDrop={(e) => {
            e.preventDefault();
            if (canDrop && dragId != null) {
              menuStore.move(dragId, menu.id);
              setExpandedIds(prev => new Set(prev).add(menu.id));
            }
            setDragOverId(null);
          }}
          onClick={() => selectNode(menu)}
          onContextMenu={(e) => { e.preventDefault(); setCtx({ x: e.clientX, y: e.clientY, menu }); }}
          style={{
            display: 'flex', alignItems: 'center', gap: '6px',
            padding: '7px 10px', paddingLeft: `${10 + depth * 16}px`,
            cursor: 'pointer', fontSize: '13px',
            borderBottom: '1px solid var(--border-light)',
            background: isSelected ? '#e6f7ff' : dragOverId === menu.id ? '#fffbe6' : 'transparent',
            borderLeft: isSelected ? '3px solid var(--primary)' : '3px solid transparent',
            opacity: dragId === menu.id ? 0.5 : 1,
          }}
        >
          {hasChildren ? (
            <button onClick={(e) => { e.stopPropagation(); toggleExpand(menu.id); }}
              style={{ background: 'none', border: 'none', fontSize: '10px', cursor: 'pointer', padding: '0 2px', transform: isExpanded ? 'rotate(90deg)' : 'rotate(0)' }}>▶</button>
          ) : <span style={{ width: '14px' }} />}
          <span>{menu.icon || '📄'}</span>
          <span style={{ flex: 1, fontWeight: depth === 0 ? 600 : 400 }}>
            {menu.title}
            {!menu.visible && <span style={{ fontSize: '10px', color: 'var(--text-muted)', marginLeft: '4px' }}>(隐藏)</span>}
          </span>
          {hasChildren && <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{menu.children!.length}</span>}
        </div>
        {hasChildren && isExpanded && menu.children!.map(child => renderTreeNode(child, depth + 1))}
      </React.Fragment>
    );
  };

  const ctxItemStyle: React.CSSProperties = {
    display: 'block', width: '100%', textAlign: 'left', padding: '7px 12px',
    background: 'none', border: 'none', fontSize: '13px', cursor: 'pointer',
    color: 'var(--text-primary)', borderRadius: '4px',
  };

  return (
    <div>
      <div className="page-header">
        <h2>菜单管理</h2>
        <p>左树右编辑 · 点击树节点编辑该菜单 · 右键新建 · 拖拽调整层级</p>
      </div>

      <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
        {/* ===== 左侧：菜单树 ===== */}
        <div style={{ width: '300px', flexShrink: 0 }}>
          <div className="table-wrapper" style={{ padding: '10px 12px', marginBottom: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '13px', fontWeight: 600 }}>菜单结构</span>
            <button className="btn-link" onClick={() => openCreate(0)}>+ 新建顶级菜单</button>
          </div>
          <div className="table-wrapper" style={{ padding: 0, maxHeight: '520px', overflowY: 'auto' }}>
            {menus.map(menu => renderTreeNode(menu))}
          </div>
          {/* 拖拽为顶级的放置区 */}
          <div
            onDragOver={(e) => { if (dragId != null) { e.preventDefault(); setDragOverRoot(true); } }}
            onDragLeave={() => setDragOverRoot(false)}
            onDrop={(e) => {
              e.preventDefault();
              if (dragId != null) menuStore.move(dragId, 0);
              setDragOverRoot(false);
              setDragId(null);
            }}
            style={{
              marginTop: '8px', padding: '10px', textAlign: 'center', fontSize: '12px',
              color: 'var(--text-muted)',
              border: dragOverRoot ? '2px dashed var(--primary)' : '2px dashed var(--border)',
              borderRadius: 'var(--radius)', background: dragOverRoot ? '#fffbe6' : 'transparent',
            }}
          >
            拖拽到此处设为顶级菜单
          </div>
        </div>

        {/* ===== 右侧：菜单编辑表单 ===== */}
        <div style={{ flex: 1 }}>
          {selectedNode ? (
            <>
              {/* 编辑表单（右上角保存） */}
              <div className="page-toolbar">
                <div className="toolbar-left">
                  <span style={{ fontSize: '14px', fontWeight: 600 }}>{selectedNode.icon} 编辑菜单 - {selectedNode.title}</span>
                </div>
                <div className="toolbar-right">
                  <button className="btn btn-primary" onClick={handleSaveEdit}
                    disabled={!form.title.trim() || !form.path.trim()}
                    style={{ opacity: form.title.trim() && form.path.trim() ? 1 : 0.5 }}>
                    保存
                  </button>
                </div>
              </div>
              <div className="table-wrapper" style={{ padding: '20px 24px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px 24px', maxWidth: '680px' }}>
                  <div>
                    <div style={labelStyle}>菜单标题 <span style={{ color: 'var(--danger)' }}>*</span></div>
                    <input style={inputStyle} value={form.title} onChange={(e) => setForm(f => ({ ...f, title: e.target.value }))} />
                  </div>
                  <div>
                    <div style={labelStyle}>图标（emoji）</div>
                    <input style={inputStyle} value={form.icon} onChange={(e) => setForm(f => ({ ...f, icon: e.target.value }))} />
                  </div>
                  <div>
                    <div style={labelStyle}>路由路径 <span style={{ color: 'var(--danger)' }}>*</span></div>
                    <input style={inputStyle} value={form.path} onChange={(e) => setForm(f => ({ ...f, path: e.target.value }))} />
                  </div>
                  <div>
                    <div style={labelStyle}>类型</div>
                    <select style={inputStyle} value={form.type} onChange={(e) => setForm(f => ({ ...f, type: e.target.value as MenuConfig['type'] }))}>
                      <option value="page">页面</option>
                      <option value="tab">导航</option>
                    </select>
                  </div>
                  <div>
                    <div style={labelStyle}>上级菜单</div>
                    <select style={inputStyle} value={form.parentId} onChange={(e) => setForm(f => ({ ...f, parentId: Number(e.target.value) }))}>
                      <option value={0}>（顶级菜单）</option>
                      {buildParentOptions(selectedNode).map(o => <option key={o.id} value={o.id} disabled={o.disabled}>{o.label}</option>)}
                    </select>
                  </div>
                  <div>
                    <div style={{ ...labelStyle, visibility: 'hidden' }} aria-hidden="true">占位</div>
                    <div style={{
                      height: '38px', border: '1px solid var(--border)', borderRadius: 'var(--radius)',
                      display: 'flex', alignItems: 'center', gap: '8px', padding: '0 12px', background: '#fff',
                    }}>
                      <input id="menu-visible" type="checkbox" checked={form.visible} onChange={(e) => setForm(f => ({ ...f, visible: e.target.checked }))} />
                      <label htmlFor="menu-visible" style={{ fontSize: '13px', cursor: 'pointer', userSelect: 'none' }}>在导航中显示</label>
                    </div>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="table-wrapper" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '420px' }}>
              <div style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
                <div style={{ fontSize: '48px', marginBottom: '12px' }}>👈</div>
                <p>请在左侧选择要编辑的菜单</p>
                <p style={{ fontSize: '12px', marginTop: '8px' }}>右键树节点可新建子菜单 · 拖拽节点调整层级</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 右键菜单 */}
      {ctx && (
        <>
          <div style={{ position: 'fixed', inset: 0, zIndex: 1200 }} onClick={() => setCtx(null)} onContextMenu={(e) => { e.preventDefault(); setCtx(null); }} />
          <div style={{
            position: 'fixed', left: ctx.x, top: ctx.y, zIndex: 1201,
            background: '#fff', border: '1px solid var(--border)', borderRadius: '8px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)', padding: '4px', minWidth: '140px',
          }}>
            <button style={ctxItemStyle} onClick={() => { openCreate(ctx.menu.id); setCtx(null); }}>➕ 新建子菜单</button>
            <button style={ctxItemStyle} onClick={() => { selectNode(ctx.menu); setCtx(null); }}>✏️ 编辑</button>
            <button style={{ ...ctxItemStyle, color: 'var(--danger)' }} onClick={() => { handleDelete(ctx.menu); setCtx(null); }}>🗑 删除</button>
          </div>
        </>
      )}

      {/* 新建菜单弹窗 */}
      {createModal.visible && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}
          onClick={() => setCreateModal({ visible: false, parentId: 0 })}>
          <div style={{ width: '420px', background: '#fff', borderRadius: '12px', padding: '20px' }} onClick={e => e.stopPropagation()}>
            <div style={{ fontSize: '16px', fontWeight: 600, marginBottom: '14px' }}>新建菜单</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <div style={{ fontSize: '13px', marginBottom: '4px' }}>上级菜单</div>
                <select style={inputStyle} value={form.parentId} onChange={(e) => setForm(f => ({ ...f, parentId: Number(e.target.value) }))}>
                  <option value={0}>（顶级菜单）</option>
                  {buildParentOptions(null).map(o => <option key={o.id} value={o.id}>{o.label}</option>)}
                </select>
              </div>
              <div>
                <div style={{ fontSize: '13px', marginBottom: '4px' }}>菜单标题 <span style={{ color: 'var(--danger)' }}>*</span></div>
                <input style={inputStyle} placeholder="请输入菜单标题" value={form.title} onChange={(e) => setForm(f => ({ ...f, title: e.target.value }))} />
              </div>
              <div>
                <div style={{ fontSize: '13px', marginBottom: '4px' }}>路由路径 <span style={{ color: 'var(--danger)' }}>*</span></div>
                <input style={inputStyle} placeholder="如 /business/newpage" value={form.path} onChange={(e) => setForm(f => ({ ...f, path: e.target.value }))} />
              </div>
              <div style={{ display: 'flex', gap: '12px' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '13px', marginBottom: '4px' }}>图标（emoji）</div>
                  <input style={inputStyle} value={form.icon} onChange={(e) => setForm(f => ({ ...f, icon: e.target.value }))} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '13px', marginBottom: '4px' }}>类型</div>
                  <select style={inputStyle} value={form.type} onChange={(e) => setForm(f => ({ ...f, type: e.target.value as MenuConfig['type'] }))}>
                    <option value="page">页面</option>
                    <option value="tab">导航</option>
                  </select>
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '16px' }}>
              <button className="btn btn-default" onClick={() => setCreateModal({ visible: false, parentId: 0 })}>取消</button>
              <button className="btn btn-primary" onClick={handleSaveCreate}
                disabled={!form.title.trim() || !form.path.trim()}
                style={{ opacity: form.title.trim() && form.path.trim() ? 1 : 0.5 }}>
                保存
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        visible={dialog.visible}
        title="删除菜单"
        content="确定删除这个菜单吗？删除后导航将实时更新。"
        danger
        onConfirm={() => {
          menuStore.remove(dialog.id);
          if (selectedId === dialog.id) setSelectedId(null);
          setDialog({ visible: false, id: 0 });
        }}
        onCancel={() => setDialog({ visible: false, id: 0 })}
      />
    </div>
  );
};
