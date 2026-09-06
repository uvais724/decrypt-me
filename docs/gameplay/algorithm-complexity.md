# Algorithm Complexity

This page documents the asymptotic behavior of the algorithms used by the cryptogram domain. Let:

- `n` be the message length in characters.
- `m` be the number of alphabetic cells in the message.
- `u` be the number of distinct letters in the message, at most 26.
- `r` be the number of revealed indices.
- `k` be the number of requested initial reveals.

## Summary Table

| Function/Class | Purpose | Time Complexity | Space Complexity | Notes |
| --- | --- | --- | --- | --- |
| `cryptoRandomInt(min, max)` | Produce an integer in `[min, max)` | Expected `O(1)` | `O(1)` | Uses rejection sampling with `crypto.getRandomValues` when available. |
| `FenwickTree.add(index, delta)` | Update a rank-count tree | `O(log n)` | `O(1)` additional | Tree storage is allocated by the constructor. |
| `FenwickTree.lowerBound(target)` | Find the index for an order statistic | `O(log n)` | `O(1)` | Used for uniform rank selection. |
| `orderStatisticShuffle(array)` | Shuffle without random-sort bias | `O(n log n)` | `O(n)` | Builds a Fenwick tree of live positions and removes one random rank at a time. |
| `selectRandomUnrevealedIndex(chars, revealedIndices)` | Pick a hidden alphabetic cell for a hint | `O(n + r + log n)` | `O(n + r)` | Builds a revealed set and live Fenwick tree each call. |
| `buildDerangedCryptogramMap(letters, numbers)` | Assign cipher numbers while avoiding natural mappings | `O(E sqrt(V))` | `O(V + E)` | Hopcroft-Karp on a small graph. In practice `V <= 52` and `E <= 650`. |
| `pickSpreadRandomIndices(chars, count)` | Pick initial revealed cells | `O(n + m log m)` | `O(m)` | Filters letter positions, shuffles them, then claims ranks with a disjoint successor set. |
| `CircularSuccessorIndex.first()` | Find first hidden letter | Amortized near `O(alpha(m))` | `O(1)` additional | Uses path compression in the successor set. |
| `CircularSuccessorIndex.nextAfter(index)` | Find next hidden letter, wrapping | `O(log m + alpha(m))` | `O(1)` additional | Binary search finds insertion rank, successor set skips revealed ranks. |
| `CryptogramGame.buildBoard(...)` | Build renderable cells | `O(n)` | `O(n)` | One cell object per message character. |
| `CryptogramGame.getLetterToIndices()` | Group message indices by original letter | `O(n)` | `O(m)` | Only alphabetic cells are recorded. |
| `CryptogramGame.getDisabledKeys(...)` | Find fully revealed letters | `O(u + m)` | `O(u + r)` | Converts revealed indices to a set before checking groups. |
| `CryptogramGame.getPartiallyRevealedKeys(...)` | Find partially revealed letters | `O(u + m)` | `O(u + r)` | Same grouping cost as disabled-key detection. |

## Algorithm Notes

### Deranged Cipher Map

`generateCryptogramMap` collects unique message letters, shuffles numbers 1 through 26, then calls `buildDerangedCryptogramMap`. The map builder treats letters as left-side graph nodes and numbers as right-side graph nodes. It omits the natural edge for each letter, such as `A -> 1`, then runs Hopcroft-Karp to find a maximum matching.

The theoretical matching cost is higher than a simple shuffle, but the graph is capped by the English alphabet. That makes the real runtime effectively constant for application use while improving puzzle quality by avoiding obvious self-mappings where possible.

### Initial Reveal Selection

`pickSpreadRandomIndices` starts with alphabetic positions only. It shuffles those positions using `orderStatisticShuffle`, then records up to `k` selected positions. The disjoint successor set is prepared for rank claiming, although the shuffled source positions are already unique. The current implementation therefore prioritizes uniform random selection and sorted output over strict visual spacing.

### Hint Selection

`selectRandomUnrevealedIndex` rebuilds its Fenwick tree per hint request. That is simple and reliable for short cryptogram messages. A persistent hidden-cell index could reduce repeated hint cost, but it would add synchronization risk with React state for little user-visible benefit.

### Active Cell Movement

`CircularSuccessorIndex` preprocesses alphabetic positions and removes revealed ranks. `nextAfter` then uses binary search plus a successor lookup to avoid repeatedly scanning the board after every correct guess or hint.

## Practical Performance

Cryptogram messages are small compared with the bounds where these structures matter. The biggest user-facing costs are React renders and Supabase round trips, not the local algorithms. The data structures are still useful because they make randomness unbiased and keep behavior predictable as prompt length grows.
