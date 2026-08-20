import {
  generateCryptogramMap,
  initializeGuesses,
  pickRandomIndices,
  setDifficultyLevel,
  findFirstUnrevealed
} from '../helper/helper.js';

const REVEALED_COUNTS_BY_DIFFICULTY = {
  easy: 3,
  medium: 5,
  hard: 8
};

export class CryptogramSession {
  constructor({
    message,
    cryptogramMap,
    revealedIndices,
    initialRevealed = revealedIndices,
    guesses,
    activeIndex,
    lives = 3,
    hintsUsed = 0,
    sessionId = null
  }) {
    this.message = message;
    this.cryptogramMap = cryptogramMap;
    this.revealedIndices = revealedIndices;
    this.initialRevealed = initialRevealed;
    this.guesses = guesses;
    this.activeIndex = activeIndex;
    this.lives = lives;
    this.hintsUsed = hintsUsed;
    this.sessionId = sessionId;
  }

  toDatabaseRecord(extraFields = {}) {
    return {
      ...extraFields,
      message: this.message,
      cryptogram_map: this.cryptogramMap,
      guesses: this.guesses,
      revealed_indices: this.revealedIndices,
      initial_revealed: this.initialRevealed,
      active_index: this.activeIndex,
      lives: this.lives,
      hints_used: this.hintsUsed
    };
  }

  toHookState() {
    return {
      session_id: this.sessionId,
      cryptogram_map: this.cryptogramMap,
      revealed_indices: this.revealedIndices,
      initial_revealed: this.initialRevealed,
      guesses: this.guesses,
      active_index: this.activeIndex,
      lives: this.lives,
      hints_used: this.hintsUsed
    };
  }
}

// Factory Pattern: all cryptogram session construction lives here so pages do
// not duplicate setup rules for maps, hints, guesses, and active cells.
export class CryptogramSessionFactory {
  createFromPrompt(promptText, options = {}) {
    const message = promptText.toUpperCase().trim();
    const difficulty = options.difficulty ?? setDifficultyLevel(message);
    const revealedCount = options.revealedCount ?? REVEALED_COUNTS_BY_DIFFICULTY[difficulty] ?? 3;
    const cryptogramMap = options.cryptogramMap ?? generateCryptogramMap(message);
    const chars = message.split('');
    const revealedIndices = options.revealedIndices ?? pickRandomIndices(chars, revealedCount);
    const guesses = options.guesses ?? initializeGuesses(cryptogramMap, revealedIndices, message);
    const activeIndex = options.activeIndex ?? findFirstUnrevealed(chars, revealedIndices);

    return new CryptogramSession({
      message,
      cryptogramMap,
      revealedIndices,
      guesses,
      activeIndex,
      lives: options.lives ?? 3,
      hintsUsed: options.hintsUsed ?? 0,
      sessionId: options.sessionId ?? null
    });
  }

  createDailySession(promptText, puzzleDate) {
    return this.createFromPrompt(promptText, {
      revealedCount: 3,
      sessionId: `daily-${puzzleDate}`
    });
  }

  createResetSession(existingSession, message) {
    return this.createFromPrompt(message, {
      cryptogramMap: existingSession.cryptogram_map,
      revealedIndices: existingSession.initial_revealed,
      activeIndex: findFirstUnrevealed(message.split(''), existingSession.initial_revealed),
      sessionId: existingSession.session_id,
      lives: 3,
      hintsUsed: 0
    });
  }
}

export const cryptogramSessionFactory = new CryptogramSessionFactory();
