import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    cssCodeSplit: false,
    rollupOptions: {
      output: {
        // 取消 inlineDynamicImports（其会禁用代码分割，抵消 App.tsx 的 lazy 懒加载），改用手动分包
        manualChunks: {
          react: ['react', 'react-dom', 'react-router-dom'],
          antd: ['antd', '@ant-design/icons'],
        },
        inlineDynamicImports: false,
      },
    },
  },
  server: {
    port: 11181,
    host: true,
    // WSL 挂载的 /mnt/d 上 inotify 不可靠，开启轮询以触发 HMR
    watch: { usePolling: true, interval: 300 },
    // 开发态跨域代理：前端 /klsjnh/* → 后端 java17-framework011（不动后端 CORS）
    proxy: {
      '/klsjnh': {
        target: 'http://192.168.3.160:11610',
        changeOrigin: true,
      },
    },
  },
});
