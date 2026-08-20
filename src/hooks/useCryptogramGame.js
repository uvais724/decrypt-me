// hooks/useCryptogramGame.js
import { useMemo, useState, useCallback, useEffect } from "react";
import { ALPHABET_REGEX } from "../helper/helper";
import { CryptogramGame } from "../domain/CryptogramGame";

export function useCryptogramGame(
    message,
    {
        initialLives = 3,
        initialState = null,      // 👈 backend session data
    } = {},
    blocked = false
) {
    const game = useMemo(
        () => new CryptogramGame({ message, initialLives, initialState }),
        [message, initialLives, initialState]
    );

    /* ------------------ CORE STATE ------------------ */
    const [lives, setLives] = useState(initialState?.lives ?? initialLives);
    const [guesses, setGuesses] = useState(initialState?.guesses ?? {});
    const [revealedIndices, setRevealedIndices] = useState(initialState?.revealed_indices ?? []);

    const [hintsUsed, setHintsUsed] = useState(initialState?.hints_used ?? 0);
    const [activeIndex, setActiveIndex] = useState(initialState?.active_index);


    const [errorIndex, setErrorIndex] = useState(null);
    const [isGameComplete, setIsGameComplete] = useState(false);

    /* ------------------ CRYPTOGRAM MAP (STABLE) ------------------ */
    /* ------------------ DERIVED MAPS ------------------ */

    const letterToIndices = useMemo(() => {
        return game.getLetterToIndices();
    }, [game]);

    const cryptogramNumbers = useMemo(() => {
        return game.getCryptogramNumbers();
    }, [game]);


    const disabledKeys = useMemo(() => {
        return game.getDisabledKeys(letterToIndices, revealedIndices);
    }, [game, letterToIndices, revealedIndices]);

    const partiallyRevealedKeys = useMemo(() => {
        return game.getPartiallyRevealedKeys(letterToIndices, revealedIndices);
    }, [game, letterToIndices, revealedIndices]);

    const board = useMemo(() => {
        return game.buildBoard(guesses, revealedIndices);
    }, [game, guesses, revealedIndices]);

    /* ------------------ GAME LOGIC ------------------ */

    const moveToNextIndex = useCallback(
        (current, revealed) => {
            return game.moveToNextIndex(current, revealed);
        },
        [game]
    );

    const totalLetters = useMemo(
        () => game.getTotalLetters(),
        [game]
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
        const chosenIndex = game.chooseHintIndex(revealedIndices);
        if (chosenIndex === -1) return;

        const chosenLetter = game.chars[chosenIndex];

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
    }, [game, moveToNextIndex, revealedIndices, totalLetters]);

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
