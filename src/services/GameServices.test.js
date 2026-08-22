import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../repositories/SupabaseRepositories', () => ({
  repositories: {
    games: {},
    sessions: {},
    dailyPuzzles: {},
    relationships: {},
    singlePlayer: {},
  },
}));

vi.mock('../lib/pairScore', () => ({
  incrementPairScoreWithPrevious: vi.fn(),
}));

import {
  DailyPuzzleService,
  GameCompletionService,
  GameCreationService,
  SinglePlayerGameService,
} from './GameServices';

describe('GameCreationService', () => {
  it('blocks friend games when five are already in progress', async () => {
    const service = new GameCreationService({
      gameRepository: {
        countInProgressFromSenderToReceiver: vi.fn().mockResolvedValue(5),
      },
    });

    await expect(service.createFriendGame({
      senderId: 'sender',
      receiverId: 'receiver',
      promptText: 'HELLO THERE FRIEND',
    })).rejects.toThrow('Cannot send more than 5 games');
  });

  it('creates a friend game through the repository and increments pair score', async () => {
    const session = {
      message: 'HELLO THERE FRIEND',
      cryptogramMap: { H: 8 },
      revealedIndices: [0],
      initialRevealed: [0],
      guesses: { 8: 'H' },
      activeIndex: 1,
    };
    const gameRepository = {
      countInProgressFromSenderToReceiver: vi.fn().mockResolvedValue(1),
      createNewGameViaRpc: vi.fn().mockResolvedValue('game-1'),
    };
    const pairScoreIncrementer = vi.fn().mockResolvedValue({
      previousScore: 1,
      currentScore: 2,
      incrementBy: 1,
    });
    const service = new GameCreationService({
      gameRepository,
      sessionFactory: { createFromPrompt: vi.fn().mockReturnValue(session) },
      pairScoreIncrementer,
    });

    await expect(service.createFriendGame({
      senderId: 'sender',
      receiverId: 'receiver',
      promptText: 'hello there friend',
    })).resolves.toEqual({
      gameId: 'game-1',
      scoreData: { previousScore: 1, currentScore: 2, incrementBy: 1 },
    });

    expect(gameRepository.createNewGameViaRpc).toHaveBeenCalledWith({
      p_sender_id: 'sender',
      p_receiver_id: 'receiver',
      p_prompt_text: 'HELLO THERE FRIEND',
      p_difficulty_level: 'easy',
      p_cryptogram_map: { H: 8 },
      p_revealed_indices: [0],
      p_initial_revealed: [0],
      p_guesses: { 8: 'H' },
      p_active_index: 1,
    });
    expect(pairScoreIncrementer).toHaveBeenCalledWith('sender', 'receiver', 1);
  });
});

describe('SinglePlayerGameService', () => {
  it('returns an existing session game id when one matches the prompt and user', async () => {
    const service = new SinglePlayerGameService({
      sessionRepository: {
        findByMessageAndUser: vi.fn().mockResolvedValue({ game_id: 'existing-game' }),
      },
    });

    await expect(service.createOrFindGame({
      single_player_levels: {
        prompts: { prompt_text: 'hello', prompt_id: 'prompt-1' },
      },
    }, 'user-1')).resolves.toBe('existing-game');
  });

  it('creates a single-player game and session when none exists', async () => {
    const session = {
      toDatabaseRecord: vi.fn((extra) => ({ ...extra, message: 'HELLO' })),
    };
    const gameRepository = {
      createSinglePlayerGame: vi.fn().mockResolvedValue({ game_id: 'new-game' }),
    };
    const sessionRepository = {
      findByMessageAndUser: vi.fn().mockRejectedValue(new Error('not found')),
      create: vi.fn().mockResolvedValue(undefined),
    };
    const service = new SinglePlayerGameService({
      gameRepository,
      sessionRepository,
      sessionFactory: { createFromPrompt: vi.fn().mockReturnValue(session) },
    });

    await expect(service.createOrFindGame({
      single_player_levels: {
        prompts: { prompt_text: 'hello', prompt_id: 'prompt-1' },
      },
    }, 'user-1')).resolves.toBe('new-game');

    expect(gameRepository.createSinglePlayerGame).toHaveBeenCalledWith('prompt-1', 'easy');
    expect(sessionRepository.create).toHaveBeenCalledWith({
      game_id: 'new-game',
      user_id: 'user-1',
      message: 'HELLO',
    });
  });
});

