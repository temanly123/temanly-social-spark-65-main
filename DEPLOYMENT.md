# Temanly Production Deployment Guide

This guide provides comprehensive instructions for deploying the Temanly platform to production.

## Prerequisites

- Node.js 18+ and npm/yarn
- Supabase account and project
- Midtrans account (for payment processing)
- TextMeBot API access (for WhatsApp notifications)
- Domain name and hosting provider (Vercel recommended)

## 1. Supabase Setup

### Database Setup
1. Create a new Supabase project
2. Run the migration files in order:
   ```bash
   # Apply the comprehensive database schema
   supabase db push
   ```

### Storage Setup
1. Create storage buckets:
   - `documents` (for KTP and verification documents)
   - `profile-images` (for user profile pictures)
   - `talent-portfolios` (for talent portfolio images)

2. Set up storage policies:
   ```sql
   -- Allow authenticated users to upload documents
   CREATE POLICY "Users can upload documents" ON storage.objects
   FOR INSERT WITH CHECK (auth.uid()::text = (storage.foldername(name))[1]);
   
   -- Allow admins to view all documents
   CREATE POLICY "Admins can view all documents" ON storage.objects
   FOR SELECT USING (auth.jwt() ->> 'role' = 'admin');
   ```

### Edge Functions Setup
Deploy the Supabase Edge Functions:
```bash
supabase functions deploy midtrans-webhook
supabase functions deploy send-payment-notification
supabase functions deploy send-verification-email
supabase functions deploy notify-admin-verification
supabase functions deploy send-verification-result
```

### Environment Variables in Supabase
Set these secrets in your Supabase project:
- `MIDTRANS_SERVER_KEY`
- `TEXTMEBOT_API_KEY`
- `ADMIN_EMAIL`
- `ADMIN_PHONE`

## 2. Midtrans Configuration

### Sandbox Setup (for testing)
1. Create Midtrans sandbox account
2. Get Server Key and Client Key from dashboard
3. Configure webhook URL: `https://your-supabase-url.supabase.co/functions/v1/midtrans-webhook`

### Production Setup
1. Upgrade to Midtrans production account
2. Complete business verification
3. Get production Server Key and Client Key
4. Update webhook URL to production endpoint

## 3. WhatsApp Integration

### TextMeBot Setup
1. Register at TextMeBot service
2. Get API key (currently using: `jYg9R67hoNMT`)
3. Verify phone number format compatibility
4. Test message delivery

## 4. Frontend Deployment

### Environment Variables
Create `.env.production` with:
```env
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_MIDTRANS_CLIENT_KEY=your-midtrans-client-key
VITE_MIDTRANS_ENVIRONMENT=production
VITE_TEXTMEBOT_API_KEY=jYg9R67hoNMT
VITE_TEXTMEBOT_API_URL=http://api.textmebot.com/send.php
VITE_APP_NAME=Temanly
VITE_APP_URL=https://temanly.com
VITE_APP_ENVIRONMENT=production
VITE_ADMIN_EMAIL=admin@temanly.com
VITE_ADMIN_PHONE=6285890033683
VITE_ENABLE_REAL_PAYMENTS=true
VITE_ENABLE_WHATSAPP_NOTIFICATIONS=true
```

### Vercel Deployment
1. Connect GitHub repository to Vercel
2. Set environment variables in Vercel dashboard
3. Configure build settings:
   - Build Command: `npm run build`
   - Output Directory: `dist`
   - Install Command: `npm install`

### Custom Domain Setup
1. Add custom domain in Vercel
2. Configure DNS records
3. Enable SSL certificate

## 5. Database Seeding

### Initial Data Setup
Run these commands to set up initial data:

```sql
-- Insert cities
INSERT INTO cities (name, is_active) VALUES 
('Jakarta', true),
('Surabaya', true),
('Bandung', true),
('Medan', true),
('Semarang', true),
('Makassar', true),
('Palembang', true),
('Tangerang', true),
('Depok', true),
('Bekasi', true);

-- Insert service types
INSERT INTO service_types (name, base_rate, unit, description, is_active) VALUES
('chat', 25000, 'day', 'Chat service for one day', true),
('call', 40000, 'hour', 'Voice call service per hour', true),
('video_call', 65000, 'hour', 'Video call service per hour', true),
('offline_date', 285000, '3_hours', 'Offline date for 3 hours', true),
('party_buddy', 1000000, 'event', 'Party companion for events', true),
('rent_lover', 85000, 'day', 'Romantic companion service', true);

-- Create admin user
INSERT INTO auth.users (email, encrypted_password, email_confirmed_at, created_at, updated_at)
VALUES ('admin@temanly.com', crypt('admin123', gen_salt('bf')), now(), now(), now());

-- Create admin profile
INSERT INTO profiles (id, email, name, user_type, verification_status, is_admin)
SELECT id, 'admin@temanly.com', 'Admin', 'admin', 'verified', true
FROM auth.users WHERE email = 'admin@temanly.com';
```

## 6. Security Configuration

### Row Level Security (RLS)
Ensure all tables have proper RLS policies:
- Users can only access their own data
- Admins can access all data
- Public data (like talent profiles) is accessible to all

### API Security
- Enable rate limiting
- Configure CORS properly
- Set up proper authentication flows

## 7. Monitoring and Analytics

### Error Tracking
Set up error tracking with:
- Sentry for frontend errors
- Supabase logs for backend errors
- Custom error logging for critical flows

### Performance Monitoring
- Monitor page load times
- Track API response times
- Monitor database performance

### Business Analytics
- Track user registrations
- Monitor booking conversions
- Analyze payment success rates
- Track talent performance metrics

## 8. Testing Checklist

### Pre-deployment Testing
- [ ] User registration and verification flow
- [ ] Talent registration and approval flow
- [ ] Booking creation and payment processing
- [ ] WhatsApp notifications delivery
- [ ] Admin dashboard functionality
- [ ] Document upload and verification
- [ ] Review and rating system
- [ ] Talent level progression
- [ ] Payout request and approval

### Production Testing
- [ ] Real payment processing with small amounts
- [ ] WhatsApp delivery to actual phone numbers
- [ ] Email delivery and verification
- [ ] Document upload to production storage
- [ ] Admin notifications and workflows
- [ ] Mobile responsiveness
- [ ] Performance under load

## 9. Launch Preparation

### Content Preparation
- Create initial talent profiles (5-10 verified talents)
- Prepare marketing materials
- Set up customer support channels
- Create user guides and FAQs

### Legal and Compliance
- Terms of service
- Privacy policy
- Payment processing compliance
- Data protection compliance

### Marketing Setup
- Social media accounts
- Google Analytics
- SEO optimization
- Launch announcement materials

## 10. Post-Launch Monitoring

### Daily Monitoring
- Check system health and uptime
- Monitor payment processing
- Review user feedback and support tickets
- Check WhatsApp delivery rates

### Weekly Reviews
- Analyze user growth and retention
- Review talent performance and earnings
- Monitor financial metrics
- Update content and features

### Monthly Optimization
- Performance optimization
- Feature updates based on user feedback
- Security updates and patches
- Business metric analysis

## Support and Maintenance

### Regular Maintenance
- Database optimization
- Security updates
- Performance monitoring
- Backup verification

### Emergency Procedures
- Incident response plan
- Rollback procedures
- Emergency contact information
- Disaster recovery plan

## Contact Information

For deployment support:
- Technical Lead: [Your Contact]
- DevOps: [Your Contact]
- Business: [Your Contact]

---

This deployment guide ensures a smooth transition from development to production with all features working correctly and securely.
