# Fix: 404 Error on Registration in Production

## Problem
Registration works locally but returns `HTTP error! status: 404` in production.

## Root Cause
- **Local Development**: Vite proxy forwards `/api` requests to `http://localhost:5000`
- **Production**: No proxy exists, so `/api` becomes a relative URL pointing to your frontend domain
- **Result**: Frontend tries `https://your-frontend.com/api/users/register` instead of your backend URL

## Solution

### ✅ Fixed in Code

The backend URL `https://acha-eeme.onrender.com/api` is now configured as the default production API base URL. The code automatically:
- Uses `/api` (Vite proxy) in **development mode**
- Uses `https://acha-eeme.onrender.com/api` in **production mode**

**No additional configuration needed!** Just rebuild and redeploy your frontend.

### Optional: Override with Environment Variable

If you need to use a different backend URL, you can still set `VITE_API_BASE_URL` environment variable to override the default:

**For Render.com, Vercel, Netlify, etc.:**

1. Go to your deployment platform's environment variables settings
2. Add a new environment variable:
   - **Key**: `VITE_API_BASE_URL`
   - **Value**: `https://your-backend-domain.com/api`
   
   Example:
   ```
   VITE_API_BASE_URL=https://acha-eeme.onrender.com/api
   ```

3. **Rebuild and redeploy** your frontend after adding the environment variable

### Step 2: Verify Your Backend URL

Make sure your backend server is accessible at the URL you're using. Test it:
```bash
curl https://your-backend-domain.com/api/users/register
```

You should get a response (even if it's an error about missing fields, that's fine - it means the route exists).

### Step 3: Check CORS Configuration

Ensure your backend allows requests from your frontend domain. In `server/index.js`, the CORS middleware should allow your frontend origin:

```javascript
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));
```

Set `FRONTEND_URL` in your backend's environment variables to your production frontend URL.

## Quick Test

After setting the environment variable and redeploying:

1. Open browser DevTools (F12)
2. Go to Network tab
3. Try to register
4. Check the request URL - it should be `https://your-backend-domain.com/api/users/register`, not `/api/users/register`

## Common Deployment Platforms

### Render.com
- The backend URL is already configured in code
- Optional: Override with `VITE_API_BASE_URL` = `https://acha-eeme.onrender.com/api` if needed
- Manual Deploy → Clear build cache & deploy

### Vercel
- Go to your project → Settings → Environment Variables
- Add: `VITE_API_BASE_URL` = `https://your-backend.com/api`
- Redeploy

### Netlify
- Go to Site settings → Environment variables
- Add: `VITE_API_BASE_URL` = `https://your-backend.com/api`
- Trigger a new deploy

## Important Notes

- Environment variables starting with `VITE_` are embedded at **build time**, not runtime
- You **must rebuild** your frontend after adding/changing `VITE_API_BASE_URL`
- The variable must be set **before** running `npm run build`
