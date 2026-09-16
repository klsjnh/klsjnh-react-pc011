/**
 * 主题配色状态持久化（localStorage）
 *  - 当前选中主题 key 存 pc011-theme，刷新后恢复
 *  - 模块加载时立即 applyThemeCssVars(initial) 写入 :root，避免首屏闪烁
 *  - setTheme 同时更新 store 与 :root CSS 变量；ConfigProvider 在 App.tsx 订阅后自动换肤
 * 分层约定同 uiStore：store 只管状态 + 本地持久化，不调 service。
 */
import { createStore, useStoreState } from '@/stores/createStore';
import { THEME_PRESETS, DEFAULT_THEME, applyThemeCssVars, type ThemeKey } from '@/config/theme';

interface ThemeState {
  current: ThemeKey;
}

const STORAGE_KEY = 'pc011-theme';

function load(): ThemeState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed?.current && THEME_PRESETS[parsed.current as ThemeKey]) {
        return { current: parsed.current as ThemeKey };
      }
    }
  } catch { /* 忽略损坏数据 */ }
  return { current: DEFAULT_THEME };
}

const initial = load();
// 首屏前写入 :root，自定义样式（.bar-fill / .profile-hero 等）不闪
applyThemeCssVars(initial.current);

const base = createStore<ThemeState>(initial);

base.subscribe(() => {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(base.getSnapshot())); } catch { /* 存储不可用时仅内存生效 */ }
});

export const themeStore = {
  getSnapshot: base.getSnapshot,
  subscribe: base.subscribe,
  setTheme: (key: ThemeKey) => {
    base.setState({ current: key });
    applyThemeCssVars(key);
  },
};

export function useThemeKey(): ThemeKey {
  return useStoreState(base).current;
}
