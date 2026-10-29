/// <reference types="vitest/config" />
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  test: {
    // Runs before every test file. Tests run in Node by default; files that render React opt into a fake browser
    // with a `// @vitest-environment happy-dom` comment on their first line.
    setupFiles: ['src/testSetup.ts'],
    // Vitest skips CSS files by default, so importing one gives an empty string. The theme tests read index.css.
    css: { include: [/\/app\/index\.css/] },
  },
})
