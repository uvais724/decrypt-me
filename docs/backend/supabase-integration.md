# Supabase Integration

## Client Setup

The Supabase client is created in `src/lib/supabaseClient.js`:

```js
export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);
```

All browser access uses the public anon key, so Row Level Security policies must protect user-specific data in Supabase.

## Authentication

`AuthProvider` in `src/context/AuthContext.jsx`:

- Calls `supabase.auth.getSession()` on mount.
- Subscribes to `supabase.auth.onAuthStateChange`.
- Exposes `user`, `session`, `loading`, `login`, `loginWithMagicLink`, and `logout`.

Email/password behavior:

- `login({ email, password })` first attempts `signInWithPassword`.
- If sign-in fails, it attempts `signUp`.
- After sign-up, it attempts `signInWithPassword` again.
- If Supabase requires email confirmation, the login page shows a confirmation message.

Google OAuth behavior:

- `Login` calls `supabase.auth.signInWithOAuth({ provider: 'google' })`.
- Redirect target is `${window.location.origin}/auth/callback`.
- `AuthCallback` reads the session and redirects to `/` or `/login`.

## Repository Layer

`src/repositories/SupabaseRepositories.js` provides classes for database operations:

- `GameRepository`
- `GameSessionRepository`
- `DailyPuzzleRepository`
- `RelationshipRepository`
- `SinglePlayerRepository`

The exported `repositories` object is the default singleton dependency used by pages and services.

## Services

`src/services/GameServices.js` coordinates repository calls and domain logic:

- `GameCreationService`: creates friend challenges and increments pair scores.
- `SinglePlayerGameService`: creates or finds the current level game.
- `DailyPuzzleService`: loads daily puzzle state and records daily attempts/completion.
- `GameCompletionService`: marks friend games solved, advances single-player progress, closes finished games, and handles give-up.

## Required RPCs

The frontend calls these Supabase RPC functions:

### `create_new_game`

Called by `GameRepository.createNewGameViaRpc`.

Expected payload:

- `p_sender_id`
- `p_receiver_id`
- `p_prompt_text`
- `p_difficulty_level`
- `p_cryptogram_map`
- `p_revealed_indices`
- `p_initial_revealed`
- `p_guesses`
- `p_active_index`

Expected behavior:

- Create a prompt.
- Create a game linked to that prompt.
- Create an initial game session for the receiver.
- Return the new `game_id`.

This RPC is important because friend game creation needs several related inserts to succeed atomically.

### `increment_pair_score`

Called by `incrementPairScoreWithPrevious`.

Expected arguments:

- `uid1`
- `uid2`
- `inc`

Expected behavior:

- Find or create a `user_pair_scores` row for the unordered pair.
- Increment `current_score`.
- Maintain `highest_score` and `last_activity_at` as needed.

### `get_daily_puzzle_leaderboard`

Called from `Login` and likely `Leaderboard`.

Known argument:

- `limit_count`

Expected behavior:

- Return leaderboard rows with at least `puzzle_date`, `username`, and `best_time_seconds`.

## Direct Table Access By Area

### Dashboard

`GameList` directly queries:

- `games`
- joined `prompts`
- joined sender `users`
- related `game_sessions`
- `relationship_invites`
- `daily_puzzles`
- `daily_puzzle_attempts`

### Invites

`Invite` and `SendInvite` directly query:

- `relationship_invites`
- `user_relationships`
- `users`

### Archive

`Archive` directly queries solved `games` joined to `prompts` and sender/receiver users.

### Curated Packs

`CuratedPacks` directly queries `curated_packs`.

## RLS Guidance

The repo does not include Supabase RLS policies, but production should enforce at least:

- Users can read their own profile and profiles necessary for invites/relationships.
- Users can only read relationship invites where they are inviter or invitee.
- Users can only create invites as themselves.
- Users can only accept/reject invites addressed to themselves.
- Users can only read games where they are sender or receiver.
- Users can only update sessions where `game_sessions.user_id = auth.uid()`.
- Users can only update their own `daily_puzzle_attempts`.
- Public or authenticated read access for `daily_puzzles`, `curated_packs`, and single-player level metadata, depending on product needs.

## Backend Consistency Notes

- Daily puzzle date matching uses the browser's UTC date string.
- The login UI says the daily reset is 10:00 AM IST, so backend puzzle creation should align with that product expectation or the frontend date logic should be updated.
- Friend challenges rely on sender and receiver having accepted relationship rows.
- Single-player mode assumes a progress row already exists for the user.
