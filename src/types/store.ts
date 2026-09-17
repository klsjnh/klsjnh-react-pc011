/** 通用 store 类型（zustand vanilla StoreApi 适配） */
import type { StoreApi } from 'zustand/vanilla';

export interface StoreController<T extends object> {
  /** 原始 zustand store（供 useStore 使用） */
  api: StoreApi<T>;
  getSnapshot(): T;
  /** 订阅状态变化（回调接收当前/上一次状态） */
  subscribe(listener: (state: T, prevState: T) => void): () => void;
  /** 合并局部状态（浅合并并替换引用）；patch 可直接传对象，也可传 setter 函数 (prev) => Partial */
  setState(patch: Partial<T> | ((state: T) => Partial<T>)): void;
  /** 整体替换状态 */
  replace(next: T): void;
  /** 仅替换引用以触发通知（状态内容不变时用） */
  emit(): void;
}
