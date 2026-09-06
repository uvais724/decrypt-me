# STAR Mapping

This page maps the project work into STAR format: Situation, Task, Action, Result. It is intended for portfolio, resume, and interview discussion.

## 1. Cryptogram Gameplay Engine

| STAR Area | Mapping |
| --- | --- |
| Situation | The app needed a reusable cryptogram engine that could power demo, friend challenge, daily puzzle, and single-player modes without duplicating rules in each page. |
| Task | Build a game model for cipher maps, revealed cells, guesses, hints, lives, active-cell movement, and completion detection. |
| Action | Split domain construction into `CryptogramSessionFactory`, board behavior into `CryptogramGame`, and interactive React state into `useCryptogramGame`. Added tests across domain, hook, and helper modules. |
| Result | The same gameplay flow now supports persisted sessions, in-memory daily/demo sessions, resets after loss, hints, keyboard input, and completion handling with a consistent state shape. |

## 2. Supabase Workflow Layer

| STAR Area | Mapping |
| --- | --- |
| Situation | Game creation, completion, daily attempts, and single-player progression require several database reads/writes and RPC calls. |
| Task | Keep route components from becoming tightly coupled to Supabase table details. |
| Action | Introduced repository classes for game, session, daily puzzle, relationship, and single-player data access. Added services to coordinate friend game creation, daily puzzle state, single-player setup, and game completion cleanup. |
| Result | Core workflows are easier to test and read. Components can call intention-revealing methods instead of embedding multi-step persistence logic. |

## 3. Fair Randomness And DSA Application

| STAR Area | Mapping |
| --- | --- |
| Situation | Cryptogram generation needs random shuffling, random hints, and non-obvious cipher mappings. Naive random-sort shuffling can be biased, and natural cipher mappings make puzzles easier to guess. |
| Task | Improve algorithm quality while keeping runtime fast for browser gameplay. |
| Action | Implemented `cryptoRandomInt`, Fenwick-tree order-statistic shuffle, Fenwick-backed hidden-cell selection, Hopcroft-Karp deranged matching, and successor indexing for active-cell movement. |
| Result | The game uses unbiased random selection where possible, avoids trivial letter-to-number mappings when feasible, and keeps active-cell navigation efficient and predictable. |

## 4. Authenticated Social Challenge Flow

| STAR Area | Mapping |
| --- | --- |
| Situation | Players should be able to send puzzles to accepted connections, but the app needs to limit spam and keep sender/receiver score state updated. |
| Task | Build a friend challenge creation flow with relationship selection, active-game limits, atomic game/session creation, and pair-score updates. |
| Action | Used accepted relationships for receiver choices, enforced a five in-progress game limit per sender/receiver pair, delegated multi-row creation to `create_new_game`, and incremented pair score after creation. |
| Result | Friend challenges can be created as playable persisted sessions, while the app gives immediate feedback when a sender reaches the active-game limit. |

## 5. Daily Puzzle And Progression Modes

| STAR Area | Mapping |
| --- | --- |
| Situation | The app needed replayable product loops beyond one-off friend games. |
| Task | Add a daily timed puzzle with attempt limits and a single-player progression path. |
| Action | Built `DailyPuzzleService` for date-based puzzle loading and attempt upserts, plus `SinglePlayerGameService` for current-level session creation/reuse. `GameCompletionService` advances single-player progress on completion. |
| Result | Players can return daily for a limited-attempt puzzle and continue a level-based solo mode, both using the same cryptogram session mechanics. |

## Interview Talking Points

- I separated domain rules, React state, persistence, and workflow orchestration so each layer could be tested independently.
- I used Supabase RPCs where atomic multi-table behavior mattered, while keeping simple reads in client-side repositories.
- I improved randomness and puzzle quality with appropriate data structures instead of relying on random-sort shuffling.
- I documented complexity and trade-offs so the DSA choices are understandable to future maintainers.
- I identified a real product/engineering mismatch in daily puzzle timezone handling and documented it for follow-up.
