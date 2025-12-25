# Connection String Format for .env

## Password Encoding

Your password: `tAHg/&9-*L*%PiE`

Special characters need to be URL-encoded in connection strings:
- `/` → `%2F`
- `&` → `%26`
- `*` → `%2A`
- `%` → `%25`

**Encoded password:** `tAHg%2F%269-%2AL%2A%25PiE`

## Best Practice: Use Supabase Dashboard

**Don't manually encode!** Instead:

1. Go to Supabase Dashboard → Settings → Database
2. Copy the **Connection string** (it's already encoded)
3. Just replace `[YOUR-PASSWORD]` with your actual password
4. Supabase will handle the encoding automatically

## Connection String Format

**Transaction Pooler (Recommended):**
```
postgresql://postgres.[PROJECT_REF]:tAHg%2F%269-%2AL%2A%25PiE@aws-1-ca-central-1.pooler.supabase.com:6543/postgres
```

**Or use the one from Supabase Dashboard** - it will have the password already properly encoded.

## In Your .env File

```env
DATABASE_URL=postgresql://postgres.[PROJECT_REF]:tAHg%2F%269-%2AL%2A%25PiE@aws-1-ca-central-1.pooler.supabase.com:6543/postgres
```

**Important:** 
- No quotes needed in .env file
- Use the encoded password
- Or better: Copy the full connection string from Supabase Dashboard


