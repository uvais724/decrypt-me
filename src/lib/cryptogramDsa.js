const LETTER_CODE_A = "A".charCodeAt(0);

export const ALPHABET_REGEX = /^[A-Z]$/;

export function cryptoRandomInt(min, max) {
  const range = max - min;
  if (range <= 0) {
    throw new Error("Max must be greater than min.");
  }

  const cryptoApi = globalThis.crypto;
  if (!cryptoApi?.getRandomValues) {
    return min + Math.floor(Math.random() * range);
  }

  const limit = Math.floor(0x100000000 / range) * range;
  const byteArray = new Uint32Array(1);
  let value;

  do {
    cryptoApi.getRandomValues(byteArray);
    value = byteArray[0];
  } while (value >= limit);

  return min + (value % range);
}

export class FenwickTree {
  constructor(size) {
    this.size = size;
    this.tree = Array(size + 1).fill(0);
  }

  add(index, delta) {
    for (let i = index + 1; i <= this.size; i += i & -i) {
      this.tree[i] += delta;
    }
  }

  lowerBound(target) {
    let index = 0;
    let bit = 1;

    while (bit << 1 <= this.size) {
      bit <<= 1;
    }

    for (; bit > 0; bit >>= 1) {
      const next = index + bit;
      if (next <= this.size && this.tree[next] < target) {
        index = next;
        target -= this.tree[next];
      }
    }

    return index;
  }
}

// Order-statistic shuffle:
// keep every array position as a "live" item in a Fenwick tree, choose a random
// live rank, then remove that rank in O(log n). Used by helper.shuffle and by
// initial hint selection so the game avoids Array.sort(Math.random()) bias.
export function orderStatisticShuffle(array) {
  const live = new FenwickTree(array.length);
  const shuffled = [];

  for (let i = 0; i < array.length; i++) {
    live.add(i, 1);
  }

  for (let remaining = array.length; remaining > 0; remaining--) {
    const rank = cryptoRandomInt(1, remaining + 1);
    const index = live.lowerBound(rank);
    shuffled.push(array[index]);
    live.add(index, -1);
  }

  array.splice(0, array.length, ...shuffled);
  return array;
}

// Uniformly picks one still-hidden letter cell by storing unrevealed positions
// in a Fenwick tree and selecting a random rank. Used when the player requests
// a hint inside useCryptogramGame.
export function selectRandomUnrevealedIndex(chars, revealedIndices = []) {
  const revealed = new Set(revealedIndices);
  const live = new FenwickTree(chars.length);
  let total = 0;

  chars.forEach((char, index) => {
    if (ALPHABET_REGEX.test(char) && !revealed.has(index)) {
      live.add(index, 1);
      total++;
    }
  });

  if (total === 0) {
    return -1;
  }

  return live.lowerBound(cryptoRandomInt(1, total + 1));
}

class HopcroftKarpMatcher {
  constructor(leftNodes, adjacency) {
    this.leftNodes = leftNodes;
    this.adjacency = adjacency;
    this.pairLeft = new Map();
    this.pairRight = new Map();
    this.distance = new Map();
  }

  bfs() {
    const queue = [];
    let foundFreeRight = false;

    this.leftNodes.forEach((left) => {
      if (!this.pairLeft.has(left)) {
        this.distance.set(left, 0);
        queue.push(left);
      } else {
        this.distance.set(left, Infinity);
      }
    });

    for (let head = 0; head < queue.length; head++) {
      const left = queue[head];

      for (const right of this.adjacency.get(left) || []) {
        const pairedLeft = this.pairRight.get(right);

        if (pairedLeft === undefined) {
          foundFreeRight = true;
        } else if (this.distance.get(pairedLeft) === Infinity) {
          this.distance.set(pairedLeft, this.distance.get(left) + 1);
          queue.push(pairedLeft);
        }
      }
    }

    return foundFreeRight;
  }

  dfs(left) {
    for (const right of this.adjacency.get(left) || []) {
      const pairedLeft = this.pairRight.get(right);

      if (
        pairedLeft === undefined ||
        (
          this.distance.get(pairedLeft) === this.distance.get(left) + 1 &&
          this.dfs(pairedLeft)
        )
      ) {
        this.pairLeft.set(left, right);
        this.pairRight.set(right, left);
        return true;
      }
    }

    this.distance.set(left, Infinity);
    return false;
  }

