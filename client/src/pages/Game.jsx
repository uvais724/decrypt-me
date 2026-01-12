import { useState, useEffect } from 'react'
import GameEngine from '../components/GameEngine';
import { useParams } from 'react-router-dom';
import apiClient from '../lib/apiClient';
import Navbar from '../components/Navbar';
import Loading from '../components/Loading';

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
                const response = await apiClient.get(`/games/${gameId}`);
                const gameData = await response.data;
                setMessage(gameData.prompt_text.toUpperCase());
                setLoading(false);
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
                const res = await apiClient.get(`/game/session/${gameId}`);
                const data = await res.data;
                if (data) {
                    setSession(data);
                }
                setLoading(false);
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
                        guesses[char] = cryptogramMap[char];
                    }
                });

                const result = await apiClient.put('/game/session', { sessionId: session.session_id, initialRevealed, guesses });
                console.log('Reset session: ', result);
                setSession(result.data.result);
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
