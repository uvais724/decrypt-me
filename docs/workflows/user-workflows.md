# User Workflows

## Authentication

1. User opens `/login`.
2. User signs in with email/password or Google.
3. `AuthProvider` stores Supabase session/user state.
4. Protected routes become available.
5. Logout calls `supabase.auth.signOut()` and clears local auth state.

## Demo Puzzle

1. User selects "Try a Puzzle First" on `/login`.
2. App navigates to `/demo-game`.
3. `DemoGame` passes a hardcoded message and mock session to `GameEngine`.
4. Progress is never saved because `isDemo` is true.
5. Closing the modal returns the user to `/login`.

## Relationship Invite

1. User opens `/send-invite`.
2. User enters an email and clicks check.
3. App looks up `public.users.email`.
4. App rejects self-invites, existing accepted relationships, and duplicate pending invites.
5. App inserts a `relationship_invites` row with `PENDING` status.

## Accept Or Reject Invite

1. Invitee opens `/invite`.
2. App fetches pending invites addressed to the current user.
3. Accept:
   - Reads the invite.
   - Inserts an `ACCEPTED` `user_relationships` row.
   - Deletes the invite row.
4. Reject:
   - Updates invite status to `REJECTED`.
   - Deletes the invite row.
5. UI removes the processed invite from local state.

## Create Friend Game

1. User opens `/new-game`.
2. App loads accepted related users.
3. User selects a receiver and enters a prompt.
4. Prompt must contain at least 10 alphabetic characters.
5. Service checks for fewer than 5 in-progress games from sender to receiver.
6. Session factory builds initial puzzle state.
7. Supabase RPC `create_new_game` persists prompt, game, and session.
8. RPC `increment_pair_score` increments the pair score.
9. User returns to dashboard.

## Play Friend Game

1. User opens a game from `/`.
2. `Game` loads the in-progress `games` row and `game_sessions` row.
3. `GameEngine` renders the board, lives, hint button, give-up button, and keyboard.
4. Progress is persisted when leaving the page.
5. On solve, `Modal` marks the game `SOLVED` and increments pair score.
6. Closing a won game deletes the session and refreshes the dashboard.
7. On give-up, the session is deleted and the game is marked `GAVE_UP`.

## Game Over And Retry

1. When lives reach 0, `Modal` shows "Game Over!".
2. For friend games, "Try Again" resets the persisted session to `initial_revealed`, lives 3, hints 0, and a fresh active index.
3. Daily puzzle losses consume one daily attempt instead of resetting persisted game state.

## Daily Puzzle

1. Dashboard loads the current date's puzzle and the user's attempt row.
2. `/daily` loads the puzzle through `DailyPuzzleService.loadToday`.
3. If solved or attempts are exhausted, the game is blocked.
4. Otherwise, user sees a start overlay and countdown.
5. `GameEngine` tracks elapsed time.
6. A loss increments `attempts_used`.
7. A solve increments `attempts_used`, records `best_time_seconds`, and marks `solved`.
8. Completed users cannot replay until the next available puzzle date.

## Single Player

1. Dashboard `SinglePlayer` component loads `single_player_progress` with the current level's prompt.
2. User clicks "Start Level".
3. Service tries to find an existing session with the same message and user.
4. If none exists, it creates a game and session.
5. On solve, `GameCompletionService` increments `single_player_progress.current_level`.
6. Closing the modal deletes the temporary single-player game.

## Curated Packs

1. User opens `/curated-packs`.
2. App fetches all `curated_packs`.
3. UI groups packs by category.
4. User picks a message.
5. App navigates to `/new-game` with that message in route state.

## Archive

1. User opens `/archive`.
2. App fetches solved games where the user is sender or receiver.
3. AG Grid displays sender, receiver, message, and start time.
4. Clicking a message opens a modal with full text.
