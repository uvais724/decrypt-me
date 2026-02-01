// GameEngine.jsx
import './GameEngine.css'
import { useCryptogramGame } from "../hooks/useCryptogramGame";
import Board from "./Board";
import Keyboard from "./Keyboard";
import Lives from "./Lives";
import Modal from "./Modal";
import ConfirmationModal from "./ConfirmationModal";
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../context/AuthContext';
import { useGameRefresh } from '../context/GameRefreshContext';
import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function GameEngine({
  gameId,
  message,
  session,
  onTryAgain,
  isSinglePlayer = false,
  currentLevel = null,
  isDemo = false,
}) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { triggerRefresh } = useGameRefresh();
  const [showGiveUpModal, setShowGiveUpModal] = useState(false);
  // 🔹 Holds latest serialized game state
  const latestStateRef = useRef(null);

  const {
    board,
    lives,
    hintsUsed,
    guessLetter,
    activeIndex,
    setActiveIndex,
    errorIndex,
    disabledKeys,
    isGameComplete,
    revealRandomCell,
    partiallyRevealedKeys,
    revealedIndices,
    guesses,
    cryptogramNumbers,
  } = useCryptogramGame(message, {
    initialState: session
  });

  /* ------------------ KEEP STATE UPDATED ------------------ */

  useEffect(() => {
    latestStateRef.current = {
      lives,
      hintsUsed,
      activeIndex,
      isGameComplete,
      revealedIndices,
      guesses,
      message
    };
    setActiveIndex(activeIndex);
  }, [
    lives,
    hintsUsed,
    activeIndex,
    isGameComplete,
    revealedIndices,
    guesses,
    message,
  ]);

  /* ------------------ PERSIST ON UNMOUNT ONLY ------------------ */
  const lastSavedStateRef = useRef(null);

  async function persistData() {
    // Skip persistence in demo mode
    if (isDemo) return;

    // 1. Check if state exists
    if (!latestStateRef.current) return;

    // 2. Optimization: Only save if the data has actually changed
    const isChanged = JSON.stringify(latestStateRef.current) !== JSON.stringify(lastSavedStateRef.current);

    if (!isChanged) {
      console.log("No changes detected, skipping persist.");
      return;
    }

    const payload = { ...latestStateRef.current };

    try {
      const { data, error } = await supabase
      .from('game_sessions')
      .update({
        guesses:payload.guesses,
        revealed_indices: payload.revealedIndices,
        hints_used: payload.hintsUsed,
        lives: payload.lives,
        active_index: payload.activeIndex,
        updated_at: new Date().toISOString()
      })
      .eq('session_id', session.session_id)
      .eq('user_id', user.id)
      .select('session_id')
      .single();

      // Trigger refresh in GameList via Context
      if(data) {
        triggerRefresh();
      }
      
      // Update the "last saved" marker after successful save
      lastSavedStateRef.current = payload;

      if (error) throw error;
    } catch (error) {
      console.error("Failed to persist session:", error);
    }
  }

  useEffect(() => {
    // Handler for closing tab / refreshing
    const handleBeforeUnload = async (event) => {
      // Note: Most modern browsers don't allow async calls in beforeunload.
      // Use navigator.sendBeacon() if the request fails consistently here.
      await persistData();
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return async () => {
      // CLEANUP: This runs when the user changes routes (component unmounts)
      window.removeEventListener('beforeunload', handleBeforeUnload);
      await persistData();
    };
  }, []); // Empty dependency array ensures this setup runs once

  /* ------------------ UI LOGIC ------------------ */

  const MAX_HINTS = 3;
  const canUseHint = hintsUsed < MAX_HINTS;
  const showModal = lives === 0 || isGameComplete;

  const useHint = () => {
    if (!canUseHint) return;
    revealRandomCell();
  };

  const handleGiveUp = () => {
    setShowGiveUpModal(true);
  };

  const confirmGiveUp = async () => {
    setShowGiveUpModal(false);
    
    const {error: deleteSessionError} = await supabase
      .from('game_sessions')
      .delete()
      .eq('game_id', gameId);
    
    if(deleteSessionError) {
      console.error("Error deleting game session: ", deleteSessionError);
      return;
    }

    const {error} = await supabase
      .from('games')
      .update({
        status: 'GAVE_UP'
      })
      .eq('game_id', gameId);
    
    if (error) {
      console.error("Error giving up the game: ", error);
    } else {
      navigate('/');
    }
  };

  return (
    <div className='h-screen bg-linear-to-br from-blue-50 to-indigo-100 flex flex-col items-center justify-center'>
      {/* Back Button for Demo Mode */}
      {isDemo && (
        <div className='w-full sm:max-w-2xl bg-white shadow-lg p-3 flex justify-start'>
          <button 
            className='btn btn-ghost btn-sm'
            onClick={() => navigate('/login')}
          >
            ← Back to Login
          </button>
        </div>
      )}

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={showGiveUpModal}
        title="Give Up?"
        message="Are you sure you want to give up? Your progress will be lost."
        confirmText="Yes, Give Up"
        cancelText="No, Continue"
        onConfirm={confirmGiveUp}
        onCancel={() => setShowGiveUpModal(false)}
      />

      {/* Game Board */}
      <div className='bg-white shadow-lg w-full sm:max-w-2xl'>
        {isSinglePlayer && currentLevel && (
                <div className="bg-linear-to-r from-purple-600 to-blue-600 text-white py-4 px-6">
                    <div className="container mx-auto flex items-center justify-center">
                        <h1 className="text-2xl font-bold">Level {currentLevel}</h1>
                    </div>
                </div>
            )}
        <div className='max-h-[50vh] overflow-x-auto'>
          <div className='bg-gray-50 h-auto overflow-y-auto overflow-x-auto border border-gray-200'>
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
      <div className='bg-white shadow-lg w-full sm:max-w-2xl'>
        <div className='pt-3'>
          <div className='flex flex-wrap justify-center items-center gap-4'>
            <button className='max-sm:btn-xs btn btn-error btn-lg gap-2' onClick={handleGiveUp} disabled={isSinglePlayer || isDemo}>
              Give Up!
            </button>

            <Lives lives={lives} />

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
      <div className='bg-white shadow-lg w-full sm:max-w-2xl overflow-y-auto'>
        <div className='py-3'>
          {/* <h3 className='font-bold text-gray-700 mb-2 text-center'>Keyboard</h3> */}
          <div className='bg-gray-50 py-4 border border-gray-200'>
            <Keyboard
              onKey={(char) => guessLetter(activeIndex, char)}
              disabledKeys={disabledKeys}
              partiallyRevealedKeys={partiallyRevealedKeys}
              cryptogramNumbers={cryptogramNumbers}
            />
          </div>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <Modal
          gameId={gameId}
          sessionId={session?.session_id}
          gameResult={lives === 0 ? "Game Over!" : "You Won!"}
          gamePuzzle={isGameComplete ? message : undefined}
          onTryAgain={onTryAgain}
          isSinglePlayer={isSinglePlayer}
          currentLevel={currentLevel}
          isDemo={isDemo}
          lives={lives}
          hintsUsed={hintsUsed}
        />
      )}
    </div>
  );
}
