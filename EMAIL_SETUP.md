# Email Setup Guide - DPMPTSP Magang

## What's Been Set Up

✅ Nodemailer installed
✅ Email API endpoint created at `/api/send-email`
✅ Form updated to send confirmation emails
✅ Beautiful HTML email template with DPMPTSP branding

## How to Configure Gmail SMTP

### Step 1: Get Gmail App Password

1. Go to your Google Account: https://myaccount.google.com/
2. Go to **Security** → **2-Step Verification** (enable if not enabled)
3. Scroll down to **App passwords**
4. Click "Create app password"
5. Give it a name like "DPMPTSP Magang"
6. Copy the 16-character password (looks like: `abcd efgh ijkl mnop`)

### Step 2: Create .env.local File

1. In your project root (`d:\backup\syafa`), create a file named `.env.local`
2. Add these lines:

```
SMTP_USER=your-gmail@gmail.com
SMTP_PASS=your-16-char-app-password
```

Example:
```
SMTP_USER=dpmptsp.jateng@gmail.com
SMTP_PASS=abcd efgh ijkl mnop
```

### Step 3: Restart Development Server

```bash
# Stop the current server (Ctrl+C)
# Then restart:
npm run dev
```

## Email Features

When a user submits the internship form:

1. ✅ Form is validated
2. ✅ Email is sent to user's email address
3. ✅ Email contains:
   - Personalized greeting with user's name
   - Confirmation of registration
   - Next steps information
   - Contact information
   - Professional DPMPTSP branding

## Email Template Preview

The email includes:
- 🎉 Header with success message
- 👤 Personalized greeting
- 📋 Next steps instructions
- 📧 Contact information (email, phone, address)
- 🎨 Teal/green branding matching your website

## Testing

1. Fill out the form at `/laporan`
2. Submit with a valid email
3. Check the email inbox (including spam folder first time)
4. Verify the email looks good and has correct information

## Troubleshooting

**Email not sending?**
- Check `.env.local` has correct credentials
- Restart dev server after adding `.env.local`
- Check Google App Password is correct (16 characters, no spaces)
- Look at terminal for error messages

**Email going to spam?**
- Normal for first emails from new domains
- Users should mark as "Not Spam"
- Consider setting up SPF/DKIM records for production

**Want to customize email?**
- Edit: `app/api/send-email/route.ts`
- Change HTML template in `mailOptions.html`
- Update text, colors, content as needed

## Security Note

⚠️ **Never commit `.env.local` to git**
- Already in `.gitignore`
- Keep credentials private
- Use different credentials for production
