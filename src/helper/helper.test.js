import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  findFirstUnrevealed,
  generateCryptogramMap,
  initializeGuesses,
  isMobile,
  pickRandomIndices,
  setDifficultyLevel,
  shuffle,
} from './helper';

describe('helper utilities', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('initializes guesses from revealed letter positions', () => {
    const guesses = initializeGuesses({ A: 7, B: 4 }, [0, 2, 99], 'aba');

    expect(guesses).toEqual({ 7: 'A' });
  });

  it('sets difficulty from alphabetic character count only', () => {
    expect(setDifficultyLevel('short phrase!')).toBe('easy');
    expect(setDifficultyLevel('a'.repeat(50))).toBe('medium');
    expect(setDifficultyLevel('a'.repeat(101))).toBe('hard');
  });

  it('generates map entries for unique uppercase letters', () => {
    const map = generateCryptogramMap('Balloon!');

    expect(Object.keys(map).sort()).toEqual(['A', 'B', 'L', 'N', 'O']);
    expect(Object.values(map).every((value) => Number.isInteger(value))).toBe(true);
  });

  it('keeps public shuffle and picker APIs wired to DSA helpers', () => {
    expect([...shuffle(['A', 'B', 'C'])].sort()).toEqual(['A', 'B', 'C']);
    expect(pickRandomIndices('A1B'.split(''), 2).sort((a, b) => a - b)).toEqual([0, 2]);
  });

  it('finds the first unrevealed alphabetic cell', () => {
    expect(findFirstUnrevealed('!AB'.split(''), [1])).toBe(2);
    expect(findFirstUnrevealed('!!'.split(''), [])).toBe(-1);
  });

  it('detects common mobile user agents', () => {
    Object.defineProperty(globalThis.navigator, 'userAgent', {
      value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)',
      configurable: true,
    });

    expect(isMobile()).toBe(true);

    Object.defineProperty(globalThis.navigator, 'userAgent', {
      value: 'Mozilla/5.0 (X11; Linux x86_64)',
      configurable: true,
    });

    expect(isMobile()).toBe(false);
  });
});
