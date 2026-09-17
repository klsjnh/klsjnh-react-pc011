/**
 * 通用 store 工厂（基于 zustand）
 *
 * 分层约定：
 *  - store 只负责「状态 + 本地持久化」，不调用 service
 *  - service 负责业务操作，成功后可写 store 状态
 *  - 页面事件调 service、渲染读 store
 */
import { useStore } from 'zustand';
import { createStore as createVanillaStore, type StoreApi } from 'zustand/vanilla';
import type { StoreController } from '@/types/store';

export type { StoreController };

export function createStore<T extends object>(initial: T): StoreController<T> {
  const api: StoreApi<T> = createVanillaStore<T>(() => initial);
  return {
    api,
    getSnapshot: api.getState,
    subscribe: (listener) => api.subscribe(listener),
    setState: (patch) => api.setState(patch as object) as object,
    replace: (next) => api.setState(next as T, true),
    emit: () => api.setState((s) => ({ ...s })),
  };
}

/** 组件内订阅整个 store 状态 */
export function useStoreState<T extends object>(store: StoreController<T>): T {
  return useStore(store.api);
}
