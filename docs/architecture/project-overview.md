# Project Overview

Decrypt Me is a browser-based cryptogram puzzle app. A cryptogram message is converted into numbered cipher cells; players reveal the original message by choosing letters. The app supports public demo play, authenticated friend challenges, daily puzzles, single-player progression, relationship invites, curated prompt packs, and solved-game archives.

## Primary Features

- Supabase email/password authentication.
- Google OAuth authentication with callback handling.
- Protected app routes for authenticated users.
- Public demo puzzle at `/demo-game`.
- Friend challenge creation with accepted relationships.
- Maximum of 5 in-progress games from one sender to one receiver.
- Daily puzzle with 3 attempts per day and best-time tracking.
- Daily leaderboard data via Supabase RPC.
- Single-player levels backed by `single_player_levels` and `single_player_progress`.
- In-game hints, lives, keyboard input, progress persistence, give-up flow, and reset-after-loss flow.
- Curated prompt packs that prefill the new-game prompt form.
- Solved games archive rendered with AG Grid.
- Shareable win image generated with `html-to-image`.

## Tech Stack

- React 19
- Vite 7
- React Router 7
- Tailwind CSS 4 with DaisyUI
- Supabase Auth and Postgres
- Supabase JavaScript client
- AG Grid Community
- Vercel Analytics
- Vitest
- ESLint

## High-Level Runtime Model

The frontend is a single-page app. `src/main.jsx` renders `App`, which provides auth state, game-list refresh state, and route definitions. Most backend calls use the singleton Supabase client from `src/lib/supabaseClient.js`.

Cryptogram behavior is split into:

- Domain classes in `src/domain/`.
- Algorithms and helpers in `src/lib/cryptogramDsa.js` and `src/helper/helper.js`.
- Stateful React gameplay hook in `src/hooks/useCryptogramGame.js`.
- Supabase repositories in `src/repositories/SupabaseRepositories.js`.
- Workflow services in `src/services/GameServices.js`.

This split keeps game mechanics mostly independent from React components and Supabase table details.
