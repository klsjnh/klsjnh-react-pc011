// Tailwind 已移除（其 theme.extend 长期为空、preflight 关闭，等于零收益却占构建）。
// 这里只保留 autoprefixer 补浏览器前缀。
export default {
  plugins: {
    autoprefixer: {},
  },
};
