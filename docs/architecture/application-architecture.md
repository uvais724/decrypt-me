# Application Architecture

## Entry Point

`src/main.jsx` mounts the React app in strict mode and enables Vercel Analytics:

- Imports global styles from `src/index.css`.
- Renders `<Analytics />`.
- Renders `<App />`.

## App Composition

`src/App.jsx` creates the main provider and route tree:

- `BrowserRouter` handles client-side routing.
- `AuthProvider` exposes Supabase auth state and auth actions.
- `GameRefreshProvider` exposes a refresh trigger for dashboards after game-state changes.
- `ProtectedRoute` blocks private routes for unauthenticated users.
- `AppLayout` renders the shared navbar around protected pages.

## Main Layers

### Pages

Files under `src/pages/` represent route-level screens. They load page-specific data, manage route state, and compose components.

### Components

Files under `src/components/` provide reusable UI and gameplay surfaces such as the board, keyboard, modal, lives display, navbar, leaderboard, and single-player panel.

### Domain

Files under `src/domain/` contain cryptogram-specific construction and board logic:

- `CryptogramGame.js`
- `CryptogramSessionFactory.js`

### Hooks

`src/hooks/useCryptogramGame.js` owns interactive game state during a puzzle: guesses, lives, hints, revealed indices, active cell, keyboard handling, and completion detection.

### Repositories

`src/repositories/SupabaseRepositories.js` wraps Supabase table/RPC calls behind intention-revealing methods.

### Services

`src/services/GameServices.js` coordinates multi-step workflows such as creating a friend challenge, loading daily puzzles, completing games, giving up, and starting single-player sessions.

### Utilities And Algorithms

- `src/helper/helper.js` exposes public helper APIs used by the app.
- `src/lib/cryptogramDsa.js` implements the algorithmic core: Fenwick tree shuffle, random unrevealed-cell selection, Hopcroft-Karp deranged cipher matching, and circular successor lookup.
- `src/lib/pairScore.js` handles pair-score lookup and RPC incrementing.
- `src/utils/hashToken.js` hashes tokens with SHA-256. It is currently not wired into the main flow.

## Data Flow Example: Friend Game Creation

1. User opens `/new-game`.
2. `NewGame` loads accepted relationships through `RelationshipRepository.findAcceptedForUser`.
3. User selects a receiver and enters a prompt.
4. `GameCreationService.createFriendGame` validates active game count.
5. `CryptogramSessionFactory.createFromPrompt` creates the cryptogram map, initial revealed indices, guesses, active index, lives, and hint count.
6. `GameRepository.createNewGameViaRpc` calls Supabase RPC `create_new_game`.
7. `incrementPairScoreWithPrevious` calls RPC `increment_pair_score`.
8. UI shows score increment when available, then navigates back to the dashboard.

## Data Flow Example: Game Play

1. `Game` loads the game row and session row by `gameId`.
2. `GameEngine` initializes `useCryptogramGame` from the persisted session.
3. Correct guesses add a revealed index and move focus to the next hidden letter.
4. Wrong guesses reduce lives.
5. Hints reveal a random hidden letter up to 3 hints.
6. On unmount, non-demo and non-daily games persist progress through `GameSessionRepository.updateProgress`.
7. On completion, `Modal` calls `GameCompletionService.markSolved`.
8. Closing a won game deletes the finished session and navigates home.
