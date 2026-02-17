//Modal.jsx
import React, { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../context/AuthContext';
import { useGameRefresh } from '../context/GameRefreshContext';
import { toPng } from "html-to-image";
import { isMobile } from '../helper/helper';
import Share from './Share';
import ScoreIncrement from './ScoreIncrement';
import { incrementPairScoreWithPrevious } from '../lib/pairScore';

export default function Modal({
  gameId,
  sessionId,
  gamePuzzle,
  gameResult,
  onTryAgain,
  isSinglePlayer = false,
  currentLevel = null,
  isDemo = false,
  lives,
  hintsUsed,
  isDailyPuzzle = false
}) {
  const dialogRef = useRef(null);
  const shareRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [scoreIncrementData, setScoreIncrementData] = useState(null);
  const navigate = useNavigate();
  const { user } = useAuth();
  const { triggerRefresh } = useGameRefresh();

  useEffect(() => {
    dialogRef.current?.showModal();

    // Prevent closing when clicking outside the modal
    const handleCancel = (e) => {
      e.preventDefault();
    };

    dialogRef.current?.addEventListener('cancel', handleCancel);

    if (gamePuzzle) {
      const updateGameStatus = async () => {
        try {
          if (!isSinglePlayer && !isDailyPuzzle && !isDemo) {
            const { error } = await supabase
              .from('games')
              .update({
                status: 'SOLVED',
                solved_at: new Date().toISOString()
              })
              .eq('game_id', gameId);

            if (error) throw error;

            const { data: gameData, error: gameError } = await supabase
              .from('games')
              .select('prompts!inner(sender_id)')
              .eq('game_id', gameId)
              .eq('prompts.receiver_id', user.id)
              .single();

            if (gameError) throw gameError;

            const senderId = gameData.prompts.sender_id;

            const scoreData = await incrementPairScoreWithPrevious(senderId, user.id, 1);
            setScoreIncrementData(scoreData);
          }


          // If single player, increment the level
          if (isSinglePlayer && currentLevel !== null) {
            const { error: updateError } = await supabase
              .from('single_player_progress')
              .update({
                current_level: currentLevel + 1
              })
              .eq('user_id', user.id);

            if (updateError) throw updateError;
          }

        } catch (error) {
          console.error('Error updating game status:', error);
        }
      };
      updateGameStatus();
    }

    return () => {
      dialogRef.current?.removeEventListener('cancel', handleCancel);
    };
  }, []);


   const handleClose = async () => {
        // In demo mode, just navigate back to login
        if (isDemo) {
            navigate('/login');
            return;
        }

        if (isDailyPuzzle) {
          navigate('/');
          return;
        }

        const deleteSession = async () => {
            try {
                const { error } = await supabase
                    .from('game_sessions')
                    .delete()
                    .eq('session_id', sessionId);

                if (error) throw error;

                // Trigger refresh to update GameList
                triggerRefresh();
                setLoading(false);
            } catch (error) {
                console.error("Error deleting session:", error);
                setLoading(false);
            }
        };

        const deleteGame = async () => {
            try {
                const { error } = await supabase
                    .from('games')
                    .delete()
                    .eq('game_id', gameId);
                if (error) throw error;
            } catch (error) {
                console.error("Error deleting game:", error);
            }
        };

        await deleteSession();
        if (isSinglePlayer) {
            await deleteGame();
        }

        dialogRef.current?.close();
        navigate('/');
    };

  const handleShare = async () => {
    if (!shareRef.current) return;

    const dataUrl = await toPng(shareRef.current, {
      backgroundColor: "#ffffff",
      pixelRatio: 2
    });

    const blob = await (await fetch(dataUrl)).blob();
    const file = new File([blob], "cryptogram-win.png", {
      type: "image/png"
    });

    if (isMobile() && navigator.canShare?.({ files: [file] })) {
      await navigator.share({
        title: "I cracked this cryptogram 🧠🔥",
        files: [file]
      });
    } else {
      const link = document.createElement("a");
      link.href = dataUrl;
      link.download = "cryptogram-win.png";
      link.click();
    }

    await handleClose();
  };

  return (
    <>
      <dialog ref={dialogRef} className="modal">
        <div className="modal-box text-center">
          <h3 className="font-bold text-lg">{gameResult}</h3>

          {gamePuzzle && (
            <>
              <h3>The hidden message is</h3>
              <blockquote className="p-4 mt-2 text-xl italic font-semibold bg-gray-300">
                <p>{gamePuzzle}</p>
              </blockquote>
            </>
          )}

          {scoreIncrementData && (
            <ScoreIncrement
              previousScore={scoreIncrementData.previousScore}
              currentScore={scoreIncrementData.currentScore}
              incrementBy={scoreIncrementData.incrementBy}
              label="Pair Score"
            />
          )}

          <div className="mt-4 flex justify-center gap-4">
            {gameResult !== "Game Over!" && (
              <button className="btn btn-success" onClick={handleShare}>
                Share 🎉
              </button>
            )}

            {gameResult === "Game Over!" && !isDailyPuzzle && (
              <button className="btn" onClick={onTryAgain}>
                Try Again
              </button>
            )}

            <button className="btn" onClick={handleClose}>
              Close
            </button>
          </div>
        </div>
      </dialog>

      <div style={{ position: "absolute", left: "-9999px", top: 0 }}>
        <Share
          ref={shareRef}
          gamePuzzle={gamePuzzle}
          lives={lives}
          hintsUsed={hintsUsed}
        />
      </div>
    </>
  );
}
