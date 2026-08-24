# Testing

## Test Stack

The project uses Vitest. Configuration lives in `vite.config.js`:

```js
test: {
  environment: 'node',
  setupFiles: ['./src/test/setup.js'],
}
```

## Run Tests

```bash
npm run test
```

## Existing Test Areas

The repository includes tests for:

- Components: `src/components/components.test.jsx`
- Layout: `src/layouts/AppLayout.test.jsx`
- Pages: `src/pages/pages.test.jsx`
- Protected routing: `src/router/ProtectedRoute.test.jsx`
- Auth context: `src/context/AuthContext.test.jsx`
- Game refresh context: `src/context/GameRefreshContext.test.jsx`
- Game services: `src/services/GameServices.test.js`
- Supabase repositories: `src/repositories/SupabaseRepositories.test.js`
- Domain logic: `src/domain/CryptogramGame.test.js`
- Session factory: `src/domain/CryptogramSessionFactory.test.js`
- Gameplay hook: `src/hooks/useCryptogramGame.test.jsx`
- Helpers and algorithms: `src/helper/helper.test.js`, `src/lib/cryptogramDsa.test.js`, `src/lib/pairScore.test.js`
- Token hashing utility: `src/utils/hashToken.test.js`

## What To Test When Changing Features

- Game rules: update domain and hook tests.
- Supabase query behavior: update repository or service tests with mocked clients.
- Route/page behavior: update page tests.
- Auth changes: update auth context and protected route tests.
- Daily puzzle behavior: cover attempt limits, solve records, and loss records.
- Single-player behavior: cover current-level lookup, session reuse, level increment, and cleanup.

## Manual Smoke Test Checklist

After larger changes, manually verify:

- `/login` renders and can start the demo.
- Email/password auth succeeds or gives useful errors.
- Google OAuth returns to `/auth/callback`.
- Dashboard loads active games, daily puzzle card, invites, and single-player progress.
- Creating a friend game persists a playable session.
- Correct/wrong guesses update board state and lives.
- Hints stop after 3 uses.
- Leaving and returning to a friend game restores progress.
- Solving a friend game marks it solved and moves it to archive.
- Give-up removes the session and marks the game `GAVE_UP`.
- Daily puzzle records attempts and locks after solve or 3 attempts.
- Curated pack pick preloads `/new-game`.
