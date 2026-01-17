export function initializeGuesses(cryptogramMap, revealedIndices, message) {
    console.log('Cryptogram map: ', cryptogramMap);
    console.log('Initial reveaded indices: ', revealedIndices);
    console.log('Message: ', message);
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

    shuffle(numbers);

    const map = {};
    letters.forEach((letter, i) => {
        map[letter] = numbers[i];
    });

    return map;
}

export function cryptoRandomInt(min, max) {
    const range = max - min;
    if (range <= 0) {
        throw new Error('Max must be greater than min.');
    }

    // Use Uint32Array for a range up to 2^32
    const byteArray = new Uint32Array(1);
    window.crypto.getRandomValues(byteArray);

    // Get a value between 0 (inclusive) and range (exclusive)
    const randomValue = byteArray[0] % range;

    return min + randomValue;
}

export function shuffle(array) {
    // Fisher–Yates shuffle using crypto for better randomness
    for (let i = array.length - 1; i > 0; i--) {
        const j = cryptoRandomInt(0, i + 1);
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

export function pickRandomIndices(chars, count) {
    console.log('Characters" ', chars);
    const result = chars
        .map((c, i) => (/[A-Z]/.test(c) ? i : null))
        .filter(i => i !== null)
        .sort(() => 0.5 - Math.random())
        .slice(0, count);
    console.log('Result: ', result);
    return result;
}


export function findFirstUnrevealed(chars, revealed) {
    return chars.findIndex(
        (c, i) => /[A-Z]/.test(c) && !revealed.includes(i)
    );
}