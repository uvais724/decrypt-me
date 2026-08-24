# Gameplay Domain

## Cryptogram Model

A puzzle message is normalized to uppercase and split into characters. Alphabetic characters are playable cells; punctuation and spaces remain as non-playable characters.

Each distinct letter in the message receives a cipher number. The board displays the cipher number and lets the player fill in the matching original letter.

## Difficulty

`setDifficultyLevel(promptText)` counts alphabetic characters:

| Letter Count | Difficulty |
| --- | --- |
| Less than 50 | `easy` |
| 50 through 100 | `medium` |
| More than 100 | `hard` |

Initial revealed-cell counts by difficulty are defined in `CryptogramSessionFactory.js`:

| Difficulty | Initial Revealed Count |
| --- | --- |
| `easy` | 3 |
| `medium` | 5 |
| `hard` | 8 |

Daily and single-player sessions currently use 3 initial revealed cells.

## Session Shape

`CryptogramSession` serializes to a `game_sessions` row with:

- `message`
- `cryptogram_map`
- `revealed_indices`
- `initial_revealed`
- `guesses`
- `active_index`
- `lives`
- `hints_used`
- Additional fields such as `game_id` and `user_id`

## Guessing Rules

`useCryptogramGame` applies the runtime rules:

- Correct guess: records the guessed letter at the selected index, reveals the index, and moves focus to the next hidden letter.
- Wrong guess: subtracts one life down to a minimum of 0 and briefly marks the cell as an error.
- Completion: when revealed indices equal the total number of alphabetic characters, the game is complete.
- Keyboard input: browser keypresses are converted to uppercase letters and ignored if invalid or disabled.

## Hints

The game allows up to 3 hints per session. A hint chooses one random unrevealed alphabetic cell, reveals it, records the correct letter, increments `hints_used`, and moves focus to the next hidden cell.

## Algorithms

`src/lib/cryptogramDsa.js` contains the core algorithms:

- `cryptoRandomInt`: unbiased random integer generation using `crypto.getRandomValues` when available.
- `FenwickTree`: order-statistic data structure used for random rank selection.
- `orderStatisticShuffle`: unbiased shuffle based on a Fenwick tree.
- `selectRandomUnrevealedIndex`: picks a random hidden letter position.
- `HopcroftKarpMatcher`: maximum bipartite matching implementation.
- `buildDerangedCryptogramMap`: maps letters to numbers while avoiding natural A=1, B=2, etc. mappings whenever possible.
- `pickSpreadRandomIndices`: chooses initial revealed letter positions.
- `CircularSuccessorIndex`: finds the first or next unrevealed letter position, wrapping when needed.

## Modes

### Friend Challenge

Backed by persisted `games`, `prompts`, and `game_sessions` rows. Progress is saved when `GameEngine` unmounts.

### Demo

Uses a hardcoded prompt and mock session in `DemoGame`. It does not persist state.

### Daily Puzzle

Uses a generated in-memory session for the current `daily_puzzles` row. It persists daily outcome records in `daily_puzzle_attempts`.

### Single Player

Uses the user's current level to create or find a persisted game/session. On completion, the user's current level advances and the temporary game is deleted.
