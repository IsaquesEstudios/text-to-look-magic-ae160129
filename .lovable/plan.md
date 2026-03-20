

## Password Recovery Feature

### What's Needed

To send password recovery emails from your own domain (e.g., `noreply@discoveryinvestimentos.com`), you need to:

1. **Configure an email domain** — You just need to tell me which domain you want to use (e.g., `discoveryinvestimentos.com`). The system will provide DNS records (NS records) that you'll need to add at your domain registrar (where you bought the domain). This typically takes a few minutes to set up and up to 72 hours for DNS propagation.

2. **No API keys or external accounts needed** — Lovable Cloud handles email sending natively.

### Implementation Plan

**Step 1: Email Domain Setup**
- Configure your sender domain through the email setup dialog
- You'll receive DNS records to add at your domain provider

**Step 2: "Forgot Password" Link on Login**
- Add a "Esqueceu sua senha?" link below the password field on the login form
- Clicking it shows a simple form asking for the email address
- Calls the password reset API with redirect to `/reset-password`

**Step 3: Create `/reset-password` Page**
- New page at `/reset-password` route
- Detects the recovery token from the URL
- Shows a form to enter and confirm a new password
- Updates the password and redirects to login

**Step 4: Auth Email Templates (Optional)**
- Customize the recovery email to match your brand (logo, colors, Portuguese copy)
- Deploy the email templates

### Files to Create/Modify
- `src/pages/Auth.tsx` — Add "Forgot password" link and email input form
- `src/pages/ResetPassword.tsx` — New page for setting new password
- `src/routes.tsx` — Add `/reset-password` route
- `src/i18n/translations/pt.ts`, `en.ts`, `es.ts` — Add translation keys

### What I Need From You
Just tell me your **domain name** (e.g., `discoveryinvestimentos.com`) and I'll start the setup. You'll then need to add the DNS records at your domain registrar.

