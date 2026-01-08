import { useState, useEffect } from 'react'
import GameEngine from '../components/GameEngine';
import { useParams } from 'react-router-dom';
import apiClient from '../lib/apiClient';
import Navbar from '../components/Navbar';

export default function Game() {
    const { gameId } = useParams();
    const [session, setSession] = useState(undefined);
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState("");
    const [childKey, setChildKey] = useState(0);

    useEffect(() => {
        // Fetch game data by ID when component mounts
        const fetchGame = async () => {
            try {
                const response = await apiClient.get(`/games/${gameId}`);
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
                const res = await apiClient.get(`/game/session/${gameId}`);
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
    }, []);


     async function handleTryAgain() {
        const deleteSession = async () => {
            try {
                await apiClient.delete(`/game/session/${session.session_id}`);
                setSession(undefined);
            } catch (error) {
                console.error("Error deleting session:", error);
            }
        };
        await deleteSession();
        setChildKey(prevKey => prevKey + 1);
    }

    if (loading || !message) return <div>Loading...</div>;

    return (
        <>
            <Navbar />
            <GameEngine key={childKey} gameId={gameId} message={message} session={session} setSession={setSession} onTryAgain={handleTryAgain} />
        </>
    )
}
