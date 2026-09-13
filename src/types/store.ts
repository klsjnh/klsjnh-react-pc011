/** 通用 store 工厂类型 */
export interface StoreController<T extends object> {
  getSnapshot(): T;
  subscribe(listener: () => void): () => void;
  /** 合并局部状态（浅合并并替换引用） */
  setState(patch: Partial<T>): void;
  /** 整体替换状态 */
  replace(next: T): void;
  /** 仅替换引用以触发通知（状态内容不变时用） */
  emit(): void;
}
