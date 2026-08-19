# Hour Logger

Hour Logger is a Vercel-ready, private medical-experience tracker built from the
purple spreadsheet design. Users can register with email and password, create
custom categories and goals, save organizations, log sessions in hours and
minutes, and see exact totals in the same format.

## Included

- Public landing page
- Email/password registration and sign-in
- Six-digit email-code password recovery
- Private per-user records protected by Supabase Row Level Security
- Custom category tabs and editable goals
- Spreadsheet-style session logs
- Native calendar field and separate hours-and-minutes entry controls
- Optional private profile with a name, username, and profile picture
- Organization dropdown that fills the saved contact and default role
- Responsive dashboard with total hours and progress bars
- Vercel configuration and a branded sharing image

## Local setup

1. Use Node.js 22.
2. Copy `.env.example` to `.env.local`.
3. The starter already contains Hour Logger's browser-safe Supabase project URL and
   publishable key as defaults. Environment variables can override them. Never
   use a secret or service-role key in browser code.
4. Apply the SQL file in `supabase/migrations`.
5. Install and run:

```text
npm install
npm run dev
```

## Required Supabase Auth settings

In project `lzxeubqpimgyglowuhjh`:

1. Enable Email authentication, public signup, and email confirmation.
2. Keep anonymous sign-ins disabled.
3. Add these local redirect URLs:
   - `http://localhost:3000/auth/confirm`
   - `http://localhost:3000/forgot-password`
4. After Vercel deployment, set the Supabase Site URL to the production URL and
   add the matching production routes.
5. Change the **Reset password** email template to show the OTP:

```html
<h2>Reset your password</h2>
<p>Enter this six-digit verification code in Hour Logger:</p>
<p style="font-size: 28px; font-weight: 700; letter-spacing: 6px;">
  {{ .Token }}
</p>
<p>If you did not request this, you can ignore this email.</p>
```

The application calls `resetPasswordForEmail()`, verifies the code with
`verifyOtp({ type: "recovery" })`, and then uses the authenticated recovery
session to update the password.

Supabase's default sender is intended for testing and is limited. A custom SMTP
provider is recommended before inviting real users. New free Supabase projects
using the default sender may require custom SMTP before email templates can be
customized.

## Vercel environment variables

The app is ready to deploy without adding secrets: it contains only the
browser-safe project URL and publishable key. These optional variables can
override those defaults for Production, Preview, and Development:

```text
NEXT_PUBLIC_SUPABASE_URL=https://lzxeubqpimgyglowuhjh.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=<browser-safe publishable key>
NEXT_PUBLIC_SITE_URL=https://<production-domain>
```

The two `NEXT_PUBLIC_SUPABASE_*` values are designed for browser use. Database
privacy comes from authenticated sessions and the migration's RLS policies.
When `NEXT_PUBLIC_SITE_URL` is omitted, Vercel's production-host environment
variable is used automatically.

## Validation

The starter has been checked with:

```text
npm run typecheck
npm run lint
npm run build
npm audit --omit=dev
```

See `docs/supabase-setup.md` for database verification and two-user isolation
checks.
