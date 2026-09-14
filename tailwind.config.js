/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  // 关闭 preflight：避免 Tailwind 的基础重置覆盖 antd 6 自带样式
  corePlugins: { preflight: false },
  theme: {
    extend: {},
  },
};
