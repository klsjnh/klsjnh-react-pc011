/**
 * 字典明细子表（julyDictionary 下方「明细项」页签的内容）
 *
 * 行编辑草稿模型（用户指定）：
 *  - 默认只读；同一时刻只允许一行处于编辑态 —— 进入某行编辑态时其余行退出，**改动仍留在草稿里**
 *  - 新增 / 修改 / 删除都只改本地 `draftItems` 草稿，点「保存」一次性提交
 *  - 删除不打二次确认、不立刻调接口，只打 `_deleted` 标记，未提交前可「撤销删除」
 *  - 保存顺序：**先删（腾出编码）后增改**；编码唯一性只校验要新增 / 修改的行
 *
 * 数据来源：直接订阅 julyDictionaryStore（items / itemsLoading）；保存成功后由 service 刷新 store，
 * store 变化触发草稿重置。行状态样式 `.draft-row-*` / 操作条 `.detail-actions` 见
 * `styles/_common.scss` 与 `styles/pages/_system011.scss`。
 */
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Button, Input, InputNumber, Space, Switch, Table, Tag } from 'antd';
import { PlusOutlined, SaveOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { useDictionaryState } from '@/stores/system011/julyDictionaryStore';
import { fetchDictionaryItems, saveDictionaryItem, removeDictionaryItem } from '@/services/system011';
import { toast } from '@/utils/toast';
import type { JulyDictionaryVo011, DictionaryItemDraft } from '@/types/system011';

const STATUS_TAG = (s?: string) => <Tag color={s === '1' ? 'green' : 'red'}>{s === '1' ? '启用' : '停用'}</Tag>;

/** 表头一律居中（antd 的 align 只管表体，表头要另给 onHeaderCell） */
const hdrCenter = (): React.HTMLAttributes<HTMLElement> => ({ style: { textAlign: 'center' } });
/** 内容左对齐 + 表头居中（编码 / 名称类列） */
const leftCell = { align: 'left' as const, onHeaderCell: hdrCenter };

export interface DictionaryItemTableProps {
  /** 当前选中的字典（null = 未选中：按钮禁用、表格给提示） */
  active: JulyDictionaryVo011 | null;
}

export const DictionaryItemTable = ({ active }: DictionaryItemTableProps) => {
  const { items, itemsLoading } = useDictionaryState();

  /** 明细行草稿（默认只读；同一时刻最多一行处于编辑态，点保存一次性提交） */
  const [draftItems, setDraftItems] = useState<DictionaryItemDraft[]>([]);
  const [rowsSaving, setRowsSaving] = useState(false);
  const newRowSeq = useRef(0);

  // 明细拉取回来后重置草稿（换字典 / 保存后刷新都会走到这里）
  useEffect(() => {
    setDraftItems((items || []).map((r) => ({ ...r, _key: r.id || `row-${r.itemCode}`, _editing: false, _dirty: false })));
  }, [items]);

  const dirtyRows = useMemo(() => draftItems.filter((r) => r._dirty), [draftItems]);
  const dirtyCount = dirtyRows.length;
  const deletedCount = useMemo(() => draftItems.filter((r) => r._deleted).length, [draftItems]);

  /** 改某行字段（标记 _dirty） */
  const patchRow = (key: string, patch: Partial<DictionaryItemDraft>) => {
    setDraftItems((prev) => prev.map((r) => (r._key === key ? { ...r, ...patch, _dirty: true } : r)));
  };

  /** 进入单行编辑态：其余行一律退出编辑态（已改未存的值保留在草稿里，脏行有底色标记） */
  const enterEdit = (key: string) => {
    setDraftItems((prev) => prev.map((r) => ({ ...r, _editing: !r._deleted && r._key === key })));
  };

  /** 退出编辑态但不改动数据（无改动时点「保存」等同确认） */
  const exitEdit = (key: string) => {
    setDraftItems((prev) => prev.map((r) => (r._key === key ? { ...r, _editing: false } : r)));
  };

  /** 取消编辑：新行直接丢弃，老行还原为服务端原值 */
  const cancelEdit = (key: string) => {
    setDraftItems((prev) => {
      const row = prev.find((r) => r._key === key);
      if (!row) return prev;
      if (row._isNew) return prev.filter((r) => r._key !== key);
      const origin = (items || []).find((o) => o.id === row.id);
      return prev.map((r) => (r._key === key
        ? { ...(origin ? { ...origin } : r), _key: key, _editing: false, _dirty: false }
        : r));
    });
  };

  /** 表格末尾追加一条空行，直接进编辑态（其余行退出编辑态） */
  const handleAddRow = () => {
    if (!active) return toast.warning('请先在上方选中一个字典');
    newRowSeq.current += 1;
    // 排序号取现有最大值 +1，落在最后
    const maxSort = draftItems.reduce((m, r) => Math.max(m, r.sortOrder ?? 0), 0);
    const row: DictionaryItemDraft = {
      _key: `new-${Date.now()}-${newRowSeq.current}`,
      _isNew: true,
      _editing: true,
      _dirty: true,
      id: '',
      dictionaryCode: active.dictionaryCode,
      itemCode: '',
      itemLabel: '',
      sortOrder: maxSort + 1,
      remark: '',
      status: '1',
    };
    setDraftItems((prev) => [...prev.map((r) => ({ ...r, _editing: false })), row]);
  };

  /**
   * 删除明细：只打「待删除」标记，不立刻调接口（保持与行编辑一致——保存时才统一提交）；
   * 未落库的新行本来就只存在于草稿里，直接移出即可。
   */
  const handleRowRemove = (row: DictionaryItemDraft) => {
    if (row._isNew) {
      setDraftItems((prev) => prev.filter((r) => r._key !== row._key));
      return;
    }
    setDraftItems((prev) => prev.map((r) => (r._key === row._key
      ? { ...r, _deleted: true, _dirty: true, _editing: false }
      : r)));
  };

  /** 撤销「待删除」标记（未提交前都可反悔）；若该行删除前本就改过，撤销后仍标记为脏 */
  const undoRowRemove = (key: string) => {
    setDraftItems((prev) => prev.map((r) => {
      if (r._key !== key) return r;
      const origin = (items || []).find((o) => o.id === r.id);
      const stillDirty = !!origin && (
        r.itemLabel !== origin.itemLabel
        || (r.sortOrder ?? 0) !== (origin.sortOrder ?? 0)
        || r.remark !== origin.remark
        || r.status !== origin.status
      );
      return { ...r, _deleted: false, _dirty: stillDirty };
    }));
  };

  /** 保存：先把待删除行提交（logicDeleteItem），再把新增 / 修改的行逐条提交，最后刷新 */
  const submitRows = async (rows: DictionaryItemDraft[]) => {
    if (!active) return toast.warning('请先在上方选中一个字典');
    if (!rows.length) return toast.info('没有需要保存的改动');

    const deletions = rows.filter((r) => r._deleted && !r._isNew);
    const upserts = rows.filter((r) => !r._deleted);

    if (upserts.some((r) => !r.itemCode?.trim() || !r.itemLabel?.trim())) {
      return toast.warning('项编码 / 项标签不能为空');
    }
    const codes = upserts.map((r) => r.itemCode.trim());
    if (new Set(codes).size !== codes.length) return toast.warning('项编码在同一字典内不能重复');
    // 与未改动行也要比一遍，避免和已存在的编码撞车（待删除行不占用编码）
    const untouched = draftItems.filter((r) => !r._dirty && !r._deleted).map((r) => r.itemCode?.trim());
    if (codes.some((c) => untouched.includes(c))) return toast.warning('项编码在同一字典内不能重复');

    setRowsSaving(true);
    try {
      // 先删：腾出编码，避免与本次新增行撞车
      for (const r of deletions) {
        await removeDictionaryItem(r.id);
      }
      for (const r of upserts) {
        const savedId = await saveDictionaryItem({
          id: r._isNew ? undefined : r.id,
          dictionaryCode: active.dictionaryCode,
          itemCode: r.itemCode.trim(),
          itemLabel: r.itemLabel.trim(),
          sortOrder: r.sortOrder ?? 0,
          remark: r.remark,
          status: r.status,
        });
        // 后端 insertItem 契约不含 status（新行一律落为启用）→ 用户在新行选了停用时补一次 updateItem
        if (r._isNew && r.status === '0') {
          await saveDictionaryItem({
            id: savedId, dictionaryCode: active.dictionaryCode, itemCode: r.itemCode.trim(),
            itemLabel: r.itemLabel.trim(), sortOrder: r.sortOrder ?? 0, remark: r.remark, status: '0',
          });
        }
      }
      const parts: string[] = [];
      if (deletions.length) parts.push(`delete ${deletions.length}`);
      if (upserts.length) parts.push(`save ${upserts.length}`);
      toast.success(`${parts.join(' / ')} item(s) success ...`);
      await fetchDictionaryItems(active.dictionaryCode);
    } catch (e) {
      toast.error((e as Error)?.message || '保存失败，请重试');
    } finally {
      setRowsSaving(false);
    }
  };

  const itemColumns: ColumnsType<DictionaryItemDraft> = [
    {
      title: '项编码', dataIndex: 'itemCode', ...leftCell, width: 220,
      // 后端 itemCode 不可变：新行可输入，已落库的行只读展示
      render: (v, r) => (r._editing && r._isNew
        ? <Input size="small" value={v} placeholder="同一字典内唯一，如 1 / M" onChange={(e) => patchRow(r._key, { itemCode: e.target.value })} />
        : <code>{v || '-'}</code>),
    },
    {
      title: '项标签', dataIndex: 'itemLabel', ...leftCell,
      render: (v, r) => (r._editing
        ? <Input size="small" value={v} placeholder="如 启用 / 停用 / 男 / 女" onChange={(e) => patchRow(r._key, { itemLabel: e.target.value })} />
        : v),
    },
    {
      title: '排序', dataIndex: 'sortOrder', align: 'center', onHeaderCell: hdrCenter, width: 100,
      render: (v, r) => (r._editing
        ? <InputNumber size="small" min={0} value={v} style={{ width: 72 }} onChange={(nv) => patchRow(r._key, { sortOrder: Number(nv) || 0 })} />
        : v),
    },
    {
      title: '状态', dataIndex: 'status', align: 'center', onHeaderCell: hdrCenter, width: 110,
      render: (v, r) => (r._editing
        ? (
          <Switch size="small" checked={r.status === '1'} checkedChildren="启用" unCheckedChildren="停用"
            onChange={(c) => patchRow(r._key, { status: c ? '1' : '0' })} />
        )
        : STATUS_TAG(v)),
    },
    {
      title: '操作', key: 'action', width: 130, align: 'center', onHeaderCell: hdrCenter,
      render: (_, r) => {
        // 已标记删除：未保存前可撤销（删除不立刻生效，随保存一起提交）
        if (r._deleted) {
          return <Button type="link" size="small" onClick={() => undoRowRemove(r._key)}>撤销删除</Button>;
        }
        if (r._editing) {
          return (
            <Space size="small">
              <Button type="link" size="small" loading={rowsSaving}
                onClick={() => (r._dirty ? submitRows([r]) : exitEdit(r._key))}>保存</Button>
              <Button type="link" size="small" onClick={() => cancelEdit(r._key)}>取消</Button>
            </Space>
          );
        }
        return (
          <Space size="small">
            <Button type="link" size="small" onClick={() => enterEdit(r._key)}>编辑</Button>
            <Button type="link" size="small" danger onClick={() => handleRowRemove(r)}>删除</Button>
          </Space>
        );
      },
    },
  ];

  return (
    <>
      {/* 行编辑操作条：在表格上方 */}
      <div className="detail-actions">
        <Button icon={<PlusOutlined />} color="primary" variant="filled" disabled={!active} onClick={handleAddRow}>
          新增一行
        </Button>
        <Button type="primary" icon={<SaveOutlined />} loading={rowsSaving}
          disabled={!active || !dirtyCount} onClick={() => submitRows(dirtyRows)}>
          保存
        </Button>
        {dirtyCount > 0 && (
          <span className="detail-dirty">
            有 {dirtyCount} 处改动未保存{deletedCount > 0 ? `（含 ${deletedCount} 行待删除）` : ''}
          </span>
        )}
      </div>
      <Table<DictionaryItemDraft>
        rowKey="_key"
        columns={itemColumns}
        dataSource={draftItems}
        loading={itemsLoading}
        scroll={{ x: 800 }}
        pagination={false}
        rowClassName={(r) => (r._deleted ? 'draft-row-deleted' : r._dirty ? 'draft-row-dirty' : '')}
        locale={{ emptyText: active ? '暂无明细，点上方「新增一行」开始录入' : '请先在上方选中一个字典' }}
      />
    </>
  );
};

export default DictionaryItemTable;
