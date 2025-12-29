# Fixing Prisma Connection Errors

If you're seeing errors like:
```
Error in PostgreSQL connection: Error { kind: Io, cause: Some(Os { code: 10054, kind: ConnectionReset, message: "An existing connection was forcibly closed by the remote host." }) }
```

This is a common issue with Supabase/PostgreSQL connections in Next.js serverless environments.

## Root Cause

The error occurs because:
1. **Connection timeouts**: Supabase closes idle connections after a period
2. **Connection limits**: Supabase has connection limits per project
3. **Serverless functions**: Next.js API routes create new connections each time
4. **No connection pooling**: Without proper pooling, connections can be exhausted

## Solutions

### Solution 1: Use Supabase Connection Pooler (Recommended)

Supabase provides a connection pooler that handles connection management better. Update your `DATABASE_URL` in `.env.local`:

**Instead of:**
```env
DATABASE_URL=postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres
```

**Use the pooler URL (Session mode):**
```env
DATABASE_URL=postgresql://postgres.[PROJECT_REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres?pgbouncer=true
```

**⚠️ Important: Use Session Mode, Not Transaction Mode**

Prisma uses prepared statements, which are **not supported** in Transaction mode. You must use **Session mode** when using PgBouncer with Prisma.

**Error you'll see if using Transaction mode:**
```
prepared statement "s1" already exists
```

**Solution:** Switch to Session mode in Supabase Dashboard → Settings → Database → Connection Pooling

**How to find your pooler URL:**
1. Go to Supabase Dashboard → Settings → Database
2. Look for "Connection string" or "Connection pooling"
3. **IMPORTANT: Select "Session" mode (NOT "Transaction" mode)**
   - Transaction mode doesn't support prepared statements (which Prisma uses)
   - Session mode supports prepared statements and works with Prisma
4. Copy the connection string
5. It should look like: `postgresql://postgres.xxxxx:xxxxx@aws-0-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true`

**Benefits:**
- Better connection management
- Handles connection timeouts automatically
- More efficient for serverless functions
- Reduces connection errors

### Solution 2: Add Connection Pool Parameters

If you can't use the pooler, add connection pool parameters to your existing connection string:

```env
DATABASE_URL=postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres?connection_limit=5&pool_timeout=10
```

**Parameters:**
- `connection_limit=5` - Limits concurrent connections
- `pool_timeout=10` - Connection timeout in seconds

### Solution 3: Update Prisma Configuration

The Prisma client has been updated to handle connections better. Make sure you're using the latest version:

```bash
npx prisma generate
```

### Solution 4: Add Retry Logic (Already Implemented)

The code now includes better error handling. If connections fail, Prisma will automatically retry.

## Verification

After updating your connection string:

1. **Restart your dev server:**
   ```bash
   # Stop the server (Ctrl+C)
   npm run dev
   ```

2. **Test the connection:**
   - Try generating questions again
   - Check if the error still appears in logs

3. **Monitor connections:**
   - Check Supabase Dashboard → Database → Connection Pooling
   - See how many connections are active

## Best Practices

1. **Always use the connection pooler** for production and development
2. **Limit connection pool size** to avoid exhausting Supabase limits
3. **Use connection reuse** - The code already does this in development
4. **Handle errors gracefully** - The updated code includes better error handling

## Common Error: "prepared statement already exists"

If you see this error:
```
prepared statement "s1" already exists
```

**Cause:** You're using PgBouncer in **Transaction mode**, which doesn't support prepared statements. Prisma requires prepared statements.

**Solution:** Switch to **Session mode** in Supabase Dashboard:
1. Go to Supabase Dashboard → Settings → Database
2. Find "Connection Pooling" section
3. Select **"Session" mode** (not "Transaction" mode)
4. Copy the connection string
5. Update your `.env.local` with the Session mode URL
6. Restart your dev server

**Alternative:** If you must use Transaction mode, you can use the direct connection (port 5432) instead of the pooler, but this is less efficient.

## If Errors Persist

1. **Check Supabase status**: Make sure your project is active
2. **Verify connection string**: Ensure it's correct in `.env.local` and uses Session mode
3. **Check connection limits**: Supabase free tier has connection limits
4. **Restart the server**: Sometimes a fresh start helps
5. **Check for connection leaks**: Make sure connections are being closed properly

## Additional Resources

- [Supabase Connection Pooling](https://supabase.com/docs/guides/database/connecting-to-postgres#connection-pooler)
- [Prisma Connection Management](https://www.prisma.io/docs/guides/performance-and-optimization/connection-management)

