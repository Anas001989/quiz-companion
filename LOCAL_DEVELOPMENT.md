# Local Development Setup

## Accessing Your App

### ✅ Correct URL
```
http://localhost:3000
```

### ❌ Wrong URL (Will Cause SSL Error)
```
https://localhost:3000
```

## Why?

Next.js development server runs on **HTTP** by default, not HTTPS. 

- ✅ `http://localhost:3000` - Works correctly
- ❌ `https://localhost:3000` - Will show SSL/connection errors

## Environment Variables

### Supabase URLs (Use HTTPS)
Your Supabase URLs should use HTTPS:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
```

### Local Development (Use HTTP)
Your local dev server uses HTTP:
```
http://localhost:3000
```

## If You See SSL Errors

If you're getting `ERR_SSL_PROTOCOL_ERROR` or connection refused errors:

1. **Check the URL** - Make sure you're using `http://` not `https://`
2. **Clear browser cache** - Sometimes browsers cache HTTPS redirects
3. **Try incognito/private mode** - To bypass cached redirects
4. **Check your browser** - Some browsers auto-redirect HTTP to HTTPS

## Production vs Development

- **Development**: `http://localhost:3000` (HTTP)
- **Production**: Your deployed URL will use HTTPS (handled by hosting provider)

## Quick Fix

If you accidentally typed `https://localhost:3000`:
1. Change it to `http://localhost:3000`
2. The app should load immediately

