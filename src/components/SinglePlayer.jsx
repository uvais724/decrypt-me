import React, { use, useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../context/AuthContext';
import { generateCryptogramMap, pickRandomIndices, initializeGuesses, findFirstUnrevealed, setDifficultyLevel } from '../helper/helper.js';
import { useNavigate } from 'react-router-dom';

export default function SinglePlayer() {
    const [progress, setProgress] = useState(null);
    const { user } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        const createUserProgressIfNotExist = async () => {
            try {
                const { data, error } = await supabase.from('single_player_progress')
                    .select('*')
                    .eq('user_id', user.id);

                if (error) throw error;

                if (data && data.length === 0) {
                    const { error } = await supabase.from('single_player_progress')
                        .insert({
                            'user_id': user.id
                        });

                    if (error) throw error;
                }
            } catch (error) {
                console.error(error);
            }
        };

        const fetchLevel = async () => {
            try {
                const { data, error } = await supabase
                    .from('single_player_progress')
                    .select(`
                        current_level,
                        single_player_levels!inner (
                            level_number,
                            prompts!inner (
                                prompt_id,
                                prompt_text
                            )
                        )
                    `)
                    .eq('user_id', user.id)
                    .single();

                if (data) {
                    console.log('Level Data: ', data);
                    setProgress(data);
                }

                if (error) throw error;
            } catch (error) {
                console.error(error);
            }
        };

        createUserProgressIfNotExist();
        fetchLevel();
    }, []);

    async function createAndStartGame() {
        if (!progress) return;
        let game = null;
        try {
            const promptText = progress.single_player_levels?.prompts?.prompt_text.toUpperCase();

            const fetchGame = async () => {
                try {
                    const { data, error } = await supabase
                        .from('games')
                        .select('*')
                        .eq('prompt_id', progress.single_player_levels?.prompts?.prompt_id)
                        .eq('status', 'IN_PROGRESS')
                        .single();

                    if (data) {
                        console.log('Existing Game: ', data);
                        game = data;
                    }

                    if (error) throw error;
                } catch (error) {
                    console.error(error);
                }
            };

            await fetchGame();

            if (game && game.game_id) {
                navigate(`/${game.game_id}`, { state: { gameId: game.game_id } });
                return;
            }

            const difficulty = setDifficultyLevel(promptText);

            const { data: gameData, error: gameError } = await supabase
                .from('games')
                .insert({
                    prompt_id: progress.single_player_levels.prompts.prompt_id,
                    difficulty_level: difficulty
                })
                .select()
                .single();

            game = gameData;
            console.log('New Game: ', gameData);

            if (gameError) {
                throw gameError;
            }

            const cryptogramMap = generateCryptogramMap(promptText);
            let revealedCharCount = 3;

            const chars = promptText.split("");
            const revealedIndices = pickRandomIndices(chars, revealedCharCount);
            const initialRevealedIndices = revealedIndices;
            const guesses = initializeGuesses(cryptogramMap, revealedIndices, promptText);
            const activeIndex = findFirstUnrevealed(chars, revealedIndices);


            const { error } = await supabase
                .from('game_sessions')
                .insert({
                    game_id: game.game_id,
                    user_id: user.id,
                    message: promptText,
                    cryptogram_map: cryptogramMap,
                    guesses,
                    revealed_indices: revealedIndices,
                    initial_revealed: initialRevealedIndices,
                    active_index: activeIndex,
                });

            if (error) throw error;

            navigate(`/${game.game_id}`, { state: { gameId: game.game_id } });
        } catch (error) {
            console.error(error);
        }
    }

    if (!progress) return;

    return (
        <div className='flex justify-center'>
            <div>Level: {progress.current_level}</div>
            <div><button className='btn btn-primary' onClick={async () => await createAndStartGame()}>Play</button></div>
        </div>
    )
}
