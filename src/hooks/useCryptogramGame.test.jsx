import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { useCryptogramGame } from './useCryptogramGame';

function HookProbe({ message, initialState, blocked }) {
  const state = useCryptogramGame(message, { initialState }, blocked);

  return (
    <script
      type="application/json"
      data-state={JSON.stringify({
        board: state.board,
        lives: state.lives,
        hintsUsed: state.hintsUsed,
        activeIndex: state.activeIndex,
        disabledKeys: [...state.disabledKeys],
        partiallyRevealedKeys: [...state.partiallyRevealedKeys],
        cryptogramNumbers: state.cryptogramNumbers,
      })}
    />
  );
}

function readProbe(markup) {
  const match = markup.match(/data-state="([^"]+)"/);
  return JSON.parse(match[1].replaceAll('&quot;', '"'));
}

describe('useCryptogramGame', () => {
  it('derives initial game state from a persisted session', () => {
    const initialState = {
      cryptogram_map: { A: 1, B: 2 },
      revealed_indices: [0],
      guesses: { 1: 'A' },
      active_index: 1,
      lives: 2,
      hints_used: 1,
    };

    const state = readProbe(renderToStaticMarkup(
      <HookProbe message="AB" initialState={initialState} />
    ));

    expect(state.lives).toBe(2);
    expect(state.hintsUsed).toBe(1);
    expect(state.activeIndex).toBe(1);
    expect(state.cryptogramNumbers).toEqual({ A: 1, B: 2 });
    expect(state.board[0]).toMatchObject({ letter: 'A', revealed: true, displayLetter: 'A' });
    expect(state.partiallyRevealedKeys).toEqual([]);
    expect(state.disabledKeys).toEqual(['A']);
  });
});
