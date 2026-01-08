import './GameEngine.css'
import { useCryptogramGame } from "../hooks/useCryptogramGame";
import Board from "./Board";
import Keyboard from "./Keyboard";
import Lives from "./Lives";
import Modal from "./Modal";
import apiClient from '../lib/apiClient';
import { useAuth } from '../context/AuthContext';


export default function GameEngine({ gameId, message, session, setSession, onTryAgain }) {

    const { user } = useAuth();
    const persistSession = async (state) => {
        state.message = message;
        console.log('Persisting session for gameId:', gameId, 'with state:', state);
        if (!session) {
            const response = await apiClient.post('/game/session', {
                gameId,
                userId: user.userId,
                ...state
            });
            const data = await response.data;
            console.log('New session created:', data);
            if (data) {
                setSession(data);
            }

        } else {
            const response = await apiClient.patch(`/game/session/${session.session_id}`, {
                ...state
            });
            const data = await response.data;
            console.log('Session updated:', data);
            if (data) {
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
        <div className='h-screen bg-linear-to-br from-blue-50 to-indigo-100 flex flex-col items-center justify-center'>
            {/* Game Board */}
            <div className='card bg-white shadow-lg w-full sm:max-w-2xl'>
                <div className='card-body max-h-[50vh] overflow-x-auto'>
                    {/* <h2 className='card-title text-2xl font-bold text-center mb-4'>Cryptogram</h2> */}
                    <div className=' bg-gray-50 h-auto overflow-y-auto overflow-x-auto border border-gray-200'>
                        <Board
                            board={board}
                            onGuess={guessLetter}
                            activeIndex={activeIndex}
                            setActiveIndex={setActiveIndex}
                            errorIndex={errorIndex}
                        />
                    </div>
                </div>
            </div>

            {/* Controls */}
            <div className='card h-[10vh] bg-white shadow-lg w-full sm:max-w-2xl'>
                <div className='md:p-6'>
                    <div className='flex flex-wrap justify-center items-center gap-4'>
                        <button className='max-sm:btn-xs btn btn-error btn-lg gap-2'>
                            Give Up!
                        </button>
                        <div className='divider divider-horizontal max-sm:hidden'></div>
                        <Lives lives={lives} />
                        <div className='divider divider-horizontal max-sm:hidden'></div>
                        <button 
                            className='max-sm:btn-xs btn btn-info btn-lg gap-2' 
                            onClick={useHint} 
                            disabled={!canUseHint}
                        >
                            Hints ({MAX_HINTS - hintsUsed} left)
                        </button>
                    </div>
                </div>
            </div>

            {/* Keyboard */}
            <div className='card h-[30vh] bg-white shadow-lg w-full sm:max-w-2xl overflow-y-auto'>
                <div className='md:p-6'>
                    <h3 className='font-bold text-gray-700 mb-2 text-center'>Keyboard</h3>
                    <div className='bg-gray-50 md:p-4 border border-gray-200'>
                        <Keyboard
                            onKey={(char) => guessLetter(activeIndex, char)}
                            disabledKeys={disabledKeys}
                            partiallyRevealedKeys={partiallyRevealedKeys}
                        />
                    </div>
                </div>
            </div>

            {/* 👇 Modal overlay */}
            {showModal && (
                <Modal
                    gameId={gameId}
                    sessionId={session.session_id}
                    gameResult={lives === 0 ? "Game Over!" : "You Won!"}
                    gamePuzzle={isGameComplete ? message : undefined}
                    onTryAgain={onTryAgain}
                />
            )}
        </div>

    );
}