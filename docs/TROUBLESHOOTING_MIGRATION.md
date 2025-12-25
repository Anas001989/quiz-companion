# Troubleshooting Migration Issues

## Authentication Error: P1000

If you get:
```
Error: P1000: Authentication failed against database server
```

### Common Causes & Solutions

#### 1. Wrong Password in Connection String

**Problem:** Password might be URL-encoded incorrectly or wrong password.

**Solution:**
1. Go to your new Supabase project → Settings → Database
2. Click "Reset database password" (if needed)
3. Copy the **Connection string** again
4. Update `DATABASE_URL` in `.env`

#### 2. Using Wrong Connection String Format

**For Transaction Pooler (Recommended):**
```
postgresql://postgres.[PROJECT_REF]:[PASSWORD]@aws-1-ca-central-1.pooler.supabase.com:6543/postgres
```

**Check:**
- ✅ Port should be `6543` (pooler)
- ✅ Host should be `aws-1-ca-central-1.pooler.supabase.com`
- ✅ Format: `postgres.[PROJECT_REF]` (not just `postgres`)

#### 3. Password Contains Special Characters

If your password has special characters, they need to be URL-encoded:
- `@` → `%40`
- `#` → `%23`
- `$` → `%24`
- `%` → `%25`
- `&` → `%26`
- `+` → `%2B`
- `=` → `%3D`

**Solution:** Use the connection string directly from Supabase Dashboard (it's already encoded).

#### 4. Wrong Project Reference

**Check:**
- Make sure you're using the connection string from the **new project** (quiz-companion-west)
- Not the old project connection string

### How to Get Correct Connection String

1. Go to **New Supabase Project** (quiz-companion-west)
2. Settings → Database
3. Under "Connection string", select:
   - **Connection pooling** tab
   - **Transaction** mode
   - **URI** format
4. Copy the connection string
5. Replace `[YOUR-PASSWORD]` with your actual password
6. Update `DATABASE_URL` in `.env`

### Test Connection

```bash
# Test if connection works
npx prisma db pull --preview-feature
```

If this works, your connection string is correct.

### Alternative: Use Direct Connection (Not Pooler)

If pooler doesn't work, try direct connection:

```
postgresql://postgres:[PASSWORD]@db.[PROJECT_REF].supabase.co:5432/postgres
```

**Note:** Direct connection is slower but sometimes more reliable for migrations.

## Still Having Issues?

1. **Double-check password:** Reset it in Supabase Dashboard
2. **Verify project:** Make sure you're using the new project (ca-central-1)
3. **Check connection string format:** Should match exactly from Supabase Dashboard
4. **Try direct connection:** Use port 5432 instead of 6543


