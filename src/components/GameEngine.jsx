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
  senderId,
  message,
  session,
  onTryAgain,
  isSinglePlayer = false,
  currentLevel = null,
  isDemo = false,
  isDailyPuzzle = false,
  dailyStatus = null
}) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { triggerRefresh } = useGameRefresh();

  const [showGiveUpModal, setShowGiveUpModal] = useState(false);
  const [startTime] = useState(Date.now());
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  const [attemptsUsed, setAttemptsUsed] = useState(dailyStatus?.attempts_used || 0);
  const [solved, setSolved] = useState(dailyStatus?.solved || false);

  const latestStateRef = useRef(null);

  const blocked = isDailyPuzzle && (
    solved === true ||
    attemptsUsed >= 3
  );


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
  } = useCryptogramGame(
    message,
    { initialState: session },
    blocked
  );

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
  }, [lives, hintsUsed, activeIndex, isGameComplete, revealedIndices, guesses, message]);


  useEffect(() => {
    if (!isDailyPuzzle || solved || isGameComplete) return;

    const timerId = setInterval(() => {
      setElapsedSeconds(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);

    return () => clearInterval(timerId);
  }, [isDailyPuzzle, startTime, solved, isGameComplete]);

  useEffect(() => {
    if (!isDailyPuzzle || !user) return;

    const updateAttempts = async () => {
      // If player LOST the round
      if (lives === 0 && !solved) {
        const newAttempts = attemptsUsed + 1;

        setAttemptsUsed(newAttempts);

        const { data, error } = await supabase.from("daily_puzzle_attempts").upsert({
          user_id: user.id,
          puzzle_date: new Date().toISOString().split("T")[0],
          attempts_used: newAttempts,
          solved: false
        });

        console.log("Upserted daily puzzle attempt:", data);

        if (error) {
          console.error("Error updating daily puzzle attempts:", error);
        }
      }
    };

    updateAttempts();
  }, [lives]);


  // 🔐 DAILY PUZZLE COMPLETION TRACKING
  useEffect(() => {
    if (!isDailyPuzzle || !user) return;

    const updateAttempts = async () => {
      if (isGameComplete && !solved) {
        const finishTime = Math.floor((Date.now() - startTime) / 1000);

        const { data, error } = await supabase.from("daily_puzzle_attempts").upsert({
          user_id: user.id,
          puzzle_date: new Date().toISOString().split("T")[0],
          solved: true,
          attempts_used: attemptsUsed,
          best_time_seconds: finishTime
        });
        console.log("Upserted daily puzzle completion:", data);

        if (error) {
          console.error("Error updating daily puzzle completion:", error);
        }

        setSolved(true);
      }
    };

    updateAttempts();
  }, [isGameComplete]);


  async function persistData() {
    if (isDemo || isDailyPuzzle) return;
    if (!latestStateRef.current) return;

    try {
      await supabase
        .from('game_sessions')
        .update({
          guesses: latestStateRef.current.guesses,
          revealed_indices: latestStateRef.current.revealedIndices,
          hints_used: latestStateRef.current.hintsUsed,
          lives: latestStateRef.current.lives,
          active_index: latestStateRef.current.activeIndex,
          updated_at: new Date().toISOString()
        })
        .eq('session_id', session.session_id)
        .eq('user_id', user.id);

      triggerRefresh();
    } catch (error) {
      console.error("Failed to persist session:", error);
    }
  }

  useEffect(() => {
    return () => {
      persistData();
    };
  }, []);

  const MAX_HINTS = 3;
  const canUseHint = hintsUsed < MAX_HINTS;
  const showModal = lives === 0 || isGameComplete;

  const useHint = () => {
    if (!canUseHint) return;
    revealRandomCell();
  };

  const handleGiveUp = () => setShowGiveUpModal(true);
  const formattedTimer = `${String(Math.floor(elapsedSeconds / 60)).padStart(2, '0')}:${String(elapsedSeconds % 60).padStart(2, '0')}`;

  const confirmGiveUp = async () => {
    setShowGiveUpModal(false);

    await supabase
      .from('game_sessions')
      .delete()
      .eq('game_id', gameId);

    await supabase
      .from('games')
      .update({ status: 'GAVE_UP' })
      .eq('game_id', gameId);

    navigate('/');
  };

  return (
    <div className='md:h-screen bg-linear-to-br from-blue-50 to-indigo-100 flex flex-col items-center justify-center'>
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
        {isDailyPuzzle && (
          <div className="bg-yellow-100 text-center p-2 text-sm">
            Attempts used: {attemptsUsed} / 3 <span className="mx-2">|</span> Time: {formattedTimer}
            {solved && " – Completed!"}
            {attemptsUsed >= 3 && !solved && " – Locked for today"}
          </div>
        )}
        <div className='max-h-[45vh] overflow-x-auto'>
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
            <button className='max-sm:btn-xs btn btn-error btn-lg gap-2' onClick={handleGiveUp} disabled={isSinglePlayer || isDemo || isDailyPuzzle}>
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
          <div className='bg-gray-50 py-4 max-sm:pb-0 border border-gray-200'>
            <Keyboard
              onKey={(char) => guessLetter(activeIndex, char)}
              disabledKeys={disabledKeys}
              partiallyRevealedKeys={partiallyRevealedKeys}
              cryptogramNumbers={cryptogramNumbers}
            />
          </div>
        </div>
      </div>

      {showModal && (
        <Modal
          gameId={gameId}
          senderId={senderId}
          sessionId={session?.session_id}
          gameResult={lives === 0 ? "Game Over!" : "You Won!"}
          gamePuzzle={isGameComplete ? message : undefined}
          onTryAgain={onTryAgain}
          isSinglePlayer={isSinglePlayer}
          currentLevel={currentLevel}
          isDemo={isDemo}
          lives={lives}
          hintsUsed={hintsUsed}
          isDailyPuzzle={isDailyPuzzle}
        />
      )}
    </div>
  );
}
