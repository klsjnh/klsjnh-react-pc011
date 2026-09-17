/**
 * 存储实例下拉数据（存储桶页 / 文件列表页共用）。
 *
 * ready 标记「已拿到结果（哪怕是空）」：调用方据此决定何时发首个查询，
 * 避免「先按 undefined 打全量、再被收窄请求覆盖」的竞态（谁后返回谁写 store）。
 * reload：实例被新增/删除后由「实例管理弹窗」触发，重新拉一次下拉项。
 */
import { useCallback, useEffect, useState } from 'react';
import { listStorages } from '@/services/storage011/julyStorageService';
import type { JulyStorage } from '@/types/storage011';

export interface StorageOptions {
  storages: JulyStorage[];
  ready: boolean;
  reload: () => void;
}

export function useStorageOptions(): StorageOptions {
  const [state, setState] = useState<{ storages: JulyStorage[]; ready: boolean }>({ storages: [], ready: false });
  const [tick, setTick] = useState(0);

  useEffect(() => {
    let alive = true;
    void (async () => {
      try {
        const rows = await listStorages('1');
        if (alive) setState({ storages: rows || [], ready: true });
      } catch {
        if (alive) setState({ storages: [], ready: true });
      }
    })();
    return () => { alive = false; };
  }, [tick]);

  const reload = useCallback(() => setTick((t) => t + 1), []);

  return { storages: state.storages, ready: state.ready, reload };
}
