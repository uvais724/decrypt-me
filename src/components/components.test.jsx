import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import Board from './Board';
import Cell from './Cell';
import ConfirmationModal from './ConfirmationModal';
import HowToPlay from './HowToPlay';
import Keyboard from './Keyboard';
import Leaderboard from './Leaderboard';
import Lives from './Lives';
import Loading from './Loading';
import Modal from './Modal';
import Navbar from './Navbar';
import ScoreIncrement from './ScoreIncrement';
import Share from './Share';
import { AuthContext } from '../context/authContextValue';
import { GameRefreshContext } from '../context/gameRefreshContextValue';

vi.mock('../lib/supabaseClient', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      neq: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: null }),
    })),
    rpc: vi.fn().mockResolvedValue({ data: [], error: null }),
  },
}));

vi.mock('react-loader-spinner', () => ({
  Oval: ({ ariaLabel }) => `spinner:${ariaLabel}`,
}));

vi.mock('../services/GameServices', () => ({
  gameCompletionService: {
    markSolved: vi.fn(),
    closeFinishedGame: vi.fn(),
    giveUp: vi.fn(),
  },
  dailyPuzzleService: {
    recordLoss: vi.fn(),
    recordCompletion: vi.fn(),
  },
}));

function withProviders(ui, authValue = { user: { id: 'user-1', email: 'u@example.com' }, logout: vi.fn() }) {
  return (
    <MemoryRouter>
      <AuthContext.Provider value={authValue}>
        <GameRefreshContext.Provider value={{ refreshTrigger: 0, triggerRefresh: vi.fn() }}>
          {ui}
        </GameRefreshContext.Provider>
      </AuthContext.Provider>
    </MemoryRouter>
  );
}

describe('presentational components', () => {
  it('renders a cell with active, revealed, and error state classes', () => {
    const markup = renderToStaticMarkup(
      <Cell
        cell={{ index: 0, letter: 'A', value: 7, revealed: true }}
        isActive={true}
        isError={true}
        onGuess={vi.fn()}
        onFocus={vi.fn()}
      />
    );

    expect(markup).toContain('border-blue-500');
    expect(markup).toContain('bg-green-200');
    expect(markup).toContain('border-red-500');
    expect(markup).toContain('disabled=""');
    expect(markup).toContain('value="A"');
    expect(markup).toContain('<span>7</span>');
  });

  it('groups board letters and renders punctuation directly', () => {
    const board = [
      { index: 0, letter: 'H', value: 1, revealed: false },
      { index: 1, letter: 'I', value: 2, revealed: false },
      { index: 2, letter: '!', value: undefined, revealed: false },
    ];

    const markup = renderToStaticMarkup(
      <Board board={board} onGuess={vi.fn()} activeIndex={1} setActiveIndex={vi.fn()} />
    );

    expect(markup).toContain('value=""');
    expect(markup).toContain('>!</span>');
    expect(markup).toContain('border-blue-500');
  });

  it('renders keyboard rows, disabled keys, and partially revealed numbers', () => {
    const markup = renderToStaticMarkup(
      <Keyboard
        onKey={vi.fn()}
        disabledKeys={new Set(['A'])}
        partiallyRevealedKeys={new Set(['B'])}
        cryptogramNumbers={{ B: 2 }}
      />
    );

    expect(markup).toContain('disabled=""');
    expect(markup).toContain('bg-green-100');
    expect(markup).toContain('>2</span>');
    expect((markup.match(/<button/g) || [])).toHaveLength(26);
  });

  it('renders filled and empty lives', () => {
    const markup = renderToStaticMarkup(<Lives lives={1} maxLives={3} />);

    expect((markup.match(/text-red-500/g) || [])).toHaveLength(1);
    expect((markup.match(/text-gray-300/g) || [])).toHaveLength(2);
  });

  it('renders modal-like informational components only when open', () => {
    expect(renderToStaticMarkup(<ConfirmationModal isOpen={false} />)).toBe('');
    expect(renderToStaticMarkup(<HowToPlay isOpen={false} />)).toBe('');

    expect(renderToStaticMarkup(
      <ConfirmationModal
        isOpen
        title="Delete?"
        message="This cannot be undone."
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
      />
    )).toContain('Delete?');

    expect(renderToStaticMarkup(<HowToPlay isOpen onClose={vi.fn()} />)).toContain('How to Play Decrypt Me');
  });

  it('renders share and score summary cards', () => {
    expect(renderToStaticMarkup(
      <Share gamePuzzle="HELLO WORLD" lives={2} hintsUsed={1} />
    )).toContain('HELLO WORLD');

    const scoreMarkup = renderToStaticMarkup(
      <ScoreIncrement previousScore="bad" currentScore={3} incrementBy="2" label="Pair Score" />
    );
    expect(scoreMarkup).toContain('Pair Score');
    expect(scoreMarkup).toContain('+2 added');
  });

  it('renders loading and leaderboard fallback states', () => {
    expect(renderToStaticMarkup(<Loading />)).toContain('oval-loading');

    const leaderboard = renderToStaticMarkup(<Leaderboard />);
    expect(leaderboard).toContain('Top Pair Leaderboard');
    expect(leaderboard).toContain('loading_user_1');
  });

  it('renders navbar links and a user avatar fallback', () => {
    const markup = renderToStaticMarkup(withProviders(<Navbar />));

    expect(markup).toContain('Decrypt-Me');
    expect(markup).toContain('Games');
    expect(markup).toContain('Curated Packs');
    expect(markup).toContain('U');
  });

  it('renders modal game-over actions without winner-only sharing', () => {
    const markup = renderToStaticMarkup(withProviders(
      <Modal
        gameId="game-1"
        senderId="sender"
        sessionId="session-1"
        gameResult="Game Over!"
        onTryAgain={vi.fn()}
        lives={0}
        hintsUsed={2}
      />
    ));

    expect(markup).toContain('Game Over!');
    expect(markup).toContain('Try Again');
    expect(markup).not.toContain('Share');
  });
});
