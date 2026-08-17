import {
    ALPHABET_REGEX,
    CircularSuccessorIndex,
    buildDerangedCryptogramMap,
    cryptoRandomInt,
    orderStatisticShuffle,
    pickSpreadRandomIndices,
    selectRandomUnrevealedIndex
} from '../lib/cryptogramDsa.js';

export function initializeGuesses(cryptogramMap, revealedIndices, message) {
    const guesses = {};
    // For revealed indices, map the character to its cryptogram number
    revealedIndices.forEach(index => {
        const char = message.charAt(index).toUpperCase();
        if (cryptogramMap[char]) {
            guesses[cryptogramMap[char]] = char;
        }
    });

    return guesses;
}

export function setDifficultyLevel(promptText) {
    //calculate word count by only counting letters A-Z
    const wordCount = promptText.match(/[a-zA-Z]/g)?.length || 0;
    if (wordCount < 50) return 'easy';
    if (wordCount <= 100) return 'medium';
    return 'hard';
}

export function generateCryptogramMap(text) {
    const letters = [...new Set(text.toUpperCase().match(/[A-Z]/g))];
    const numbers = Array.from({ length: 26 }, (_, i) => i + 1);

    // Uses the Fenwick order-statistic shuffle, then Hopcroft-Karp matching to
    // assign each prompt letter a non-obvious cipher number.
    shuffle(numbers);

    return buildDerangedCryptogramMap(letters, numbers);
}

export function shuffle(array) {
    // Kept as the public helper API; implemented with a Fenwick tree in
    // cryptogramDsa.js.
    return orderStatisticShuffle(array);
}

export function pickRandomIndices(chars, count) {
    // Used during game creation to choose initial revealed cells through the
    // DSA-backed picker instead of random-sort sampling.
    return pickSpreadRandomIndices(chars, count);
}


export function findFirstUnrevealed(chars, revealed) {
    // Used during game creation to seed the active cell with the union-find
    // successor index.
    return new CircularSuccessorIndex(chars, revealed).first();
}

export { ALPHABET_REGEX, CircularSuccessorIndex, cryptoRandomInt, selectRandomUnrevealedIndex };

export function isMobile() {
  const userAgent = navigator.userAgent;
  // Check for common desktop OS keywords and the absence of mobile identifiers
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini|Mobi/i.test(userAgent);
  
  // A simple check might just be to ensure it's not a common mobile device
  return isMobile;
}
