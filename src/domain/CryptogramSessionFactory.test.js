import { describe, expect, it } from 'vitest';
import { CryptogramSession, CryptogramSessionFactory } from './CryptogramSessionFactory';

describe('CryptogramSession', () => {
  it('serializes to database records and hook state', () => {
    const session = new CryptogramSession({
      message: 'HELLO',
      cryptogramMap: { H: 8 },
      revealedIndices: [0],
      initialRevealed: [0],
      guesses: { 8: 'H' },
      activeIndex: 1,
      lives: 2,
      hintsUsed: 1,
      sessionId: 'session-1',
    });

    expect(session.toDatabaseRecord({ game_id: 'game-1' })).toEqual({
      game_id: 'game-1',
      message: 'HELLO',
      cryptogram_map: { H: 8 },
      guesses: { 8: 'H' },
      revealed_indices: [0],
      initial_revealed: [0],
      active_index: 1,
      lives: 2,
      hints_used: 1,
    });

    expect(session.toHookState()).toEqual({
      session_id: 'session-1',
      cryptogram_map: { H: 8 },
      revealed_indices: [0],
      initial_revealed: [0],
      guesses: { 8: 'H' },
      active_index: 1,
      lives: 2,
      hints_used: 1,
    });
  });
});

describe('CryptogramSessionFactory', () => {
  it('creates normalized sessions from prompts with overridable setup', () => {
    const session = new CryptogramSessionFactory().createFromPrompt('  ab c ', {
      cryptogramMap: { A: 1, B: 2, C: 3 },
      revealedIndices: [0],
      guesses: { 1: 'A' },
      activeIndex: 1,
      lives: 1,
      hintsUsed: 2,
      sessionId: 'existing',
    });

    expect(session.message).toBe('AB C');
    expect(session.cryptogramMap).toEqual({ A: 1, B: 2, C: 3 });
    expect(session.initialRevealed).toEqual([0]);
    expect(session.activeIndex).toBe(1);
    expect(session.lives).toBe(1);
    expect(session.hintsUsed).toBe(2);
    expect(session.sessionId).toBe('existing');
  });

  it('creates a daily session with a stable daily id and three revealed cells', () => {
    const session = new CryptogramSessionFactory().createDailySession('daily message', '2026-08-22');

    expect(session.message).toBe('DAILY MESSAGE');
    expect(session.sessionId).toBe('daily-2026-08-22');
    expect(session.revealedIndices).toHaveLength(3);
  });

  it('resets an existing session to its initial revealed state', () => {
    const reset = new CryptogramSessionFactory().createResetSession(
      {
        session_id: 'session-1',
        cryptogram_map: { A: 1, B: 2 },
        initial_revealed: [0],
      },
      'AB'
    );

    expect(reset.revealedIndices).toEqual([0]);
    expect(reset.activeIndex).toBe(1);
    expect(reset.lives).toBe(3);
    expect(reset.hintsUsed).toBe(0);
    expect(reset.sessionId).toBe('session-1');
  });
});
