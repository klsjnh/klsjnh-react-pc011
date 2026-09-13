/**
 * 通用 store 工厂（useSyncExternalStore）
 *
 * 分层约定：
 *  - store 只负责「状态 + 本地持久化」，不调用 service
 *  - service 负责业务操作，成功后可写 store 状态
 *  - 页面事件调 service、渲染读 store
 *
 * 状态需「整体替换引用」才会通知订阅者。
 */
import { useSyncExternalStore } from 'react';
import type { StoreController } from '@/types/store';

export type { StoreController };

export function createStore<T extends object>(initial: T): StoreController<T> {
  let state = initial;
  const listeners = new Set<() => void>();
  const notify = () => listeners.forEach((l) => l());
  const getSnapshot = () => state;
  const subscribe = (l: () => void) => {
    listeners.add(l);
    return () => { listeners.delete(l); };
  };
  const setState = (patch: Partial<T>) => { state = { ...state, ...patch }; notify(); };
  const replace = (next: T) => { state = next; notify(); };
  const emit = () => { state = { ...state }; notify(); };
  return { getSnapshot, subscribe, setState, replace, emit };
}

export function useStoreState<T extends object>(store: StoreController<T>): T {
  return useSyncExternalStore(store.subscribe, store.getSnapshot, store.getSnapshot);
}