describe('DailyPuzzleService', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-08-22T12:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('loads today’s playable puzzle with a fresh daily session', async () => {
    const dailyPuzzleRepository = {
      findPuzzleByDate: vi.fn().mockResolvedValue({ message: 'daily text' }),
      findAttempt: vi.fn().mockResolvedValue({ attempts_used: 1, solved: false }),
    };
    const sessionFactory = {
      createDailySession: vi.fn(() => ({
        toHookState: () => ({ session_id: 'daily-2026-08-22' }),
      })),
    };
    const service = new DailyPuzzleService({ dailyPuzzleRepository, sessionFactory });

    await expect(service.loadToday({ id: 'user-1' })).resolves.toEqual({
      message: 'DAILY TEXT',
      attempt: { attempts_used: 1, solved: false },
      session: { session_id: 'daily-2026-08-22' },
    });

    expect(dailyPuzzleRepository.findPuzzleByDate).toHaveBeenCalledWith('2026-08-22');
    expect(sessionFactory.createDailySession).toHaveBeenCalledWith('DAILY TEXT', '2026-08-22');
  });

  it('does not create a session for solved or exhausted daily attempts', async () => {
    const service = new DailyPuzzleService({
      dailyPuzzleRepository: {
        findPuzzleByDate: vi.fn().mockResolvedValue({ message: 'daily text' }),
        findAttempt: vi.fn().mockResolvedValue({ attempts_used: 3, solved: false }),
      },
      sessionFactory: {
        createDailySession: vi.fn(),
      },
    });

    await expect(service.loadToday({ id: 'user-1' })).resolves.toMatchObject({
      message: 'DAILY TEXT',
      session: null,
    });
  });

  it('records daily losses and completions for today', async () => {
    const dailyPuzzleRepository = {
      saveAttempt: vi.fn().mockResolvedValue({ ok: true }),
    };
    const service = new DailyPuzzleService({ dailyPuzzleRepository });

    await service.recordLoss('user-1', 2);
    await service.recordCompletion('user-1', 1, 42);

    expect(dailyPuzzleRepository.saveAttempt).toHaveBeenNthCalledWith(1, {
      user_id: 'user-1',
      puzzle_date: '2026-08-22',
      attempts_used: 2,
      solved: false,
    });
    expect(dailyPuzzleRepository.saveAttempt).toHaveBeenNthCalledWith(2, {
      user_id: 'user-1',
      puzzle_date: '2026-08-22',
      solved: true,
      attempts_used: 1,
      best_time_seconds: 42,
    });
  });
});

describe('GameCompletionService', () => {
  it('marks friend games solved and increments the pair score', async () => {
    const gameRepository = { markSolved: vi.fn() };
    const pairScoreIncrementer = vi.fn().mockResolvedValue({ currentScore: 10 });
    const service = new GameCompletionService({ gameRepository, pairScoreIncrementer });

    await expect(service.markSolved({
      gameId: 'game-1',
      senderId: 'sender',
      receiverId: 'receiver',
      isSinglePlayer: false,
      isDailyPuzzle: false,
      isDemo: false,
    })).resolves.toEqual({ currentScore: 10 });

    expect(gameRepository.markSolved).toHaveBeenCalledWith('game-1');
    expect(pairScoreIncrementer).toHaveBeenCalledWith('sender', 'receiver', 1);
  });

  it('advances single-player progress without touching friend score', async () => {
    const singlePlayerRepository = { updateLevel: vi.fn() };
    const service = new GameCompletionService({ singlePlayerRepository });

    await expect(service.markSolved({
      receiverId: 'user-1',
      isSinglePlayer: true,
      currentLevel: 4,
      isDailyPuzzle: false,
      isDemo: false,
    })).resolves.toBeNull();

    expect(singlePlayerRepository.updateLevel).toHaveBeenCalledWith('user-1', 5);
  });

  it('closes won sessions and deletes temporary single-player games', async () => {
    const sessionRepository = { deleteBySessionId: vi.fn() };
    const gameRepository = { deleteGame: vi.fn() };
    const service = new GameCompletionService({ sessionRepository, gameRepository });

    await service.closeFinishedGame({
      gameId: 'game-1',
      sessionId: 'session-1',
      isSinglePlayer: true,
      gameResult: 'You Won!',
    });

    expect(sessionRepository.deleteBySessionId).toHaveBeenCalledWith('session-1');
    expect(gameRepository.deleteGame).toHaveBeenCalledWith('game-1');
  });

  it('gives up by deleting the session and marking the game', async () => {
    const sessionRepository = { deleteByGameId: vi.fn() };
    const gameRepository = { markGaveUp: vi.fn() };
    const service = new GameCompletionService({ sessionRepository, gameRepository });

    await service.giveUp('game-1');

    expect(sessionRepository.deleteByGameId).toHaveBeenCalledWith('game-1');
    expect(gameRepository.markGaveUp).toHaveBeenCalledWith('game-1');
  });
});
