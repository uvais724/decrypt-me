// hooks/useCryptogramGame.js
import { useMemo, useState, useCallback, useEffect } from "react";

const ALPHABET_REGEX = /^[A-Z]$/;

export function useCryptogramGame(message, initialLives = 3) {
    const chars = useMemo(() => message.split(""), [message]);

    const [lives, setLives] = useState(initialLives);
    const [guesses, setGuesses] = useState({});
    const [revealedIndices, setRevealedIndices] = useState(() =>
        pickRandomIndices(chars, 3)
    );
    const [activeIndex, setActiveIndex] = useState(() => {
        let index = 0;
        for (let i = 0; i < chars.length; i++) {
            if (revealedIndices.includes(i) || !/[A-Z]/.test(chars[i])) {
                continue;
            }
            index = i;
            break;
        }
        return index;
    });

    const [errorIndex, setErrorIndex] = useState(null);

    const cryptogramMap = useMemo(() => {
        const map = new Map();
        let used = new Set();

        chars.forEach((char) => {
            if (ALPHABET_REGEX.test(char) && !map.has(char)) {
                let value;
                do {
                    value = Math.floor(Math.random() * 26) + 1;
                } while (used.has(value));
                used.add(value);
                map.set(char, value);
            }
        });
        return map;
    }, [chars]);

    const board = useMemo(() => {
        return chars.map((char, index) => ({
            index,
            letter: char,
            value: cryptogramMap.get(char),
            revealed: revealedIndices.includes(index) || guesses[index] === char,
        }));
    }, [chars, cryptogramMap, guesses, revealedIndices]);


    const moveToNextIndex = useCallback(
        (currentIndex, revealed) => {
            const length = chars.length;

            for (let step = 1; step <= length; step++) {
                const i = (currentIndex + step) % length;

                if (/[A-Z]/.test(chars[i]) && !revealed.includes(i)) {
                    return i;
                }
            }

            // All characters revealed — stay put
            return currentIndex;
        },
        [chars]
    );


    const guessLetter = useCallback(
        (index, letter) => {
            if (board[index].letter === letter) {
                setGuesses((g) => ({ ...g, [index]: letter }));

                setRevealedIndices((prev) => {
                    const next = [...prev, index];
                    setActiveIndex(moveToNextIndex(index, next));
                    return next;
                });
            } else {
                setLives((l) => l - 1);

                setErrorIndex(index);

                setTimeout(() => {
                    setErrorIndex(null);
                }, 500);
            }
        },
        [board, moveToNextIndex]
    );


    useEffect(() => {
        const handleKeyDown = (e) => {
            if (!/^[a-zA-Z]$/.test(e.key)) return;
            guessLetter(activeIndex, e.key.toUpperCase());
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [guessLetter, activeIndex]);


    return {
        board,
        lives,
        guessLetter,
        setActiveIndex,
        activeIndex,
        errorIndex
    };
}

function pickRandomIndices(chars, count) {
    const indices = chars
        .map((c, i) => (/[A-Z]/.test(c) ? i : null))
        .filter((i) => i !== null);

    return indices.sort(() => 0.5 - Math.random()).slice(0, count);
}
