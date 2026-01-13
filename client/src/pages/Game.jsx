import { useState, useEffect } from 'react'
import GameEngine from '../components/GameEngine';
import { useParams } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Loading from '../components/Loading';
import { supabase } from '../lib/supabaseClient';

export default function Game() {
    const { gameId } = useParams();
    const [session, setSession] = useState(undefined);
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState("");
    const [childKey, setChildKey] = useState(0);

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
                    setLoading(false);
                }

                if(error) throw error;
                
            } catch (error) {
                console.error("Error fetching game data:", error);
                setLoading(false);
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
                    setLoading(false);
                }
                
                if(error) throw error;

            } catch (error) {
                console.error("Error loading session:", error);
                setLoading(false);
            }
        }

        loadSession();
    }, []);


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
            <GameEngine key={childKey} gameId={gameId} message={message} session={session} setSession={setSession} onTryAgain={handleTryAgain} />
        </>
    )
}
