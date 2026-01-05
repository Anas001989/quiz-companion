import { PrismaClient } from '@/generated/prisma'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// Prisma Client configuration with connection pooling settings
// ⚠️ IMPORTANT: Prisma requires prepared statements, which are NOT supported in PgBouncer Transaction mode
// You MUST use Session mode when using the connection pooler (port 6543)
// If you see "prepared statement already exists" error, switch to Session mode in Supabase Dashboard

// NOTE: You may see "ConnectionReset" or "forcibly closed" errors in logs during long operations
// (e.g., OpenAI API calls). These are NON-FATAL - Prisma automatically reconnects when needed.
// The errors appear because idle connections timeout during long API calls, but this doesn't
// affect functionality. Prisma handles reconnection transparently.

export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  log: process.env.NODE_ENV === 'development' 
    ? [
        { emit: 'event', level: 'error' },
        { emit: 'event', level: 'warn' },
      ]
    : [{ emit: 'event', level: 'error' }],
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
})

// Filter out non-fatal connection errors that occur during long operations
// These happen when connections timeout during API calls but don't affect functionality
prisma.$on('error' as never, (e: any) => {
  const errorMessage = e.message || String(e)
  // Suppress connection reset errors - these are expected during long-running operations
  // (e.g., OpenAI API calls that take several seconds)
  // Prisma automatically reconnects when the database is actually needed
  if (errorMessage.includes('ConnectionReset') || 
      errorMessage.includes('forcibly closed') ||
      errorMessage.includes('10054') ||
      errorMessage.includes('An existing connection was forcibly closed')) {
    // Only log in verbose mode
    if (process.env.VERBOSE_DB_LOGS === 'true') {
      console.warn('[Prisma] Connection reset during long operation (non-fatal, auto-reconnect enabled)')
    }
    return
  }
  // Log actual errors
  console.error('[Prisma Error]', e)
})

prisma.$on('warn' as never, (e: any) => {
  const warnMessage = e.message || String(e)
  // Suppress connection warnings during long operations
  if (warnMessage.includes('ConnectionReset') || 
      warnMessage.includes('forcibly closed')) {
    return
  }
  console.warn('[Prisma Warning]', e)
})

// Note: Connection errors are handled automatically by Prisma
// The error logging happens in the catch blocks of API routes

// In development, reuse the same Prisma instance to avoid connection issues
if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}

// Helper function to reset Prisma client (useful when connection string changes)
export async function resetPrismaClient() {
  if (globalForPrisma.prisma) {
    await globalForPrisma.prisma.$disconnect()
    globalForPrisma.prisma = undefined
  }
}

// Graceful shutdown
if (typeof process !== 'undefined') {
  process.on('beforeExit', async () => {
    await prisma.$disconnect()
  })
}
