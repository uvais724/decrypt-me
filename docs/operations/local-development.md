# Local Development

## Prerequisites

- Node.js 20 or newer.
- npm.
- A Supabase project with the schema and RPCs used by the app.

## Environment Variables

Create a `.env` file in the project root:

```bash
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

These variables are read in `src/lib/supabaseClient.js`.

## Install And Run

```bash
npm install
npm run dev
```

Vite usually serves the app at `http://localhost:5173`.

## Available Scripts

- `npm run dev`: start the Vite development server.
- `npm run build`: create a production build in `dist/`.
- `npm run preview`: preview the production build locally.
- `npm run lint`: run ESLint over the project.
- `npm run test`: run the Vitest test suite.

## Important Local Notes

- The app uses browser APIs such as `crypto`, keyboard events, `navigator.share`, and canvas/image conversion via `html-to-image`.
- Supabase OAuth redirect URLs must include the local callback URL, usually `http://localhost:5173/auth/callback`.
- Daily puzzle dates are computed in the browser with `new Date().toISOString().split('T')[0]`, so they are UTC-date based in the app code.
- The login page displays an IST reset countdown for the daily puzzle, currently calculated client-side.
