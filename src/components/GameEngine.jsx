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
  isDailyPuzzle = false,
  dailyStatus = null
}) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { triggerRefresh } = useGameRefresh();

  const [showGiveUpModal, setShowGiveUpModal] = useState(false);
  const [startTime] = useState(Date.now());

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

  const handleGuess = (index, letter) => {
    guessLetter(index, letter);
  };

  const handleGiveUp = () => setShowGiveUpModal(true);

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

      <ConfirmationModal
        isOpen={showGiveUpModal}
        title="Give Up?"
        message="Are you sure you want to give up? Your progress will be lost."
        confirmText="Yes, Give Up"
        cancelText="No, Continue"
        onConfirm={confirmGiveUp}
        onCancel={() => setShowGiveUpModal(false)}
      />

      <div className='bg-white shadow-lg w-full sm:max-w-2xl'>
        {isDailyPuzzle && (
          <div className="bg-yellow-100 text-center p-2 text-sm">
            Attempts used: {attemptsUsed} / 3
            {solved && " – Completed!"}
            {attemptsUsed >= 3 && !solved && " – Locked for today"}
          </div>
        )}

        <Board
          board={board}
          onGuess={handleGuess}
          activeIndex={activeIndex}
          setActiveIndex={setActiveIndex}
          errorIndex={errorIndex}
        />

        <div className='flex justify-center gap-4 p-4'>
          <button
            className='btn btn-error'
            onClick={handleGiveUp}
            disabled={isSinglePlayer || isDemo || isDailyPuzzle}
          >
            Give Up!
          </button>

          <Lives lives={lives} />

          <button
            className='btn btn-info'
            onClick={useHint}
            disabled={!canUseHint}
          >
            Hints ({MAX_HINTS - hintsUsed} left)
          </button>
        </div>

        <Keyboard
          onKey={(char) => !blocked && handleGuess(activeIndex, char)}
          disabledKeys={disabledKeys}
          partiallyRevealedKeys={partiallyRevealedKeys}
          cryptogramNumbers={cryptogramNumbers}
        />
      </div>

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
          isDailyPuzzle={isDailyPuzzle}
        />
      )}
    </div>
  );
}
