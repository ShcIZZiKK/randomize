/**
 * Конфигурация Vite для сборки слот-игры и Vitest.
 */
import { defineConfig } from 'vitest/config'

export default defineConfig({
  base: '/randomize/',
  test: {
    environment: 'jsdom',
    globals: true,
    pool: 'threads',
    include: ['src/**/*.{test,spec}.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      include: ['src/**/*.ts'],
      exclude: ['src/main.ts', 'src/three/**', 'src/**/*.test.ts', 'src/**/*.spec.ts'],
    },
  },
})
