// hooks/useCryptogramGame.js
import { useMemo, useState, useCallback, useEffect } from "react";
import { ALPHABET_REGEX, CircularSuccessorIndex, selectRandomUnrevealedIndex } from "../helper/helper";

export function useCryptogramGame(
    message,
    {
        initialLives = 3,
        initialState = null,      // 👈 backend session data
    } = {},
    blocked = false
) {
    const chars = useMemo(() => message.split(""), [message]);

    /* ------------------ CORE STATE ------------------ */
    const [lives, setLives] = useState(initialState?.lives ?? initialLives);
    const [guesses, setGuesses] = useState(initialState?.guesses ?? {});
    const [revealedIndices, setRevealedIndices] = useState(initialState?.revealed_indices ?? []);

    const [hintsUsed, setHintsUsed] = useState(initialState?.hints_used ?? 0);
    const [activeIndex, setActiveIndex] = useState(initialState?.active_index);


    const [errorIndex, setErrorIndex] = useState(null);
    const [isGameComplete, setIsGameComplete] = useState(false);

    /* ------------------ CRYPTOGRAM MAP (STABLE) ------------------ */
    const cryptogramMap = useMemo(
        () => new Map(Object.entries(initialState?.cryptogram_map ?? {})),
        [initialState?.cryptogram_map]
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
        return chars.map((char, i) => {
            const charValue = cryptogramMap.get(char);
            const isHint = revealedIndices.includes(i);
            const userGuess = guesses[charValue];

            return {
                index: i,
                letter: char,
                value: charValue,
                // ONLY true if it was one of the specific random indices picked
                revealed: isHint,
                // The value to display in the box (either the hint or what the user typed)
                displayLetter: isHint ? char : (userGuess || "")
            };
        });
    }, [chars, cryptogramMap, guesses, revealedIndices]);

    /* ------------------ GAME LOGIC ------------------ */

    const moveToNextIndex = useCallback(
        (current, revealed) => {
            // Successor DSU chooses the next playable cell after guesses/hints.
            return new CircularSuccessorIndex(chars, revealed).nextAfter(current);
        },
        [chars]
    );

    const totalLetters = useMemo(
        () => chars.filter(c => ALPHABET_REGEX.test(c)).length,
        [chars]
    );

    const guessLetter = useCallback(
        (index, letter) => {
            if (blocked) return;

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
        [blocked, board, totalLetters, moveToNextIndex]
    );

    const revealRandomCell = useCallback(() => {
        // Fenwick rank selection keeps hint choice uniform across unrevealed cells.
        const chosenIndex = selectRandomUnrevealedIndex(chars, revealedIndices);
        if (chosenIndex === -1) return;

        const chosenLetter = chars[chosenIndex];

        setRevealedIndices(prev => {
            const next = [...prev, chosenIndex];
            // Move to NEXT unrevealed cell, not the revealed one
            const nextIndex = moveToNextIndex(chosenIndex, next);
            setActiveIndex(nextIndex);

            // Check for game completion
            if (next.length === totalLetters) {
                setIsGameComplete(true);
            }

            return next;
        });

        setGuesses(g => ({ ...g, [chosenIndex]: chosenLetter }));
        setHintsUsed(h => h + 1);
    }, [chars, moveToNextIndex, revealedIndices, totalLetters]);

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
