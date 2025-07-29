# Vercel Full-Stack Deployment Guide

This guide will help you deploy the Temanly application as a full-stack application on Vercel.

## Architecture Overview

- **Frontend**: React + Vite (Static Site Generation)
- **Backend**: Vercel API Routes (Serverless Functions)
- **Database**: Supabase (PostgreSQL + Auth + Storage + Edge Functions)
- **WhatsApp Integration**: Vercel API Routes (replacing Express server)

## Pre-Deployment Setup

### 1. Environment Variables

You need to set up the following environment variables in your Vercel dashboard:

#### Required Variables:
```bash
# Supabase Configuration
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here

# WhatsApp API (Backend)
TEXTMEBOT_API_KEY=jYg9R67hoNMT
TEXTMEBOT_API_URL=https://api.textmebot.com/send.php
REGISTERED_PHONE=6285890033683

# Midtrans Payment
VITE_MIDTRANS_CLIENT_KEY=your-midtrans-client-key
VITE_MIDTRANS_SERVER_KEY=your-midtrans-server-key
VITE_MIDTRANS_ENVIRONMENT=sandbox

# Application Configuration
VITE_APP_NAME=Temanly
VITE_APP_URL=https://your-domain.vercel.app
VITE_APP_ENVIRONMENT=production
```

### 2. Vercel Project Setup

1. **Upload the Project**:
   - Upload the `temanly-social-spark-65-main` folder (the inner folder)
   - Or connect your GitHub repository

2. **Configure Build Settings**:
   - Framework Preset: `Vite`
   - Build Command: `npm run build`
   - Output Directory: `dist`
   - Install Command: `npm install`

3. **Add Environment Variables**:
   - Go to Project Settings → Environment Variables
   - Add all the variables listed above

## API Routes Structure

The following API routes have been created to replace the Express server:

```
/api/send-whatsapp.js  - WhatsApp message sending
/api/health.js         - Health check endpoint
```

### API Endpoints:

1. **WhatsApp Proxy**: `POST /api/send-whatsapp`
   ```json
   {
     "phone": "6285890033683",
     "code": "123456"
   }
   ```

2. **Health Check**: `GET /api/health`
   ```json
   {
     "status": "OK",
     "service": "WhatsApp Proxy",
     "timestamp": "2024-01-01T00:00:00.000Z"
   }
   ```

## Deployment Steps

### Step 1: Prepare Your Code
1. Ensure all API routes are in the `/api` folder
2. Update any frontend code that calls the old Express server endpoints
3. Test locally using `vercel dev` (optional)

### Step 2: Deploy to Vercel
1. Go to [vercel.com](https://vercel.com)
2. Click "New Project"
3. Import your repository or upload the folder
4. Configure environment variables
5. Deploy!

### Step 3: Post-Deployment
1. Test all API endpoints
2. Verify WhatsApp integration works
3. Check Supabase connections
4. Test the complete user flow

## Troubleshooting

### Common Issues:

1. **API Routes Not Working**:
   - Ensure files are in `/api` folder
   - Check function runtime is set to `nodejs18.x`
   - Verify CORS headers are set

2. **Environment Variables**:
   - Make sure all required variables are set in Vercel dashboard
   - Frontend variables must start with `VITE_`
   - Backend variables (API routes) don't need `VITE_` prefix

3. **Build Errors**:
   - Check that all dependencies are in `package.json`
   - Ensure TypeScript types are correct
   - Verify Vite configuration

### Testing API Routes Locally:

```bash
# Install Vercel CLI
npm i -g vercel

# Run development server
vercel dev

# Test endpoints
curl -X POST http://localhost:3000/api/send-whatsapp \
  -H "Content-Type: application/json" \
  -d '{"phone":"6285890033683","code":"123456"}'
```

## Migration Notes

### What Changed:
- ✅ Express server → Vercel API routes
- ✅ CORS middleware → Headers in vercel.json
- ✅ Environment variables → Vercel environment variables
- ✅ Health check endpoint → API route

### What Stayed the Same:
- ✅ Supabase integration (no changes needed)
- ✅ Frontend React application
- ✅ Database schema and edge functions
- ✅ Authentication flow

## Performance Benefits

- **Serverless**: API routes scale automatically
- **Global CDN**: Frontend served from edge locations
- **Zero Cold Starts**: For frequently used functions
- **Cost Effective**: Pay only for what you use

## Support

If you encounter issues during deployment:
1. Check Vercel deployment logs
2. Verify environment variables are set correctly
3. Test API routes individually
4. Check Supabase connection status
