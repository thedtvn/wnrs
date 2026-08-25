import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import { resolve } from 'node:path'

const alias = {
  '@src': resolve(__dirname, './src'),
  '@components': resolve(__dirname, './src/components'),
}

export default defineConfig({
  test: {
    projects: [
      {
        plugins: [react()],
        test: {
          name: 'client',
          environment: 'jsdom',
          include: ['src/**/*.test.{ts,tsx}'],
          setupFiles: ['./src/test/setup.ts'],
          alias,
        },
      },
      {
        test: {
          name: 'server',
          environment: 'node',
          include: ['server/**/*.test.ts', 'src/shared/**/*.test.ts'],
          alias,
        },
      },
    ],
  },
})
