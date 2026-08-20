import { useState, useEffect } from 'react'
import GameEngine from '../components/GameEngine';
import { useParams, useLocation } from 'react-router-dom';
import Loading from '../components/Loading';
import { useAuth } from '../context/useAuth';
import { cryptogramSessionFactory } from '../domain/CryptogramSessionFactory';
import { repositories } from '../repositories/SupabaseRepositories';

export default function Game() {
    const { gameId } = useParams();
    const location = useLocation();
    const senderId = location.state?.senderId;
    
    const { user } = useAuth();
    const [session, setSession] = useState(undefined);
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState("");
    const [childKey, setChildKey] = useState(0);
    const [isSinglePlayer, setIsSinglePlayer] = useState(false);
    const [currentLevel, setCurrentLevel] = useState(null);

    useEffect(() => {
        setLoading(true);
        // Fetch game data by ID when component mounts
        const fetchGame = async () => {
            try {
                const data = await repositories.games.findInProgressGame(gameId);

                if(data) {
                    setMessage(data.prompts.prompt_text.toUpperCase());
                }
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
                const data = await repositories.sessions.findByGameId(gameId);
                setSession(data);
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
                const data = await repositories.singlePlayer.findCurrentPrompt(user.id);

                if (data && data.single_player_levels?.prompts) {
                    const currentPromptId = data.single_player_levels.prompts.prompt_id;
                    const promptId = await repositories.games.findPromptId(gameId);

                    if (promptId === currentPromptId) {
                        setIsSinglePlayer(true);
                        setCurrentLevel(data.current_level);
                    }
                }
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
                const resetState = cryptogramSessionFactory.createResetSession(session, message);
                const data = await repositories.sessions.reset(session.session_id, resetState);
                setSession(data);

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
        <GameEngine 
            key={childKey} 
            gameId={gameId} 
            senderId={senderId}
            message={message} 
            session={session}
            onTryAgain={handleTryAgain}
            isSinglePlayer={isSinglePlayer}
            currentLevel={currentLevel}
        />
    )
}
