import { defineConfig } from 'vitest/config'

// Separate from vite.config.ts on purpose: this project's unit tests target
// pure logic shared by the Edge Functions (supabase/functions/_shared), not
// the React frontend, so no need to load the Tailwind/React plugins here.
export default defineConfig({
  test: {
    include: ['supabase/functions/**/*.test.ts'],
  },
})
