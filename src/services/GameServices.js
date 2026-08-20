import { repositories } from '../repositories/SupabaseRepositories';
import { cryptogramSessionFactory } from '../domain/CryptogramSessionFactory';
import { setDifficultyLevel } from '../helper/helper';
import { incrementPairScoreWithPrevious } from '../lib/pairScore';

export class GameCreationService {
  constructor({
    gameRepository = repositories.games,
    sessionFactory = cryptogramSessionFactory,
    pairScoreIncrementer = incrementPairScoreWithPrevious
  } = {}) {
    this.gameRepository = gameRepository;
    this.sessionFactory = sessionFactory;
    this.pairScoreIncrementer = pairScoreIncrementer;
  }

  async createFriendGame({ senderId, receiverId, promptText }) {
    const activeCount = await this.gameRepository.countInProgressFromSenderToReceiver(senderId, receiverId);

    if (activeCount >= 5) {
      throw new Error('Cannot send more than 5 games to this user. Please wait for them to be solved before sending more.');
    }

    const session = this.sessionFactory.createFromPrompt(promptText);
    const difficulty = setDifficultyLevel(session.message);

    const gameId = await this.gameRepository.createNewGameViaRpc({
      p_sender_id: senderId,
      p_receiver_id: receiverId,
      p_prompt_text: session.message,
      p_difficulty_level: difficulty,
      p_cryptogram_map: session.cryptogramMap,
      p_revealed_indices: session.revealedIndices,
      p_initial_revealed: session.initialRevealed,
      p_guesses: session.guesses,
      p_active_index: session.activeIndex
    });

    let scoreData = null;

    try {
      scoreData = await this.pairScoreIncrementer(senderId, receiverId, 1);
    } catch (error) {
      console.error('Error incrementing pair score:', error);
    }

    return { gameId, scoreData };
  }
}

export class SinglePlayerGameService {
  constructor({
    gameRepository = repositories.games,
    sessionRepository = repositories.sessions,
    sessionFactory = cryptogramSessionFactory
  } = {}) {
    this.gameRepository = gameRepository;
    this.sessionRepository = sessionRepository;
    this.sessionFactory = sessionFactory;
  }

  async createOrFindGame(progress, userId) {
    const prompt = progress.single_player_levels?.prompts;
    const promptText = prompt?.prompt_text.toUpperCase();

    try {
      const existingGame = await this.sessionRepository.findByMessageAndUser(promptText, userId);
      if (existingGame?.game_id) {
        return existingGame.game_id;
      }
    } catch (error) {
      console.error(error);
    }

    const difficulty = setDifficultyLevel(promptText);
    const game = await this.gameRepository.createSinglePlayerGame(prompt.prompt_id, difficulty);
    const session = this.sessionFactory.createFromPrompt(promptText, { revealedCount: 3 });

    await this.sessionRepository.create(
      session.toDatabaseRecord({
        game_id: game.game_id,
        user_id: userId
      })
    );

    return game.game_id;
  }
}

export class DailyPuzzleService {
  constructor({
    dailyPuzzleRepository = repositories.dailyPuzzles,
    sessionFactory = cryptogramSessionFactory
  } = {}) {
    this.dailyPuzzleRepository = dailyPuzzleRepository;
    this.sessionFactory = sessionFactory;
  }

  async loadToday(user) {
    const today = new Date().toISOString().split('T')[0];
    const puzzle = await this.dailyPuzzleRepository.findPuzzleByDate(today);
    const message = puzzle.message.toUpperCase();
    let attempt = null;

    if (user) {
      attempt = await this.dailyPuzzleRepository.findAttempt(user.id, today);
    }

    if (attempt?.solved || attempt?.attempts_used >= 3) {
      return { message, attempt, session: null };
    }

    const session = this.sessionFactory.createDailySession(message, today).toHookState();
    return { message, attempt, session };
  }

  async recordLoss(userId, attemptsUsed) {
    const today = new Date().toISOString().split('T')[0];

    return this.dailyPuzzleRepository.saveAttempt({
      user_id: userId,
      puzzle_date: today,
      attempts_used: attemptsUsed,
      solved: false
    });
  }

  async recordCompletion(userId, attemptsUsed, bestTimeSeconds) {
    const today = new Date().toISOString().split('T')[0];

    return this.dailyPuzzleRepository.saveAttempt({
      user_id: userId,
      puzzle_date: today,
      solved: true,
      attempts_used: attemptsUsed,
      best_time_seconds: bestTimeSeconds
    });
  }
}

export class GameCompletionService {
  constructor({
    gameRepository = repositories.games,
    sessionRepository = repositories.sessions,
    singlePlayerRepository = repositories.singlePlayer,
    pairScoreIncrementer = incrementPairScoreWithPrevious
  } = {}) {
    this.gameRepository = gameRepository;
    this.sessionRepository = sessionRepository;
    this.singlePlayerRepository = singlePlayerRepository;
    this.pairScoreIncrementer = pairScoreIncrementer;
  }

  async markSolved({ gameId, senderId, receiverId, isSinglePlayer, currentLevel, isDailyPuzzle, isDemo }) {
    if (!isSinglePlayer && !isDailyPuzzle && !isDemo) {
      await this.gameRepository.markSolved(gameId);
      return this.pairScoreIncrementer(senderId, receiverId, 1);
    }

    if (isSinglePlayer && currentLevel !== null) {
      await this.singlePlayerRepository.updateLevel(receiverId, currentLevel + 1);
    }

    return null;
  }

  async closeFinishedGame({ gameId, sessionId, isSinglePlayer, gameResult }) {
    if (gameResult === 'You Won!') {
      await this.sessionRepository.deleteBySessionId(sessionId);
    }

    if (isSinglePlayer) {
      await this.gameRepository.deleteGame(gameId);
    }
  }

  async giveUp(gameId) {
    await this.sessionRepository.deleteByGameId(gameId);
    await this.gameRepository.markGaveUp(gameId);
  }
}

export const gameCreationService = new GameCreationService();
export const singlePlayerGameService = new SinglePlayerGameService();
export const dailyPuzzleService = new DailyPuzzleService();
export const gameCompletionService = new GameCompletionService();
