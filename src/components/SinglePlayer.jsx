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
                    setProgress(data);
                }

                if (error) throw error;
            } catch (error) {
                console.error(error);
            }
        };

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
                        .from('game_sessions')
                        .select('game_id')
                        .eq('message', promptText)
                        .eq('user_id', user.id)
                        .single();

                    if (data) {
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
        <div className="container mx-auto p-6">
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-3xl font-extrabold">Single Player Mode</h1>
            </div>
            <div className="flex">
                <div className="card card-compact bg-linear-to-br from-purple-50 to-blue-50 shadow hover:shadow-xl transition w-full">
                    <div className="card-body">
                        <div className="flex items-start justify-between mb-4">
                            <div>
                                <h2 className="card-title text-2xl">Level {progress.current_level}</h2>
                                <p className="text-sm text-neutral mt-2">Continue your journey</p>
                            </div>
                        </div>

                        <div className="mt-4 space-y-3">
                            <div className="stats stats-horizontal shadow bg-white w-full">
                                <div className="stat">
                                    <div className="stat-title text-neutral">Total Letters</div>
                                    <div className="stat-value text-primary text-2xl">
                                        {progress.single_player_levels?.prompts?.prompt_text.replace(/[^a-zA-Z]/g, '').length}
                                    </div>
                                    {/* <div className="stat-desc">Characters to discover</div> */}
                                </div>
                                <div className="stat">
                                    <div className="stat-title text-neutral">Words</div>
                                    <div className="stat-value text-secondary text-2xl">
                                        {progress.single_player_levels?.prompts?.prompt_text.trim().split(/\s+/).length}
                                    </div>
                                    {/* <div className="stat-desc">In the cryptogram</div> */}
                                </div>
                            </div>
                            <div className="alert alert-info">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="stroke-current shrink-0 w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                                <span>Decode the hidden message and unlock the next level!</span>
                            </div>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-4 items-stretch mt-6">
                            <button 
                                className='btn btn-primary btn-lg max-sm:btn-sm py-2 flex-1'
                                onClick={async () => await createAndStartGame()}
                            >
                                Start Level
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
