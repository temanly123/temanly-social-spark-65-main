# Deploy Edge Functions to Fix Payment 404 Error

The payment 404 error occurs because the `create-payment` edge function is not deployed to your Supabase project. Here's how to deploy it manually:

## Option 1: Using Supabase Dashboard (Recommended)

1. **Go to your Supabase Dashboard**
   - Visit: https://supabase.com/dashboard
   - Select your project: `enyrffgedfvgunokpmqk`

2. **Navigate to Edge Functions**
   - In the left sidebar, click on "Edge Functions"
   - Click "Create a new function"

3. **Create the `create-payment` function**
   - Function name: `create-payment`
   - Copy the entire content from `supabase/functions/create-payment/index.ts`
   - Paste it into the function editor
   - Click "Deploy function"

4. **Set Environment Variables**
   - Go to Settings → Environment Variables
   - Add these variables:
     ```
     MIDTRANS_SERVER_KEY=your_midtrans_server_key_here
     SUPABASE_URL=https://enyrffgedfvgunokpmqk.supabase.co
     SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
     ```

5. **Create the `midtrans-webhook` function (optional)**
   - Function name: `midtrans-webhook`
   - Copy content from `supabase/functions/midtrans-webhook/index.ts`
   - Deploy the function

## Option 2: Using Supabase CLI (if available)

If you have Supabase CLI installed:

```bash
# Login to Supabase
supabase login

# Link to your project
supabase link --project-ref enyrffgedfvgunokpmqk

# Deploy the functions
supabase functions deploy create-payment
supabase functions deploy midtrans-webhook

# Set environment variables
supabase secrets set MIDTRANS_SERVER_KEY=your_key_here
```

## Option 3: Install Supabase CLI

If you want to install the CLI:

```bash
# Using npm
npm install -g supabase

# Using PowerShell (Windows)
iwr -useb https://supabase.com/install.ps1 | iex

# Then follow Option 2 steps
```

## Testing the Deployment

1. **Visit the test page**: http://localhost:3000/payment-test
2. **Click "Test Payment Function"**
3. **Check the result**:
   - Status 200 = Function is working
   - Status 404 = Function not deployed
   - Status 500 = Function deployed but has errors

## Environment Variables Needed

Make sure these are set in your Supabase project:

- `MIDTRANS_SERVER_KEY`: Your Midtrans production server key
- `SUPABASE_URL`: https://enyrffgedfvgunokpmqk.supabase.co
- `SUPABASE_SERVICE_ROLE_KEY`: Your service role key from Supabase

## Midtrans Configuration

1. **Get your Midtrans keys**:
   - Login to https://dashboard.midtrans.com
   - Go to Settings → Access Keys
   - Copy the Server Key (for backend)
   - Client Key is already set in the frontend: `Mid-client-t14R0G6XRLw9MLZj`

2. **Set notification URL in Midtrans**:
   - Go to Settings → Configuration
   - Set Notification URL to: `https://enyrffgedfvgunokpmqk.supabase.co/functions/v1/midtrans-webhook`

## Troubleshooting

- **404 Error**: Function not deployed - follow deployment steps above
- **500 Error**: Check function logs in Supabase dashboard
- **CORS Error**: Function deployed but CORS headers missing - check function code
- **Token Error**: Midtrans keys not set or incorrect

## Quick Fix (Temporary)

If you can't deploy immediately, the function has a demo mode that will work without Midtrans keys, but payments won't be real.
