// hooks/useCryptogramGame.js
import { useMemo, useState, useCallback, useEffect, useRef } from "react";

const ALPHABET_REGEX = /^[A-Z]$/;

export function useCryptogramGame(
    message,
    {
        initialLives = 3,
        initialState = null,      // 👈 backend session data
        onPersist = null          // 👈 function to save state
    } = {}
) {
    const chars = useMemo(() => message.split(""), [message]);

    /* ------------------ CORE STATE ------------------ */
    const [lives, setLives] = useState(initialState?.livesLeft ?? initialLives);
    const [guesses, setGuesses] = useState(initialState?.guesses ?? {});
    const [revealedIndices, setRevealedIndices] = useState(() => {
        if (initialState?.revealed_indices) {
            return initialState.revealed_indices;
        }
        return pickRandomIndices(chars, 3);
    });

    const [hintsUsed, setHintsUsed] = useState(initialState?.hintsUsed ?? 0);
    const [activeIndex, setActiveIndex] = useState(() => {
        if (initialState?.activeIndex !== undefined) {
            return initialState.activeIndex;
        }
        return findFirstUnrevealed(
            chars,
            initialState?.revealedIndices ?? []
        );
    });


    const [errorIndex, setErrorIndex] = useState(null);
    const [isGameComplete, setIsGameComplete] = useState(false);

    /* ------------------ CRYPTOGRAM MAP (STABLE) ------------------ */
    const cryptogramMapRef = useRef(null);

    if (!cryptogramMapRef.current) {
        if (initialState?.cryptogram_map) {
            cryptogramMapRef.current = new Map(
                Object.entries(initialState.cryptogram_map)
            );
        } else {
            const map = new Map();
            const used = new Set();

            chars.forEach(char => {
                if (ALPHABET_REGEX.test(char) && !map.has(char)) {
                    let value;
                    do {
                        value = Math.floor(Math.random() * 26) + 1;
                    } while (used.has(value));
                    used.add(value);
                    map.set(char, value);
                }
            });

            cryptogramMapRef.current = map;
        }
    }

    const cryptogramMap = cryptogramMapRef.current;

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
    }, [board, moveToNextIndex]);

    /* ------------------ PERSISTENCE ------------------ */

    const debounceRef = useRef();

    useEffect(() => {
        if (!onPersist) return;

        clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => {
            onPersist(serialize());
        }, 500);

        return () => clearTimeout(debounceRef.current);
    }, [lives, guesses, revealedIndices, hintsUsed, activeIndex]);

    const serialize = () => ({
        message,
        cryptogramMap: Object.fromEntries(cryptogramMap),
        guesses,
        revealedIndices,
        activeIndex,
        livesLeft: lives,
        hintsUsed,
        status: isGameComplete ? "COMPLETED" : "IN_PROGRESS"
    });

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
        guessLetter,
        activeIndex,
        setActiveIndex,
        errorIndex,
        disabledKeys,
        partiallyRevealedKeys,
        isGameComplete,
        revealRandomCell,
        serialize
    };
}

/* ------------------ HELPERS ------------------ */

function pickRandomIndices(chars, count) {
    return chars
        .map((c, i) => (/[A-Z]/.test(c) ? i : null))
        .filter(i => i !== null)
        .sort(() => 0.5 - Math.random())
        .slice(0, count);
}

function findFirstUnrevealed(chars, revealed) {
    return chars.findIndex(
        (c, i) => /[A-Z]/.test(c) && !revealed.includes(i)
    );
}
