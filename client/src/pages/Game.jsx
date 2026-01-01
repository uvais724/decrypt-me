import { useState, useEffect } from 'react'
import GameEngine from '../components/GameEngine';
import { useParams } from 'react-router-dom';
import axios from 'axios';

export default function Game() {
    const { gameId } = useParams();
    const [session, setSession] = useState(undefined);
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState("");

    useEffect(() => {
        // Fetch game data by ID when component mounts
        const fetchGame = async () => {
            try {
                const response = await axios.get(`/api/games/${gameId}`);
                const gameData = await response.data;
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
            const res = await axios.get(`/api/game/session/${gameId}`);
            const data = await res.data;
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
    }, [gameId]);


    if (loading || !message) return <div>Loading...</div>;

    return (
        <GameEngine gameId={gameId} message={message} session={session} />
    )
}
