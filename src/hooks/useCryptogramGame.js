// hooks/useCryptogramGame.js
import { useMemo, useState, useCallback, useEffect, useRef } from "react";

const ALPHABET_REGEX = /^[A-Z]$/;

export function useCryptogramGame(
    message,
    {
        initialLives = 3,
        initialState = null,      // 👈 backend session data
    } = {}
) {
    const chars = useMemo(() => message.split(""), [message]);

    /* ------------------ CORE STATE ------------------ */
    const [lives, setLives] = useState(initialState?.lives ?? initialLives);
    const [guesses, setGuesses] = useState(initialState?.guesses ?? {});
    const [revealedIndices, setRevealedIndices] = useState(initialState?.revealed_indices);

    const [hintsUsed, setHintsUsed] = useState(initialState?.hints_used ?? 0);
    const [activeIndex, setActiveIndex] = useState(initialState?.active_index);


    const [errorIndex, setErrorIndex] = useState(null);
    const [isGameComplete, setIsGameComplete] = useState(false);

    /* ------------------ CRYPTOGRAM MAP (STABLE) ------------------ */
    const cryptogramMap = new Map(
        Object.entries(initialState.cryptogram_map)
    );

    /* ------------------ DERIVED MAPS ------------------ */

    const letterToIndices = useMemo(() => {
        const map = {};
        chars.forEach((char, i) => {
            if (ALPHABET_REGEX.test(char)) {
                map[char] ??= [];
                map[char].push(i);
            }
        });
        return map;
    }, [chars]);

    const cryptogramNumbers = useMemo(() => {
        const obj = {};
        cryptogramMap.forEach((value, key) => {
            obj[key] = value;
        });
        return obj;
    }, [cryptogramMap]);


    const disabledKeys = useMemo(() => {
        const revealedSet = new Set(revealedIndices);
        return new Set(
            Object.entries(letterToIndices)
                .filter(([, idxs]) => idxs.every(i => revealedSet.has(i)))
                .map(([letter]) => letter)
        );
    }, [letterToIndices, revealedIndices]);

    const partiallyRevealedKeys = useMemo(() => {
        const revealedSet = new Set(revealedIndices);
        return new Set(
            Object.entries(letterToIndices)
                .filter(([, idxs]) => {
                    const r = idxs.filter(i => revealedSet.has(i)).length;
                    return r > 0 && r < idxs.length;
                })
                .map(([letter]) => letter)
        );
    }, [letterToIndices, revealedIndices]);

    const board = useMemo(() => {
        return chars.map((char, i) => ({
            index: i,
            letter: char,
            value: cryptogramMap.get(char),
            revealed:
                revealedIndices.includes(i) ||
                guesses[i] === char
        }));
    }, [chars, cryptogramMap, guesses, revealedIndices]);

    /* ------------------ GAME LOGIC ------------------ */

    const moveToNextIndex = useCallback(
        (current, revealed) => {
            for (let step = 1; step <= chars.length; step++) {
                const i = (current + step) % chars.length;
                if (ALPHABET_REGEX.test(chars[i]) && !revealed.includes(i)) {
                    return i;
                }
            }
            return current;
        },
        [chars]
    );

    const totalLetters = useMemo(
        () => chars.filter(c => ALPHABET_REGEX.test(c)).length,
        [chars]
    );

    const guessLetter = useCallback(
        (index, letter) => {
            if (!board[index]) return;

            if (board[index].letter === letter) {
                setGuesses(g => ({ ...g, [index]: letter }));
                setRevealedIndices(prev => {
                    const next = [...prev, index];
                    setActiveIndex(moveToNextIndex(index, next));
                    if (next.length === totalLetters) {
                        setIsGameComplete(true);
                    }
                    return next;
                });
            } else {
                setLives(l => Math.max(0, l - 1));
                setErrorIndex(index);
                setTimeout(() => setErrorIndex(null), 500);
            }
        },
        [board, totalLetters, moveToNextIndex]
    );

    const revealRandomCell = useCallback(() => {
        const unrevealed = board.filter(
            c => ALPHABET_REGEX.test(c.letter) && !c.revealed
        );
        if (!unrevealed.length) return;

        const chosen = unrevealed[Math.floor(Math.random() * unrevealed.length)];

        setRevealedIndices(prev => {
            const next = [...prev, chosen.index];
            setActiveIndex(moveToNextIndex(chosen.index, next));
            return next;
        });

        setGuesses(g => ({ ...g, [chosen.index]: chosen.letter }));
        setHintsUsed(h => h + 1);

        const revealedChars = board.filter(
            c => ALPHABET_REGEX.test(c.letter) && c.revealed
        );
        const messageChars = message.split('').filter(c => ALPHABET_REGEX.test(c))
        if (revealedChars.length === messageChars.length - 1) {
            setIsGameComplete(true);
        }
    }, [board, moveToNextIndex]);

    /* ------------------ KEYBOARD INPUT ------------------ */

    useEffect(() => {
        const handler = e => {
            const letter = e.key.toUpperCase();
            if (!ALPHABET_REGEX.test(letter)) return;
            if (disabledKeys.has(letter)) return;
            guessLetter(activeIndex, letter);
        };

        window.addEventListener("keydown", handler);
        return () => window.removeEventListener("keydown", handler);
    }, [guessLetter, activeIndex, disabledKeys]);

    return {
        board,
        lives,
        hintsUsed,
        guessLetter,
        activeIndex,
        setActiveIndex,
        errorIndex,
        disabledKeys,
        partiallyRevealedKeys,
        isGameComplete,
        revealRandomCell,
        revealedIndices,
        guesses,
        cryptogramNumbers,
    };
}