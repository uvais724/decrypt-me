# Trade-offs And Reflection

## What Worked Well

The codebase separates gameplay rules from persistence and page rendering. `CryptogramGame` and `CryptogramSessionFactory` keep most cryptogram setup and board behavior outside React components, while `GameServices.js` coordinates multi-step workflows. This makes the app easier to test because domain, services, repositories, hooks, and components each have focused tests.

The repository layer is also a useful boundary. Pages and services call methods such as `markSolved`, `updateProgress`, and `findAcceptedForUser` instead of repeating Supabase query details everywhere. That improves readability and makes mocked tests simpler.

The algorithm work is stronger than a naive implementation. The project avoids `Array.sort(Math.random())`, uses unbiased integer selection when Web Crypto is available, and models cipher generation as a matching problem to avoid easy `A=1`, `B=2` style giveaways.

## Trade-offs

### Frontend-only Application Logic

Most workflow logic lives in the React app. This keeps the project simple to deploy on Vercel and lets services be tested locally without maintaining a separate backend. The trade-off is that Supabase RLS and RPCs must enforce security and atomicity, because browser code cannot be trusted as an authority.

### Supabase RPC For Friend Game Creation

Friend game creation uses `create_new_game` instead of separate client-side inserts. That is a good choice because prompt, game, and session creation should succeed atomically. The trade-off is that part of the business behavior lives outside the JavaScript repository, so the SQL function must be documented and versioned carefully.

### Direct Supabase Calls Still Exist In Pages

The repository pattern covers core game workflows, but some pages still query Supabase directly for dashboard data, invites, archive rows, curated packs, and leaderboard data. This can be pragmatic for page-specific reads, but it weakens consistency. Moving those queries behind repositories would make the API surface clearer and reduce duplicated error/loading behavior.

### UTC Daily Puzzle Date

`DailyPuzzleService` uses `new Date().toISOString().split('T')[0]`, which means daily puzzle lookup follows UTC. The UI documentation mentions a 10:00 AM IST reset expectation. This is a product decision that should be resolved explicitly because UTC rollover and IST rollover do not happen at the same local time.

### Algorithmic Sophistication

Fenwick trees, Hopcroft-Karp matching, and successor sets are more complex than a small puzzle app strictly requires. The benefit is fair random behavior and good DSA demonstration value. The cost is maintenance complexity: future contributors need docs and tests to understand why these structures exist.

## Reflection

This project is strongest when it treats the cryptogram engine as a small domain model instead of scattering game rules through UI code. The current structure supports that direction, and the test suite already backs many of the risky behaviors.

The next improvement would be to make backend boundaries more formal. The SQL schema is documented, but RPC definitions and RLS policies are not stored in this repo. Adding migration files or checked-in Supabase function definitions would make local development, review, and deployment safer.

A second improvement would be to standardize date handling. Daily puzzle behavior should pick one reset rule, likely a configured product timezone, then use it everywhere: puzzle lookup, attempt records, leaderboard display, and UI copy.

Finally, the app would benefit from finishing the repository abstraction. The core service/repository split is good, and extending it to page-specific reads would make the codebase easier to reason about as features grow.

## Future Improvements

- Check in Supabase migrations, RPC definitions, and RLS policies.
- Move remaining direct page queries into repository modules.
- Centralize daily puzzle date calculation behind a named utility.
- Add runtime validation for Supabase result shapes before domain code consumes them.
- Consider storing game session state changes more frequently than unmount for better resilience on browser crashes.
- Add explicit error states for missing daily puzzle rows and missing single-player progress rows.
