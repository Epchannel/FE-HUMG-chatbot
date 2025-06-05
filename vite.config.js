import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/', // Sử dụng '/' vì có custom domain
  publicDir: 'public',
  build: {
    rollupOptions: {
      input: {
        main: './index.html',
      },
    },
    // Copy CNAME file to preserve custom domain
    copyPublicDir: true,
    // Tối ưu hóa cho production
    minify: 'esbuild',
    sourcemap: false,
  },
  // Đảm bảo HTTPS trong production
  server: {
    https: false, // Chỉ cho development
  },
});


