/**
 * Ant Design 多主题配色 + 全局组件规范（PC 端换肤系统）
 *
 * 职责边界（重要）：
 *  - **antd 组件的尺寸 / 字号 / 行高 / 状态色，一律定义在这里的 token**，不写 SCSS 覆盖。
 *    理由：antd 6 是 CSS-in-JS 运行时注入，与外部 CSS 同权重、胜负取决于插入顺序，
 *    用样式文件覆盖 .ant-table / .ant-btn 既不稳定（要 !important）、又绑死私有 DOM、
 *    还因为 SCSS 变量是编译期常量而无法跟随运行时的 10 套主题。
 *  - **自研 DOM 的样式才写 SCSS**（src/styles/），且取色只读这里的 CSS 变量。
 *
 * - THEME_PRESETS：10 套配色，由 SEEDS 一行一色派生 antd token + :root CSS 变量。
 * - TYPOGRAPHY / SPACING：全局排版与间距标尺（与 src/styles/_tokens.scss 的静态值保持一致）。
 * - buildTheme(key)：生成 ThemeConfig（预设只管主色系，其余统一在此补齐）。
 * - applyThemeCssVars(key)：把 CSS 变量写入 document.documentElement，让自定义样式同步换色。
 * - 换肤入口在顶栏（Top.tsx 的 BgColorsOutlined），状态持久化在 themeStore（localStorage: pc011-theme）。
 */
import type { ThemeConfig } from 'antd';

export type ThemeKey =
  | 'indigo'
  | 'classic'
  | 'blue'
  | 'cyan'
  | 'teal'
  | 'emerald'
  | 'amber'
  | 'rose'
  | 'violet'
  | 'slate';

export interface ThemePreset {
  /** 中文名（切换面板展示） */
  name: string;
  /** antd token：仅覆盖主色系，语义色在 buildTheme 统一补齐 */
  token: {
    colorPrimary: string;
    colorPrimaryHover: string;
    colorPrimaryActive: string;
    colorLink: string;
    colorLinkHover: string;
  };
  /** 注入 :root 的 CSS 变量（与 src/styles/_tokens.scss 同名，运行时覆盖静态 fallback） */
  cssVars: Record<string, string>;
}

interface PresetSeed {
  key: ThemeKey;
  /** 中文名 */
  name: string;
  /** 主色 */
  primary: string;
  /** hover（更亮） */
  hover: string;
  /** active（更深） */
  active: string;
  /** 主色浅底（选中态背景 / 高亮行） */
  bg: string;
  /** 渐变浅端（条形图、色块） */
  tint: string;
}

/**
 * 色系种子表（改这里即可增删主题）
 * 「经典蓝 #1677ff」= antd 默认蓝，即换肤之前项目原本那套。
 */
const SEEDS: PresetSeed[] = [
  { key: 'indigo',  name: '靛蓝',    primary: '#4f46e5', hover: '#6366f1', active: '#4338ca', bg: '#eef2ff', tint: '#c7d2fe' },
  { key: 'classic', name: '经典蓝',  primary: '#1677ff', hover: '#4096ff', active: '#0958d9', bg: '#e6f4ff', tint: '#91caff' },
  { key: 'blue',    name: '科技蓝',  primary: '#2563eb', hover: '#3b82f6', active: '#1d4ed8', bg: '#eff6ff', tint: '#bfdbfe' },
  { key: 'cyan',    name: '青色',    primary: '#06b6d4', hover: '#22d3ee', active: '#0891b2', bg: '#ecfeff', tint: '#a5f3fc' },
  { key: 'teal',    name: '蓝绿',    primary: '#0d9488', hover: '#14b8a6', active: '#0f766e', bg: '#f0fdfa', tint: '#99f6e4' },
  { key: 'emerald', name: '翠绿',    primary: '#059669', hover: '#10b981', active: '#047857', bg: '#ecfdf5', tint: '#a7f3d0' },
  { key: 'amber',   name: '琥珀橙',  primary: '#ea580c', hover: '#f97316', active: '#c2410c', bg: '#fff7ed', tint: '#fed7aa' },
  { key: 'rose',    name: '玫红',    primary: '#e11d48', hover: '#fb7185', active: '#be123c', bg: '#fff1f2', tint: '#fecdd3' },
  { key: 'violet',  name: '紫色',    primary: '#7c3aed', hover: '#8b5cf6', active: '#6d28d9', bg: '#f5f3ff', tint: '#ddd6fe' },
  { key: 'slate',   name: '石墨灰',  primary: '#475569', hover: '#64748b', active: '#334155', bg: '#f1f5f9', tint: '#cbd5e1' },
];

/** 给 6 位 hex 追加 alpha 通道（8 位 hex），用于需要透明度的 token（聚焦环等） */
function alpha(hex: string, aa: string): string {
  return `${hex}${aa}`;
}

function toPreset(s: PresetSeed): ThemePreset {
  return {
    name: s.name,
    token: {
      colorPrimary: s.primary,
      colorPrimaryHover: s.hover,
      colorPrimaryActive: s.active,
      colorLink: s.primary,
      colorLinkHover: s.hover,
    },
    cssVars: {
      '--primary': s.primary,
      '--primary-hover': s.hover,
      '--primary-active': s.active,
      '--primary-bg': s.bg,
      '--primary-border': s.tint,
      '--bar-from': s.primary,
      '--bar-to': s.tint,
      '--hero-from': s.primary,
      '--hero-to': s.active,
    },
  };
}

