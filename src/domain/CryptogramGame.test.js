import { describe, expect, it, vi } from 'vitest';
import { CryptogramBoardBuilder, CryptogramGame, FenwickHintStrategy } from './CryptogramGame';

describe('CryptogramGame', () => {
  const initialState = {
    cryptogram_map: { A: 4, B: 8, C: 2 },
    revealed_indices: [0],
    guesses: {},
  };

  it('indexes only alphabetic letters by their board positions', () => {
    const game = new CryptogramGame({ message: 'ABA C!', initialState });

    expect(game.getLetterToIndices()).toEqual({
      A: [0, 2],
      B: [1],
      C: [4],
    });
    expect(game.getTotalLetters()).toBe(4);
  });

  it('builds board cells with cipher values, hints, and user guesses', () => {
    const game = new CryptogramGame({ message: 'AB', initialState });

    expect(game.buildBoard({ 8: 'B' }, [0])).toEqual([
      {
        index: 0,
        letter: 'A',
        value: 4,
        revealed: true,
        displayLetter: 'A',
      },
      {
        index: 1,
        letter: 'B',
        value: 8,
        revealed: false,
        displayLetter: 'B',
      },
    ]);
  });

  it('computes disabled and partially revealed keyboard keys', () => {
    const game = new CryptogramGame({ message: 'ABA C', initialState });
    const letterToIndices = game.getLetterToIndices();

    expect(game.getDisabledKeys(letterToIndices, [1, 4])).toEqual(new Set(['B', 'C']));
    expect(game.getPartiallyRevealedKeys(letterToIndices, [0])).toEqual(new Set(['A']));
  });

  it('delegates hint and board strategies', () => {
    const hintStrategy = { chooseIndex: vi.fn(() => 3) };
    const boardBuilder = { build: vi.fn(() => ['board']) };
    const game = new CryptogramGame({
      message: 'ABC',
      initialState,
      hintStrategy,
      boardBuilder,
    });

    expect(game.chooseHintIndex([0])).toBe(3);
    expect(hintStrategy.chooseIndex).toHaveBeenCalledWith(['A', 'B', 'C'], [0]);
    expect(game.buildBoard({}, [])).toEqual(['board']);
    expect(boardBuilder.build).toHaveBeenCalled();
  });

  it('moves to the next unrevealed index through the circular successor', () => {
    const game = new CryptogramGame({ message: 'A B C', initialState });

    expect(game.moveToNextIndex(0, [0])).toBe(2);
  });
});

describe('CryptogramBoardBuilder', () => {
  it('falls back to index-keyed guesses for current hook state', () => {
    const builder = new CryptogramBoardBuilder();
    const map = new Map([['A', 1]]);

    expect(builder.build(['A'], map, { 0: 'A' }, [])[0].displayLetter).toBe('A');
  });
});

describe('FenwickHintStrategy', () => {
  it('returns -1 when no hidden letters remain', () => {
    expect(new FenwickHintStrategy().chooseIndex(['A'], [0])).toBe(-1);
  });
});
