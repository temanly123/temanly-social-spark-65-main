# 📧 Email Setup Guide for Supabase Password Reset

## Step 1: Configure Gmail App Password

1. **Go to your Google Account**: https://myaccount.google.com/
2. **Navigate to Security** → **2-Step Verification** (enable if not already)
3. **Go to App Passwords**: https://myaccount.google.com/apppasswords
4. **Generate App Password**:
   - Select app: "Mail"
   - Select device: "Other (custom name)"
   - Name it: "Temanly Supabase"
   - **Copy the 16-character password** (save this!)

## Step 2: Configure Supabase SMTP

1. **Go to Supabase Dashboard**: https://supabase.com/dashboard/project/enyrffgedfvgunokpmqk
2. **Navigate to**: Settings → Auth → SMTP Settings
3. **Enable Custom SMTP** and enter:

```
SMTP Host: smtp.gmail.com
SMTP Port: 587
SMTP User: amandasoenoko@gmail.com
SMTP Pass: [Your 16-character app password from Step 1]
Sender Name: Temanly
Sender Email: amandasoenoko@gmail.com
```

## Step 3: Configure Email Templates

1. **Go to**: Settings → Auth → Email Templates
2. **Reset Password Template**:

**Subject**: `Reset your Temanly password`

**Body**:
```html
<h2>Reset Your Password</h2>
<p>Hi there,</p>
<p>You requested a password reset for your Temanly account.</p>
<p>Click the link below to reset your password:</p>
<p><a href="{{ .ConfirmationURL }}">Reset Password</a></p>
<p>If you didn't request this, you can safely ignore this email.</p>
<p>Thanks,<br>The Temanly Team</p>
```

## Step 4: Test the Setup

After configuring the above:

1. Go to your login page: http://localhost:3000/login
2. Click "Reset password" 
3. Enter your email: amandasoenoko@gmail.com
4. Check your Gmail inbox (and spam folder)
5. Click the reset link in the email

## Alternative: Use Resend (Recommended for Production)

If Gmail doesn't work, use Resend.com:

1. **Sign up at**: https://resend.com
2. **Get API Key** from dashboard
3. **In Supabase SMTP Settings**:
   ```
   SMTP Host: smtp.resend.com
   SMTP Port: 587
   SMTP User: resend
   SMTP Pass: [Your Resend API Key]
   Sender Email: noreply@yourdomain.com
   ```

## Troubleshooting

### If emails don't arrive:
1. Check spam/junk folder
2. Verify SMTP credentials in Supabase
3. Check Supabase logs: Dashboard → Logs → Auth
4. Try with a different email address

### If you get SMTP errors:
1. Make sure 2FA is enabled on Gmail
2. Use the exact 16-character app password
3. Don't use your regular Gmail password
4. Check that "Less secure app access" is disabled (use app password instead)

## Quick Test Commands

You can test if your SMTP is working by running this in browser console on your site:

```javascript
// Test password reset
supabase.auth.resetPasswordForEmail('amandasoenoko@gmail.com', {
  redirectTo: window.location.origin + '/reset-password'
}).then(result => console.log('Reset result:', result))
```

## Security Notes

- Never commit SMTP credentials to code
- Use environment variables in production
- Consider using a dedicated email service for production
- App passwords are safer than regular passwords for SMTP

---

**Need Help?** 
- Check Supabase documentation: https://supabase.com/docs/guides/auth/auth-smtp
- Gmail App Password help: https://support.google.com/accounts/answer/185833
