# Frontend Routes

Routes are defined in `src/App.jsx`.

## Public Routes

| Path | Component | Purpose |
| --- | --- | --- |
| `/login` | `Login` | Email/password sign in or sign up, Google OAuth, how-to-play modal, daily leaderboard preview, demo entry. |
| `/demo-game` | `DemoGame` | Public static cryptogram puzzle that does not persist progress. |
| `/auth/callback` | `AuthCallback` | Completes OAuth session lookup and redirects to the dashboard or login. |

## Protected Routes

Protected routes are wrapped in `ProtectedRoute` and `AppLayout`.

| Path | Component | Purpose |
| --- | --- | --- |
| `/` | `GameList` | Dashboard with in-progress friend games, daily puzzle card, invite notification, and single-player panel. |
| `/daily` | `DailyPuzzle` | Daily puzzle flow with start countdown, attempt limit, timer, and completion tracking. |
| `/:gameId` | `Game` | Loads a persisted game/session and renders `GameEngine`. |
| `/new-game` | `NewGame` | Creates a friend challenge for an accepted relationship. |
| `/archive` | `Archive` | Shows solved games involving the current user. |
| `/invite` | `Invite` | Shows pending relationship invites and allows accept/reject. |
| `/send-invite` | `SendInvite` | Checks users by email and sends relationship invites. |
| `/curated-packs` | `CuratedPacks` | Browses grouped prompt packs and preloads a prompt into `/new-game`. |

## Route Protection

`src/router/ProtectedRoute.jsx` reads `user` and `loading` from `useAuth`.

- While auth is loading, it renders a simple loading message.
- If authenticated, it renders the nested route through `<Outlet />`.
- If unauthenticated, it redirects to `/login`.

## Shared Layout

`src/layouts/AppLayout.jsx` renders:

- `Navbar`
- Current child route through `<Outlet />`
