# Coverable Sales Command

Interactive onboarding, CRM, and competition app for Coverable.ai sales team members.

## Project Goal

Help new sales reps ramp quickly by centralizing product knowledge, sales plays, practice scenarios, call guidance, CRM activity, competition, and readiness tracking.

## Current Features

- Next.js app ready for Vercel
- Supabase auth/database scaffolding
- Rep-facing team progress page
- Five-day Coverable sales bootcamp based on the training packet
- Interactive progress tracking for each rep
- CRM activity logging for calls, demos, follow-ups, and closed clients
- Competition scoring from onboarding + CRM activity
- Scripts, objections, and certification targets
- Admin console for approved admins to create rep accounts

## Run Locally

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

Without Supabase environment variables, the app runs in demo mode with browser `localStorage`.

## Free Hosting Plan

- Vercel Hobby for hosting.
- Supabase Free for auth and Postgres.

Supabase setup:

1. Create a free Supabase project.
2. Run `supabase/schema.sql` in the Supabase SQL editor.
3. Copy the project URL and anon key into `.env.local`:

```bash
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
```

4. Add the same variables in Vercel project settings before deploy. Keep
   `SUPABASE_SERVICE_ROLE_KEY` server-only and never expose it as a public key.

## Admin Setup

Only these accounts may be admins:

- Uzi Isman: `uzi@coverable.ai`
- Joshua Reinfeld: `joshuareinfeld17@gmail.com`

To enable the admin console:

1. Run `supabase/admin-roles.sql` in the Supabase SQL editor.
2. Add `SUPABASE_SERVICE_ROLE_KEY` from Supabase project API settings to
   `.env.local` and to the Vercel project's environment variables.
3. Redeploy after setting the Vercel environment variable.

Admins can then use the Admin tab to create confirmed rep accounts with
temporary passwords. Newly created accounts cannot be admins.
