import { defineConfig } from 'vitest/config'

// resolve.tsconfigPaths reuses the same "@/*" aliases as tsconfig.json, so
// test files can import from "@/..." exactly like the app code does.
export default defineConfig({
  resolve: {
    tsconfigPaths: true,
  },
  test: {
    environment: 'node',
  },
})
