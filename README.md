# 69th FAMILY — homepage starter

A responsive static homepage using the agreed Clinical Synapse-inspired visual language:
deep burgundy, dusty rose, warm ivory, subtle abstract curves, restrained gold details,
the supplied batch logo, a short branded intro, and four platform cards.

## Files
- `index.html` — homepage structure
- `styles.css` — visual design and responsive layout
- `app.js` — intro transition, mobile navigation, and announcement loading
- `config.js` — optional Supabase URL and anon/public key
- `supabase-announcements.sql` — additive announcement table and read-only public policy
- `assets/batch-logo.jpg` — supplied batch logo

## Existing links included
- Clinical Synapse: https://clinical-synapse.admincmc69.workers.dev/
- Attendance Tracker: https://69th-batch-attendance-tracker.pages.dev/
- Feedback: https://69th-batch-feedback.enosh17j.workers.dev/home

Check these URLs before launch in case any have changed.

## Configure Supabase safely
1. Confirm the correct existing Supabase project before running SQL.
2. Review the existing schema and RLS policies first.
3. Run `supabase-announcements.sql` to add the dedicated table.
4. Put the project's Project URL and anon/public key in `config.js`.
5. Never place the `service_role` key in client-side code.
6. Admin publishing UI and write policies are deliberately not included yet. They must be designed against the existing authentication/role schema, not guessed.

The homepage works without Supabase configured; it will show a setup message in the announcements area.

## GitHub / Cloudflare Pages
Create a new repository in the same GitHub account, for example `69th-family`.
Upload the contents of this folder (not the ZIP itself) to the repository root.
Create a new Cloudflare Pages project connected to that repository:
- Framework preset: None
- Build command: leave blank
- Build output directory: `/` (or the repository root, depending on the dashboard field)
No secrets are required for the static homepage.

Test on mobile and desktop before sharing the public URL.
