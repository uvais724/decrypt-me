# Supabase Schema Reference

This guide summarizes the schema from `docs/database/schema.sql`. The SQL file is context copied from the attached schema and is not treated as executable migration code.

## Tables

### `public.users`

Application profile table linked to Supabase Auth.

| Column | Purpose |
| --- | --- |
| `user_id` | Primary key and foreign key to `auth.users(id)`. |
| `username` | Required unique display name. |
| `email` | User email used by invite lookup. |
| `avatar_url` | Optional profile image URL. |
| `created_at` | Profile creation timestamp. |

### `public.prompts`

Stores puzzle messages and sender/receiver metadata.

| Column | Purpose |
| --- | --- |
| `prompt_id` | Primary key. |
| `sender_id` | Optional FK to `public.users`; used for friend challenges. |
| `receiver_id` | Optional FK to `public.users`; used for friend challenges. |
| `prompt_text` | Original puzzle message. |
| `type` | Prompt category/type. |
| `created_at` | Creation timestamp. |

### `public.games`

Top-level game row for friend and single-player games.

| Column | Purpose |
| --- | --- |
| `game_id` | Primary key. |
| `prompt_id` | FK to `prompts`. |
| `difficulty_level` | `easy`, `medium`, or `hard` as calculated by frontend helper logic. |
| `status` | `IN_PROGRESS`, `SOLVED`, or `GAVE_UP`. |
| `started_at` | Game creation timestamp. |
| `solved_at` | Completion timestamp for solved friend games. |

### `public.game_sessions`

Persisted gameplay state.

| Column | Purpose |
| --- | --- |
| `session_id` | Primary key. |
| `game_id` | FK to `games`. |
| `user_id` | FK to `users`; the player solving this session. |
| `message` | Uppercase puzzle message used by the game engine. |
| `cryptogram_map` | JSON letter-to-number map. |
| `revealed_indices` | JSON array of revealed board indices. |
| `initial_revealed` | JSON array used to reset after a loss. |
| `guesses` | JSON object of user guesses. |
| `active_index` | Current selected board cell index. |
| `lives` | Remaining lives, constrained to `>= 0`. |
| `hints_used` | Number of hints consumed. |
| `created_at` | Session creation timestamp. |
| `updated_at` | Session update timestamp. |

### `public.relationship_invites`

Pending or historical relationship invitations.

| Column | Purpose |
| --- | --- |
| `invite_id` | Primary key. |
| `inviter_id` | FK to user sending the invite. |
| `invitee_id` | FK to user receiving the invite. |
| `relationship_type` | Relationship enum/type such as partner, friend, family, or other. |
| `status` | Defaults to `PENDING`; app also uses `REJECTED`. |
| `accepted_at` | Acceptance timestamp if retained. |
| `created_at` | Invite creation timestamp. |

### `public.user_relationships`

Accepted relationship records used to determine who can receive games.

| Column | Purpose |
| --- | --- |
| `relationship_id` | Primary key. |
| `user_id` | One side of the relationship. |
| `related_user_id` | Other side of the relationship. |
| `relationship_type` | Enum/type copied from the invite. |
| `initiated_by` | User who accepted/initiated the accepted relationship row. |
| `status` | Defaults to `PENDING`; app filters for `ACCEPTED`. |
| `created_at` | Creation timestamp. |
| `updated_at` | Update timestamp. |

### `public.single_player_levels`

Maps level numbers to prompts.

| Column | Purpose |
| --- | --- |
| `level_number` | Primary key and ordered level number. |
| `prompt_id` | FK to the prompt for that level. |

### `public.single_player_progress`

Tracks each user's current single-player level.

| Column | Purpose |
| --- | --- |
| `user_id` | Primary key and FK to `users`. |
| `current_level` | FK to `single_player_levels(level_number)`. |
| `updated_at` | Last update timestamp. |

### `public.curated_packs`

Prompt library shown by `/curated-packs`.

| Column | Purpose |
| --- | --- |
| `id` | Primary key. |
| `category` | Category heading in the UI. |
| `message` | Prompt text used to prefill new game creation. |
| `created_at` | Creation timestamp. |

### `public.daily_puzzles`

One daily puzzle per date.

| Column | Purpose |
| --- | --- |
| `puzzle_date` | Primary key date. |
| `message` | Unique puzzle message. |
| `created_at` | Creation timestamp. |

### `public.daily_puzzle_attempts`

Daily puzzle state per user and date.

| Column | Purpose |
| --- | --- |
| `user_id` | Composite primary key and FK to `users`. |
| `puzzle_date` | Composite primary key and FK to `daily_puzzles`. |
| `best_time_seconds` | Completion time recorded on solve. |
| `attempts_used` | Number of daily attempts consumed. |
| `solved` | Whether the user solved the date's puzzle. |
| `started_at` | First attempt timestamp. |
| `updated_at` | Last update timestamp. |

### `public.user_pair_scores`

Stores score/streak-style data between two users.

| Column | Purpose |
| --- | --- |
| `id` | Primary key. |
| `user_one` | First user in the pair. |
| `user_two` | Second user in the pair. |
| `current_score` | Current pair score. |
| `highest_score` | Highest score reached by the pair. |
| `last_activity_at` | Last score-changing activity. |
| `created_at` | Row creation timestamp. |
| `updated_at` | Row update timestamp. |

## Relationships

- `users.user_id` references Supabase `auth.users(id)`.
- `prompts.sender_id` and `prompts.receiver_id` reference `users.user_id`.
- `games.prompt_id` references `prompts.prompt_id`.
- `game_sessions.game_id` references `games.game_id`.
- `game_sessions.user_id` references `users.user_id`.
- `relationship_invites.inviter_id` and `invitee_id` reference `users.user_id`.
- `user_relationships.user_id`, `related_user_id`, and `initiated_by` reference `users.user_id`.
- `single_player_levels.prompt_id` references `prompts.prompt_id`.
- `single_player_progress.current_level` references `single_player_levels.level_number`.
- `daily_puzzle_attempts.puzzle_date` references `daily_puzzles.puzzle_date`.
- `daily_puzzle_attempts.user_id` references `users.user_id`.
- `user_pair_scores.user_one` and `user_two` reference users/auth users.

## Enum-Like Values Used By The App

The schema references user-defined relationship types and relationship status. The frontend currently assumes:

- Relationship types: `partner`, `friend`, `family`, `other`.
- Relationship statuses: `PENDING`, `ACCEPTED`, `REJECTED`.
- Game statuses: `IN_PROGRESS`, `SOLVED`, `GAVE_UP`.

## Required Seed Data

The app expects:

- At least one `daily_puzzles` row for the current UTC date for daily puzzle play.
- `single_player_levels` rows connected to valid `prompts`.
- `single_player_progress` rows for users who should see single-player mode.
- `curated_packs` rows for `/curated-packs` content.
- `users` profile rows corresponding to Supabase Auth users.
