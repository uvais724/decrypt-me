# Decrypt Me

Decrypt Me is a React + Vite cryptogram game where users decode hidden messages, challenge friends, and play daily puzzles.

## Features

- Email/password and Google OAuth login via Supabase Auth
- Demo puzzle mode for first-time users (`/demo-game`)
- Send custom cryptogram challenges to connected users
- Invite/accept relationship flow before sending games
- Daily puzzle mode with up to 3 attempts and time tracking
- Curated message packs for quick game creation
- Solved games archive view
- In-game hints, lives, progress persistence, and give-up flow

## Tech Stack

- React 19
- Vite 7
- Tailwind CSS 4 + DaisyUI
- Supabase (Auth + Postgres + RPC)
- React Router 7
- AG Grid (archive table)
- Vercel Analytics

## Prerequisites

- Node.js 20+ (recommended)
- npm
- A Supabase project configured with the required schema/RPCs

## Environment Variables

Create a `.env` file in the project root:

```bash
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Local Development

```bash
npm install
npm run dev
```

App runs on the Vite dev server (default: `http://localhost:5173`).

## Available Scripts

- `npm run dev`: start development server
- `npm run build`: create production build
- `npm run preview`: preview production build locally
- `npm run lint`: run ESLint

## App Routes

- `/login`: login/signup page
- `/demo-game`: public demo puzzle
- `/auth/callback`: OAuth callback
- `/`: active games dashboard (protected)
- `/daily`: daily puzzle (protected)
- `/:gameId`: play a game session (protected)
- `/new-game`: create a new game (protected)
- `/archive`: solved games history (protected)
- `/invite`: pending invites (protected)
- `/send-invite`: send relationship invite (protected)
- `/curated-packs`: browse curated messages (protected)

## Backend Expectations (Supabase)

This frontend expects Supabase tables/RPCs used by the app logic, including:

- Tables: `users`, `games`, `prompts`, `game_sessions`, `relationship_invites`, `user_relationships`, `daily_puzzles`, `daily_puzzle_attempts`, `curated_packs`, `single_player_progress`, `single_player_levels`, `user_pair_scores`
- RPC functions: `create_new_game`, `increment_pair_score`, `get_daily_puzzle_leaderboard`

## Deployment

The project includes `vercel.json` and is ready to deploy on Vercel after setting required environment variables.
