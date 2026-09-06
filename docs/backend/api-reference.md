# API Reference

This reference covers the main repository, service, domain, helper, and algorithm functions used by the application. Return values are promises unless noted otherwise.

## Services

### `GameCreationService`

| Function | Takes In | Returns | Errors/Notes |
| --- | --- | --- | --- |
| `createFriendGame({ senderId, receiverId, promptText })` | Sender user id, receiver user id, prompt text | `{ gameId, scoreData }` | Throws when sender already has 5 in-progress games for the receiver. Propagates repository/RPC errors. Pair-score errors are logged and do not block game creation. |

### `SinglePlayerGameService`

| Function | Takes In | Returns | Errors/Notes |
| --- | --- | --- | --- |
| `createOrFindGame(progress, userId)` | Single-player progress row with joined prompt, user id | `game_id` | Reuses an existing session with the same message/user when found. Logs lookup errors and creates a new game. Propagates insert/session errors. |

### `DailyPuzzleService`

| Function | Takes In | Returns | Errors/Notes |
| --- | --- | --- | --- |
| `loadToday(user)` | Auth user object or `null` | `{ message, attempt, session }` | Uses `new Date().toISOString().split('T')[0]`, so "today" is UTC. Returns `session: null` when solved or attempts are exhausted. |
| `recordLoss(userId, attemptsUsed)` | User id, attempts used | Supabase upsert result data | Saves today's attempt as unsolved. Propagates repository errors. |
| `recordCompletion(userId, attemptsUsed, bestTimeSeconds)` | User id, attempts used, best time in seconds | Supabase upsert result data | Saves today's attempt as solved. Propagates repository errors. |

### `GameCompletionService`

| Function | Takes In | Returns | Errors/Notes |
| --- | --- | --- | --- |
| `markSolved({ gameId, senderId, receiverId, isSinglePlayer, currentLevel, isDailyPuzzle, isDemo })` | Completion context | Pair-score data or `null` | Friend games are marked `SOLVED` and increment pair score. Single-player updates receiver progress to `currentLevel + 1`. Daily/demo completions do not write here. |
| `closeFinishedGame({ gameId, sessionId, isSinglePlayer, gameResult })` | Finish/cleanup context | `undefined` | Deletes won sessions. Also deletes the temporary game for single-player sessions. |
| `giveUp(gameId)` | Game id | `undefined` | Deletes sessions for the game, then marks the game `GAVE_UP`. Propagates repository errors. |

## Repositories

### `GameRepository`

| Function | Takes In | Returns | Errors/Notes |
| --- | --- | --- | --- |
| `findInProgressGame(gameId)` | Game id | Game row with joined prompt text | Throws Supabase error, including no-row errors from `.single()`. |
| `countInProgressFromSenderToReceiver(senderId, receiverId)` | Sender and receiver user ids | Number | Counts joined prompt/game rows with `IN_PROGRESS` status. Throws Supabase error. |
| `createSinglePlayerGame(promptId, difficulty)` | Prompt id, difficulty string | Created game row | Inserts into `games`. Throws Supabase error. |
| `createNewGameViaRpc(payload)` | RPC payload for `create_new_game` | New game id | Throws Supabase RPC error. |
| `markSolved(gameId)` | Game id | `undefined` | Sets `status = SOLVED` and `solved_at` to current ISO timestamp. |
| `markGaveUp(gameId)` | Game id | `undefined` | Sets `status = GAVE_UP`. |
| `deleteGame(gameId)` | Game id | `undefined` | Deletes the game row. |
| `findPromptId(gameId)` | Game id | `prompt_id` or `undefined` | Throws Supabase error. |

### `GameSessionRepository`

| Function | Takes In | Returns | Errors/Notes |
| --- | --- | --- | --- |
| `findByGameId(gameId)` | Game id | Game session row | Uses `.single()`, so no row is an error. |
| `findByMessageAndUser(message, userId)` | Uppercase message, user id | `{ game_id }` | Uses `.single()`. Service catches lookup errors during single-player reuse. |
| `create(record)` | Full game session record | `undefined` | Inserts into `game_sessions`. |
| `updateProgress(sessionId, userId, progress)` | Session id, optional user id, progress object | `undefined` | Updates guesses, revealed indices, hints, lives, active index, and `updated_at`. Adds `user_id` filter when provided. |
| `reset(sessionId, resetSession)` | Session id, reset session object | Updated row | Restores initial reveals and resets lives/hints/guesses. |
| `deleteBySessionId(sessionId)` | Session id | `undefined` | Deletes matching session. |
| `deleteByGameId(gameId)` | Game id | `undefined` | Deletes all sessions for a game. |

### `DailyPuzzleRepository`

| Function | Takes In | Returns | Errors/Notes |
| --- | --- | --- | --- |
| `findPuzzleByDate(puzzleDate)` | Date string, `YYYY-MM-DD` | Daily puzzle row | Uses `.single()`. Missing puzzle throws. |
| `findAttempt(userId, puzzleDate)` | User id, date string | Attempt row or `null` | Ignores Supabase errors and returns `data`. |
| `saveAttempt(record)` | Attempt record | Supabase upsert data | Upserts into `daily_puzzle_attempts`. Throws on error. |

### `RelationshipRepository`

