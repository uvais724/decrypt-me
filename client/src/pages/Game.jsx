import { useState, useEffect } from 'react'
import GameEngine from '../components/GameEngine';
import { useLocation } from 'react-router-dom';

export default function Game() {
    const location = useLocation();
    const gameIdFromState = location.state?.gameId;
    const [session, setSession] = useState(undefined);
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState("");

    useEffect(() => {
        // Fetch game data by ID when component mounts
        const fetchGame = async () => {
            try {
                const response = await fetch(`/api/games/${gameIdFromState}`);
                const gameData = await response.json();
                setMessage(gameData.prompt_text.toUpperCase());
            } catch (error) {
                console.error("Error fetching game data:", error);
            }
        };

        fetchGame();
    }, [])

    useEffect(() => {
        async function loadSession() {
            try {
            const res = await fetch(`/api/game/session/${gameIdFromState}`);
            const data = await res.json();
            if (data) {
                setSession(data);
            }
            setLoading(false);
            } catch (error) {
                console.error("Error loading session:", error);
                await setLoading(false);
            }
        }

        loadSession();
    }, [gameIdFromState]);


    if (loading || !message) return <div>Loading...</div>;

    return (
        <GameEngine gameId={gameIdFromState} message={message} session={session} />
    )
}
