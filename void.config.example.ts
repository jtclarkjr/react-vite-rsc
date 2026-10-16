import { defineConfig } from 'void/config'

export default defineConfig({
  worker: {
    compatibility_date: '2026-02-24',
    compatibility_flags: ['nodejs_compat']
  },
  cloudflare: {
    account_id: process.env.CLOUDFLARE_ACCOUNT_ID
  }
})
