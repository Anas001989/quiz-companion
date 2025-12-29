import { PrismaClient } from '@/generated/prisma'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// Prisma Client configuration with connection pooling settings
// ⚠️ IMPORTANT: Prisma requires prepared statements, which are NOT supported in PgBouncer Transaction mode
// You MUST use Session mode when using the connection pooler (port 6543)
// If you see "prepared statement already exists" error, switch to Session mode in Supabase Dashboard
export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
  // Connection pool settings to prevent connection errors
  // These help with "connection forcibly closed" errors
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
