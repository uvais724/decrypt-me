import { useState,useEffect } from 'react'
import GameEngine from '../components/GameEngine';
import { useLocation } from 'react-router-dom';

export default function Game() {
    const location = useLocation();
    const gameIdFromState = location.state?.gameId;

    const [message, setMessage] = useState(null);

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

    if (!message) return <div>Loading...</div>;

    return (
        <GameEngine message={message} />
    )
}
