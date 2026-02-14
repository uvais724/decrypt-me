//Modal.jsx
import React, { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../context/AuthContext';
import { useGameRefresh } from '../context/GameRefreshContext';
import { toPng } from "html-to-image";
import { isMobile } from '../helper/helper';
import Share from './Share';

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

  const navigate = useNavigate();
  const { user } = useAuth();
  const { triggerRefresh } = useGameRefresh();

  useEffect(() => {
    dialogRef.current?.showModal();

    const handleCancel = (e) => e.preventDefault();
    dialogRef.current?.addEventListener('cancel', handleCancel);

    return () => {
      dialogRef.current?.removeEventListener('cancel', handleCancel);
    };
  }, []);

  const handleClose = async () => {
    if (isDemo) {
      navigate('/login');
      return;
    }

    if (isDailyPuzzle) {
      navigate('/');
      return;
    }

    await supabase
      .from('game_sessions')
      .delete()
      .eq('session_id', sessionId);

    triggerRefresh();

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