  maximumMatching() {
    while (this.bfs()) {
      this.leftNodes.forEach((left) => {
        if (!this.pairLeft.has(left)) {
          this.dfs(left);
        }
      });
    }

    return this.pairLeft;
  }
}

// Builds the letter -> number cipher as a bipartite matching problem:
// letters are left nodes, numbers are right nodes, and edges exclude the
// letter's natural A=1, B=2, ... value. Hopcroft-Karp gives a maximum matching,
// so generated cryptograms avoid trivial self-mapping whenever possible.
export function buildDerangedCryptogramMap(letters, numbers) {
  const adjacency = new Map();

  letters.forEach((letter) => {
    const naturalNumber = letter.charCodeAt(0) - LETTER_CODE_A + 1;
    adjacency.set(
      letter,
      numbers.filter((number) => number !== naturalNumber)
    );
  });

  const matching = new HopcroftKarpMatcher(letters, adjacency).maximumMatching();

  if (matching.size !== letters.length) {
    return Object.fromEntries(letters.map((letter, i) => [letter, numbers[i]]));
  }

  return Object.fromEntries(letters.map((letter) => [letter, matching.get(letter)]));
}

class DisjointSuccessorSet {
  constructor(size) {
    this.parent = Array.from({ length: size + 1 }, (_, i) => i);
  }

  find(index) {
    if (this.parent[index] !== index) {
      this.parent[index] = this.find(this.parent[index]);
    }

    return this.parent[index];
  }

  remove(index) {
    this.parent[index] = this.find(index + 1);
  }
}

// Picks starting revealed cells using the same order-statistic shuffle, then a
// disjoint-set "next available rank" structure to claim positions. This is used
// when creating new, daily, and single-player sessions.
export function pickSpreadRandomIndices(chars, count) {
  const letterIndices = chars
    .map((char, index) => (ALPHABET_REGEX.test(char) ? index : null))
    .filter((index) => index !== null);

  if (count <= 0 || letterIndices.length === 0) {
    return [];
  }

  const targetCount = Math.min(count, letterIndices.length);
  const shuffledLetters = orderStatisticShuffle([...letterIndices]);
  const byPosition = [...letterIndices].sort((a, b) => a - b);
  const rankByIndex = new Map(byPosition.map((index, rank) => [index, rank]));
  const remainingRanks = new DisjointSuccessorSet(byPosition.length);
  const selected = [];

  for (const index of shuffledLetters) {
    if (selected.length === targetCount) break;

    const rank = remainingRanks.find(rankByIndex.get(index));
    if (rank >= byPosition.length) continue;

    selected.push(byPosition[rank]);
    remainingRanks.remove(rank);
  }

  return selected.sort((a, b) => a - b);
}

export class CircularSuccessorIndex {
  constructor(chars, revealedIndices = []) {
    this.letterPositions = chars
      .map((char, index) => (ALPHABET_REGEX.test(char) ? index : null))
      .filter((index) => index !== null);
    this.rankByIndex = new Map(this.letterPositions.map((index, rank) => [index, rank]));
    this.successors = new DisjointSuccessorSet(this.letterPositions.length);

    revealedIndices.forEach((index) => {
      const rank = this.rankByIndex.get(index);
      if (rank !== undefined) {
        this.successors.remove(rank);
      }
    });
  }

  // First hidden letter in reading order. Used to choose the active cell when a
  // fresh game session is created.
  first() {
    const rank = this.successors.find(0);
    return rank < this.letterPositions.length ? this.letterPositions[rank] : -1;
  }

  // Next hidden letter after the current index, wrapping to the beginning. Used
  // after correct guesses and hints to move focus without scanning every cell.
  nextAfter(index) {
    if (this.letterPositions.length === 0) {
      return index;
    }

    const insertionRank = this.upperBound(index);
    const rank = this.successors.find(insertionRank);

    if (rank < this.letterPositions.length) {
      return this.letterPositions[rank];
    }

    const wrappedRank = this.successors.find(0);
    return wrappedRank < this.letterPositions.length
      ? this.letterPositions[wrappedRank]
      : index;
  }

  upperBound(index) {
    let low = 0;
    let high = this.letterPositions.length;

    while (low < high) {
      const mid = Math.floor((low + high) / 2);
      if (this.letterPositions[mid] <= index) {
        low = mid + 1;
      } else {
        high = mid;
      }
    }

    return low;
  }
}
