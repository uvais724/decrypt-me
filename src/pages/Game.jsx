import { useState, useEffect, useRef } from 'react'
import GameEngine from '../components/GameEngine';
import { useParams } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Loading from '../components/Loading';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../context/AuthContext';

export default function Game() {
    const { gameId } = useParams();
    const { user } = useAuth();
    const [session, setSession] = useState(undefined);
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState("");
    const [childKey, setChildKey] = useState(0);
    const [isSinglePlayer, setIsSinglePlayer] = useState(false);
    const [currentLevel, setCurrentLevel] = useState(null);
    const containerRef = useRef(null);

    useEffect(() => {
        setLoading(true);
        // Fetch game data by ID when component mounts
        const fetchGame = async () => {
            try {
                const { data, error } = await supabase
                .from('games')
                .select(`
                game_id,
                prompts!inner(prompt_text)
                `)
                .eq('game_id', gameId)
                .eq('status', 'IN_PROGRESS')
                .single();

                if(data) {
                    setMessage(data.prompts.prompt_text.toUpperCase());
                }

                if(error) throw error;
                
            } catch (error) {
                console.error("Error fetching game data:", error);
            }
        };

        fetchGame();
    }, [])

    useEffect(() => {
        setLoading(true);
        const loadSession = async () => {
            try {
               const { data, error } = await supabase
                .from('game_sessions')
                .select('*')
                .eq('game_id', gameId)
                .single();
                if (data) {
                    setSession(data);
                }
                
                if(error) throw error;

            } catch (error) {
                console.error("Error loading session:", error);
            }
        }

        loadSession();
    }, []);

    // Check if this is a single player game
    useEffect(() => {
        const checkSinglePlayerMode = async () => {
            if (!user || !gameId) return;

            try {
                const { data, error } = await supabase
                    .from('single_player_progress')
                    .select(`
                        current_level,
                        single_player_levels!inner (
                            level_number,
                            prompts!inner (
                                prompt_id
                            )
                        )
                    `)
                    .eq('user_id', user.id)
                    .single();

                if (data && data.single_player_levels?.prompts) {
                    // Get the prompt_id for the current level
                    const currentPromptId = data.single_player_levels.prompts.prompt_id;
                    
                    // Check if the game is for this prompt
                    const { data: gameData } = await supabase
                        .from('games')
                        .select('prompt_id')
                        .eq('game_id', gameId)
                        .single();

                    if (gameData && gameData.prompt_id === currentPromptId) {
                        setIsSinglePlayer(true);
                        setCurrentLevel(data.current_level);
                    }
                }

                if (error && error.code !== 'PGRST116') throw error;
            } catch (error) {
                console.error("Error checking single player mode:", error);
            } finally {
                setLoading(false);
            }
        };

        checkSinglePlayerMode();
    }, [user, gameId]);

    // Scroll to bottom when game is loaded
    useEffect(() => {
        if (!loading && session) {
            // Use requestAnimationFrame to ensure DOM is fully rendered
            requestAnimationFrame(() => {
                setTimeout(() => {
                    window.scrollTo(0, document.documentElement.scrollHeight);
                }, 100);
            });
        }
    }, [loading, session]);

     async function handleTryAgain() {
        setLoading(true);
        const resetSession = async () => {
            try {
                const guesses = {};
                const initialRevealed = session.initial_revealed;
                const cryptogramMap = session.cryptogram_map;
                initialRevealed.forEach(index => {
                    const char = message.charAt(index).toUpperCase();
                    if (cryptogramMap[char]) {
                        guesses[cryptogramMap[char]] = char;
                    }
                });

                const activeIndex = message.split('').findIndex((c, i) => /[A-Z]/.test(c) && !session.revealed_indices.includes(i))

                const { data, error } = await supabase
                    .from('game_sessions')
                    .update({
                    revealed_indices: initialRevealed,
                    hints_used: 0,
                    lives: 3,
                    active_index: activeIndex,
                    guesses
                    })
                    .eq('session_id', session.session_id)
                    .select()
                    .single();

                if(data) {
                    setSession(data);
                }
                
                if(error) throw error;

                setLoading(false);
                
            } catch (error) {
                console.error("Error resetting session:", error);
                setLoading(false);
            }
        };
        await resetSession();
        setChildKey(prevKey => prevKey + 1);
    }

    if (loading || !session) return <Loading />;

    return (
        <>
            <Navbar />
            <GameEngine 
                key={childKey} 
                gameId={gameId} 
                message={message} 
                session={session}
                onTryAgain={handleTryAgain}
                isSinglePlayer={isSinglePlayer}
                currentLevel={currentLevel}
            />
        </>
    )
}