| Function | Takes In | Returns | Errors/Notes |
| --- | --- | --- | --- |
| `findAcceptedForUser(userId)` | User id | Array of related user records | Reads accepted relationships where the user is on either side. Throws Supabase error. |

### `SinglePlayerRepository`

| Function | Takes In | Returns | Errors/Notes |
| --- | --- | --- | --- |
| `findProgress(userId)` | User id | Progress row with joined current level prompt | Uses `.single()`. Throws Supabase error. |
| `findCurrentPrompt(userId)` | User id | Current prompt/progress row or `null` | Ignores Supabase `PGRST116` no-row errors. Throws other errors. |
| `updateLevel(userId, nextLevel)` | User id, next level number | `undefined` | Updates `single_player_progress.current_level`. |

## Domain

### `CryptogramSessionFactory`

| Function | Takes In | Returns | Errors/Notes |
| --- | --- | --- | --- |
| `createFromPrompt(promptText, options = {})` | Prompt text and optional overrides | `CryptogramSession` | Uppercases/trims the message, generates map/reveals/guesses, and picks first active hidden cell. |
| `createDailySession(promptText, puzzleDate)` | Prompt text, date string | `CryptogramSession` | Uses 3 initial reveals and session id `daily-${puzzleDate}`. |
| `createResetSession(existingSession, message)` | Persisted session, message | `CryptogramSession` | Reuses the existing cryptogram map and initial reveals, resets lives and hints. |

### `CryptogramSession`

| Function | Takes In | Returns | Errors/Notes |
| --- | --- | --- | --- |
| `toDatabaseRecord(extraFields = {})` | Extra database fields | Plain object | Converts camelCase properties to database column names and merges extras. |
| `toHookState()` | Nothing | Plain object | Converts session data into the shape expected by `useCryptogramGame`. |

### `CryptogramGame`

| Function | Takes In | Returns | Errors/Notes |
| --- | --- | --- | --- |
| `getLetterToIndices()` | Nothing | Object mapping letter to indices | Alphabetic cells only. |
| `getCryptogramNumbers()` | Nothing | Object mapping letters to cipher numbers | Converts internal `Map` to plain object. |
| `getTotalLetters()` | Nothing | Number | Counts alphabetic cells. |
| `buildBoard(guesses, revealedIndices)` | Guess map, revealed index array | Array of board cell objects | Uses `CryptogramBoardBuilder`. |
| `getDisabledKeys(letterToIndices, revealedIndices)` | Letter index map, revealed index array | `Set<string>` | Letters are disabled when every occurrence is revealed. |
| `getPartiallyRevealedKeys(letterToIndices, revealedIndices)` | Letter index map, revealed index array | `Set<string>` | Letters are partial when at least one but not all occurrences are revealed. |
| `moveToNextIndex(currentIndex, revealedIndices)` | Current index, revealed index array | Number | Wraps to first hidden letter or returns current index if none exists. |
| `chooseHintIndex(revealedIndices)` | Revealed index array | Number | Returns `-1` when no hidden alphabetic cell remains. |

## Helpers And Algorithms

| Function/Class | Takes In | Returns | Errors/Notes |
| --- | --- | --- | --- |
| `initializeGuesses(cryptogramMap, revealedIndices, message)` | Cipher map, revealed indices, message | Guess object | Keys guesses by cipher number for initially revealed letters. |
| `setDifficultyLevel(promptText)` | Prompt text | `easy`, `medium`, or `hard` | Counts alphabetic characters only. |
| `generateCryptogramMap(text)` | Message text | Letter to number object | Uses shuffle plus deranged matching. |
| `shuffle(array)` | Mutable array | Same array | Mutates in place using order-statistic shuffle. |
| `pickRandomIndices(chars, count)` | Character array, count | Sorted index array | Delegates to `pickSpreadRandomIndices`. |
| `findFirstUnrevealed(chars, revealed)` | Character array, revealed index array | Number | Returns first unrevealed alphabetic index or `-1`. |
| `isMobile()` | Nothing | Boolean | Reads `navigator.userAgent`; browser-only helper. |
| `cryptoRandomInt(min, max)` | Inclusive min, exclusive max | Number | Throws if `max <= min`. |
| `orderStatisticShuffle(array)` | Mutable array | Same array | Mutates in place. |
| `selectRandomUnrevealedIndex(chars, revealedIndices)` | Character array, revealed index array | Number | Returns `-1` when no hidden letter exists. |
| `buildDerangedCryptogramMap(letters, numbers)` | Letter array, number array | Letter to number object | Falls back to positional assignment if no full deranged matching exists. |
| `pickSpreadRandomIndices(chars, count)` | Character array, count | Sorted index array | Caps count at available alphabetic cells. |
| `CircularSuccessorIndex.first()` | Nothing | Number | First hidden letter, or `-1`. |
| `CircularSuccessorIndex.nextAfter(index)` | Current index | Number | Next hidden letter after `index`, wrapping when needed. |
| `fetchPairCurrentScore(uid1, uid2)` | Two user ids | Number | Returns 0 on Supabase read errors or missing score. |
| `incrementPairScoreWithPrevious(uid1, uid2, inc = 1)` | Two user ids, increment amount | `{ previousScore, currentScore, incrementBy }` | Throws if `increment_pair_score` RPC fails. |
