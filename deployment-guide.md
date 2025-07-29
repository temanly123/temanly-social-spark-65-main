# Production Deployment Guide

## 🎯 Deployment Options

### Option 1: Vercel (Recommended for React Apps)

#### Step 1: Prepare for Deployment
```bash
# Build the application
npm run build

# Test the build locally
npm run preview
```

#### Step 2: Deploy to Vercel
1. **Install Vercel CLI**:
   ```bash
   npm i -g vercel
   ```

2. **Deploy**:
   ```bash
   vercel --prod
   ```

3. **Set Environment Variables** in Vercel Dashboard:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `VITE_MIDTRANS_CLIENT_KEY`
   - `VITE_MIDTRANS_IS_PRODUCTION=true`

### Option 2: Netlify

#### Step 1: Build and Deploy
1. **Connect GitHub repository** to Netlify
2. **Set build command**: `npm run build`
3. **Set publish directory**: `dist`
4. **Add environment variables** in Netlify dashboard

### Option 3: Traditional Hosting

#### Step 1: Build Application
```bash
npm run build
```

#### Step 2: Upload Files
- Upload contents of `dist/` folder to your web server
- Configure web server to serve `index.html` for all routes

## 🗄️ Production Database Setup

### Step 1: Production Supabase Project
1. **Create production project** in Supabase
2. **Apply migration** using the `migration-simplified.sql` file
3. **Update environment variables** with production URLs

### Step 2: Configure Production RLS
```sql
-- Ensure RLS is properly configured for production
ALTER TABLE payment_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE payout_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE payout_transactions ENABLE ROW LEVEL SECURITY;
```

## 🔧 Production Midtrans Setup

### Step 1: Switch to Production Mode
1. **Go to Midtrans Dashboard**
2. **Switch to Production environment**
3. **Get production API keys**
4. **Update environment variables**:
   ```
   VITE_MIDTRANS_IS_PRODUCTION=true
   VITE_MIDTRANS_CLIENT_KEY=your_production_client_key
   ```

### Step 2: Configure Production Webhook
1. **Set webhook URL** to production Supabase function
2. **Test webhook** with Midtrans simulator
3. **Verify webhook receives callbacks**

## 🔒 Security Checklist

### Environment Variables
- [ ] All sensitive keys in environment variables
- [ ] No hardcoded API keys in code
- [ ] Production vs development environment separation

### Database Security
- [ ] RLS policies enabled and tested
- [ ] Service role key secured
- [ ] Database backups configured

### API Security
- [ ] Webhook signature verification enabled
- [ ] Rate limiting configured
- [ ] CORS properly configured

## 📊 Monitoring Setup

### Step 1: Error Tracking
```javascript
// Add to your main.tsx or App.tsx
if (import.meta.env.PROD) {
  // Add error tracking service like Sentry
  console.log('Production mode - error tracking enabled');
}
```

### Step 2: Analytics
- Set up payment transaction monitoring
- Configure alerts for failed payments
- Monitor payout request volumes

### Step 3: Health Checks
- Monitor webhook endpoint health
- Check database connection status
- Verify Midtrans API connectivity

## 🚀 Deployment Commands

### Quick Deployment Script
```bash
#!/bin/bash
# deployment-script.sh

echo "🚀 Starting deployment..."

# Build the application
echo "📦 Building application..."
npm run build

# Deploy to Vercel (or your chosen platform)
echo "🌐 Deploying to production..."
vercel --prod

# Verify deployment
echo "✅ Deployment complete!"
echo "🔗 Check your production URL"
echo "🧪 Run production tests"
```

### Environment Setup Script
```bash
#!/bin/bash
# setup-production-env.sh

echo "🔧 Setting up production environment..."

# Copy environment template
cp .env.local .env.production

echo "📝 Please update .env.production with:"
echo "  - Production Supabase URL and keys"
echo "  - Production Midtrans keys"
echo "  - Set VITE_MIDTRANS_IS_PRODUCTION=true"

echo "✅ Environment template created!"
```

## 🧪 Production Testing

### Step 1: Smoke Tests
1. **Test booking flow** with real payment
2. **Verify webhook** receives callbacks
3. **Test payout request** creation
4. **Verify admin approval** workflow

### Step 2: Load Testing
- Test with multiple concurrent bookings
- Verify database performance
- Check webhook handling under load

### Step 3: Integration Testing
- Test Midtrans sandbox payments
- Verify all payment statuses
- Test error scenarios

## 📋 Go-Live Checklist

### Pre-Launch
- [ ] Database migration applied to production
- [ ] All environment variables configured
- [ ] Webhook deployed and tested
- [ ] Midtrans production keys configured
- [ ] SSL certificate installed
- [ ] Domain configured
- [ ] Error monitoring setup

### Launch Day
- [ ] Deploy application to production
- [ ] Verify all endpoints working
- [ ] Test complete payment flow
- [ ] Monitor error logs
- [ ] Check webhook callbacks
- [ ] Verify admin dashboard access

### Post-Launch
- [ ] Monitor payment transactions
- [ ] Check payout request volumes
- [ ] Verify webhook stability
- [ ] Monitor error rates
- [ ] Backup database
- [ ] Document any issues

## 🆘 Rollback Plan

### If Issues Occur:
1. **Revert to previous deployment**
2. **Check error logs** for root cause
3. **Verify database integrity**
4. **Test webhook connectivity**
5. **Notify stakeholders** of status

### Emergency Contacts:
- Database admin
- Midtrans support
- Hosting provider support
- Development team lead

## 📞 Support Information

### Midtrans Support:
- Documentation: https://docs.midtrans.com/
- Support: support@midtrans.com

### Supabase Support:
- Documentation: https://supabase.com/docs
- Community: https://github.com/supabase/supabase/discussions

Remember to test thoroughly in a staging environment before production deployment!
