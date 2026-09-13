/**
 * 全局 Toast 渲染层（挂在 App 根部，对齐老项目 MessageBridge 的作用）
 * 与 src/utils/toast.ts 的单例 store 解耦：业务侧直接 toast.success() 即可。
 */
import React, { useSyncExternalStore } from 'react';
import { subscribeToast, getToastSnapshot, dismissToast, type ToastKind } from '../utils/toast';

const ICON: Record<ToastKind, string> = {
  success: '✓',
  error: '✕',
  info: 'i',
  warning: '!',
};

const THEME: Record<ToastKind, { bg: string; border: string; color: string; iconBg: string }> = {
  success: { bg: '#f6ffed', border: '#b7eb8f', color: '#389e0d', iconBg: '#52c41a' },
  error: { bg: '#fff2f0', border: '#ffccc7', color: '#cf1322', iconBg: '#ff4d4f' },
  info: { bg: '#e6f7ff', border: '#91caff', color: '#0958d9', iconBg: '#1677ff' },
  warning: { bg: '#fffbe6', border: '#ffe58f', color: '#d48806', iconBg: '#faad14' },
};

export const Toaster: React.FC = () => {
  const items = useSyncExternalStore(subscribeToast, getToastSnapshot, getToastSnapshot);

  return (
    <div
      style={{
        position: 'fixed', top: '20px', left: '50%', transform: 'translateX(-50%)',
        zIndex: 9999, display: 'flex', flexDirection: 'column', gap: '10px',
        pointerEvents: 'none', alignItems: 'center',
      }}
    >
      {items.map((t) => {
        const theme = THEME[t.kind];
        return (
          <div
            key={t.id}
            onClick={() => dismissToast(t.id)}
            role="alert"
            style={{
              pointerEvents: 'auto', cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: '10px',
              minWidth: '220px', maxWidth: '480px', padding: '10px 16px',
              background: '#fff', borderRadius: '8px',
              border: `1px solid ${theme.border}`,
              boxShadow: '0 6px 16px rgba(0,0,0,0.12)',
              fontSize: '14px', color: 'var(--text-primary, #333)',
              animation: 'toastSlideIn .22s ease-out',
            }}
          >
            <span
              style={{
                flex: '0 0 auto', width: '18px', height: '18px', borderRadius: '50%',
                background: theme.iconBg, color: '#fff', fontSize: '12px', fontWeight: 700,
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              }}
            >
              {ICON[t.kind]}
            </span>
            <span style={{ flex: 1, wordBreak: 'break-word' }}>{t.content}</span>
          </div>
        );
      })}
    </div>
  );
};
