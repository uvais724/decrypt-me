import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { AuthContext } from '../context/authContextValue';
import { GameRefreshContext } from '../context/gameRefreshContextValue';
import Archive from './Archive';
import AuthCallback from './AuthCallback';
import CuratedPacks from './CuratedPacks';
import DailyPuzzle from './DailyPuzzle';
import DemoGame from './DemoGame';
import Game from './Game';
import GameList from './GameList';
import Invite from './Invite';
import Login from './Login';
import NewGame from './NewGame';
import SendInvite from './SendInvite';

vi.mock('../components/Loading', () => ({
  default: () => 'Loading',
}));

vi.mock('../components/GameEngine', () => ({
  default: ({ message, isDemo, isDailyPuzzle }) => `GameEngine:${message}:${isDemo}:${isDailyPuzzle}`,
}));

vi.mock('../components/SinglePlayer', () => ({
  default: () => 'SinglePlayer',
}));

vi.mock('../components/Leaderboard', () => ({
  default: () => 'Leaderboard',
}));

vi.mock('../components/ScoreIncrement', () => ({
  default: ({ label }) => `ScoreIncrement:${label}`,
}));

vi.mock('ag-grid-react', () => ({
  AgGridReact: () => 'AgGridReact',
}));

vi.mock('ag-grid-community', () => ({
  AllCommunityModule: {},
  ModuleRegistry: {
    registerModules: vi.fn(),
  },
}));

vi.mock('../lib/supabaseClient', () => {
  const query = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    or: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data: null, error: null }),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
  };

  return {
    supabase: {
      from: vi.fn(() => query),
      rpc: vi.fn().mockResolvedValue({ data: [], error: null }),
      auth: {
        getSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null }),
        signInWithOAuth: vi.fn(),
      },
    },
  };
});

vi.mock('../services/GameServices', () => ({
  dailyPuzzleService: {
    loadToday: vi.fn(),
  },
  gameCreationService: {
    createFriendGame: vi.fn(),
  },
  singlePlayerGameService: {
    createOrFindGame: vi.fn(),
  },
}));

vi.mock('../repositories/SupabaseRepositories', () => ({
  repositories: {
    games: {
      findInProgressGame: vi.fn(),
      findPromptId: vi.fn(),
    },
    sessions: {
      findByGameId: vi.fn(),
      reset: vi.fn(),
    },
    singlePlayer: {
      findCurrentPrompt: vi.fn(),
    },
    relationships: {
      findAcceptedForUser: vi.fn(),
    },
  },
}));

function renderPage(page) {
  return renderToStaticMarkup(
    <MemoryRouter>
      <AuthContext.Provider
        value={{
          user: { id: 'user-1', email: 'user@example.com' },
          loading: false,
          login: vi.fn(),
        }}
      >
        <GameRefreshContext.Provider value={{ refreshTrigger: 0, triggerRefresh: vi.fn() }}>
          {page}
        </GameRefreshContext.Provider>
      </AuthContext.Provider>
    </MemoryRouter>
  );
}

describe('page first-render smoke tests', () => {
  it('renders the public login and callback pages', () => {
    expect(renderPage(<Login />)).toContain('Guess the message');
    expect(renderPage(<AuthCallback />)).toContain('Completing Login');
  });

  it('renders game pages in their initial loading or demo state', () => {
    expect(renderPage(<Game />)).toContain('Loading');
    expect(renderPage(<DailyPuzzle />)).toContain('Loading');
    expect(renderPage(<DemoGame />)).toContain('GameEngine:YOU HAVE DISCOVERED A HIDDEN WORLD:true');
  });

  it('renders dashboard and form pages in their initial states', () => {
    expect(renderPage(<GameList />)).toContain('Loading');
    expect(renderPage(<NewGame />)).toContain('Loading');
    expect(renderPage(<SendInvite />)).toContain('Send Invite');
  });

  it('renders secondary collection pages', () => {
    expect(renderPage(<Archive />)).toContain('Loading');
    expect(renderPage(<Invite />)).toContain('Invites');
    expect(renderPage(<CuratedPacks />)).toContain('No packs available yet');
  });
});
