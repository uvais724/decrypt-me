import { describe, expect, it, vi } from 'vitest';
import {
  buildDerangedCryptogramMap,
  CircularSuccessorIndex,
  cryptoRandomInt,
  FenwickTree,
  orderStatisticShuffle,
  pickSpreadRandomIndices,
  selectRandomUnrevealedIndex,
} from './cryptogramDsa';

describe('cryptogramDsa', () => {
  it('tracks prefix ranks with a Fenwick tree', () => {
    const tree = new FenwickTree(5);

    tree.add(0, 1);
    tree.add(2, 1);
    tree.add(4, 1);

    expect(tree.lowerBound(1)).toBe(0);
    expect(tree.lowerBound(2)).toBe(2);
    expect(tree.lowerBound(3)).toBe(4);
  });

  it('generates crypto random integers inside the requested half-open range', () => {
    const spy = vi.spyOn(globalThis.crypto, 'getRandomValues').mockImplementation((array) => {
      array[0] = 7;
      return array;
    });

    expect(cryptoRandomInt(10, 15)).toBe(12);
    expect(() => cryptoRandomInt(5, 5)).toThrow('Max must be greater than min.');

    spy.mockRestore();
  });

  it('shuffles by removing live order statistics without dropping items', () => {
    const input = [1, 2, 3, 4, 5];
    const shuffled = orderStatisticShuffle(input);

    expect(shuffled).toBe(input);
    expect([...shuffled].sort((a, b) => a - b)).toEqual([1, 2, 3, 4, 5]);
  });

  it('builds a cryptogram map that avoids natural A=1 mappings when possible', () => {
    const result = buildDerangedCryptogramMap(['A', 'B', 'C'], [1, 2, 3]);

    expect(Object.keys(result)).toEqual(['A', 'B', 'C']);
    expect(new Set(Object.values(result))).toEqual(new Set([1, 2, 3]));
    expect(result.A).not.toBe(1);
    expect(result.B).not.toBe(2);
    expect(result.C).not.toBe(3);
  });

  it('falls back to positional assignment when a full derangement is impossible', () => {
    expect(buildDerangedCryptogramMap(['A'], [1])).toEqual({ A: 1 });
  });

  it('picks only letter indices, sorted and capped by available letters', () => {
    const chars = 'A B!C'.split('');
    const picked = pickSpreadRandomIndices(chars, 10);

    expect(picked).toEqual([...picked].sort((a, b) => a - b));
    expect(picked).toHaveLength(3);
    expect(picked.every((index) => /^[A-Z]$/.test(chars[index]))).toBe(true);
    expect(pickSpreadRandomIndices(chars, 0)).toEqual([]);
    expect(pickSpreadRandomIndices('123'.split(''), 2)).toEqual([]);
  });

  it('selects a hidden letter index or -1 when every letter is revealed', () => {
    const chars = 'A-B'.split('');
    const index = selectRandomUnrevealedIndex(chars, [0]);

    expect(index).toBe(2);
    expect(selectRandomUnrevealedIndex(chars, [0, 2])).toBe(-1);
  });

  it('finds first and next unrevealed letter positions with wrapping', () => {
    const successor = new CircularSuccessorIndex('A B C'.split(''), [0, 4]);

    expect(successor.first()).toBe(2);
    expect(successor.nextAfter(2)).toBe(2);
    expect(new CircularSuccessorIndex('!'.split('')).nextAfter(5)).toBe(5);
  });
});
