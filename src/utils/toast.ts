/**
 * 全局 Toast（对齐老项目 D:/Source/react011/klsjnh-react-java8-dev011 的 message 体系）
 *
 * 老项目用法：`message.success('xxx')` / `message.error(err)` —— 全局任意位置可调，
 * 与组件树解耦（其内部经 MessageBridge 注入 antd 实例）。
 * 本项目无 antd，故自建等价实现：
 *   - 模块级单例 store + 订阅；<Toaster /> 挂在 App 根部渲染浮层；
 *   - 业务侧 `import { toast } from '@/utils/toast'` 直接调用，无需 hook、无需传 props。
 *
 * 用法：
 *   toast.success('保存成功');
 *   toast.error('保存失败：xxx');
 *   toast.info('提示');
 *   toast.warning('注意');
 */

import type { ToastKind, ToastItem } from '@/types/view/toast';

export type { ToastKind, ToastItem };

type Listener = () => void;

let items: ToastItem[] = [];
let seq = 0;
const listeners = new Set<Listener>();
/** 每个 toast 的定时器，便于手动关闭时清理 */
const timers = new Map<number, ReturnType<typeof setTimeout>>();

function emit() {
  listeners.forEach((l) => l());
}

export function subscribeToast(l: Listener): () => void {
  listeners.add(l);
  return () => { listeners.delete(l); };
}

export function getToastSnapshot(): ToastItem[] {
  return items;
}

/** 移除指定 toast（自动关闭 / 手动关闭共用） */
export function dismissToast(id: number) {
  const t = timers.get(id);
  if (t) { clearTimeout(t); timers.delete(id); }
  items = items.filter((x) => x.id !== id);
  emit();
}

function push(kind: ToastKind, content: string, duration = 2600) {
  const id = ++seq;
  items = [...items, { id, kind, content, createdAt: Date.now(), duration }];
  emit();
  timers.set(id, setTimeout(() => dismissToast(id), duration));
  return id;
}

export const toast = {
  success: (content: string, duration?: number) => push('success', content, duration),
  error: (content: string, duration?: number) => push('error', content, duration),
  info: (content: string, duration?: number) => push('info', content, duration),
  warning: (content: string, duration?: number) => push('warning', content, duration),
  /** 关闭全部 */
  clear: () => {
    timers.forEach((t) => clearTimeout(t));
    timers.clear();
    items = [];
    emit();
  },
};

/** 供老项目风格的 `message.xxx` 调用别名（迁移期兼容） */
export const message = toast;
