import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/setupTests.js'],
    include: ['src/__tests__/**/*.{test,spec}.{js,jsx}'],
    pool: 'forks',
    minForks: 1,
    maxForks: 1,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'src/__tests__/**',
        'src/__tests__/__mocks__/**',
        '**/*.css',
        '**/*.svg',
        'src/reportWebVitals.js',
        'src/index.js'
      ]
    },
    alias: {
      '\\.svg$': path.resolve(__dirname, './src/__tests__/__mocks__/svgMock.jsx'),
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '../assets/discord.svg': path.resolve(__dirname, './src/__tests__/__mocks__/svgMock.jsx'),
      '../assets/github.svg': path.resolve(__dirname, './src/__tests__/__mocks__/svgMock.jsx'),
      '../assets/linkedin.svg': path.resolve(__dirname, './src/__tests__/__mocks__/svgMock.jsx'),
    },
  },
});
