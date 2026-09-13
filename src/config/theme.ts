/** Ant Design 主题（对齐现有 global.css 设计令牌） */
import type { ThemeConfig } from 'antd';

export const antdTheme: ThemeConfig = {
  token: {
    colorPrimary: '#1890ff',
    colorSuccess: '#52c41a',
    colorWarning: '#faad14',
    colorError: '#f5222d',
    colorText: '#1f2937',
    colorTextSecondary: '#6b7280',
    colorBgLayout: '#f0f2f5',
    borderRadius: 8,
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
  },
  components: {
    Layout: { headerHeight: 56, headerBg: '#fff', siderBg: '#fff' },
    Menu: { itemBorderRadius: 6, itemMarginInline: 8 },
  },
};
