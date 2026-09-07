# How the Cryptogram Game's Algorithms Work

This file explains the data structures and algorithms behind a **cryptogram puzzle game** (think: letters are swapped with numbers, and the player has to guess which letter each number represents). Every clever structure here exists to answer one of these questions *fast*:

1. How do we shuffle things fairly?
2. How do we pick a random hidden letter to reveal?
3. How do we build a number-cipher that never maps a letter to its "obvious" number (A→1, B→2...)?
4. How do we jump to the "next hidden letter" quickly as the player fills in the puzzle?

---

## 1. `cryptoRandomInt(min, max)` — Fair, unbiased random numbers

**Problem it solves:** `Math.random()` is fine for games, but it's not cryptographically strong, and naive tricks like `Math.floor(Math.random() * range)` can be *biased* when you additionally use `crypto`-based ints modulo a range.

**How it works:**
- If the browser doesn't support `crypto.getRandomValues`, fall back to plain `Math.random()`.
- Otherwise, use **rejection sampling**: it computes the largest multiple of `range` that fits below `2^32` (`limit`), and keeps drawing random 32-bit numbers until it gets one below that limit. Any number ≥ `limit` is thrown away.
- Only after landing inside the "clean" zone does it take `value % range` and shift by `min`.

**Why the rejection step matters:** if you skipped it and just did `randomUint32 % range`, numbers in the low part of the 32-bit space would come up slightly more often than others (because `2^32` isn't usually an exact multiple of `range`). Rejection sampling guarantees every outcome in `[min, max)` is equally likely.

---

## 2. `FenwickTree` (a.k.a. Binary Indexed Tree) — the workhorse structure

A **Fenwick Tree** is used twice in this file for the same underlying trick: *"keep a live count of items, and let me quickly ask: which item is the K-th remaining one?"*

Think of it as an array where you can:
- **`add(index, delta)`** — mark a position as "alive" (`+1`) or "removed" (`-1`) in `O(log n)`.
- **`lowerBound(target)`** — find the smallest index whose *cumulative sum so far* reaches `target`, also in `O(log n)`. This is effectively "give me the position of the `target`-th alive item."

### Why not just use an array and splice it?
Removing an item from a plain array and re-scanning for the "Nth remaining item" is `O(n)` per operation. If you do this `n` times (like in a shuffle), that's `O(n²)` total. The Fenwick tree turns each pick into `O(log n)`, so shuffling `n` items becomes `O(n log n)`.

### Visualizing `lowerBound`
It works like binary search, but jumping over power-of-two chunks of the tree instead of comparing single elements — it starts at the largest power of two ≤ size and halves the jump each step, only committing to a jump if the chunk's stored sum doesn't overshoot the `target`. This is the standard Fenwick-tree "find by prefix sum" trick.

---

## 3. `orderStatisticShuffle(array)` — Unbiased shuffling via the Fenwick tree

**Goal:** Shuffle an array so every permutation is equally likely (avoiding the classic bug of sorting an array by `Math.random() - 0.5`, which is statistically biased).

**How it works, step by step:**
1. Mark every index as "alive" in a Fenwick tree (`live.add(i, 1)` for all `i`).
2. Loop `remaining` from `array.length` down to `1`:
   - Pick a random rank between `1` and `remaining` using `cryptoRandomInt`.
   - Ask the Fenwick tree: "which alive index is the `rank`-th one?" (`live.lowerBound(rank)`).
   - Push that item into the result.
   - Mark that index as "dead" (`live.add(index, -1)`) so it's never picked again.
3. Replace the original array's contents with the shuffled result.

This is exactly the logic of the **Fisher–Yates shuffle**, except instead of physically swapping elements in an array (which is simple but requires mutable positional swapping), it treats "still available" items as a shrinking pool inside a Fenwick tree. The benefit: uniformly random order, achieved in `O(n log n)`.

---

## 4. `selectRandomUnrevealedIndex(chars, revealedIndices)` — Picking a hint

**Goal:** When the player asks for a hint, pick one of the still-hidden **letter** cells (numbers/punctuation don't count) uniformly at random.

**How it works:**
1. Walk through `chars`. For every character that's a capital letter (`ALPHABET_REGEX`) *and* not already revealed, mark it alive in a Fenwick tree and bump a `total` counter.
2. If nothing is left to reveal, return `-1`.
3. Otherwise, pick a random rank from `1..total` and ask the Fenwick tree which index that corresponds to.

This is the same "alive items + random rank" trick as the shuffle, just used once instead of repeatedly — so a single hint pick is `O(n)` to build the tree and `O(log n)` to query.

---

## 5. Building the cipher with `HopcroftKarpMatcher` + `buildDerangedCryptogramMap`

**Goal:** Assign each letter (A, B, C...) a unique number, such that **no letter maps to its natural position** (A must not map to 1, B must not map to 2, etc.) — this is called a *derangement*. This keeps the puzzle from accidentally giving away free answers.

### Modeling it as bipartite matching
- **Left nodes:** letters (A, B, C, ...)
- **Right nodes:** numbers (1, 2, 3, ...)
- **Edges:** a letter connects to every number *except* its natural value.

We now need a **maximum matching** — pairing as many letters to numbers as possible, using only allowed edges, with each letter and number used exactly once. If a perfect matching exists (every letter gets a number), we have a valid derangement-style cipher.

### `HopcroftKarpMatcher` — how the matching algorithm works
This implements the classic **Hopcroft–Karp algorithm**, which alternates two phases until no more improvement is possible:

1. **BFS phase (`bfs`)**: Starting from all unmatched letters, it does a layered breadth-first search across the bipartite graph, following alternating paths (unmatched edge, then matched edge, then unmatched edge...). It records how far each letter is from an unmatched starting point (`distance`) and reports whether any *free* (unmatched) number was reached.
2. **DFS phase (`dfs`)**: For each unmatched letter, try to find an *augmenting path* — a path that starts and ends unmatched but alternates matched/unmatched edges — restricted to only following the BFS layering (`distance.get(pairedLeft) === distance.get(left) + 1`). Whenever such a path is found, all the edges along it get flipped (unmatched ↔ matched), which increases the total number of matched pairs by one.
3. Repeat BFS+DFS until BFS can't find any more free numbers — at that point the matching is maximum.

**Why this algorithm specifically?** A simple one-augmenting-path-at-a-time approach (plain DFS-based matching) works but is slower (`O(V·E)`). Hopcroft–Karp finds *multiple* shortest augmenting paths per round using the BFS layering, bringing the complexity down to `O(E·√V)` — much faster for larger alphabets/number sets.

### Falling back safely
`buildDerangedCryptogramMap` checks if the matching covers *every* letter (`matching.size !== letters.length`). If some letters couldn't be matched (which would only happen with unusual/small input sets), it falls back to a naive direct assignment rather than crashing or leaving letters unmapped.

---

## 6. `DisjointSuccessorSet` — "find the next available slot" structure

This is a clever, minimal twist on **Union-Find (Disjoint Set Union)**, used to answer: *"given a slot has been taken, what's the next free slot after it?"* — in near `O(1)` amortized time.

- `find(index)` uses **path compression**: once a slot's owner is resolved, future lookups skip straight there.
- `remove(index)` "unions" a taken slot with `index + 1`, meaning: once slot `i` is used, asking `find(i)` again will now redirect to whatever's free starting at `i + 1`.

This is the same core idea used in the famous "allocate the next free number" Union-Find pattern (also seen in problems like "K Empty Slots" or offline range allocation).

---

## 7. `pickSpreadRandomIndices(chars, count)` — Choosing well-spread starting reveals

**Goal:** When a new puzzle starts, reveal `count` letters chosen *randomly* but by processing them through a fair shuffle (not just `slice`-ing the first few of an unshuffled list).

**How it works:**
1. Collect all letter positions (skip non-letters).
2. Shuffle a *copy* of those positions using `orderStatisticShuffle` (uniform, unbiased order).
3. Build a `rankByIndex` map: each letter position's rank in left-to-right (reading) order.
4. Use a `DisjointSuccessorSet` over these ranks to track which ranks are still "claimable."
5. Walk through the shuffled list; for each shuffled index, look up its reading-order rank, and if that rank is still free, claim it (add to `selected`, remove the rank from the set).
6. Stop once `targetCount` letters have been selected.
7. Sort the final selection back into reading order before returning.

Note: because each position starts owning its own unique rank and nothing is removed before this loop runs, the `DisjointSuccessorSet` here mostly acts as a safe "already selected?" check — but it reuses the same reusable structure as `CircularSuccessorIndex` below.

---

## 8. `CircularSuccessorIndex` — Jumping to the next hidden letter

**Goal:** After a player reveals a letter (correct guess or hint), instantly find the *next* hidden letter in reading order, wrapping around to the start if we hit the end — without scanning the whole puzzle each time.

**Setup:**
- Collect all letter positions and their reading-order ranks (same pattern as above).
- Use a `DisjointSuccessorSet` to track "remaining hidden" ranks, removing any that start out already revealed.

**Key operations:**
- **`first()`** — Ask the successor set: what's the first available rank starting from `0`? Translate that rank back into a character index. Used to pick the initially active cell.
- **`nextAfter(index)`** — 
  1. `upperBound(index)` runs a **binary search** to find the rank of the first letter position strictly *after* `index`.
  2. Ask the successor set for the next hidden rank starting there.
  3. If nothing is found (we've run off the end), **wrap around** by asking for the first hidden rank from `0` again.
  4. If literally nothing is hidden anymore, just return the original `index` unchanged.

This gives an efficient "circular next empty slot" cursor — the same idea that powers a lot of round-robin scheduling and calendar-slot-finding logic, but built here from a Union-Find "successor" trick plus binary search for translating between character index and puzzle rank.

---

## Big Picture: Why These Structures Are Reused

| Need | Structure Used | Complexity |
|---|---|---|
| Unbiased random integer | Rejection sampling | O(1) amortized |
| Unbiased shuffle | Fenwick Tree (order statistics) | O(n log n) |
| Pick random hidden cell | Fenwick Tree | O(n) build, O(log n) pick |
| Fair non-trivial cipher | Bipartite Matching (Hopcroft–Karp) | O(E·√V) |
| "Next free slot" lookups | Disjoint Set (Union-Find variant) | ~O(1) amortized |
| Translate char index ↔ rank | Binary search | O(log n) |

The common thread: rather than re-scanning arrays every time the game needs "a random remaining item" or "the next remaining item," each structure keeps enough precomputed bookkeeping to answer that question almost instantly, even as items get removed one by one during gameplay.