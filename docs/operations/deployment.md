# Deployment

## Hosting

The project includes `vercel.json`:

```json
{
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
}
```

This allows Vercel to serve the React single-page app for client-side routes such as `/daily`, `/archive`, and `/:gameId`.

## Build

```bash
npm run build
```

The production build is emitted to `dist/`.

## Required Environment Variables

Set these in the Vercel project:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

## Supabase Configuration

Before deploying, confirm:

- Supabase Auth email/password provider is configured as desired.
- Google OAuth provider is configured if Google login should be available.
- Site URL and redirect URLs include the deployed origin and `/auth/callback`.
- Database schema matches the tables in `docs/database/schema.sql`.
- RPCs exist: `create_new_game`, `increment_pair_score`, `get_daily_puzzle_leaderboard`.
- RLS policies allow the expected frontend operations and block cross-user access.
- Daily puzzle rows are inserted before users need them.
- Profile rows in `public.users` are created for auth users.

## Production Checks

After deployment:

- Visit `/login`.
- Complete a login flow.
- Confirm protected route access.
- Create and solve a game between test users.
- Confirm archive updates.
- Confirm daily puzzle record writes.
- Confirm browser refresh works on nested routes.
