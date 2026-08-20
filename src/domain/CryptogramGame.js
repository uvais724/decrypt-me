import {
  ALPHABET_REGEX,
  CircularSuccessorIndex,
  selectRandomUnrevealedIndex
} from '../helper/helper';

export class FenwickHintStrategy {
  chooseIndex(chars, revealedIndices) {
    return selectRandomUnrevealedIndex(chars, revealedIndices);
  }
}

export class CryptogramBoardBuilder {
  build(chars, cryptogramMap, guesses, revealedIndices) {
    return chars.map((char, index) => {
      const charValue = cryptogramMap.get(char);
      const isHint = revealedIndices.includes(index);
      const userGuess = guesses[charValue] ?? guesses[index];

      return {
        index,
        letter: char,
        value: charValue,
        revealed: isHint,
        displayLetter: isHint ? char : (userGuess || '')
      };
    });
  }
}

// Strategy Pattern: hint selection is injected, letting the game rules stay
// independent from the random-selection algorithm.
export class CryptogramGame {
  constructor({
    message,
    initialLives = 3,
    initialState = null,
    hintStrategy = new FenwickHintStrategy(),
    boardBuilder = new CryptogramBoardBuilder()
  }) {
    this.message = message;
    this.chars = message.split('');
    this.initialLives = initialLives;
    this.initialState = initialState;
    this.hintStrategy = hintStrategy;
    this.boardBuilder = boardBuilder;
    this.cryptogramMap = new Map(Object.entries(initialState?.cryptogram_map ?? {}));
  }

  getLetterToIndices() {
    const map = {};

    this.chars.forEach((char, index) => {
      if (ALPHABET_REGEX.test(char)) {
        map[char] ??= [];
        map[char].push(index);
      }
    });

    return map;
  }

  getCryptogramNumbers() {
    return Object.fromEntries(this.cryptogramMap.entries());
  }

  getTotalLetters() {
    return this.chars.filter((char) => ALPHABET_REGEX.test(char)).length;
  }

  buildBoard(guesses, revealedIndices) {
    return this.boardBuilder.build(this.chars, this.cryptogramMap, guesses, revealedIndices);
  }

  getDisabledKeys(letterToIndices, revealedIndices) {
    const revealedSet = new Set(revealedIndices);

    return new Set(
      Object.entries(letterToIndices)
        .filter(([, indices]) => indices.every((index) => revealedSet.has(index)))
        .map(([letter]) => letter)
    );
  }

  getPartiallyRevealedKeys(letterToIndices, revealedIndices) {
    const revealedSet = new Set(revealedIndices);

    return new Set(
      Object.entries(letterToIndices)
        .filter(([, indices]) => {
          const revealedCount = indices.filter((index) => revealedSet.has(index)).length;
          return revealedCount > 0 && revealedCount < indices.length;
        })
        .map(([letter]) => letter)
    );
  }

  moveToNextIndex(currentIndex, revealedIndices) {
    return new CircularSuccessorIndex(this.chars, revealedIndices).nextAfter(currentIndex);
  }

  chooseHintIndex(revealedIndices) {
    return this.hintStrategy.chooseIndex(this.chars, revealedIndices);
  }
}
