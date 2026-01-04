import './GameEngine.css'
import { useCryptogramGame } from "../hooks/useCryptogramGame";
import Board from "./Board";
import Keyboard from "./Keyboard";
import Lives from "./Lives";
import Modal from "./Modal";
import axios from 'axios';
import { useAuth } from '../context/AuthContext';


export default function GameEngine({ gameId, message, session, setSession, onTryAgain }) {

    const { user } = useAuth();
    const persistSession = async (state) => {
        state.message = message;
        console.log('Persisting session for gameId:', gameId, 'with state:', state);
        if (!session) {
            const response = await axios.post('/api/game/session', {
                gameId,
                userId: user.userId,
                ...state
            });
            const data = await response.data;
            console.log('New session created:', data);
            if(data) {
                setSession(data);
            }
            
        } else {
            const response = await axios.patch(`/api/game/session/${session.session_id}`, {
                ...state
            });
            const data = await response.data;
            console.log('Session updated:', data);
            if(data) {
                setSession(data);
            }
        }
    };

    const { board, lives, hintsUsed, guessLetter, activeIndex, setActiveIndex, errorIndex, disabledKeys, isGameComplete, revealRandomCell, partiallyRevealedKeys } = useCryptogramGame(message, {
        initialState: session,
        onPersist: persistSession
    });

    const MAX_HINTS = 3;
    const canUseHint = hintsUsed < MAX_HINTS;
    const showModal = lives === 0 || isGameComplete;

    const useHint = () => {
        if (!canUseHint) return;
        revealRandomCell();
    }

    return (
        <div className="flex flex-col h-screen">
            {/* Top section */}
            <div className="shrink-0 container mx-auto p-10 max-sm:px-0">
                <Lives lives={lives} />

                {/* 👇 THIS is the important wrapper */}
                <div className="max-sm:max-h-[40vh] md:max-h-[50vh] overflow-y-auto mt-4">
                    <Board
                        board={board}
                        onGuess={guessLetter}
                        activeIndex={activeIndex}
                        setActiveIndex={setActiveIndex}
                        errorIndex={errorIndex}
                    />
                </div>
            </div>

            {/* Middle section */}
            <div className="shrink-0 flex justify-center mt-4">
                <button
                    className={`btn btn-primary ${!canUseHint ? 'opacity-50 cursor-not-allowed' : ''}`}
                    onClick={useHint}
                    disabled={!canUseHint}
                >
                    Hint
                </button>
            </div>

            {/* Bottom section */}
            <div className="mt-auto bg-white">
                <div className="container mx-auto p-4 max-sm:px-2">
                    <Keyboard
                        onKey={(char) => guessLetter(activeIndex, char)}
                        disabledKeys={disabledKeys}
                        partiallyRevealedKeys={partiallyRevealedKeys}
                    />
                </div>
            </div>

            {/* 👇 Modal overlay */}
            {showModal && (
                <Modal
                    gameId={gameId}
                    gameResult={lives === 0 ? "Game Over!" : "You Won!"}
                    gamePuzzle={isGameComplete ? message : undefined}
                    onTryAgain={onTryAgain}
                />
            )}
        </div>

    );
}