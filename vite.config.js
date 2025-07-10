import { defineConfig } from 'vite';

export default defineConfig({
  base: './',
  build: {
    outDir: 'build', // 输出到 build 目录
    emptyOutDir: true
  }
});