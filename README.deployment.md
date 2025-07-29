# Vercel Deployment Guide

## Prerequisites

1. **Vercel Account**: Sign up at [vercel.com](https://vercel.com)
2. **GitHub Repository**: Push your code to GitHub
3. **Supabase Project**: Ensure your Supabase project is set up

## Deployment Steps

### 1. Connect to Vercel

1. Go to [vercel.com/dashboard](https://vercel.com/dashboard)
2. Click "New Project"
3. Import your GitHub repository
4. Select the repository containing this project

### 2. Configure Environment Variables

In your Vercel project settings, add these environment variables:

**Required Variables:**
```
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

**Optional but Recommended:**
```
NODE_VERSION=18
```

### 3. Build Settings

Vercel should auto-detect the settings, but verify:

- **Framework Preset**: Vite
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Install Command**: `npm install`

### 4. Deploy

1. Click "Deploy"
2. Wait for the build to complete
3. Your app will be available at `https://your-project-name.vercel.app`

## Post-Deployment Configuration

### Update Supabase Settings

1. Go to your Supabase Dashboard
2. Navigate to Authentication > URL Configuration
3. Add your Vercel domain to:
   - **Site URL**: `https://your-project-name.vercel.app`
   - **Redirect URLs**: `https://your-project-name.vercel.app/**`

### Custom Domain (Optional)

1. In Vercel Dashboard, go to your project
2. Click "Domains" tab
3. Add your custom domain
4. Update DNS records as instructed
5. Update Supabase URLs to use your custom domain

## Admin Panel Access

The admin panel is built into the same app and accessible at:
```
https://your-domain.com/admin-login
```

Default admin credentials are configured in your Supabase database.

## Troubleshooting

### Build Issues

1. **Node Version**: Ensure using Node 18+
2. **Dependencies**: Check all packages are listed in package.json
3. **Environment Variables**: Verify all required vars are set

### Runtime Issues

1. **CORS Errors**: Check Supabase URL configuration
2. **Auth Issues**: Verify redirect URLs in Supabase
3. **404 Errors**: Check vercel.json rewrites configuration

### Edge Functions

Your Supabase Edge Functions will work automatically:
- They're deployed to Supabase, not Vercel
- No additional configuration needed
- Functions available at: `https://your-project-ref.supabase.co/functions/v1/`

## Performance Optimization

The deployment includes:
- Static asset caching (1 year)
- SPA routing configuration
- Gzip compression (automatic)
- Edge network distribution

## Monitoring

Monitor your deployment:
- **Vercel Analytics**: Built-in performance monitoring
- **Supabase Dashboard**: Database and function analytics
- **Error Tracking**: Check Vercel function logs

## Scaling

This setup automatically scales:
- **Frontend**: Vercel's edge network
- **Backend**: Supabase handles scaling
- **Database**: Supabase managed PostgreSQL

Your app is now production-ready! 🚀