export const THEME_PRESETS: Record<ThemeKey, ThemePreset> = SEEDS.reduce((acc, s) => {
  acc[s.key] = toPreset(s);
  return acc;
}, {} as Record<ThemeKey, ThemePreset>);

/** 默认主题（靛蓝） */
export const DEFAULT_THEME: ThemeKey = 'indigo';

/** 切换面板列表：key / 中文名 / 主色 / 渐变浅色（色块用双色渐变更好看） */
export const THEME_LIST: { key: ThemeKey; name: string; color: string; color2: string }[] = SEEDS.map((s) => ({
  key: s.key,
  name: s.name,
  color: s.primary,
  color2: s.active,
}));

/** 取某套主题的主色（顶栏色点等场景用） */
export function getThemeColor(key: ThemeKey): string {
  return (THEME_PRESETS[key] ?? THEME_PRESETS[DEFAULT_THEME]).token.colorPrimary;
}

/**
 * 全局排版标尺：字号 / 行高
 * 改这里即全站生效（antd 组件 + 文本），不必写任何 .ant-* 覆盖。
 */
const TYPOGRAPHY = {
  fontSize: 14,        // 正文基准
  fontSizeSM: 12,      // 次要文本、表格小尺寸
  fontSizeLG: 16,      // 小标题
  fontSizeXL: 20,      // 页面级标题
  lineHeight: 1.5714,  // 正文行高（14 × 1.5714 ≈ 22px）
  lineHeightSM: 1.5,
  lineHeightLG: 1.5,
};

/**
 * 全局间距 / 圆角 / 控件高度
 */
const SPACING = {
  controlHeight: 36,
  controlHeightSM: 28,
  controlHeightLG: 44,
  borderRadius: 8,
  borderRadiusSM: 6,
  borderRadiusLG: 10,
  padding: 16,
  paddingSM: 12,
  paddingLG: 24,
  paddingXS: 8,
  margin: 16,
  marginSM: 12,
  marginLG: 24,
  marginXS: 8,
};

/** 生成 antd ThemeConfig（语义色 / 排版 / 间距 / 组件规范统一在此补齐，预设只管主色系） */
export function buildTheme(key: ThemeKey): ThemeConfig {
  const preset = THEME_PRESETS[key] ?? THEME_PRESETS[DEFAULT_THEME];
  const p = preset.token.colorPrimary;
  const pHover = preset.token.colorPrimaryHover;
  const pBg = preset.cssVars['--primary-bg'];
  const focusRing = `0 0 0 2px ${alpha(p, '1a')}`;

  return {
    token: {
      ...preset.token,
      colorSuccess: '#16a34a',
      colorWarning: '#f59e0b',
      colorError: '#ef4444',
      colorText: '#1f2937',
      colorTextSecondary: '#6b7280',
      colorBgLayout: '#f0f2f5',
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
      ...TYPOGRAPHY,
      ...SPACING,
    },
    components: {
      Layout: { headerHeight: 56, headerBg: '#fff', siderBg: '#fff' },

      // 卡头高度 46 = Tabs 导航条高度（padding 12×2 + 行高 22）。
      // 主子表这类「一张卡用 title、另一张卡用 Tabs」的页面靠它对齐头部行高（原 antd 默认 56 → 差 10px）。
      Card: { headerHeight: 46 },

      Menu: {
        itemHeight: 40,
        itemBorderRadius: 8,
        itemMarginInline: 8,
        itemColor: '#1f2937',
        itemHoverBg: '#f5f6f8',
        itemHoverColor: p,
        itemSelectedBg: pBg,
        itemSelectedColor: p,
        subMenuItemBg: 'transparent',
        groupTitleColor: '#9ca3af',
      },

      Table: {
        cellFontSize: 14,
        cellPaddingBlock: 12,       // 行高 ≈ 12×2 + 22 ≈ 46px
        cellPaddingInline: 14,
        cellPaddingBlockSM: 8,
        cellPaddingInlineSM: 12,
        headerBg: '#fafafa',
        headerColor: '#1f2937',
        headerSplitColor: 'transparent',
        headerBorderRadius: 0,
        borderColor: '#f0f0f0',
        rowHoverBg: '#f5f6f8',
        rowSelectedBg: pBg,
        rowSelectedHoverBg: pBg,
        footerBg: '#fafafa',
        footerColor: '#6b7280',
      },

      Button: {
        fontWeight: 400,
        paddingInline: 15,
        paddingInlineSM: 7,
        paddingInlineLG: 19,
        // 扁平化：去掉 antd 默认的彩色投影，避免与主题色叠加后发脏
        defaultShadow: 'none',
        primaryShadow: 'none',
        dangerShadow: 'none',
        defaultHoverBorderColor: pHover,
        defaultHoverColor: pHover,
        defaultActiveBorderColor: preset.token.colorPrimaryActive,
        defaultActiveColor: preset.token.colorPrimaryActive,
      },

      Input: {
        activeBorderColor: p,
        hoverBorderColor: pHover,
        activeShadow: focusRing,
      },
    },
  };
}

/** 把当前主题的 CSS 变量写入 :root，供 SCSS 里 .bar-fill / .profile-hero / .login-page 等跟随 */
export function applyThemeCssVars(key: ThemeKey): void {
  const preset = THEME_PRESETS[key] ?? THEME_PRESETS[DEFAULT_THEME];
  const root = document.documentElement;
  Object.entries(preset.cssVars).forEach(([k, v]) => root.style.setProperty(k, v));
}
