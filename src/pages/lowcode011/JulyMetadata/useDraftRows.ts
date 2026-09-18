/**
 * 子表行编辑草稿 hook（对齐 DictionaryItemTable 的草稿模型，抽成可复用）。
 *
 * 行为：
 *  - 默认只读；同一时刻只允许一行处于编辑态（进入某行编辑态时其余行退出，改动保留在草稿里）
 *  - 新增 / 修改 / 删除只改本地草稿，由父组件（抽屉）统一「保存」时一次性提交
 *  - 删除不打二次确认、不立刻调接口，只打 `_deleted` 标记；未提交前可「撤销删除」
 *  - 新行「取消」= 直接丢弃；老行「取消」= 还原服务端原值
 *
 * 父组件通过 forwardRef 暴露的 getSaveData() 取最终提交数据（已剔除 _deleted / _meta，新行不带 id）。
 */
import { useMemo, useRef, useState } from 'react';
import type { DraftRow } from '@/types/lowcode011/julyMetadata';

export function useDraftRows<T extends object>(initial: T[], opts: {
  /** 取老行主键（用于 _key 与还原） */
  getId: (r: T) => string | undefined;
  /** 生成新行默认值（sortOrder 由 hook 算 max+1） */
  newRow: () => Omit<T, 'id'>;
}): {
  rows: DraftRow<T>[];
  add: () => void;
  patch: (key: string, patch: Partial<T>) => void;
  enterEdit: (key: string) => void;
  exitEdit: (key: string) => void;
  cancelEdit: (key: string) => void;
  remove: (row: DraftRow<T>) => void;
  undoRemove: (key: string) => void;
  dirtyCount: number;
  deletedCount: number;
  getSaveData: () => T[];
} {
  const { getId, newRow } = opts;

  // 挂载时快照（用于老行「取消」还原服务端原值）
  // 用 useMemo 避免在 render 阶段访问 ref / 调用 Math.random
  const originRows = useMemo<DraftRow<T>[]>(
    () =>
      initial.map((r, i) => ({
        ...r,
        _key: getId(r) || `row-${i}`,
        _editing: false,
        _dirty: false,
      } as DraftRow<T>)),
    [initial, getId],
  );
  const [rows, setRows] = useState<DraftRow<T>[]>(() => originRows.map((r) => ({ ...r })));
  const newSeq = useRef(0);

  const patch = (key: string, p: Partial<T>) =>
    setRows((prev) => prev.map((r) => (r._key === key ? { ...r, ...p, _dirty: true } : r)));

  /** 进入某行编辑态：其余行退出（已改未存的值保留），脏行有底色 */
  const enterEdit = (key: string) =>
    setRows((prev) => prev.map((r) => ({ ...r, _editing: !r._deleted && r._key === key })));

  /** 退出编辑态但不改动数据 */
  const exitEdit = (key: string) =>
    setRows((prev) => prev.map((r) => (r._key === key ? { ...r, _editing: false } : r)));

  /** 取消编辑：新行直接丢弃，老行还原服务端原值 */
  const cancelEdit = (key: string) =>
    setRows((prev) => {
      const row = prev.find((r) => r._key === key);
      if (!row) return prev;
      if (row._isNew) return prev.filter((r) => r._key !== key);
      const origin = originRows.find((o) => o._key === key);
      return prev.map((r) => (r._key === key ? { ...(origin ? origin : r), _editing: false, _dirty: false } : r));
    });

  /** 表格末尾追加空行并进编辑态（其余行退出编辑态），sortOrder = 现有最大 +1 */
  const add = () => {
    newSeq.current += 1;
    const maxSort = rows.reduce((m, r) => Math.max(m, ((r as { sortOrder?: number }).sortOrder as number) ?? 0), 0);
    const row = { ...newRow(), sortOrder: maxSort + 1 } as T;
    const draft = { ...row, _key: `new-${Date.now()}-${newSeq.current}`, _isNew: true, _editing: true, _dirty: true } as DraftRow<T>;
    setRows((prev) => [...prev.map((r) => ({ ...r, _editing: false })), draft]);
  };

  /** 删除：新行直接移除；老行打待删除标记，随保存一起提交 */
  const remove = (row: DraftRow<T>) => {
    if (row._isNew) {
      setRows((prev) => prev.filter((r) => r._key !== row._key));
      return;
    }
    setRows((prev) => prev.map((r) => (r._key === row._key ? { ...r, _deleted: true, _dirty: true, _editing: false } : r)));
  };

  /** 撤销待删除（未提交前可反悔） */
  const undoRemove = (key: string) =>
    setRows((prev) => prev.map((r) => (r._key === key ? { ...r, _deleted: false } : r)));

  const dirtyCount = useMemo(() => rows.filter((r) => r._dirty).length, [rows]);
  const deletedCount = useMemo(() => rows.filter((r) => r._deleted).length, [rows]);

  /** 最终提交数据：剔除 _deleted，新行不带 id，去掉草稿标记 */
  const getSaveData = (): T[] =>
    rows
      .filter((r) => !r._deleted)
      .map((r) => {
        const { _key, _isNew, _editing, _dirty, _deleted, ...rest } = r as Record<string, unknown> & DraftRow<T>;
        const o: Record<string, unknown> = { ...rest };
        if (_isNew) delete o.id;
        return o as T;
      });

  return { rows, add, patch, enterEdit, exitEdit, cancelEdit, remove, undoRemove, dirtyCount, deletedCount, getSaveData };
}
