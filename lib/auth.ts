// lib/auth.ts
import { betterAuth } from 'better-auth'
import { pool } from './db/index'

export const auth = betterAuth({
  database: pool,
  secret: process.env.BETTER_AUTH_SECRET,
  baseURL: process.env.BETTER_AUTH_URL
    ? process.env.BETTER_AUTH_URL
    : process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
      : process.env.VERCEL_URL
        ? `https://${process.env.VERCEL_URL}`
        : typeof globalThis !== 'undefined' && globalThis.process?.env?.V0_RUNTIME_URL
          ? globalThis.process.env.V0_RUNTIME_URL
          : 'http://localhost:3000',
  emailAndPassword: {
    enabled: true,
  },
  trustedOrigins: [
    ...(process.env.BETTER_AUTH_URL ? [process.env.BETTER_AUTH_URL] : []),
    ...(process.env.VERCEL_PROJECT_PRODUCTION_URL ? [`https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`] : []),
    ...(process.env.VERCEL_URL ? [`https://${process.env.VERCEL_URL}`] : []),
    ...(typeof globalThis !== 'undefined' && globalThis.process?.env?.V0_RUNTIME_URL ? [globalThis.process.env.V0_RUNTIME_URL] : []),
  ],
  advanced: {
    defaultCookieAttributes:
      process.env.NODE_ENV === 'development'
        ? {
            sameSite: 'none',
            secure: true,
          }
        : {},
  },
})
